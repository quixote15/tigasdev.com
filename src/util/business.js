class VideoCallBusiness {
    constructor({ roomId, media, view, socketBuilder, peerBuilder }) {
        this.roomId = roomId
        this.media = media
        this.view = view
        this.socketBuilder = socketBuilder
        this.peerBuilder = peerBuilder

        this.socket = {}
        this.currentStream = {}
        this.currentPeer = {}
        this.peers = new Map()
        this.localPeerId = null // Track our own peer ID
        this.isRecording = false
        this.isMuted = true // Start muted by default
        this.isVideoOn = true

        // Callback handlers
        this.setMessages = () => {}
        this.setIsRecording = () => {}
        this.setParticipantsCount = () => {}
    }

    static initialize(deps) {
        const instance = new VideoCallBusiness(deps)
        return instance._init()
    }

    setCallbacks({ setMessages, setIsRecording, setParticipantsCount }) {
        this.setMessages = setMessages || this.setMessages
        this.setIsRecording = setIsRecording || this.setIsRecording
        this.setParticipantsCount = setParticipantsCount || this.setParticipantsCount
        
        // Set callback to view as well
        this.view.setParticipantsCountCallback(this.setParticipantsCount)
        
        return this
    }

    async _initializeAndGetPeerId() {
        try {
            console.log('🚀 Initializing peer connection to get ID...')
            
            // Check device support first (especially for mobile)
            await this._checkMobileSupport()
            
            // Get local stream with mobile optimizations
            this.currentStream = await this.media.getCamera()
            
            // Mute local audio by default
            this._applyInitialMuteState()

            // Initialize peer first to get our ID
            this.currentPeer = await this.peerBuilder
                .setOnError(this.onPeerError())
                .setOnConnectionOpened(this.onPeerConnectionOpened())
                .setOnCallReceived(this.onPeerCallReceived())
                .setOnPeerStreamReceived(this.onPeerStreamReceived())
                .setOnCallError(this.onCallError())
                .setOnCallClose(this.onCallClose())
                .build()

            // Ensure we have a valid peer ID
            if (!this.currentPeer || !this.currentPeer.id) {
                throw new Error('Peer connection established but no ID available')
            }
            
            // Return the peer ID
            const peerId = this.currentPeer.id
            this.localPeerId = peerId
            console.log('✅ Peer initialized with ID:', peerId)
            return peerId
        } catch (error) {
            console.error('❌ Error initializing peer:', error)
            
            // Provide mobile-specific error handling
            if (error.deviceType === 'mobile') {
                const mobileMessage = this._handleMobileError(error)
                const enhancedError = new Error(mobileMessage)
                enhancedError.originalError = error
                throw enhancedError
            }
            
            throw error
        }
    }

    addSelfToParticipants(peerId) {
        console.log('👤 Adding self to participants:', peerId)
        // Add ourselves to the peers map to prevent duplication
        this.peers.set(peerId, { 
            isSelf: true, 
            stream: this.currentStream,
            connectTime: Date.now() 
        })
        
        // Update participant count
        this.setParticipantsCount(this.peers.size)
    }

    async _completeInitialization() {
        try {
            console.log('🚀 Completing video call initialization...')
            console.log('🔍 Current localPeerId:', this.localPeerId)
            console.log('🔍 Current peer ID:', this.currentPeer?.id)

            // Initialize socket
            console.log('🔌 Initializing socket connection...')
            this.socket = this.socketBuilder
                .setOnUserConnected(this.onUserConnected())
                .setOnUserDisconnected(this.onUserDisconnected())
                .setOnChatMessage(this.onChatMessage())
                .build()

            // Wait for socket to connect
            await this._waitForSocketConnection()

            // Ensure we have a valid peer ID before adding video
            if (!this.localPeerId) {
                console.error('❌ No local peer ID available, cannot add local video')
                throw new Error('Local peer ID not available')
            }

            // Add local video with real peer ID
            console.log('🎥 Adding local video with peer ID:', this.localPeerId)
            this.view.addVideoStream(this.localPeerId, this.currentStream, true, this.peers.size)
            
            // Start monitoring local stats
            this._startLocalMonitoring()
            
            // Start socket monitoring for peer-socket sync
            this._startSocketMonitoring()
            
            // Join the room now that everything is set up
            console.log('📡 Emitting join-room event...')
            console.log('📡 Room ID:', this.roomId)
            console.log('📡 Peer ID:', this.localPeerId)
            console.log('📡 Socket connected:', this.socket?.connected)
            
            this.socket.emit('join-room', this.roomId, this.localPeerId)
            
            console.log('✅ Video call initialization completed')
            return this
        } catch (error) {
            console.error('❌ Error completing initialization:', error)
            throw error
        }
    }

    _waitForSocketConnection() {
        return new Promise((resolve, reject) => {
            if (this.socket && this.socket.connected) {
                console.log('✅ Socket already connected')
                resolve()
                return
            }

            console.log('⏳ Waiting for socket connection...')
            const timeout = setTimeout(() => {
                reject(new Error('Socket connection timeout'))
            }, 10000) // 10 second timeout

            this.socket.on('connect', () => {
                console.log('✅ Socket connected successfully')
                clearTimeout(timeout)
                resolve()
            })

            this.socket.on('connect_error', (error) => {
                console.error('❌ Socket connection error:', error)
                clearTimeout(timeout)
                reject(error)
            })
        })
    }

    onUserConnected = function () {
        return userId => {
            console.log('👤 User connected event received:', userId)
            console.log('👤 Type of userId:', typeof userId)
            console.log('👤 UserId is object?:', typeof userId === 'object')
            console.log('👤 UserId JSON:', JSON.stringify(userId))
            console.log('👤 Current peer ID:', this.currentPeer?.id)
            console.log('👤 Local peer ID:', this.localPeerId)
            console.log('👤 Current participants:', Array.from(this.peers.keys()))
            
            // Extract userId if it's an object
            let actualUserId = userId
            if (typeof userId === 'object' && userId !== null) {
                // Check common properties that might contain the actual ID
                if (userId.id) {
                    actualUserId = userId.id
                } else if (userId.userId) {
                    actualUserId = userId.userId
                } else if (userId.peerId) {
                    actualUserId = userId.peerId
                } else if (userId.socketId) {
                    actualUserId = userId.socketId
                } else {
                    console.error('❌ Cannot extract user ID from object:', userId)
                    return
                }
                console.log('🔧 Extracted actual user ID:', actualUserId)
            }
            
            // Check if this user is already in our participants (including ourselves)
            if (this.peers.has(actualUserId)) {
                const peerData = this.peers.get(actualUserId)
                if (peerData.isSelf) {
                    console.log('⚠️ Ignoring self-connection event for:', actualUserId)
                } else {
                    console.log('⚠️ User already connected, ignoring duplicate:', actualUserId)
                }
                return
            }
            
            console.log('✅ Processing new user connection:', actualUserId)
            
            // Add a small delay to ensure the peer is fully registered
            setTimeout(() => {
                this.connectToNewUser(actualUserId)
            }, 1000) // 1 second delay
        }
    }

    onUserDisconnected = function () {
        return userId => {
            console.log('👤 User disconnected:', userId)
            console.log('👤 Type of disconnected userId:', typeof userId)
            if (typeof userId === 'object') {
                console.log('👤 Disconnected userId JSON:', JSON.stringify(userId))
            }
            
            // Extract userId if it's an object
            let actualUserId = userId
            if (typeof userId === 'object' && userId !== null) {
                if (userId.id) {
                    actualUserId = userId.id
                } else if (userId.userId) {
                    actualUserId = userId.userId
                } else if (userId.peerId) {
                    actualUserId = userId.peerId
                } else if (userId.socketId) {
                    actualUserId = userId.socketId
                } else {
                    console.error('❌ Cannot extract user ID from disconnect object:', userId)
                    return
                }
            }
            
            this.removeUser(actualUserId)
        }
    }

    onChatMessage = function () {
        return message => {
            console.log('💬 Chat message received:', message)
            this.setMessages(prev => [...prev, message])
        }
    }

    onPeerError = function () {
        return error => {
            console.error('❌ Peer error:', error)
            // TODO: handle peer error and try to reconnect
           
        }
    }

    onPeerConnectionOpened = function () {
        return (peer) => {
            const id = peer.id
            console.log('✅ Peer connected with ID:', id)
            
            // Update current peer reference on reconnection
            this.currentPeer = peer
            this.localPeerId = id
            
            // Only emit join-room if socket is available (during complete initialization)
            if (this.socket && this.socket.connected) {
                console.log('🏠 Joining room:', this.roomId)
                
                // Add a small delay before joining room to ensure peer is fully registered
                setTimeout(() => {
                    console.log('📡 Emitting join-room event...')
                    console.log('📡 Room ID:', this.roomId)
                    console.log('📡 Peer ID:', id)
                    console.log('📡 Socket connected:', this.socket?.connected)
                    this.socket.emit('join-room', this.roomId, id)
                }, 500) // 500ms delay
            } else {
                console.log('🔄 Peer connected but socket not ready yet (during initial setup)')
            }
        }
    }

    onPeerCallReceived = function () {
        return call => {
            console.log('📞 Incoming call from:', call.peer)
            
            // Check if call has already been answered (prevent double answering)
            if (call._answered) {
                console.log('⚠️ Call already answered, ignoring duplicate')
                return
            }
            
            // Validate local stream before answering
            if (!this.currentStream) {
                console.error('❌ No local stream available to answer call')
                call.close()
                return
            }

            // Validate stream tracks
            const videoTracks = this.currentStream.getVideoTracks()
            const audioTracks = this.currentStream.getAudioTracks()
            
            console.log('📹 Stream info for answer:', {
                active: this.currentStream.active,
                videoTracks: videoTracks.length,
                audioTracks: audioTracks.length,
                videoEnabled: videoTracks.length > 0 ? videoTracks[0].enabled : false,
                audioEnabled: audioTracks.length > 0 ? audioTracks[0].enabled : false
            })

            if (!this.currentStream.active) {
                console.error('❌ Local stream is not active')
                // Try to get a new stream, but don't answer the call again
                this._refreshLocalStream().then(() => {
                    if (this.currentStream && this.currentStream.active) {
                        console.log('✅ Stream refreshed, but call was already handled')
                    } else {
                        console.error('❌ Failed to refresh stream, closing call')
                        call.close()
                    }
                }).catch(error => {
                    console.error('❌ Error refreshing stream:', error)
                    call.close()
                })
                
                // Close the call since we can't answer with an inactive stream
                call.close()
                return
            }

            try {
                console.log('📞 Answering call with local stream')
                call.answer(this.currentStream)
                call._answered = true // Mark as answered to prevent duplicates
            } catch (error) {
                console.error('❌ Error answering call:', error)
                call.close()
            }
        }
    }

    onPeerStreamReceived = function () {
        return (call, stream) => {
            const callerId = call.peer
            console.log('📺 Received video stream from:', callerId)
            console.log('📺 Stream details:', {
                active: stream.active,
                videoTracks: stream.getVideoTracks().length,
                audioTracks: stream.getAudioTracks().length,
                id: stream.id
            })
            
            // Enhanced peer data tracking for incoming calls
            const peerData = {
                call,
                stream,
                connectTime: Date.now(),
                lastPingReceived: Date.now(),
                lastDataReceived: Date.now(),
                dataChannelClosed: false,
                isSelf: false
            }
            
            this.peers.set(callerId, peerData)
            this.view.addVideoStream(callerId, stream, false, this.peers.size)
            this.setParticipantsCount(this.peers.size)
            
            // Update connection status
            this.view.updateConnectionStatus(callerId, 'connected')
            
            // Start monitoring this peer connection
            this._startPeerMonitoring(callerId, call)
            
            // Force update all participant stats when network changes
            setTimeout(() => {
                this._updateAllParticipantStats()
            }, 1000) // Small delay to ensure video elements are ready
            
            console.log('✅ Peer connection established successfully with:', callerId)
        }
    }

    onCallError = function () {
        return (call, error) => {
            console.error('📞 Call error from:', call.peer, error)
            console.error('📞 Error details:', {
                type: error.type,
                message: error.message,
                code: error.code
            })
            
                                // Remove failed peer to avoid confusion
                    if (this.peers.has(call.peer)) {
                        const peerData = this.peers.get(call.peer)
                        if (peerData.call === call) {
                            this.peers.delete(call.peer)
                            this.setParticipantsCount(this.peers.size)
                        }
                    }
            
            // Handle specific error types
            if (error.type === 'peer-unavailable') {
                console.log('⚠️ Peer unavailable error - peer may have disconnected or not joined yet')
                // Don't retry immediately for peer-unavailable as it's handled in _attemptConnection
                return
            }
            
            // Retry connection for certain error types
            if (error.type === 'network' || 
                error.type === 'disconnected' || 
                error.message.includes('Connection failed') ||
                error.message.includes('Could not connect to peer')) {
                
                console.log('🔄 Retrying connection to:', call.peer)
                setTimeout(() => {
                    this.connectToNewUser(call.peer)
                }, 5000) // Retry after 5 seconds
            }
        }
    }

    onCallClose = function () {
        return (call) => {
            console.log('📞 Call closed from:', call.peer)
            this.removeUser(call.peer)
            
            // Attempt to reconnect if the call was closed unexpectedly
            setTimeout(() => {
                if (this.peers.has(call.peer)) {
                    console.log('🔄 Attempting to reconnect to:', call.peer)
                    this.connectToNewUser(call.peer)
                }
            }, 2000)
        }
    }

    async _refreshLocalStream() {
        try {
            console.log('🔄 Refreshing local stream...')
            
            // Stop current stream if it exists
            if (this.currentStream) {
                this.media.stopStream(this.currentStream)
            }
            
            // Get new stream
            this.currentStream = await this.media.getCamera()
            
            // Update local video with the proper peer ID (not 'local-user')
            if (this.localPeerId) {
                this.view.removeVideoStream(this.localPeerId)
                this.view.addVideoStream(this.localPeerId, this.currentStream, true, this.peers.size)
                console.log('✅ Updated local video with refreshed stream')
            } else {
                console.warn('⚠️ No local peer ID available for video update')
            }
            
            console.log('✅ Local stream refreshed successfully')
            return this.currentStream
        } catch (error) {
            console.error('❌ Failed to refresh local stream:', error)
            throw error
        }
    }

    connectToNewUser(userId) {
        console.log(`🤝 Connecting to new user: ${userId}`)
        console.log(`🤝 Type of userId: ${typeof userId}`)
        console.log(`🤝 UserId is object?: ${typeof userId === 'object'}`)
        if (typeof userId === 'object') {
            console.log(`🤝 UserId JSON: ${JSON.stringify(userId)}`)
        }
        
        // Validate peer IDs and prevent self-connection
        if (!userId) {
            console.log('⚠️ Invalid peer ID (empty)')
            return
        }
        
        if (userId === this.currentPeer?.id) {
            console.log('⚠️ Preventing self-connection attempt for:', userId)
            return
        }
        
        // Ensure userId is a string
        if (typeof userId !== 'string') {
            console.error('❌ UserId must be a string for PeerJS, got:', typeof userId, userId)
            return
        }
        
        // check if the user is already in the call
        if (this.peers.has(userId)) {
            console.log('🤝 User already in the call:', userId)
            return
        }
        
        // Additional safety check - make sure we have a valid current peer
        if (!this.currentPeer || !this.currentPeer.id) {
            console.error('❌ No valid peer connection available')
            return
        }
        
        if (!this.currentPeer || !this.currentPeer.id) {
            console.error('❌ No peer connection available')
            return
        }
        
        if (!this.currentStream) {
            console.error('❌ No local stream available to share')
            return
        }
        
        // Validate stream before making call
        if (!this.currentStream.active) {
            console.warn('⚠️ Local stream is not active, attempting to refresh...')
            this._refreshLocalStream().then(() => {
                this.connectToNewUser(userId)
            }).catch(error => {
                console.error('❌ Failed to refresh stream for outgoing call:', error)
            })
            return
        }
        
        // Check if we can reach the peer before attempting connection
        console.log('🔍 Checking peer availability...')
        
        // Add retry logic for peer-unavailable errors
        this._attemptConnection(userId, 0)
    }

    _attemptConnection(userId, attempt) {
        const maxAttempts = 3
        const delay = 2000 * (attempt + 1) // Increasing delay: 2s, 4s, 6s

        console.log(`📞 Attempting call to ${userId} (attempt ${attempt + 1}/${maxAttempts})`)
        console.log(`📞 Type of userId for call: ${typeof userId}`)
        console.log(`📞 UserId value: ${userId}`)
        
        try {
            const call = this.currentPeer.call(userId, this.currentStream)
            
            if (!call) {
                console.error('❌ Failed to create call to:', userId)
                
                if (attempt < maxAttempts - 1) {
                    console.log(`🔄 Retrying connection to ${userId} in ${delay}ms...`)
                    setTimeout(() => {
                        this._attemptConnection(userId, attempt + 1)
                    }, delay)
                }
                return
            }
            
            console.log('📞 Outgoing call initiated to:', userId)
            
            // Handle call-specific errors
            call.on('error', (error) => {
                console.error(`📞 Call error to ${userId}:`, error)
                
                if (error.type === 'peer-unavailable') {
                    console.log(`⚠️ Peer ${userId} unavailable, will retry...`)
                    
                    // Remove failed call from peers
                    if (this.peers.has(userId)) {
                        this.peers.delete(userId)
                        this.setParticipantsCount(this.peers.size)
                    }
                    
                    // Retry if attempts remaining
                    if (attempt < maxAttempts - 1) {
                        console.log(`🔄 Retrying connection to ${userId} in ${delay}ms...`)
                        setTimeout(() => {
                            this._attemptConnection(userId, attempt + 1)
                        }, delay)
                    } else {
                        console.error(`❌ Failed to connect to ${userId} after ${maxAttempts} attempts`)
                    }
                }
            })
            
            // Enhanced peer data tracking
            const peerData = {
                call,
                attempt,
                connectTime: Date.now(),
                lastPingReceived: Date.now(),
                lastDataReceived: Date.now(),
                dataChannelClosed: false,
                isSelf: false
            }
            
            this.peers.set(userId, peerData)
            this.setParticipantsCount(this.peers.size)
            
        } catch (error) {
            console.error('❌ Error creating call to:', userId, error)
            
            if (attempt < maxAttempts - 1) {
                console.log(`🔄 Retrying connection to ${userId} in ${delay}ms...`)
                setTimeout(() => {
                    this._attemptConnection(userId, attempt + 1)
                }, delay)
            }
        }
    }

    removeUser(userId) {
        // Remove video element
        this.view.removeVideoStream(userId)
        
        // Close and remove peer connection
        if (this.peers.has(userId)) {
            const peerData = this.peers.get(userId)
            if (peerData.call) {
                peerData.call.close()
            }
            this.peers.delete(userId)
        }
        
        // Update participant count
        this.setParticipantsCount(this.peers.size)
        
        // Force update all participant stats when network changes
        setTimeout(() => {
            this._updateAllParticipantStats()
        }, 500) // Small delay to ensure cleanup is complete
    }

    toggleMute() {
        this.isMuted = !this.isMuted
        const audioTrack = this.currentStream.getAudioTracks()[0]
        if (audioTrack) {
            audioTrack.enabled = !this.isMuted
            console.log(`🎤 Audio ${this.isMuted ? 'muted' : 'unmuted'}`)
        }
        return this.isMuted
    }

    toggleVideo() {
        this.isVideoOn = !this.isVideoOn
        const videoTrack = this.currentStream.getVideoTracks()[0]
        if (videoTrack) {
            videoTrack.enabled = this.isVideoOn
            console.log(`📹 Video ${this.isVideoOn ? 'enabled' : 'disabled'}`)
        }
        return this.isVideoOn
    }

    toggleRecording() {
        this.isRecording = !this.isRecording
        this.setIsRecording(this.isRecording)
        console.log('📹 Recording:', this.isRecording)
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
        console.log('🔄 Leaving call and cleaning up connections...')
        
        // Stop local stream
        if (this.currentStream) {
            this.media.stopStream(this.currentStream)
        }
        
        // Close all peer connections
        this.peers.forEach(peerData => {
            if (peerData.call) {
                peerData.call.close()
            }
        })
        this.peers.clear()
        
        // Destroy socket builder
        if (this.socketBuilder && this.socketBuilder.destroy) {
            this.socketBuilder.destroy()
        }
        
        // Disconnect socket
        if (this.socket && this.socket.disconnect) {
            this.socket.disconnect()
        }
        
        // Destroy peer builder
        if (this.peerBuilder && this.peerBuilder.destroy) {
            this.peerBuilder.destroy()
        }
        
        // Destroy peer
        if (this.currentPeer && this.currentPeer.destroy) {
            this.currentPeer.destroy()
        }
        
        console.log('✅ Call cleanup completed')
    }

    // Peer monitoring and statistics
    _startPeerMonitoring(peerId, call) {
        if (!call.peerConnection) return

        const pc = call.peerConnection
        let lastPingTime = 0
        let pingInterval = null
        let reconnectAttempts = 0
        const maxReconnectAttempts = 3
        let consecutiveFailures = 0 // Track consecutive failures to avoid false positives

        // Monitor connection state changes with enhanced handling
        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState
            console.log(`🧊 ICE Connection State for ${peerId}:`, state)
            
            let status = 'connecting'
            switch (state) {
                case 'connected':
                case 'completed':
                    status = 'connected'
                    reconnectAttempts = 0 // Reset on successful connection
                    consecutiveFailures = 0 // Reset consecutive failures
                    break
                case 'disconnected':
                    status = 'disconnected'
                    console.warn(`⚠️ Peer ${peerId} ICE disconnected - monitoring for recovery...`)
                    // Don't immediately trigger reconnection - ICE can recover
                    consecutiveFailures++
                    
                    // Only trigger reconnection after multiple consecutive failures
                    if (consecutiveFailures >= 3) {
                        console.warn(`⚠️ Peer ${peerId} has ${consecutiveFailures} consecutive failures, triggering recovery`)
                        this._handlePeerDisconnected(peerId, call, reconnectAttempts)
                    }
                    break
                case 'failed':
                case 'closed':
                    status = 'failed'
                    console.error(`❌ Peer ${peerId} connection failed/closed - definitive failure`)
                    this._handlePeerConnectionFailed(peerId, call, reconnectAttempts)
                    break
                default:
                    status = 'connecting'
            }
            
            this.view.updateConnectionStatus(peerId, status)
        }

        // Monitor peer connection state (newer API) - more conservative
        if (pc.connectionState !== undefined) {
            pc.onconnectionstatechange = () => {
                const state = pc.connectionState
                console.log(`🔗 Peer Connection State for ${peerId}:`, state)
                
                switch (state) {
                    case 'connected':
                        consecutiveFailures = 0 // Reset on successful connection
                        break
                    case 'disconnected':
                        // Don't immediately trigger - peer connection can recover
                        console.log(`🔗 Peer ${peerId} temporarily disconnected - waiting for recovery`)
                        break
                    case 'failed':
                        console.error(`❌ Peer ${peerId} connection definitively failed`)
                        this._handlePeerConnectionFailed(peerId, call, reconnectAttempts)
                        break
                    case 'closed':
                        console.log(`🔒 Peer ${peerId} connection closed`)
                        this._cleanupPeerConnection(peerId)
                        break
                }
            }
        }

        // Much more conservative connection monitoring
        const connectionHealthCheck = () => {
            // Check if peer still exists in our map
            if (!this.peers.has(peerId)) {
                console.log(`🧹 Peer ${peerId} no longer in peers map, stopping monitoring`)
                clearInterval(statsInterval)
                clearInterval(healthCheckInterval)
                return
            }

            const peerData = this.peers.get(peerId)
            
            // Only check for definitive failures, not temporary issues
            if (peerData.call && peerData.call.peerConnection) {
                const pc = peerData.call.peerConnection
                
                // Only trigger cleanup on confirmed failed/closed states
                if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
                    console.warn(`🔄 Confirmed connection failure for ${peerId} (${pc.iceConnectionState})`)
                    this._handlePeerConnectionFailed(peerId, call, reconnectAttempts)
                    return
                }
                
                // Much more lenient ping check - only after 60 seconds of no response
                const now = Date.now()
                if (peerData.lastPingReceived && (now - peerData.lastPingReceived) > 60000) {
                    console.warn(`⚠️ No ping response from ${peerId} for 60s - checking if connection is truly dead`)
                    
                    // Double check with connection state before triggering reconnection
                    if (pc.iceConnectionState === 'disconnected' || pc.connectionState === 'disconnected') {
                        console.warn(`🔄 Confirmed ping timeout with disconnected state for ${peerId}`)
                        this._handlePeerDisconnected(peerId, call, reconnectAttempts)
                    } else {
                        console.log(`ℹ️ Ping timeout but connection appears stable for ${peerId}`)
                        // Reset ping timer to avoid false positives
                        peerData.lastPingReceived = now
                    }
                }
            }
        }

        // Less frequent health checks to reduce false positives
        const healthCheckInterval = setInterval(connectionHealthCheck, 30000) // Check every 30 seconds instead of 10

        // Monitor connection quality with RTCStats
        const monitorStats = async () => {
            try {
                const stats = await pc.getStats()
                let inboundRtp = null
                let outboundRtp = null
                let candidatePair = null

                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                        inboundRtp = report
                    } else if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
                        outboundRtp = report
                    } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        candidatePair = report
                    }
                })

                // Calculate bitrate from inbound RTP
                if (inboundRtp && inboundRtp.bytesReceived) {
                    const now = Date.now()
                    const peerData = this.peers.get(peerId)
                    
                    if (peerData && peerData.lastBytesReceived && peerData.lastStatsTime) {
                        const bytesDiff = inboundRtp.bytesReceived - peerData.lastBytesReceived
                        const timeDiff = (now - peerData.lastStatsTime) / 1000
                        const bitrate = Math.round((bytesDiff * 8) / timeDiff / 1024) // kbps
                        
                        if (bitrate > 0) { // Only update if we have a valid bitrate
                            this.view.updateStreamRate(peerId, bitrate)
                            consecutiveFailures = 0 // Reset on successful data reception
                        }
                    }
                    
                    // Store for next calculation
                    if (peerData) {
                        peerData.lastBytesReceived = inboundRtp.bytesReceived
                        peerData.lastStatsTime = now
                        
                        // Reset the data reception timer since we got data
                        peerData.lastDataReceived = now
                    }
                }

                // Update ping from candidate pair
                if (candidatePair && candidatePair.currentRoundTripTime !== undefined) {
                    const pingMs = Math.round(candidatePair.currentRoundTripTime * 1000)
                    this.view.updatePing(peerId, pingMs)
                }

                // Much more conservative data reception check - only after 45 seconds
                if (!inboundRtp || inboundRtp.bytesReceived === 0) {
                    const peerData = this.peers.get(peerId)
                    if (peerData && peerData.connectTime) {
                        const timeSinceConnect = Date.now() - peerData.connectTime
                        // Only trigger after 45 seconds AND confirm connection state is bad
                        if (timeSinceConnect > 45000) {
                            const pc = peerData.call?.peerConnection
                            if (pc && (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed')) {
                                console.warn(`⚠️ No data received from ${peerId} for ${timeSinceConnect}ms and connection is ${pc.iceConnectionState}`)
                                this._handlePeerDisconnected(peerId, call, reconnectAttempts)
                            } else {
                                console.log(`ℹ️ No initial data from ${peerId} but connection appears stable (${pc?.iceConnectionState})`)
                            }
                        }
                    }
                } else {
                    // Successfully receiving data - reset failure counters
                    consecutiveFailures = 0
                }

            } catch (error) {
                console.warn(`⚠️ Failed to get stats for ${peerId}:`, error)
                
                // Only trigger reconnection on stats failure if we have other indicators of problems
                const peerData = this.peers.get(peerId)
                if (peerData?.call?.peerConnection) {
                    const pc = peerData.call.peerConnection
                    if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
                        console.warn(`⚠️ Stats failure combined with bad connection state for ${peerId}`)
                        this._handlePeerDisconnected(peerId, call, reconnectAttempts)
                    } else {
                        console.log(`ℹ️ Stats collection failed for ${peerId} but connection appears stable`)
                    }
                }
            }
        }

        // Start monitoring with more frequent updates for stats, but conservative reconnection logic
        const statsInterval = setInterval(() => {
            if (this.peers.has(peerId)) {
                monitorStats()
            } else {
                clearInterval(statsInterval)
                clearInterval(healthCheckInterval)
                if (pingInterval) clearInterval(pingInterval)
            }
        }, 5000) // Keep 5 second stats updates for UI

        // Enhanced ping measurement using data channel
        this._setupPingMeasurement(peerId, call)
    }

    // Handle peer disconnection while socket is still connected - more conservative approach
    _handlePeerDisconnected(peerId, call, reconnectAttempts) {
        console.warn(`🔧 Evaluating peer disconnection for ${peerId} (attempt ${reconnectAttempts})`)
        
        // First, verify this is actually a disconnection and not a temporary issue
        const peerData = this.peers.get(peerId)
        if (peerData?.call?.peerConnection) {
            const pc = peerData.call.peerConnection
            const iceState = pc.iceConnectionState
            const connectionState = pc.connectionState
            
            console.log(`🔍 Connection verification for ${peerId}: ICE=${iceState}, PC=${connectionState}`)
            
            // Only proceed with reconnection if we have confirmed bad states
            if (iceState === 'failed' || connectionState === 'failed' || 
                (iceState === 'disconnected' && connectionState === 'disconnected')) {
                
                console.warn(`✅ Confirmed disconnection for ${peerId} - proceeding with recovery`)
                
                // Update UI to show disconnected state
                this.view.updateConnectionStatus(peerId, 'disconnected')
                
                // Check if socket is still connected and we haven't exceeded retry attempts
                if (this.socket && this.socket.connected && reconnectAttempts < 2) { // Reduced from 3 to 2 attempts
                    console.log(`📡 Socket still connected, attempting careful peer reconnection for ${peerId}`)
                    
                    setTimeout(() => {
                        this._attemptPeerReconnection(peerId, reconnectAttempts + 1)
                    }, (reconnectAttempts + 1) * 3000) // Longer backoff: 3s, 6s
                } else {
                    console.error(`❌ Max reconnection attempts reached or socket down for ${peerId}, removing peer`)
                    this._cleanupPeerConnection(peerId)
                }
            } else {
                console.log(`ℹ️ Connection appears recoverable for ${peerId} (ICE=${iceState}, PC=${connectionState}) - skipping reconnection`)
                // Update status to show monitoring instead of disconnected
                this.view.updateConnectionStatus(peerId, 'connecting')
                
                // Reset ping timer to give connection more time to recover
                peerData.lastPingReceived = Date.now()
            }
        } else {
            console.log(`📡 No peer connection data available for ${peerId}, cleaning up`)
            this._cleanupPeerConnection(peerId)
        }
    }

    // Handle peer connection failure
    _handlePeerConnectionFailed(peerId, call, reconnectAttempts) {
        console.error(`❌ Peer connection failed for ${peerId}`)
        
        // Update UI to show failed state
        this.view.updateConnectionStatus(peerId, 'failed')
        
        // Only attempt reconnection if socket is still connected
        if (this.socket && this.socket.connected && reconnectAttempts < 3) {
            console.log(`🔄 Attempting to reestablish connection to ${peerId}`)
            setTimeout(() => {
                this._attemptPeerReconnection(peerId, reconnectAttempts + 1)
            }, 3000) // Wait 3 seconds before retry
        } else {
            console.log(`🧹 Cleaning up failed connection to ${peerId}`)
            this._cleanupPeerConnection(peerId)
        }
    }

    // Attempt to reconnect to a specific peer
    _attemptPeerReconnection(peerId, reconnectAttempts) {
        console.log(`🔄 Attempting peer reconnection to ${peerId} (attempt ${reconnectAttempts})`)
        
        // Check if peer is still in our map and socket is connected
        if (!this.socket || !this.socket.connected) {
            console.log(`📡 Socket disconnected, aborting peer reconnection to ${peerId}`)
            return
        }

        // Clean up old connection first
        if (this.peers.has(peerId)) {
            const peerData = this.peers.get(peerId)
            if (peerData.call && peerData.call.close) {
                peerData.call.close()
            }
        }

        // Update status to reconnecting
        this.view.updateConnectionStatus(peerId, 'reconnecting')
        
        // Attempt new connection
        setTimeout(() => {
            this.connectToNewUser(peerId)
        }, 1000)
    }

    // Clean up peer connection properly
    _cleanupPeerConnection(peerId) {
        console.log(`🧹 Cleaning up peer connection for ${peerId}`)
        
        if (this.peers.has(peerId)) {
            const peerData = this.peers.get(peerId)
            
            // Close the call if it exists
            if (peerData.call && typeof peerData.call.close === 'function') {
                try {
                    peerData.call.close()
                } catch (error) {
                    console.warn(`⚠️ Error closing call for ${peerId}:`, error)
                }
            }
            
            // Remove from peers map
            this.peers.delete(peerId)
            
            // Remove video element
            this.view.removeVideoStream(peerId)
            
            // Update participant count
            this.setParticipantsCount(this.peers.size)
            
            // Update stats for remaining participants
            setTimeout(() => {
                this._updateAllParticipantStats()
            }, 500)
            
            console.log(`✅ Cleaned up peer ${peerId}`)
        }
    }

    // Enhanced socket monitoring for peer-socket sync
    _startSocketMonitoring() {
        if (!this.socket) return

        this.socket.on('disconnect', () => {
            console.warn('📡 Socket disconnected, marking all peers as disconnected')
            
            // Update all peer statuses to disconnected
            this.peers.forEach((peerData, peerId) => {
                if (!peerData.isSelf) {
                    this.view.updateConnectionStatus(peerId, 'disconnected')
                }
            })
        })

        this.socket.on('reconnect', () => {
            console.log('📡 Socket reconnected, attempting to reestablish peer connections')
            
            // Get list of peers to reconnect to
            const peersToReconnect = []
            this.peers.forEach((peerData, peerId) => {
                if (!peerData.isSelf) {
                    peersToReconnect.push(peerId)
                }
            })
            
            // Clear existing peers and try to reconnect
            peersToReconnect.forEach(peerId => {
                this._cleanupPeerConnection(peerId)
            })
            
            // Rejoin the room
            setTimeout(() => {
                if (this.socket && this.socket.connected && this.localPeerId) {
                    this.socket.emit('join-room', this.roomId, this.localPeerId)
                }
            }, 1000)
        })
    }

    // Start monitoring local user stats
    _startLocalMonitoring() {
        if (!this.localPeerId || !this.currentStream) return

        console.log('🔍 Starting local stats monitoring for:', this.localPeerId)
        
        // Set initial status for local user based on current peer connections
        const hasOtherPeers = this.peers.size > 1 || (this.peers.size === 1 && !this.peers.get(this.localPeerId)?.isSelf)
        const initialStatus = hasOtherPeers ? 'connected' : 'local'
        this.view.updateConnectionStatus(this.localPeerId, initialStatus)
        console.log(`📊 Set initial local user status to ${initialStatus} (${this.peers.size - 1} peers present)`)
        
        // Monitor local stream stats
        const monitorLocalStats = () => {
            const videoElement = document.getElementById(this.localPeerId)
            if (videoElement) {
                const video = videoElement.querySelector('video')
                if (video && video.videoWidth && video.videoHeight) {
                    this.view.updateResolution(this.localPeerId, `${video.videoWidth}x${video.videoHeight}`)
                }
            }
            
            // Show local ping as 0 since it's local
            this.view.updatePing(this.localPeerId, 0)
            
            // Calculate local stream bitrate (estimate based on video properties)
            const videoTracks = this.currentStream.getVideoTracks()
            if (videoTracks.length > 0) {
                const track = videoTracks[0]
                const settings = track.getSettings()
                if (settings.width && settings.height && settings.frameRate) {
                    // Rough estimate: width * height * frameRate * 0.1 bits per pixel, converted to kbps
                    const estimatedBitrate = Math.round((settings.width * settings.height * settings.frameRate * 0.1) / 1024)
                    this.view.updateStreamRate(this.localPeerId, estimatedBitrate)
                }
            }
        }

        // Start monitoring
        const localStatsInterval = setInterval(() => {
            if (this.peers.has(this.localPeerId)) {
                monitorLocalStats()
            } else {
                clearInterval(localStatsInterval)
            }
        }, 5000) // Update every 5 seconds

        // Run initial check and comprehensive stats update
        setTimeout(() => {
            monitorLocalStats()
            // Also trigger comprehensive stats for all participants
            this._updateAllParticipantStats()
        }, 1000)
    }

    // Note: _updateLocalVideoWithPeerId method removed - no longer needed
    // Local video is now added during _completeInitialization with proper peer ID

    // Method to toggle debug overlays
    toggleDebugOverlays() {
        return this.view.toggleAllDebugOverlays()
    }

    // Force update all participant stats (called when peer network changes)
    _updateAllParticipantStats() {
        console.log('📊 Updating stats for all participants...')
        
        // Update local user stats immediately
        if (this.localPeerId) {
            this._updateLocalUserStats()
        }
        
        // Trigger immediate stats update for all remote peers
        this.peers.forEach((peerData, peerId) => {
            if (peerData.call && peerData.call.peerConnection && !peerData.isSelf) {
                console.log(`📊 Triggering stats update for remote peer: ${peerId}`)
                this._triggerPeerStatsUpdate(peerId, peerData.call)
            }
        })
    }

    // Update local user stats immediately
    _updateLocalUserStats() {
        if (!this.localPeerId || !this.currentStream) return

        console.log('📊 Updating local user stats...')
        
        // Update status based on peer connections
        const hasOtherPeers = this.peers.size > 1 || (this.peers.size === 1 && !this.peers.get(this.localPeerId)?.isSelf)
        const status = hasOtherPeers ? 'connected' : 'local'
        this.view.updateConnectionStatus(this.localPeerId, status)
        
        // Update local ping (always 0 for local)
        this.view.updatePing(this.localPeerId, 0)
        
        // Update resolution and FPS from video element
        const videoElement = document.getElementById(this.localPeerId)
        if (videoElement) {
            const video = videoElement.querySelector('video')
            if (video && video.videoWidth && video.videoHeight) {
                this.view.updateResolution(this.localPeerId, `${video.videoWidth}x${video.videoHeight}`)
                
                // Estimate FPS for local video based on track settings
                const videoTracks = this.currentStream.getVideoTracks()
                if (videoTracks.length > 0) {
                    const track = videoTracks[0]
                    const settings = track.getSettings()
                    if (settings.frameRate) {
                        this.view.updateFPS(this.localPeerId, Math.round(settings.frameRate))
                    }
                }
            }
        }
        
        // Update estimated bitrate for local stream
        const videoTracks = this.currentStream.getVideoTracks()
        if (videoTracks.length > 0) {
            const track = videoTracks[0]
            const settings = track.getSettings()
            if (settings.width && settings.height && settings.frameRate) {
                // Rough estimate: width * height * frameRate * 0.1 bits per pixel, converted to kbps
                const estimatedBitrate = Math.round((settings.width * settings.height * settings.frameRate * 0.1) / 1024)
                this.view.updateStreamRate(this.localPeerId, estimatedBitrate)
            }
        }
        
        console.log('✅ Local user stats updated')
    }

    // Trigger immediate stats update for a remote peer
    _triggerPeerStatsUpdate(peerId, call) {
        if (!call.peerConnection) return

        const pc = call.peerConnection
        
        // Update connection status based on ICE state
        const iceState = pc.iceConnectionState
        let status = 'connecting'
        switch (iceState) {
            case 'connected':
            case 'completed':
                status = 'connected'
                break
            case 'disconnected':
                status = 'disconnected'
                break
            case 'failed':
            case 'closed':
                status = 'failed'
                break
            default:
                status = 'connecting'
        }
        this.view.updateConnectionStatus(peerId, status)

        // Get immediate stats
        pc.getStats().then(stats => {
            let inboundRtp = null
            let candidatePair = null

            stats.forEach(report => {
                if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                    inboundRtp = report
                } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    candidatePair = report
                }
            })

            // Update ping from candidate pair
            if (candidatePair && candidatePair.currentRoundTripTime !== undefined) {
                const pingMs = Math.round(candidatePair.currentRoundTripTime * 1000)
                this.view.updatePing(peerId, pingMs)
            }

            // Update resolution and trigger FPS monitoring from video element
            const videoElement = document.getElementById(peerId)
            if (videoElement) {
                const video = videoElement.querySelector('video')
                if (video && video.videoWidth && video.videoHeight) {
                    this.view.updateResolution(peerId, `${video.videoWidth}x${video.videoHeight}`)
                    
                    // Try to get FPS from video track if available
                    if (inboundRtp && inboundRtp.framesPerSecond) {
                        this.view.updateFPS(peerId, Math.round(inboundRtp.framesPerSecond))
                    } else {
                        // Fallback: estimate from frames decoded if available
                        if (inboundRtp && inboundRtp.framesDecoded) {
                            const peerData = this.peers.get(peerId)
                            if (peerData && peerData.lastFramesDecoded && peerData.lastFrameTime) {
                                const framesDiff = inboundRtp.framesDecoded - peerData.lastFramesDecoded
                                const timeDiff = (Date.now() - peerData.lastFrameTime) / 1000
                                if (timeDiff > 0) {
                                    const fps = Math.round(framesDiff / timeDiff)
                                    this.view.updateFPS(peerId, fps)
                                }
                            }
                            // Store for next calculation
                            if (peerData) {
                                peerData.lastFramesDecoded = inboundRtp.framesDecoded
                                peerData.lastFrameTime = Date.now()
                            }
                        }
                    }
                }
            }

            // Calculate and update bitrate if we have previous data
            if (inboundRtp && inboundRtp.bytesReceived) {
                const now = Date.now()
                const peerData = this.peers.get(peerId)
                
                if (peerData && peerData.lastBytesReceived && peerData.lastStatsTime) {
                    const bytesDiff = inboundRtp.bytesReceived - peerData.lastBytesReceived
                    const timeDiff = (now - peerData.lastStatsTime) / 1000
                    if (timeDiff > 0) {
                        const bitrate = Math.round((bytesDiff * 8) / timeDiff / 1024) // kbps
                        if (bitrate > 0) {
                            this.view.updateStreamRate(peerId, bitrate)
                        }
                    }
                }
                
                // Store for next calculation
                if (peerData) {
                    peerData.lastBytesReceived = inboundRtp.bytesReceived
                    peerData.lastStatsTime = now
                }
            }

        }).catch(error => {
            console.warn(`⚠️ Failed to get immediate stats for ${peerId}:`, error)
        })
    }

    // Apply initial mute state to local stream
    _applyInitialMuteState() {
        if (this.currentStream && this.isMuted) {
            const audioTrack = this.currentStream.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = false
                console.log('🔇 Local audio muted by default on initialization')
            }
        }
    }

    _setupPingMeasurement(peerId, call) {
        try {
            if (!call.peerConnection) return

            const pc = call.peerConnection
            const dataChannel = pc.createDataChannel('ping', { ordered: true })
            
            dataChannel.onopen = () => {
                console.log(`📡 Data channel opened for ${peerId}`)
                
                // Send ping every 10 seconds for more responsive updates
                const pingInterval = setInterval(() => {
                    if (dataChannel.readyState === 'open') {
                        const pingTime = Date.now()
                        dataChannel.send(JSON.stringify({ type: 'ping', timestamp: pingTime }))
                    } else {
                        clearInterval(pingInterval)
                    }
                }, 10000) // Reduced from 30 seconds to 10 seconds
            }

            dataChannel.onclose = () => {
                console.warn(`📡 Data channel closed for ${peerId}`)
                // This might indicate a connection problem
                const peerData = this.peers.get(peerId)
                if (peerData) {
                    peerData.dataChannelClosed = true
                }
            }

            dataChannel.onerror = (error) => {
                console.error(`📡 Data channel error for ${peerId}:`, error)
            }

            dataChannel.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    const peerData = this.peers.get(peerId)
                    
                    if (data.type === 'ping') {
                        // Echo back the ping
                        dataChannel.send(JSON.stringify({ type: 'pong', timestamp: data.timestamp }))
                        
                        // Update last ping received time
                        if (peerData) {
                            peerData.lastPingReceived = Date.now()
                        }
                    } else if (data.type === 'pong') {
                        // Calculate ping time
                        const pingMs = Date.now() - data.timestamp
                        this.view.updatePing(peerId, pingMs)
                        
                        // Update last ping received time
                        if (peerData) {
                            peerData.lastPingReceived = Date.now()
                        }
                    }
                } catch (error) {
                    console.warn('Failed to parse data channel message:', error)
                }
            }

            // Handle incoming data channels
            pc.ondatachannel = (event) => {
                const incomingChannel = event.channel
                console.log(`📡 Incoming data channel from ${peerId}:`, incomingChannel.label)
                
                incomingChannel.onopen = () => {
                    console.log(`📡 Incoming data channel opened from ${peerId}`)
                }
                
                incomingChannel.onclose = () => {
                    console.warn(`📡 Incoming data channel closed from ${peerId}`)
                }
                
                incomingChannel.onerror = (error) => {
                    console.error(`📡 Incoming data channel error from ${peerId}:`, error)
                }
                
                incomingChannel.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data)
                        const peerData = this.peers.get(peerId)
                        
                        if (data.type === 'ping') {
                            // Echo back the ping
                            incomingChannel.send(JSON.stringify({ type: 'pong', timestamp: data.timestamp }))
                            
                            // Update last ping received time
                            if (peerData) {
                                peerData.lastPingReceived = Date.now()
                            }
                        } else if (data.type === 'pong') {
                            // Calculate ping time
                            const pingMs = Date.now() - data.timestamp
                            this.view.updatePing(peerId, pingMs)
                            
                            // Update last ping received time
                            if (peerData) {
                                peerData.lastPingReceived = Date.now()
                            }
                        }
                    } catch (error) {
                        console.warn('Failed to parse incoming data channel message:', error)
                    }
                }
            }

        } catch (error) {
            console.warn(`⚠️ Failed to setup ping measurement for ${peerId}:`, error)
        }
    }

    // Check mobile device support and compatibility
    async _checkMobileSupport() {
        console.log('📱 Checking mobile device support...')
        
        try {
            // Check device support
            const support = await this.media.checkDeviceSupport()
            
            // Log important information for mobile debugging
            if (support.isMobile) {
                console.log('📱 Mobile device detected:', {
                    isAndroid: support.isAndroid,
                    isIOS: support.isIOS,
                    userAgent: support.userAgent,
                    isSecureContext: support.isSecureContext,
                    protocol: support.protocol
                })
                
                // Check for common mobile issues
                this._checkMobileIssues(support)
            }
            
            // Check for WebRTC support
            if (!support.hasGetUserMedia) {
                throw new Error('WebRTC getUserMedia not supported on this device')
            }
            
            if (!support.isSecureContext && support.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
                console.warn('⚠️ Not in secure context - this may cause issues on mobile devices')
            }
            
        } catch (error) {
            console.error('❌ Mobile support check failed:', error)
            // Don't throw error here, just log it and continue
        }
    }

    _checkMobileIssues(support) {
        const issues = []
        
        // Check for HTTPS on mobile (required for getUserMedia on most mobile browsers)
        if (support.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
            issues.push('Not using HTTPS - this will prevent camera access on most mobile browsers')
        }
        
        // Check for specific Android Chrome versions with known issues
        if (support.isAndroid && /Chrome/.test(support.userAgent)) {
            const chromeVersion = support.userAgent.match(/Chrome\/(\d+)/)
            if (chromeVersion && parseInt(chromeVersion[1]) < 80) {
                issues.push('Chrome version may be too old for reliable WebRTC on Android')
            }
        }
        
        // Check device counts
        if (support.devices) {
            if (support.devices.videoinput === 0) {
                issues.push('No video input devices detected')
            }
            if (support.devices.audioinput === 0) {
                issues.push('No audio input devices detected')
            }
        }
        
        if (issues.length > 0) {
            console.warn('⚠️ Potential mobile issues detected:', issues)
        } else {
            console.log('✅ No major mobile compatibility issues detected')
        }
        
        return issues
    }

    // Enhanced error handling for mobile devices
    _handleMobileError(error) {
        console.error('📱 Mobile-specific error:', error)
        
        let userFriendlyMessage = 'Video call setup failed. '
        
        if (error.isAndroid) {
            userFriendlyMessage += 'For Android devices:\n'
            
            if (error.originalError?.name === 'NotAllowedError') {
                userFriendlyMessage += '• Tap the camera icon in your browser address bar\n' +
                                    '• Select "Allow" for camera and microphone\n' +
                                    '• Refresh the page and try again\n' +
                                    '• If it still doesn\'t work, try using Chrome browser'
            } else if (error.originalError?.name === 'NotFoundError') {
                userFriendlyMessage += '• Make sure no other apps are using your camera\n' +
                                    '• Close other camera/video call apps\n' +
                                    '• Restart your browser\n' +
                                    '• Try using Chrome browser if you\'re using a different one'
            } else if (error.originalError?.name === 'OverconstrainedError') {
                userFriendlyMessage += '• Your device camera may not support the required settings\n' +
                                    '• Try refreshing the page\n' +
                                    '• If the problem persists, your device may not be compatible'
            } else {
                userFriendlyMessage += '• Try refreshing the page\n' +
                                    '• Make sure you\'re using Chrome browser\n' +
                                    '• Check your internet connection\n' +
                                    '• Make sure camera permissions are allowed'
            }
        } else if (error.isIOS) {
            userFriendlyMessage += 'For iOS devices:\n' +
                                '• Make sure you\'re using Safari or Chrome\n' +
                                '• Allow camera and microphone permissions\n' +
                                '• Close other apps that might be using the camera\n' +
                                '• Try refreshing the page'
        } else {
            userFriendlyMessage += 'Please check your camera and microphone permissions and try again.'
        }
        
        return userFriendlyMessage
    }
}

export { VideoCallBusiness }