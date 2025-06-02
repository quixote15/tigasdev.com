import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '@components/Layout'

export default function Meet() {
  const [roomId, setRoomId] = useState('')

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 15)
    setRoomId(randomId)
  }

  const startInstantMeeting = () => {
    const instantRoomId = `instant-${Date.now()}`
    window.location.href = `/preview?room=${instantRoomId}`
  }

  const joinMeeting = () => {
    if (roomId.trim()) {
      window.location.href = `/preview?room=${roomId}`
    }
  }

  return (
    <>
      <Head>
        <title>Tigasdev Meet - Video Calling Platform</title>
        <meta name="description" content="Join or start video calls with anyone, anywhere. Built with WebRTC for crystal clear communication." />
      </Head>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          {/* Hero Section */}
          <div className="pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto text-center">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-transparent bg-clip-text">
                Tigasdev Meet
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto font-mono">
                Connect with anyone, anywhere. High-quality video calls powered by WebRTC technology.
              </p>
              
              {/* Quick Actions */}
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-12">
                <button
                  onClick={startInstantMeeting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-300 transform hover:scale-105 shadow-lg"
                >
                  🚀 Start Instant Meeting
                </button>
                
                <div className="text-gray-400 font-mono">or</div>
                
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter meeting ID"
                    className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                    onKeyPress={(e) => e.key === 'Enter' && joinMeeting()}
                  />
                  <button
                    onClick={joinMeeting}
                    disabled={!roomId.trim()}
                    className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
                  >
                    Join
                  </button>
                  <button
                    onClick={generateRoomId}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
                    title="Generate Random Room ID"
                  >
                    🎲
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-16 px-4 bg-gray-800 bg-opacity-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
                Features
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="text-4xl mb-4">🎥</div>
                  <h3 className="text-xl font-bold text-white mb-3">HD Video Calls</h3>
                  <p className="text-gray-300">
                    Crystal clear video quality with adaptive streaming for the best experience on any connection.
                  </p>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-xl font-bold text-white mb-3">Multi-participant</h3>
                  <p className="text-gray-300">
                    Support for multiple participants in a single call. Perfect for team meetings and group chats.
                  </p>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-xl font-bold text-white mb-3">Real-time Chat</h3>
                  <p className="text-gray-300">
                    Built-in text chat functionality to share links, notes, and messages during your calls.
                  </p>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="text-xl font-bold text-white mb-3">Secure & Private</h3>
                  <p className="text-gray-300">
                    End-to-end encrypted communication. Your conversations stay private and secure.
                  </p>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="text-4xl mb-4">📱</div>
                  <h3 className="text-xl font-bold text-white mb-3">Cross-platform</h3>
                  <p className="text-gray-300">
                    Works seamlessly across desktop, mobile, and tablet devices. No downloads required.
                  </p>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
                  <p className="text-gray-300">
                    Powered by WebRTC for low-latency, peer-to-peer communication with minimal delay.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="py-16 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white">
                How it works
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8 text-left">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Create or Join</h3>
                  <p className="text-gray-300">
                    Start an instant meeting or enter a room ID to join an existing call.
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Test & Setup</h3>
                  <p className="text-gray-300">
                    Test your camera and microphone to ensure everything works perfectly before joining.
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Communicate</h3>
                  <p className="text-gray-300">
                    Enjoy high-quality video calls with voice, video, chat, and screen sharing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="py-16 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to start your first call?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                No sign-up required. Just click and connect.
              </p>
              <button
                onClick={startInstantMeeting}
                className="bg-white text-blue-600 font-bold py-4 px-8 rounded-lg text-lg transition duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Start Meeting Now 🚀
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="py-8 px-4 text-center text-gray-400 border-t border-gray-800">
            <p className="font-mono">
              Built with ❤️ by{' '}
              <Link href="/" className="text-blue-400 hover:text-blue-300">
                Tigasdev
              </Link>
              {' '}using WebRTC & Next.js
            </p>
          </div>
        </div>
      </Layout>
    </>
  )
} 