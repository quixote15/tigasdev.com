import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '@components/Layout'

export default function MeetPreview() {
  const router = useRouter()
  const videoRef = useRef(null)
  const [roomId, setRoomId] = useState('')
  const [stream, setStream] = useState(null)
  const [permissionStatus, setPermissionStatus] = useState({
    camera: 'pending', // pending, granted, denied, error
    microphone: 'pending'
  })
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isMuted, setIsMuted] = useState(true) // Start muted to avoid feedback
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [videoStatus, setVideoStatus] = useState('Not started') // For debugging
  const [browserInfo, setBrowserInfo] = useState('')
  const [deviceInfo, setDeviceInfo] = useState({
    cameras: [],
    microphones: [],
    selectedCamera: '',
    selectedMicrophone: ''
  })

  // Audio level detection
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const microphoneRef = useRef(null)

  useEffect(() => {
    // Get room ID from URL
    const urlParams = new URLSearchParams(window.location.search)
    const urlRoomId = urlParams.get('room') || `room-${Date.now()}`
    setRoomId(urlRoomId)

    // Check browser and permissions
    checkBrowserSupport()

    // Load available devices (this requires permission first)
    loadDevices()

    return () => {
      // Cleanup
      if (stream) {
        console.log('🧹 Cleaning up stream...')
        stream.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const checkBrowserSupport = () => {
    const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    
    let browser = 'Unknown'
    if (/Chrome/.test(navigator.userAgent)) browser = 'Chrome'
    else if (/Firefox/.test(navigator.userAgent)) browser = 'Firefox'
    else if (/Safari/.test(navigator.userAgent)) browser = 'Safari'
    else if (/Edge/.test(navigator.userAgent)) browser = 'Edge'

    setBrowserInfo(`${browser} - HTTPS: ${isHTTPS} - getUserMedia: ${hasGetUserMedia}`)
    
    console.log('🌐 Browser Support Check:', {
      browser,
      isHTTPS,
      hasGetUserMedia,
      userAgent: navigator.userAgent
    })

    if (!isHTTPS) {
      setError('HTTPS is required for camera access. Please use https:// or localhost.')
    }

    if (!hasGetUserMedia) {
      setError('Your browser does not support camera access. Please use a modern browser.')
    }
  }

  const loadDevices = async () => {
    try {
      // First, try to get devices without detailed labels (this doesn't require permission)
      let devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(device => device.kind === 'videoinput')
      const microphones = devices.filter(device => device.kind === 'audioinput')
      
      console.log('📷 Available cameras (before permission):', cameras.length)
      console.log('🎤 Available microphones (before permission):', microphones.length)
      
      setDeviceInfo({
        cameras,
        microphones,
        selectedCamera: cameras[0]?.deviceId || '',
        selectedMicrophone: microphones[0]?.deviceId || ''
      })
    } catch (error) {
      console.error('Error loading devices:', error)
    }
  }

  const setupVideoElement = (mediaStream) => {
    const attemptSetup = (attempt = 1, maxAttempts = 10) => {
      const video = videoRef.current
      
      if (!video) {
        console.warn(`❌ Video ref not available (attempt ${attempt}/${maxAttempts})`)
        setVideoStatus(`Waiting for video element... (${attempt}/${maxAttempts})`)
        
        if (attempt < maxAttempts) {
          // Wait and try again
          setTimeout(() => attemptSetup(attempt + 1, maxAttempts), 200)
          return
        } else {
          console.error('❌ Video ref never became available')
          setVideoStatus('Video element not found')
          return
        }
      }

      console.log('🎬 Setting up video element...')
      setVideoStatus('Setting up video...')

      // Remove old event listeners to prevent duplicates
      video.removeEventListener('loadstart', () => {})
      video.removeEventListener('loadedmetadata', () => {})
      video.removeEventListener('canplay', () => {})
      video.removeEventListener('playing', () => {})
      video.removeEventListener('error', () => {})

      // Add event listeners for debugging
      video.addEventListener('loadstart', () => {
        console.log('📹 Video: loadstart')
        setVideoStatus('Loading started')
      })

      video.addEventListener('loadedmetadata', () => {
        console.log('📹 Video: loadedmetadata')
        setVideoStatus('Metadata loaded')
      })

      video.addEventListener('canplay', () => {
        console.log('📹 Video: canplay')
        setVideoStatus('Can play')
      })

      video.addEventListener('playing', () => {
        console.log('✅ Video: playing')
        setVideoStatus('Playing')
      })

      video.addEventListener('error', (e) => {
        console.error('❌ Video error:', e)
        setVideoStatus(`Error: ${e.message || 'Unknown error'}`)
      })

      video.addEventListener('stalled', () => {
        console.warn('⚠️ Video: stalled')
        setVideoStatus('Stalled')
      })

      // Set the stream
      video.srcObject = mediaStream
      video.muted = true // Ensure it's muted
      video.playsInline = true
      video.autoplay = true
      
      // Force play immediately
      const playVideo = async () => {
        try {
          console.log('▶️ Attempting to play video...')
          setVideoStatus('Attempting to play...')
          
          // Try to play
          const playPromise = video.play()
          
          if (playPromise !== undefined) {
            await playPromise
            console.log('✅ Video playing successfully')
            setVideoStatus('Playing successfully')
          }
        } catch (error) {
          console.error('❌ Video play error:', error)
          setVideoStatus(`Play error: ${error.message}`)
          
          // Try manual user interaction approach
          if (error.name === 'NotAllowedError' || error.message.includes('autoplay')) {
            setVideoStatus('Click to play (autoplay blocked)')
            
            // Add click handler to video
            const clickHandler = () => {
              video.play().then(() => {
                console.log('✅ Video playing after user interaction')
                setVideoStatus('Playing (user interaction)')
                video.removeEventListener('click', clickHandler)
              }).catch(e => {
                console.error('❌ Video play after click failed:', e)
                setVideoStatus(`Click play failed: ${e.message}`)
              })
            }
            
            video.addEventListener('click', clickHandler)
          }
        }
      }

      // Try to play immediately and also after a delay
      playVideo()
      setTimeout(playVideo, 500)
    }

    // Start the setup attempt
    attemptSetup()
  }

  const requestPermissions = async () => {
    setIsLoading(true)
    setError('')
    setVideoStatus('Requesting permissions...')

    try {
      console.log('🎥 Requesting camera and microphone permissions...')
      
      // Force permission request by being explicit about what we want
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }

      // Only add device constraints if we have devices selected
      if (deviceInfo.selectedCamera) {
        constraints.video.deviceId = { ideal: deviceInfo.selectedCamera }
      }
      if (deviceInfo.selectedMicrophone) {
        constraints.audio.deviceId = { ideal: deviceInfo.selectedMicrophone }
      }

      console.log('📋 MediaStream constraints:', constraints)
      setVideoStatus('Calling getUserMedia...')

      const newStream = await navigator.mediaDevices.getUserMedia(constraints)

      console.log('✅ Permissions granted!')
      console.log('📹 Stream details:', {
        active: newStream.active,
        videoTracks: newStream.getVideoTracks().length,
        audioTracks: newStream.getAudioTracks().length
      })

      // Log track details
      newStream.getVideoTracks().forEach((track, index) => {
        console.log(`📹 Video Track ${index}:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          label: track.label,
          settings: track.getSettings()
        })
      })

      newStream.getAudioTracks().forEach((track, index) => {
        console.log(`🎤 Audio Track ${index}:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          label: track.label
        })
      })
      
      // Update permission status
      setPermissionStatus({
        camera: 'granted',
        microphone: 'granted'
      })

      // Set up video element
      setupVideoElement(newStream)

      // Set up audio level monitoring
      setupAudioLevelMonitoring(newStream)

      setStream(newStream)
      setError('')

      // Reload devices to get proper labels now that we have permission
      setTimeout(loadDevices, 500)

    } catch (error) {
      console.error('❌ Permission error:', error)
      setVideoStatus(`Permission error: ${error.message}`)
      
      let errorMessage = 'Failed to access camera and microphone. '
      let permissionUpdate = { camera: 'error', microphone: 'error' }

      if (error.name === 'NotAllowedError') {
        errorMessage += 'Permission denied. Please allow camera and microphone access and try again.'
        permissionUpdate = { camera: 'denied', microphone: 'denied' }
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

      setError(errorMessage)
      setPermissionStatus(permissionUpdate)
    } finally {
      setIsLoading(false)
    }
  }

  const setupAudioLevelMonitoring = (mediaStream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(mediaStream)
      
      analyser.smoothingTimeConstant = 0.8
      analyser.fftSize = 1024

      microphone.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      microphoneRef.current = microphone

      // Start monitoring audio levels
      monitorAudioLevel()
    } catch (error) {
      console.warn('Could not set up audio level monitoring:', error)
    }
  }

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const checkLevel = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)
      
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      const average = sum / bufferLength
      const level = Math.min(100, (average / 128) * 100)
      
      setAudioLevel(level)
      requestAnimationFrame(checkLevel)
    }

    checkLevel()
  }

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn
        setIsVideoOn(!isVideoOn)
        console.log(`📹 Video ${!isVideoOn ? 'enabled' : 'disabled'}`)
      }
    }
  }

  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = isMuted // Opposite because we start muted
        setIsMuted(!isMuted)
        console.log(`🎤 Audio ${isMuted ? 'unmuted' : 'muted'}`)
      }
    }
  }

  const changeCamera = async (deviceId) => {
    console.log('📷 Changing camera to:', deviceId)
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }

    setDeviceInfo(prev => ({ ...prev, selectedCamera: deviceId }))
    
    // Request new stream with selected camera
    setTimeout(() => {
      requestPermissions()
    }, 100)
  }

  const changeMicrophone = async (deviceId) => {
    console.log('🎤 Changing microphone to:', deviceId)
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }

    setDeviceInfo(prev => ({ ...prev, selectedMicrophone: deviceId }))
    
    // Request new stream with selected microphone
    setTimeout(() => {
      requestPermissions()
    }, 100)
  }

  const joinMeeting = () => {
    if (permissionStatus.camera === 'granted' && permissionStatus.microphone === 'granted') {
      // Clean up preview stream
      if (stream) {
        console.log('🚀 Joining meeting, cleaning up preview stream...')
        stream.getTracks().forEach(track => track.stop())
      }
      
      // Navigate to video call
      router.push(`/videocall?room=${roomId}`)
    }
  }

  const canJoinMeeting = permissionStatus.camera === 'granted' && permissionStatus.microphone === 'granted'

  return (
    <>
      <Head>
        <title>Join Meeting - {roomId}</title>
      </Head>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8">
          <div className="max-w-4xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Ready to join?</h1>
              <p className="text-gray-300">Test your camera and microphone before entering the meeting</p>
              <p className="text-sm text-gray-400 mt-2">Room: <span className="font-mono text-blue-400">{roomId}</span></p>
              <p className="text-xs text-gray-500 mt-1">{browserInfo}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Video Preview */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Camera Preview</h2>
                
                <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                  {stream && isVideoOn ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => {
                        // Allow user to click video to play if autoplay failed
                        if (videoRef.current && videoRef.current.paused) {
                          videoRef.current.play()
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <div className="text-center">
                        {!stream ? (
                          <div className="text-gray-400">
                            <div className="text-4xl mb-2">📹</div>
                            <p>Camera not active</p>
                            <p className="text-xs mt-2 text-gray-500">Status: {videoStatus}</p>
                          </div>
                        ) : (
                          <div className="text-gray-400">
                            <div className="text-4xl mb-2">📹</div>
                            <p>Camera turned off</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* You label */}
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                    You
                  </div>

                  {/* Debug info */}
                  {stream && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                      {videoStatus}
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                <div className="flex gap-2">
                  <button
                    onClick={toggleVideo}
                    disabled={!stream}
                    className={`flex-1 py-2 px-4 rounded-lg transition duration-200 ${
                      isVideoOn 
                        ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    } disabled:opacity-50`}
                  >
                    {isVideoOn ? '📹 Camera On' : '📹 Camera Off'}
                  </button>
                  
                  <button
                    onClick={toggleMute}
                    disabled={!stream}
                    className={`flex-1 py-2 px-4 rounded-lg transition duration-200 ${
                      !isMuted 
                        ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    } disabled:opacity-50`}
                  >
                    {!isMuted ? '🎤 Mic On' : '🎤 Mic Off'}
                  </button>
                </div>

                {/* Audio Level Indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Microphone Level</span>
                    <span className="text-sm text-gray-400">{Math.round(audioLevel)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${Math.min(100, audioLevel)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">Speak to test your microphone</p>
                </div>

                {/* Debug Panel */}
                {stream && (
                  <div className="bg-gray-800 rounded-lg p-3 text-xs">
                    <div className="text-white font-medium mb-2">Debug Info:</div>
                    <div className="text-gray-300 space-y-1">
                      <div>Stream active: {stream.active ? '✅' : '❌'}</div>
                      <div>Video tracks: {stream.getVideoTracks().length}</div>
                      <div>Audio tracks: {stream.getAudioTracks().length}</div>
                      <div>Video status: {videoStatus}</div>
                      {stream.getVideoTracks()[0] && (
                        <div>Video enabled: {stream.getVideoTracks()[0].enabled ? '✅' : '❌'}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Settings & Join */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Settings</h2>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                    <div className="font-medium mb-1">Error</div>
                    <div className="text-sm">{error}</div>
                  </div>
                )}

                {/* Permission Status */}
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-white">Permissions</h3>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Camera</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      permissionStatus.camera === 'granted' ? 'bg-green-500 text-white' :
                      permissionStatus.camera === 'denied' ? 'bg-red-500 text-white' :
                      permissionStatus.camera === 'error' ? 'bg-orange-500 text-white' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {permissionStatus.camera === 'granted' ? '✅ Granted' :
                       permissionStatus.camera === 'denied' ? '❌ Denied' :
                       permissionStatus.camera === 'error' ? '⚠️ Error' :
                       '⏳ Pending'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Microphone</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      permissionStatus.microphone === 'granted' ? 'bg-green-500 text-white' :
                      permissionStatus.microphone === 'denied' ? 'bg-red-500 text-white' :
                      permissionStatus.microphone === 'error' ? 'bg-orange-500 text-white' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {permissionStatus.microphone === 'granted' ? '✅ Granted' :
                       permissionStatus.microphone === 'denied' ? '❌ Denied' :
                       permissionStatus.microphone === 'error' ? '⚠️ Error' :
                       '⏳ Pending'}
                    </span>
                  </div>
                </div>

                {/* Device Selection */}
                {deviceInfo.cameras.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Camera
                      </label>
                      <select
                        value={deviceInfo.selectedCamera}
                        onChange={(e) => changeCamera(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {deviceInfo.cameras.map(camera => (
                          <option key={camera.deviceId} value={camera.deviceId}>
                            {camera.label || `Camera ${camera.deviceId.substring(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Microphone
                      </label>
                      <select
                        value={deviceInfo.selectedMicrophone}
                        onChange={(e) => changeMicrophone(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {deviceInfo.microphones.map(mic => (
                          <option key={mic.deviceId} value={mic.deviceId}>
                            {mic.label || `Microphone ${mic.deviceId.substring(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {!stream ? (
                    <button
                      onClick={requestPermissions}
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
                    >
                      {isLoading ? '🎥 Testing Devices...' : '🎥 Test Camera & Microphone'}
                    </button>
                  ) : (
                    <button
                      onClick={requestPermissions}
                      disabled={isLoading}
                      className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                    >
                      🔄 Retry Test
                    </button>
                  )}

                  <button
                    onClick={joinMeeting}
                    disabled={!canJoinMeeting}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200 text-lg"
                  >
                    {canJoinMeeting ? '🚀 Join Meeting' : '⏳ Test devices first'}
                  </button>

                  <Link href="/meet">
                    <button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                      ← Back to Meet
                    </button>
                  </Link>
                </div>

                {/* Troubleshooting Tips */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium text-white mb-2">Troubleshooting</h3>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>• Make sure you're using HTTPS or localhost</div>
                    <div>• Allow camera/microphone when prompted</div>
                    <div>• Close other apps using your camera</div>
                    <div>• Try refreshing the page if blocked</div>
                    <div>• Check browser permissions in settings</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
} 