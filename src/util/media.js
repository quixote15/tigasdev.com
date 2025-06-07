class Media {
    async getCamera(constraints = {}) {
        const defaultConstraints = {
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

        const finalConstraints = { ...defaultConstraints, ...constraints }
        
        try {
            console.log('📋 Requesting media with constraints:', finalConstraints)
            const stream = await navigator.mediaDevices.getUserMedia(finalConstraints)
            
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
            
            throw new Error(errorMessage)
        }
    }

    stopStream(stream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
        }
    }
}

export { Media }