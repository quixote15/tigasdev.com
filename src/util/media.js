class Media {
    constructor() {
        this.isMobile = this._detectMobile()
        this.isAndroid = this._detectAndroid()
        this.isIOS = this._detectIOS()
        
        console.log('📱 Device Detection:', {
            isMobile: this.isMobile,
            isAndroid: this.isAndroid,
            isIOS: this.isIOS,
            userAgent: navigator.userAgent
        })
    }

    _detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768) ||
               ('ontouchstart' in window)
    }

    _detectAndroid() {
        return /Android/i.test(navigator.userAgent)
    }

    _detectIOS() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    }

    _getMobileConstraints() {
        if (this.isAndroid) {
            // Android-specific constraints with progressive fallbacks
            return {
                video: {
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    frameRate: { ideal: 15, max: 30 }, // Lower frameRate for Android
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: { ideal: 44100 },
                    channelCount: { ideal: 1 } // Mono for better compatibility
                }
            }
        } else if (this.isIOS) {
            // iOS-specific constraints
            return {
                video: {
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    frameRate: { ideal: 24, max: 30 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            }
        } else {
            // General mobile constraints
            return {
                video: {
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    frameRate: { ideal: 20, max: 30 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            }
        }
    }

    _getDesktopConstraints() {
        return {
            video: {
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 },
                frameRate: { ideal: 30 },
                facingMode: 'user'
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: { ideal: 48000 },
                channelCount: { ideal: 2 }
            }
        }
    }

    async getCamera(constraints = {}) {
        // Use device-specific constraints as base
        const baseConstraints = this.isMobile ? this._getMobileConstraints() : this._getDesktopConstraints()
        const finalConstraints = this._mergeConstraints(baseConstraints, constraints)
        
        console.log('📋 Device type:', this.isMobile ? 'Mobile' : 'Desktop')
        console.log('📋 Requesting media with constraints:', finalConstraints)

        // Progressive fallback strategy for mobile devices
        const fallbackStrategies = this._getFallbackStrategies()
        
        for (let i = 0; i < fallbackStrategies.length; i++) {
            const strategy = fallbackStrategies[i]
            console.log(`🔄 Attempting strategy ${i + 1}/${fallbackStrategies.length}: ${strategy.name}`)
            
            try {
                const constraintsToUse = strategy.constraints || finalConstraints
                const stream = await navigator.mediaDevices.getUserMedia(constraintsToUse)
                
                console.log('✅ Local media stream obtained with strategy:', strategy.name)
                console.log('📹 Stream details:', {
                    active: stream.active,
                    videoTracks: stream.getVideoTracks().length,
                    audioTracks: stream.getAudioTracks().length
                })

                // Log track details for debugging
                this._logTrackDetails(stream)
                
                // Validate stream quality for mobile devices
                if (this.isMobile && !this._validateMobileStream(stream)) {
                    console.warn('⚠️ Stream validation failed, trying next strategy...')
                    stream.getTracks().forEach(track => track.stop())
                    continue
                }

                return stream
                
            } catch (error) {
                console.warn(`❌ Strategy ${i + 1} failed:`, error.name, error.message)
                
                // If this was the last strategy, throw the error
                if (i === fallbackStrategies.length - 1) {
                    throw this._enhanceError(error)
                }
                
                // Continue to next strategy
                continue
            }
        }
    }

    _getFallbackStrategies() {
        const strategies = []

        if (this.isMobile) {
            // Mobile-specific fallback strategies
            strategies.push(
                {
                    name: 'High Quality Mobile',
                    constraints: {
                        video: {
                            width: { ideal: 640, max: 1280 },
                            height: { ideal: 480, max: 720 },
                            frameRate: { ideal: 15, max: 30 },
                            facingMode: 'user'
                        },
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    }
                },
                {
                    name: 'Medium Quality Mobile',
                    constraints: {
                        video: {
                            width: { ideal: 480, max: 640 },
                            height: { ideal: 360, max: 480 },
                            frameRate: { ideal: 15 },
                            facingMode: 'user'
                        },
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true
                        }
                    }
                },
                {
                    name: 'Low Quality Mobile',
                    constraints: {
                        video: {
                            width: { ideal: 320, max: 480 },
                            height: { ideal: 240, max: 360 },
                            frameRate: { ideal: 10 },
                            facingMode: 'user'
                        },
                        audio: true
                    }
                },
                {
                    name: 'Basic Mobile',
                    constraints: {
                        video: {
                            facingMode: 'user'
                        },
                        audio: true
                    }
                },
                {
                    name: 'Minimal Mobile',
                    constraints: {
                        video: true,
                        audio: true
                    }
                }
            )

            // Android-specific additional strategies
            if (this.isAndroid) {
                strategies.splice(1, 0, {
                    name: 'Android Optimized',
                    constraints: {
                        video: {
                            width: { exact: 640 },
                            height: { exact: 480 },
                            frameRate: { exact: 15 },
                            facingMode: { exact: 'user' }
                        },
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                            channelCount: { exact: 1 }
                        }
                    }
                })
            }
        } else {
            // Desktop fallback strategies
            strategies.push(
                {
                    name: 'High Quality Desktop',
                    constraints: {
                        video: {
                            width: { ideal: 1280, min: 640 },
                            height: { ideal: 720, min: 480 },
                            frameRate: { ideal: 30 },
                            facingMode: 'user'
                        },
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    }
                },
                {
                    name: 'Standard Desktop',
                    constraints: {
                        video: {
                            width: { ideal: 640 },
                            height: { ideal: 480 },
                            frameRate: { ideal: 30 }
                        },
                        audio: true
                    }
                },
                {
                    name: 'Basic Desktop',
                    constraints: {
                        video: true,
                        audio: true
                    }
                }
            )
        }

        return strategies
    }

    _mergeConstraints(base, override) {
        const merged = JSON.parse(JSON.stringify(base)) // Deep clone
        
        if (override.video) {
            merged.video = { ...merged.video, ...override.video }
        }
        
        if (override.audio) {
            merged.audio = { ...merged.audio, ...override.audio }
        }
        
        return merged
    }

    _validateMobileStream(stream) {
        try {
            const videoTracks = stream.getVideoTracks()
            const audioTracks = stream.getAudioTracks()
            
            // Ensure we have at least video
            if (videoTracks.length === 0) {
                console.warn('⚠️ No video tracks in mobile stream')
                return false
            }

            // Check video track state
            const videoTrack = videoTracks[0]
            if (videoTrack.readyState !== 'live') {
                console.warn('⚠️ Video track not live:', videoTrack.readyState)
                return false
            }

            // Check video settings (if available)
            const settings = videoTrack.getSettings()
            if (settings.width && settings.height) {
                console.log('📱 Video settings:', {
                    width: settings.width,
                    height: settings.height,
                    frameRate: settings.frameRate
                })
                
                // Ensure minimum resolution
                if (settings.width < 240 || settings.height < 180) {
                    console.warn('⚠️ Video resolution too low:', settings.width, 'x', settings.height)
                    return false
                }
            }

            return true
            
        } catch (error) {
            console.warn('⚠️ Error validating mobile stream:', error)
            return false
        }
    }

    _logTrackDetails(stream) {
        // Log video track details
        stream.getVideoTracks().forEach((track, index) => {
            const settings = track.getSettings()
            const capabilities = track.getCapabilities ? track.getCapabilities() : {}
            
            console.log(`📹 Video Track ${index}:`, {
                enabled: track.enabled,
                readyState: track.readyState,
                label: track.label,
                settings: settings,
                capabilities: capabilities
            })
        })

        // Log audio track details
        stream.getAudioTracks().forEach((track, index) => {
            const settings = track.getSettings()
            
            console.log(`🎤 Audio Track ${index}:`, {
                enabled: track.enabled,
                readyState: track.readyState,
                label: track.label,
                settings: settings
            })
        })
    }

    _enhanceError(error) {
        let errorMessage = 'Failed to access camera and microphone. '
        
        if (error.name === 'NotAllowedError') {
            if (this.isMobile) {
                errorMessage += 'Permission denied. On mobile devices:\n' +
                             '1. Tap the camera/microphone icon in the address bar\n' +
                             '2. Select "Allow" for both camera and microphone\n' +
                             '3. Refresh the page'
            } else {
                errorMessage += 'Permission denied. Please allow camera and microphone access and refresh the page.'
            }
        } else if (error.name === 'NotFoundError') {
            if (this.isMobile) {
                errorMessage += 'Camera or microphone not found. Please ensure:\n' +
                             '1. Your device has a working camera\n' +
                             '2. No other apps are using the camera\n' +
                             '3. Try using a different browser (Chrome recommended)'
            } else {
                errorMessage += 'No camera or microphone found. Please connect your devices and refresh the page.'
            }
        } else if (error.name === 'OverconstrainedError') {
            if (this.isMobile) {
                errorMessage += 'Camera settings not supported on your device. This may be due to hardware limitations. Try refreshing the page.'
            } else {
                errorMessage += 'Camera/microphone constraints not supported. Try a different device.'
            }
        } else if (error.name === 'NotReadableError') {
            if (this.isMobile) {
                errorMessage += 'Camera is in use by another app. Please:\n' +
                             '1. Close other camera apps\n' +
                             '2. Refresh this page\n' +
                             '3. Restart your browser if needed'
            } else {
                errorMessage += 'Camera/microphone is already in use by another application.'
            }
        } else if (error.name === 'SecurityError') {
            errorMessage += 'Security error. Please ensure you\'re using HTTPS or localhost.'
        } else if (error.name === 'AbortError') {
            errorMessage += 'Media access was aborted. Please try again.'
        } else {
            if (this.isMobile) {
                errorMessage += `Mobile device error: ${error.message}. Try refreshing the page or using Chrome browser.`
            } else {
                errorMessage += error.message
            }
        }
        
        const enhancedError = new Error(errorMessage)
        enhancedError.originalError = error
        enhancedError.deviceType = this.isMobile ? 'mobile' : 'desktop'
        enhancedError.isAndroid = this.isAndroid
        enhancedError.isIOS = this.isIOS
        
        return enhancedError
    }

    stopStream(stream) {
        if (stream) {
            stream.getTracks().forEach(track => {
                console.log(`🛑 Stopping ${track.kind} track:`, track.label)
                track.stop()
            })
        }
    }

    // Additional utility methods for mobile debugging
    async checkDeviceSupport() {
        const support = {
            hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
            hasEnumerateDevices: !!navigator.mediaDevices?.enumerateDevices,
            isSecureContext: window.isSecureContext,
            protocol: window.location.protocol,
            isMobile: this.isMobile,
            isAndroid: this.isAndroid,
            isIOS: this.isIOS,
            userAgent: navigator.userAgent
        }

        if (navigator.mediaDevices?.enumerateDevices) {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices()
                support.devices = {
                    videoinput: devices.filter(d => d.kind === 'videoinput').length,
                    audioinput: devices.filter(d => d.kind === 'audioinput').length,
                    audiooutput: devices.filter(d => d.kind === 'audiooutput').length
                }
            } catch (error) {
                support.devicesError = error.message
            }
        }

        console.log('📱 Device Support Check:', support)
        return support
    }
}

export { Media }