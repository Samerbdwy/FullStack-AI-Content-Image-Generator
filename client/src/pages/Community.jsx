import React, { useEffect, useState } from 'react'
import { dummyPublishedCreationData } from '../assets/assets'
import { Heart, X } from 'lucide-react'
import { useAuth, useUser } from '@clerk/clerk-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const Community = () => {
  const [creations, setCreations] = useState([])
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuth()

  // State for modal
  const [selectedCreation, setSelectedCreation] = useState(null)

  const fetchCreations = async () => {
    try {
      const {data} = await axios.get('/api/user/get-published-creations', {
        headers: {Authorization: `Bearer ${await getToken()}`}
      })
      if(data.success){
        setCreations(data.creations)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
      
    }
    setLoading(false)
  }

  const imageLikeToggle = async(id)=>{
    try {
      const {data} = await axios.post('/api/user/toggle-like-creation', {id}, {
        headers: {Authorization: `Bearer ${await getToken()}`}
      })

      if(data.success){
        toast.success(data.message)
        await fetchCreations()
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
      
    }
  }

  useEffect(() => {
    if (user) {
      fetchCreations()
    }
  }, [user])

  // Handle like toggle (dummy example)
  const handleLike = (e, creationId) => {
    e.stopPropagation() // 🚫 prevents modal from opening
    console.log("Liked creation:", creationId)
    // You can add logic here to update likes in state
  }

  return !loading ?  (
    <div className="flex-1 h-full flex flex-col gap-4 p-6">
      <h2 className="text-lg font-semibold">Creations</h2>

      {/* Grid of images */}
      <div className="bg-white h-full w-full rounded-xl overflow-y-scroll p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {creations.map((creation, index) => (
          <div key={index} className="w-full">
            {/* Image */}
            <div
              className="relative group cursor-pointer"
              onClick={() => setSelectedCreation(creation)}
            >
              <img
                src={creation.content}
                alt="creation"
                className="w-full h-64 object-cover rounded-lg"
              />

              {/* Like button overlay */}
              <div className="absolute inset-0 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                  className="flex gap-1 items-center bg-white/80 text-gray-800 px-2 py-1 rounded-md shadow-md backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()} // prevent modal
                >
                  <p className="text-sm">{creation.likes.length}</p>
                  <Heart
                    onClick={()=> imageLikeToggle(creation.id)}
                    className={`min-w-5 h-5 hover:scale-110 cursor-pointer transition-transform ${
                      creation.likes.includes(user?.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-700'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal overlay for description */}
      {selectedCreation && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-6">
          <button
            onClick={() => setSelectedCreation(null)}
            className="absolute top-5 right-5 text-white hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={selectedCreation.content}
            alt="creation"
            className="max-w-lg w-full rounded-lg mb-4"
          />
          <p className="text-white text-lg font-medium text-center max-w-xl">
            {selectedCreation.prompt}
          </p>
        </div>
      )}
    </div>
  ) : (
    <div className='flex justify-center items-center h-full'>
      <span className='w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin'></span>
    </div>
  )
}

export default Community
