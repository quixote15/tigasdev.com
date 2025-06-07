import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Layout from '@components/Layout'
import { createVideoCallService, createVideoCallServiceWithFallback } from '../util/index.js'
import { PeerConnectionDiagnostics } from '../util/diagnostics.js'

// Import PeerJS and Socket.IO properly
import Peer from 'peerjs'
import io from 'socket.io-client'

// Make them globally available for the utility classes
if (typeof window !== 'undefined') {
  window.Peer = Peer
  window.io = io
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
  const [diagnostics, setDiagnostics] = useState(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  
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
      // Check if PeerJS and Socket.IO are available
      if (typeof window !== 'undefined' && (!window.Peer || !window.io)) {
        throw new Error('PeerJS or Socket.IO not loaded properly')
      }
      
      // Small delay to ensure component is fully mounted
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Create video call service using the factory function
      businessRef.current = useFallback 
        ? createVideoCallServiceWithFallback({
            roomId,
            videoGridRef,
            setParticipantsCount,
            setMessages,
            setIsRecording
          })
        : createVideoCallService({
            roomId,
            videoGridRef,
            setParticipantsCount,
            setMessages,
            setIsRecording
          })
      
      // Initialize the video call
      await businessRef.current._init()
      setIsInCall(true)
    } catch (error) {
      console.error('Failed to join call:', error)
      setError(`Failed to join call: ${error.message}. Please check your camera permissions and try again.`)
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

  const handleToggleDebug = () => {
    if (businessRef.current) {
      businessRef.current.toggleDebugOverlays()
    }
  }

  const handleSendMessage = () => {
    if (businessRef.current && newMessage.trim()) {
      businessRef.current.sendMessage(newMessage)
      setNewMessage('')
    }
  }

  const runDiagnostics = async () => {
    setIsLoading(true)
    try {
      const diagnosticTool = new PeerConnectionDiagnostics()
      const results = await diagnosticTool.runFullDiagnostics()
      setDiagnostics(diagnosticTool.generateReport())
      setShowDiagnostics(true)
    } catch (error) {
      console.error('❌ Failed to run diagnostics:', error)
      setError('Failed to run diagnostics: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isInCall) {
    return (
      <>
        <Head>
          <title>Video Call - Tigasdev</title>
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
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="useFallback"
                    checked={useFallback}
                    onChange={(e) => setUseFallback(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="useFallback" className="text-sm text-gray-300">
                    Use fallback (PeerJS cloud)
                  </label>
                </div>

                <button
                  onClick={joinCall}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200 mb-2"
                >
                  {isLoading ? '🎥 Connecting...' : 'Join Call'}
                </button>

                <button
                  onClick={runDiagnostics}
                  disabled={isLoading}
                  className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-200 mb-4"
                >
                  {isLoading ? '🔍 Running diagnostics...' : '🔍 Run Connection Test'}
                </button>
                
                <div className="text-sm text-gray-400 text-center">
                  💡 Make sure to allow camera and microphone access when prompted
                </div>

                {showDiagnostics && diagnostics && (
                  <div className="mt-4 p-4 bg-gray-700 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">Diagnostic Results</h3>
                      <button
                        onClick={() => setShowDiagnostics(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                      {diagnostics}
                    </pre>
                  </div>
                )}
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
      </Head>
      <div className="h-screen bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
          <div className="text-white font-medium">
            Room: <span className="font-mono text-blue-400">{roomId}</span>
          </div>
          <div className="text-gray-300 text-sm">
            {participantsCount} participant{participantsCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Video Grid */}
          <div className="flex-1 p-4 flex items-center justify-center">
            <div 
              ref={videoGridRef}
              className={`grid gap-4 auto-rows-fr ${
                participantsCount === 1 
                  ? 'w-[70%] h-[70%]' 
                  : 'w-full h-full'
              }`}
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

            {/* Debug Toggle Button */}
            <button
              onClick={handleToggleDebug}
              className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition duration-200"
              title="Toggle Debug Info"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
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