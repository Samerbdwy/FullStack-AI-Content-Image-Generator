import { FileText, Sparkles, Download } from 'lucide-react';
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const ReviewResume = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState('');
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!resumeFile) return toast.error('Please upload a PDF resume');

    setLoading(true);
    setAnalysisResults('');

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);

      const { data } = await axios.post('/api/ai/resume-review', formData, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
          'Content-Type': 'multipart/form-data'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      if (data.success) {
        setAnalysisResults(data.analysis || 'No analysis returned.');
      } else {
        toast.error(data.message || 'Failed to analyze resume');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Server error');
    }

    setLoading(false);
  };

  const handleDownload = () => {
    if (!analysisResults) return;
    const blob = new Blob([analysisResults], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resume-analysis.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex flex-col md:flex-row gap-4 text-slate-700">
      {/* Left Column - Upload Form */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full md:w-1/2 p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00DA83]" />
          <h1 className="text-xl font-semibold">Resume Review</h1>
        </div>

        <p className="mt-6 text-sm font-medium">Upload Resume</p>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setResumeFile(e.target.files[0])}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
          required
        />
        <p className="text-xs text-gray-500 font-light mt-1">
          Supports PDF only
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00DA83] to-[#009BB3] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <FileText className="w-5" />
          )}
          Review Resume
        </button>
      </form>

      {/* Right Column - Analysis Results */}
      <div className="w-full md:w-1/2 p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-[24rem]">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-5 h-5 text-[#00DA83]" />
          <h1 className="text-xl font-semibold">Analysis Results</h1>
        </div>

        {!analysisResults ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <FileText className="w-9 h-9" />
              <p>Upload a resume and click "Review Resume" to get started</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full h-full">
            {/* Markdown container */}
            <div className="mt-3 w-full h-full p-3 border rounded-md text-sm text-gray-700 overflow-y-auto">
              <Markdown>{analysisResults}</Markdown>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-[#00DA83] hover:bg-[#009BB3] text-white text-sm rounded-lg"
            >
              <Download className="w-4 h-4" />
              Download Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewResume;
