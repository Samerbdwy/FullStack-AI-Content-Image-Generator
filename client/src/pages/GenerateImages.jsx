import React, { useState } from 'react'
import { Sparkles, Image, Download } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const GenerateImages = () => {
  const imageStyle = [
    'Realistic',
    'Ghibli style',
    'Anime style',
    'Cartoon style',
    'Fantasy style',
    'Realistic style',
    '3D style',
    'Portrait style'
  ]

  const [selectedStyle, setSelectedStyle] = useState('Realistic')
  const [input, setInput] = useState('')
  const [publish, setPublish] = useState(false)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)

      const prompt = `Generate an image of ${input} in the style ${selectedStyle}`

      const { data } = await axios.post(
        '/api/ai/generate-image',
        { prompt, publish },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )

      if (data.success) {
        setContent(data.content)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  // Download generated image
  const handleDownload = async () => {
    try {
      const response = await fetch(content)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = 'generated-image.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to download image')
    }
  }

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">
      {/* left col */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">AI Image Generator</h1>
        </div>

        <p className="mt-6 text-sm font-medium">Prompt</p>

        <textarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          rows={4}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="Describe what you want to see in the image"
          required
        />

        <p className="mt-4 text-sm font-medium">Style</p>

        <div className="mt-3 flex gap-3 flex-wrap sm:max-w-9/11">
          {imageStyle.map((item) => (
            <span
              key={item}
              onClick={() => setSelectedStyle(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer 
                ${
                  selectedStyle === item
                    ? 'bg-green-50 text-green-700 border-green-300'
                    : 'text-gray-500 border-gray-300'
                }`}
            >
              {item}
            </span>
          ))}
        </div>

        {/* Checkbox Toggle */}
        <div className="my-6 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              className="hidden"
            />
            <span
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                publish ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
              }`}
            >
              {publish ? 'Public' : 'Private'}
            </span>
            <p
              className={`text-sm transition-colors ${
                publish ? 'text-green-600' : 'text-gray-700'
              }`}
            >
              Make this image public
            </p>
          </label>
        </div>

        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00AD25] to-[#04FF50] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <Image className="w-5" />
          )}
          Generate Image
        </button>
      </form>

      {/* right col */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
        <div className="flex items-center gap-3 mb-3">
          <Image className="w-5 h-5 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">Generated Image</h1>
        </div>
        {!content ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <Image className="w-9 h-9" />
              <p>Enter a topic and click "Generate image" to get started</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <img
              src={content}
              alt="Generated"
              className="mt-3 max-h-[400px] w-auto rounded-md border"
            />
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-[#00AD25] hover:bg-[#029b20] text-white text-sm rounded-lg"
            >
              <Download className="w-4 h-4" />
              Download Image
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GenerateImages
