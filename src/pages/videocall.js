import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Layout from '@components/Layout'

// Video Call Business Logic
class VideoCallBusiness {
  constructor({ roomId, videoGridRef, setParticipantsCount, setMessages, setIsRecording }) {
    this.roomId = roomId
    this.videoGridRef = videoGridRef
    this.setParticipantsCount = setParticipantsCount
    this.setMessages = setMessages
    this.setIsRecording = setIsRecording
    
    this.socket = null
    this.peer = null
    this.localStream = null
    this.peers = new Map()
    this.isRecording = false
    this.isMuted = false
    this.isVideoOn = true
  }

  setConnectionStatus(status) {
    console.log(`🔄 Connection status: ${status}`)
    // You can extend this to update UI status if needed
  }

  async initialize() {
    try {
      console.log('🚀 Initializing video call...')
      
      // Set up local video with enhanced error handling
      await this.setupLocalVideo()

      console.log('🔌 Initializing connections...')
      // Initialize socket connection
      this.initializeSocket()
      
      // Initialize PeerJS
      this.initializePeer()
      
    } catch (error) {
      console.error('❌ Error initializing video call:', error)
      throw error // Let the calling code handle the error display
    }
  }

  initializeSocket() {
    // Using the same socket configuration as the example
    const socketUrl = 'http://signaling-server.tigasdev.com'
    this.socket = io(socketUrl)
    
    this.socket.on('user-connected', (userId) => {
      console.log('User connected:', userId)
      this.connectToNewUser(userId)
    })
    
    this.socket.on('user-disconnected', (userId) => {
      console.log('User disconnected:', userId)
      this.removeUser(userId)
    })
    
    this.socket.on('chat-message', (message) => {
      this.setMessages(prev => [...prev, message])
    })
  }

  initializePeer() {
    const PEERJS_KEY = 'Bkiv2sHChaglEQOr50OjlOFMEE8ObzW2URwpC00iWsY'
    
    this.peer = new Peer({
      host: 'peer-server.tigasdev.com',
      port: 80,
      path: '/',
      secure: false,
      debug: 2,
      key: PEERJS_KEY
    })

    this.peer.on('open', (id) => {
      console.log('Peer connected with ID:', id)
      this.socket.emit('join-room', this.roomId, id)
    })

    this.peer.on('call', (call) => {
      call.answer(this.localStream)
      call.on('stream', (userVideoStream) => {
        this.addVideoStream(call.peer, userVideoStream)
      })
      
      call.on('close', () => {
        this.removeUser(call.peer)
      })
      
      this.peers.set(call.peer, call)
    })

    this.peer.on('error', (error) => {
      console.error('Peer error:', error)
    })
  }

  connectToNewUser(userId) {
    const call = this.peer.call(userId, this.localStream)
    
    call.on('stream', (userVideoStream) => {
      this.addVideoStream(userId, userVideoStream)
    })
    
    call.on('close', () => {
      this.removeUser(userId)
    })
    
    this.peers.set(userId, call)
    this.setParticipantsCount(this.peers.size + 1)
  }

