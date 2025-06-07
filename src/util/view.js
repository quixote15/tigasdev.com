class View {
    constructor() {
        this.videoGridRef = null
        this.setParticipantsCount = null
    }

    setVideoGridRef(ref) {
        this.videoGridRef = ref
        return this
    }

    setParticipantsCountCallback(callback) {
        this.setParticipantsCount = callback
        return this
    }

    addVideoStream(userId, stream, isLocal = false, participantsCount = 1) {
        console.log(`🎬 Adding video stream for ${isLocal ? 'local user' : userId}`)
        
        // Retry mechanism for video grid ref
        const attemptAddVideo = (attempt = 1, maxAttempts = 10) => {
            const videoGrid = this.videoGridRef?.current
            
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
            nameLabel.textContent = isLocal ? 'You (Local)' : `Remote: ${userId.substring(0, 8)}`

            // Debug overlay
            const debugOverlay = document.createElement('div')
            debugOverlay.className = 'absolute top-2 left-2 bg-black bg-opacity-70 text-white p-2 rounded text-xs font-mono max-w-xs'
            debugOverlay.id = `debug-${userId}`
            debugOverlay.innerHTML = `
                <div><strong>ID:</strong> ${userId}</div>
                <div><strong>Status:</strong> <span id="status-${userId}">connecting...</span></div>
                <div><strong>Ping:</strong> <span id="ping-${userId}">--</span> ms</div>
                <div><strong>Rate:</strong> <span id="rate-${userId}">--</span> kbps</div>
                <div><strong>Resolution:</strong> <span id="resolution-${userId}">--</span></div>
                <div><strong>FPS:</strong> <span id="fps-${userId}">--</span></div>
            `

            videoWrapper.appendChild(video)
            videoWrapper.appendChild(nameLabel)
            videoWrapper.appendChild(debugOverlay)

            // Start monitoring stream stats
            this._startStreamMonitoring(userId, video, stream, isLocal)
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
            if (this.setParticipantsCount) {
                this.setParticipantsCount(participantsCount)
            }
            
            console.log(`✅ Video element added to DOM for ${userId}`)
        }

        // Start the attempt
        attemptAddVideo()
    }

    removeVideoStream(userId) {
        const videoElement = document.getElementById(userId)
        if (videoElement) {
            videoElement.remove()
            console.log(`🗑️ Removed video element for ${userId}`)
        }
    }

    renderVideo({ userId, stream, isCurrentId = false }) {
        this.addVideoStream(userId, stream, isCurrentId, 1)
    }

    setParticipants(count) {
        if (this.setParticipantsCount) {
            this.setParticipantsCount(count)
        }
    }

    // Stream monitoring methods
    _startStreamMonitoring(userId, video, stream, isLocal) {
        // Monitor video resolution and FPS
        const updateVideoStats = () => {
            if (video.videoWidth && video.videoHeight) {
                this.updateResolution(userId, `${video.videoWidth}x${video.videoHeight}`)
            }
            
            // Calculate FPS (basic estimation)
            if (!video._frameCount) video._frameCount = 0
            if (!video._lastFrameTime) video._lastFrameTime = Date.now()
            
            video._frameCount++
            const now = Date.now()
            const timeDiff = now - video._lastFrameTime
            
            if (timeDiff >= 30000) { // Update every 30 seconds
                const fps = Math.round((video._frameCount * 1000) / timeDiff)
                this.updateFPS(userId, fps)
                video._frameCount = 0
                video._lastFrameTime = now
            }
        }

        // Start monitoring
        const statsInterval = setInterval(() => {
            if (document.getElementById(userId)) {
                updateVideoStats()
            } else {
                clearInterval(statsInterval)
            }
        }, 30000) // Update every 30 seconds

        // Set initial status
        this.updateConnectionStatus(userId, isLocal ? 'local' : 'connecting')
    }

    // Update methods for debug overlay
    updateConnectionStatus(userId, status) {
        const statusElement = document.getElementById(`status-${userId}`)
        if (statusElement) {
            statusElement.textContent = status
            statusElement.style.color = this._getStatusColor(status)
        }
    }

    updatePing(userId, pingMs) {
        const pingElement = document.getElementById(`ping-${userId}`)
        if (pingElement) {
            pingElement.textContent = pingMs
            pingElement.style.color = pingMs < 100 ? '#10b981' : pingMs < 300 ? '#f59e0b' : '#ef4444'
        }
    }

    updateStreamRate(userId, rateKbps) {
        const rateElement = document.getElementById(`rate-${userId}`)
        if (rateElement) {
            rateElement.textContent = rateKbps
        }
    }

    updateResolution(userId, resolution) {
        const resolutionElement = document.getElementById(`resolution-${userId}`)
        if (resolutionElement) {
            resolutionElement.textContent = resolution
        }
    }

    updateFPS(userId, fps) {
        const fpsElement = document.getElementById(`fps-${userId}`)
        if (fpsElement) {
            fpsElement.textContent = fps
            fpsElement.style.color = fps >= 24 ? '#10b981' : fps >= 15 ? '#f59e0b' : '#ef4444'
        }
    }

    _getStatusColor(status) {
        switch (status) {
            case 'connected': return '#10b981'
            case 'connecting': return '#f59e0b'
            case 'local': return '#3b82f6'
            case 'disconnected': return '#ef4444'
            case 'failed': return '#dc2626'
            default: return '#6b7280'
        }
    }

    // Toggle debug overlay visibility
    toggleDebugOverlay(userId) {
        const debugOverlay = document.getElementById(`debug-${userId}`)
        if (debugOverlay) {
            debugOverlay.style.display = debugOverlay.style.display === 'none' ? 'block' : 'none'
        }
    }

    // Show/hide all debug overlays
    toggleAllDebugOverlays() {
        const debugOverlays = document.querySelectorAll('[id^="debug-"]')
        const isVisible = debugOverlays.length > 0 && debugOverlays[0].style.display !== 'none'
        
        debugOverlays.forEach(overlay => {
            overlay.style.display = isVisible ? 'none' : 'block'
        })
        
        return !isVisible
    }
}

export { View }