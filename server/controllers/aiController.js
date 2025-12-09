import { GoogleGenerativeAI } from "@google/generative-ai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import { v2 as cloudinary } from "cloudinary";
import OpenAI from "openai";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";
import path from "path";

// ------------------ Configure APIs ------------------
const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ------------------ Generate Article ------------------
export const generateArticle = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.status(403).json({ success: false, message: "Limit reached. Upgrade to continue." });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: length,
    });

    const content = response.choices?.[0]?.message?.content || "No content returned";

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'article')
    `;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("generateArticle error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ Generate Blog Title ------------------
export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.status(403).json({ success: false, message: "Limit reached. Upgrade to continue." });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices?.[0]?.message?.content || "No content returned";

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'blog-title')
    `;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("generateBlogTitle error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ Generate Image ------------------
export const generateImage = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.status(403).json({ success: false, message: "This feature is for premium users only." });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
        responseType: "arraybuffer",
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(data, "binary").toString("base64")}`;
    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})
    `;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error("generateImage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ Remove Image Background ------------------
export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const plan = req.plan;

    if (plan !== "premium") {
      return res.status(403).json({ success: false, message: "This feature is for premium users only." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const { secure_url } = await cloudinary.uploader.upload(req.file.path, {
      transformation: [{ effect: "background_removal" }],
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')
    `;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error("removeImageBackground error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ Remove Image Object ------------------
export const removeImageObject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { object } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.status(403).json({ success: false, message: "This feature is for premium users only." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const { secure_url } = await cloudinary.uploader.upload(req.file.path, {
      transformation: [{ effect: `gen_remove:prompt_${object}` }],
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${`Removed ${object} from image`}, ${secure_url}, 'image')
    `;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error("removeImageObject error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



export const resumeReview = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.status(403).json({ success: false, message: "This feature is for premium users only." });
    }

    if (!resume) {
      return res.status(400).json({ success: false, message: "No resume uploaded." });
    }

    const ext = path.extname(resume.originalname).toLowerCase();
    if (ext !== ".pdf") {
      return res.status(400).json({ success: false, message: "Invalid file type. Please upload a PDF." });
    }

    if (!resume.path || !fs.existsSync(resume.path)) {
      return res.status(400).json({ success: false, message: "Resume file path missing or file does not exist." });
    }

    // ✅ Extract text from PDF safely
    let extractedText = "";
    try {
      const dataBuffer = fs.readFileSync(resume.path);
      const pdfData = await pdf(dataBuffer);
      extractedText = pdfData.text.trim();
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      return res.status(500).json({ success: false, message: "Failed to extract text from PDF." });
    }

    if (!extractedText) {
      return res.status(400).json({ success: false, message: "PDF contains no extractable text." });
    }

    const prompt = `Review the following resume and provide constructive feedback (strengths, weaknesses, areas for improvement):\n\n${extractedText}`;

    // ✅ Call AI API safely
    let analysis = "";
    try {
      const response = await AI.chat.completions.create({
        model: "gemini-2.0-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      analysis = response.choices?.[0]?.message?.content?.trim() || "No analysis returned.";
    } catch (aiError) {
      console.error("AI API error:", aiError);
      return res.status(500).json({ success: false, message: "Failed to get analysis from AI API." });
    }

    // ✅ Save to DB
    try {
      await sql`
        INSERT INTO creations (user_id, prompt, content, type)
        VALUES (${userId}, 'Review the uploaded resume', ${analysis}, 'resume-review')
      `;
    } catch (dbError) {
      console.error("DB insert error:", dbError);
    }

    // ✅ Always return JSON
    return res.json({ success: true, analysis });

  } catch (error) {
    console.error("resumeReview error:", error);
    return res.status(500).json({ success: false, message: "Unexpected server error." });
  }
};