  addVideoStream(userId, stream, isLocal = false) {
    console.log(`🎬 Adding video stream for ${isLocal ? 'local user' : userId}`)
    
    // Retry mechanism for video grid ref
    const attemptAddVideo = (attempt = 1, maxAttempts = 10) => {
      const videoGrid = this.videoGridRef.current
      
      if (!videoGrid) {
        console.warn(`❌ Video grid ref not available (attempt ${attempt}/${maxAttempts})`)
        
        if (attempt < maxAttempts) {
          console.log(`🔄 Retrying video grid access for ${userId} in 200ms...`)
          setTimeout(() => attemptAddVideo(attempt + 1, maxAttempts), 200)
          return
        } else {
          console.error(`❌ Video grid ref never became available for ${userId}`)
          return
        }
      }

      console.log(`✅ Video grid ref available, proceeding with video setup for ${userId}`)

      // Check if video already exists (prevent duplicates)
      const existingVideo = document.getElementById(userId)
      if (existingVideo) {
        console.log(`⚠️ Video for ${userId} already exists, removing old one`)
        existingVideo.remove()
      }

      const videoWrapper = document.createElement('div')
      videoWrapper.className = `relative bg-gray-800 rounded-lg overflow-hidden ${isLocal ? 'border-2 border-blue-500' : ''}`
      videoWrapper.id = userId

      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.playsInline = true
      video.muted = isLocal // Mute local video to prevent feedback
      video.className = 'w-full h-full object-cover'
      
      // Add event listeners for debugging
      video.addEventListener('loadstart', () => {
        console.log(`📹 Video loadstart for ${userId}`)
      })
      
      video.addEventListener('loadedmetadata', () => {
        console.log(`📹 Video metadata loaded for ${userId}`)
      })
      
      video.addEventListener('canplay', () => {
        console.log(`📹 Video can play for ${userId}`)
      })
      
      video.addEventListener('playing', () => {
        console.log(`✅ Video started playing for ${userId}`)
      })
      
      video.addEventListener('error', (e) => {
        console.error(`❌ Video error for ${userId}:`, e)
      })

      // Enhanced video play with retry mechanism
      const playVideo = async (attempt = 1, maxAttempts = 5) => {
        try {
          console.log(`▶️ Attempting to play video for ${userId} (attempt ${attempt})`)
          
          const playPromise = video.play()
          if (playPromise !== undefined) {
            await playPromise
            console.log(`✅ Video playing successfully for ${userId}`)
          }
        } catch (error) {
          console.error(`❌ Video play error for ${userId} (attempt ${attempt}):`, error)
          
          if (attempt < maxAttempts) {
            console.log(`🔄 Retrying video play for ${userId} in 500ms...`)
            setTimeout(() => playVideo(attempt + 1, maxAttempts), 500)
          } else {
            console.error(`❌ Video play failed for ${userId} after ${maxAttempts} attempts`)
            
            // Try user interaction approach for autoplay issues
            if (error.name === 'NotAllowedError' || error.message.includes('autoplay')) {
              console.log(`🖱️ Adding click handler for ${userId} due to autoplay policy`)
              video.addEventListener('click', () => {
                video.play().catch(e => console.error(`❌ Click play failed for ${userId}:`, e))
              })
            }
          }
        }
      }

      const nameLabel = document.createElement('div')
      nameLabel.className = 'absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm'
      nameLabel.textContent = isLocal ? 'You' : userId.substring(0, 8)

      videoWrapper.appendChild(video)
      videoWrapper.appendChild(nameLabel)
      videoGrid.appendChild(videoWrapper)

      // Wait a bit for the video element to be properly attached, then try to play
      setTimeout(() => {
        playVideo()
      }, 100)

      // Also try again after a longer delay in case the first attempt fails
      setTimeout(() => {
        if (video.paused) {
          console.log(`🔄 Video still paused for ${userId}, retrying...`)
          playVideo()
        }
      }, 1000)

      // Update participant count
      this.setParticipantsCount(this.peers.size + 1)
      
      console.log(`✅ Video element added to DOM for ${userId}`)
    }

    // Start the attempt
    attemptAddVideo()
  }

