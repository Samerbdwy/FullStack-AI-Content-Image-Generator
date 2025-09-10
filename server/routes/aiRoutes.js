import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  generateArticle,
  generateBlogTitle,
  generateImage,
  removeImageBackground,
  removeImageObject,
  resumeReview
} from "../controllers/aiController.js";
import { upload } from "../configs/multer.js";

const aiRouter = express.Router();

// 📝 Text generation
aiRouter.post("/generate-article", auth, generateArticle);
aiRouter.post("/generate-blog-title", auth, generateBlogTitle);

// 🎨 Image generation
aiRouter.post("/generate-image", auth, generateImage);

// 🖼️ Image editing
aiRouter.post("/remove-image-background", auth, upload.single("image"), removeImageBackground);
aiRouter.post("/remove-image-object", auth, upload.single("image"), removeImageObject);

// 📄 Resume review
aiRouter.post("/resume-review", auth, upload.single("resume"), resumeReview);

export default aiRouter;
