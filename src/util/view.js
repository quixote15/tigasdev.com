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
        console.log(`🎬 UserId type: ${typeof userId}, value: ${userId}`)
        console.log(`🎬 IsLocal: ${isLocal}`)
        
        // Check for null/undefined userId
        if (!userId) {
            console.error('❌ Cannot add video stream with null/undefined userId:', userId)
            return
        }
        
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
            videoWrapper.className = 'relative bg-gray-800 rounded-lg overflow-hidden w-full h-full flex items-center justify-center group'
            videoWrapper.id = userId

            // Inner container to maintain aspect ratio
            const videoContainer = document.createElement('div')
            videoContainer.className = 'relative w-full h-full aspect-video'

            const video = document.createElement('video')
            video.autoplay = true
            video.playsInline = true
            video.muted = true // All participants join muted
            video.className = 'w-full h-full object-cover rounded-lg'
            video.srcObject = stream
            
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
            nameLabel.className = 'absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm font-medium transition-opacity group-hover:opacity-100 opacity-90'
            nameLabel.textContent = isLocal ? 'You' : `${userId.substring(0, 10)}`

            // Debug overlay - now more compact and better positioned
            const debugOverlay = document.createElement('div')
            debugOverlay.className = 'absolute top-2 left-2 bg-black bg-opacity-70 text-white p-2 rounded text-xs font-mono max-w-[160px] leading-tight transition-opacity opacity-0 group-hover:opacity-100'
            debugOverlay.id = `debug-${userId}`
            debugOverlay.innerHTML = `
                <div><strong>ID:</strong> ${userId.substring(0, 8)}...</div>
                <div><strong>Status:</strong> <span id="status-${userId}">connecting...</span></div>
                <div><strong>Ping:</strong> <span id="ping-${userId}">--</span>ms</div>
                <div><strong>Rate:</strong> <span id="rate-${userId}">--</span>k</div>
                <div><strong>Res:</strong> <span id="resolution-${userId}">--</span></div>
                <div><strong>FPS:</strong> <span id="fps-${userId}">--</span></div>
            `

            // Connection status indicator
            const statusIndicator = document.createElement('div')
            statusIndicator.className = 'absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500 transition-colors'
            statusIndicator.id = `indicator-${userId}`

            // Assemble the video container
            videoContainer.appendChild(video)
            videoContainer.appendChild(nameLabel)
            videoContainer.appendChild(debugOverlay)
            videoContainer.appendChild(statusIndicator)
            videoWrapper.appendChild(videoContainer)

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
        console.log(`🔍 Starting stream monitoring for ${userId} (local: ${isLocal})`)
        
        // Initialize monitoring variables
        let frameCount = 0
        let lastFrameTime = Date.now()
        let lastResolutionCheck = 0
        
        // Monitor video resolution, FPS and general health
        const updateVideoStats = () => {
            try {
                // Update resolution more frequently when it changes
                if (video.videoWidth && video.videoHeight) {
                    const resolution = `${video.videoWidth}x${video.videoHeight}`
                    const now = Date.now()
                    
                    // Check resolution every 2 seconds or when significant time has passed
                    if (now - lastResolutionCheck > 2000) {
                        this.updateResolution(userId, resolution)
                        lastResolutionCheck = now
                    }
                }
                
                // Calculate FPS using requestAnimationFrame for accuracy
                const calculateFPS = () => {
                    frameCount++
                    const now = Date.now()
                    const timeDiff = now - lastFrameTime
                    
                    // Calculate FPS every 5 seconds for more responsive updates
                    if (timeDiff >= 5000) {
                        const fps = Math.round((frameCount * 1000) / timeDiff)
                        this.updateFPS(userId, fps)
                        frameCount = 0
                        lastFrameTime = now
                    }
                    
                    // Continue monitoring if video element still exists
                    if (document.getElementById(userId) && !video.ended && !video.paused) {
                        requestAnimationFrame(calculateFPS)
                    }
                }
                
                // Start FPS monitoring with requestAnimationFrame
                if (!video.ended && !video.paused) {
                    requestAnimationFrame(calculateFPS)
                }
                
            } catch (error) {
                console.warn(`⚠️ Error updating video stats for ${userId}:`, error)
            }
        }

        // Start monitoring with more frequent updates
        const statsInterval = setInterval(() => {
            const videoElement = document.getElementById(userId)
            if (videoElement) {
                updateVideoStats()
            } else {
                console.log(`📹 Video element for ${userId} no longer exists, stopping monitoring`)
                clearInterval(statsInterval)
            }
        }, 2000) // Update every 2 seconds instead of 30

        // Set initial status
        this.updateConnectionStatus(userId, isLocal ? 'local' : 'connecting')
        
        // Run initial stats check
        setTimeout(() => {
            updateVideoStats()
        }, 1000)
        
        // Monitor video events for better status tracking
        video.addEventListener('loadedmetadata', () => {
            console.log(`📹 Video metadata loaded for ${userId}`)
            updateVideoStats()
        })
        
        video.addEventListener('playing', () => {
            console.log(`▶️ Video started playing for ${userId}`)
            if (!isLocal) {
                this.updateConnectionStatus(userId, 'connected')
            }
            updateVideoStats()
        })
        
        video.addEventListener('waiting', () => {
            console.log(`⏳ Video buffering for ${userId}`)
            if (!isLocal) {
                this.updateConnectionStatus(userId, 'buffering')
            }
        })
        
        video.addEventListener('error', (e) => {
            console.error(`❌ Video error for ${userId}:`, e)
            this.updateConnectionStatus(userId, 'failed')
        })
    }

    // Update methods for debug overlay
    updateConnectionStatus(userId, status) {
        const statusElement = document.getElementById(`status-${userId}`)
        const indicatorElement = document.getElementById(`indicator-${userId}`)
        
        if (statusElement) {
            statusElement.textContent = status
            statusElement.style.color = this._getStatusColor(status)
            console.log(`📊 Updated status for ${userId}: ${status}`)
        } else {
            console.warn(`⚠️ Status element not found for ${userId}`)
        }
        
        if (indicatorElement) {
            // Update visual status indicator
            const colorClass = status === 'connected' ? 'bg-green-500' :
                             status === 'connecting' ? 'bg-yellow-500' :
                             status === 'local' ? 'bg-blue-500' :
                             status === 'buffering' ? 'bg-yellow-500' :
                             status === 'disconnected' ? 'bg-orange-500' :
                             'bg-red-500'
            
            indicatorElement.className = `absolute top-2 right-2 w-3 h-3 rounded-full transition-colors ${colorClass}`
        }
    }

    updatePing(userId, pingMs) {
        const pingElement = document.getElementById(`ping-${userId}`)
        if (pingElement) {
            pingElement.textContent = pingMs
            pingElement.style.color = pingMs < 100 ? '#10b981' : pingMs < 300 ? '#f59e0b' : '#ef4444'
            console.log(`📊 Updated ping for ${userId}: ${pingMs}ms`)
        } else {
            console.warn(`⚠️ Ping element not found for ${userId}`)
        }
    }

    updateStreamRate(userId, rateKbps) {
        const rateElement = document.getElementById(`rate-${userId}`)
        if (rateElement) {
            rateElement.textContent = rateKbps
            rateElement.style.color = rateKbps > 1000 ? '#10b981' : rateKbps > 500 ? '#f59e0b' : '#ef4444'
            console.log(`📊 Updated rate for ${userId}: ${rateKbps}k`)
        } else {
            console.warn(`⚠️ Rate element not found for ${userId}`)
        }
    }

    updateResolution(userId, resolution) {
        const resolutionElement = document.getElementById(`resolution-${userId}`)
        if (resolutionElement) {
            resolutionElement.textContent = resolution
            console.log(`📊 Updated resolution for ${userId}: ${resolution}`)
        } else {
            console.warn(`⚠️ Resolution element not found for ${userId}`)
        }
    }

    updateFPS(userId, fps) {
        const fpsElement = document.getElementById(`fps-${userId}`)
        if (fpsElement) {
            fpsElement.textContent = fps
            fpsElement.style.color = fps >= 24 ? '#10b981' : fps >= 15 ? '#f59e0b' : '#ef4444'
            console.log(`📊 Updated FPS for ${userId}: ${fps}`)
        } else {
            console.warn(`⚠️ FPS element not found for ${userId}`)
        }
    }

    _getStatusColor(status) {
        switch (status) {
            case 'connected': return '#10b981'
            case 'connecting': return '#f59e0b'
            case 'local': return '#3b82f6'
            case 'buffering': return '#f59e0b'
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
        const isVisible = debugOverlays.length > 0 && !debugOverlays[0].classList.contains('opacity-0')
        
        debugOverlays.forEach(overlay => {
            if (isVisible) {
                // Hide permanently
                overlay.classList.remove('group-hover:opacity-100')
                overlay.classList.add('opacity-0')
            } else {
                // Show and restore hover behavior
                overlay.classList.remove('opacity-0')
                overlay.classList.add('group-hover:opacity-100', 'opacity-100')
            }
        })
        
        return !isVisible
    }
}

export { View }