  removeUser(userId) {
    const videoElement = document.getElementById(userId)
    if (videoElement) {
      videoElement.remove()
    }
    
    if (this.peers.has(userId)) {
      this.peers.get(userId).close()
      this.peers.delete(userId)
    }
    
    this.setParticipantsCount(this.peers.size + 1)
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    const audioTrack = this.localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !this.isMuted
      console.log(`🎤 Audio ${this.isMuted ? 'muted' : 'unmuted'}`)
    }
    return this.isMuted
  }

  toggleVideo() {
    this.isVideoOn = !this.isVideoOn
    const videoTrack = this.localStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = this.isVideoOn
      console.log(`📹 Video ${this.isVideoOn ? 'enabled' : 'disabled'}`)
    }
    return this.isVideoOn
  }

  toggleRecording() {
    this.isRecording = !this.isRecording
    this.setIsRecording(this.isRecording)
    // Here you would implement actual recording logic
    console.log('Recording:', this.isRecording)
    return this.isRecording
  }

  sendMessage(message) {
    if (this.socket && message.trim()) {
      const chatMessage = {
        text: message,
        sender: 'You',
        timestamp: new Date().toLocaleTimeString()
      }
      this.socket.emit('chat-message', chatMessage)
      this.setMessages(prev => [...prev, chatMessage])
    }
  }

  leaveCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
    }
    
    this.peers.forEach(call => call.close())
    
    if (this.socket) {
      this.socket.disconnect()
    }
    
    if (this.peer) {
      this.peer.destroy()
    }
  }

  async setupLocalVideo() {
    try {
      console.log('🎥 Setting up local video...')
      this.setConnectionStatus('Getting camera access...')

      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }

      console.log('📋 Requesting media with constraints:', constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      console.log('✅ Local media stream obtained')
      console.log('📹 Stream details:', {
        active: stream.active,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      })

      // Log track details
      stream.getVideoTracks().forEach((track, index) => {
        console.log(`📹 Video Track ${index}:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          label: track.label,
          settings: track.getSettings()
        })
      })

      this.localStream = stream
      
      // Add local video with retry mechanism
      this.addVideoStream('local-user', stream, true)
      
      this.setConnectionStatus('Connected')
      return stream
    } catch (error) {
      console.error('❌ Error accessing media devices:', error)
      
      let errorMessage = 'Failed to access camera and microphone. '
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Permission denied. Please allow camera and microphone access and refresh the page.'
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found. Please connect your devices and refresh the page.'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera/microphone constraints not supported. Try a different device.'
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera/microphone is already in use by another application.'
      } else if (error.name === 'SecurityError') {
        errorMessage += 'Security error. Please ensure you\'re using HTTPS or localhost.'
      } else {
        errorMessage += error.message
      }
      
      this.setConnectionStatus(`Error: ${errorMessage}`)
      throw error
    }
  }
}

export default function VideoCall() {
  const [roomId, setRoomId] = useState('')
  const [isInCall, setIsInCall] = useState(false)
  const [participantsCount, setParticipantsCount] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const videoGridRef = useRef(null)
  const businessRef = useRef(null)

  useEffect(() => {
    // Get room ID from URL or generate one
    const urlParams = new URLSearchParams(window.location.search)
    const urlRoomId = urlParams.get('room') || `room-${Date.now()}`
    setRoomId(urlRoomId)
  }, [])

  const joinCall = async () => {
    if (!roomId) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // Small delay to ensure component is fully mounted
      await new Promise(resolve => setTimeout(resolve, 100))
      
      businessRef.current = new VideoCallBusiness({
        roomId,
        videoGridRef,
        setParticipantsCount,
        setMessages,
        setIsRecording
      })
      
      await businessRef.current.initialize()
      setIsInCall(true)
    } catch (error) {
      console.error('Failed to join call:', error)
      setError('Failed to join call. Please check your camera permissions and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const leaveCall = () => {
    if (businessRef.current) {
      businessRef.current.leaveCall()
    }
    setIsInCall(false)
    window.location.href = '/'
  }

  const handleMuteToggle = () => {
    if (businessRef.current) {
      const muted = businessRef.current.toggleMute()
      setIsMuted(muted)
    }
  }

  const handleVideoToggle = () => {
    if (businessRef.current) {
      const videoOn = businessRef.current.toggleVideo()
      setIsVideoOn(videoOn)
    }
  }

  const handleRecordToggle = () => {
    if (businessRef.current) {
      businessRef.current.toggleRecording()
    }
  }

  const handleSendMessage = () => {
    if (businessRef.current && newMessage.trim()) {
      businessRef.current.sendMessage(newMessage)
      setNewMessage('')
    }
  }

  if (!isInCall) {
    return (
      <>
        <Head>
          <title>Video Call - Tigasdev</title>
          <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
          <script src="https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js"></script>
        </Head>
        <Layout>
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h1 className="text-2xl font-bold text-white mb-6 text-center">Join Video Call</h1>
              
              {error && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room ID
                  </label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter room ID or leave blank for random"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={joinCall}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  {isLoading ? '🎥 Connecting...' : 'Join Call'}
                </button>
                
                <div className="text-sm text-gray-400 text-center">
                  💡 Make sure to allow camera and microphone access when prompted
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Video Call - {roomId}</title>
        <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
        <script src="https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js"></script>
      </Head>
      <div className="h-screen bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
          <div className="text-white font-medium">Room: {roomId}</div>
          <div className="text-gray-300 text-sm">
            {participantsCount} participant{participantsCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Video Grid */}
          <div className="flex-1 p-4">
            <div 
              ref={videoGridRef}
              className="grid gap-4 h-full auto-rows-fr"
              style={{
                gridTemplateColumns: participantsCount === 1 ? '1fr' : 
                                   participantsCount <= 4 ? 'repeat(2, 1fr)' : 
                                   'repeat(3, 1fr)'
              }}
            />
          </div>

          {/* Chat Sidebar */}
          {isChatOpen && (
            <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-white font-medium">Chat</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, index) => (
                  <div key={index} className="text-sm">
                    <div className="text-gray-300 font-medium">{msg.sender}</div>
                    <div className="text-white">{msg.text}</div>
                    <div className="text-gray-500 text-xs">{msg.timestamp}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-700">
                <div className="flex">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-l-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a message..."
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md transition duration-200"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-4">
          <div className="flex items-center justify-center space-x-4">
            {/* Mute Button */}
            <button
              onClick={handleMuteToggle}
              className={`p-3 rounded-full transition duration-200 ${
                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                {isMuted ? (
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.29 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.29l4.093-3.793a1 1 0 011.617.793zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.29 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.29l4.093-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                )}
              </svg>
            </button>

            {/* Video Button */}
            <button
              onClick={handleVideoToggle}
              className={`p-3 rounded-full transition duration-200 ${
                !isVideoOn ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                {!isVideoOn ? (
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0017 14V8a2 2 0 00-2-2v4a2 2 0 01-2 2H8.414L3.707 2.293zM2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                ) : (
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                )}
              </svg>
            </button>

            {/* Record Button */}
            <button
              onClick={handleRecordToggle}
              className={`p-3 rounded-full transition duration-200 ${
                isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="3" />
              </svg>
            </button>

            {/* Chat Button */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-3 rounded-full transition duration-200 ${
                isChatOpen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Leave Button */}
            <button
              onClick={leaveCall}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full transition duration-200"
            >
              End Call
            </button>
          </div>
        </div>
      </div>
    </>
  )
} 