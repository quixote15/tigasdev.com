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
            
            // Get local stream
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
            
            this.peers.set(callerId, { call, stream, connectTime: Date.now() })
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
            
            this.peers.set(userId, { call, attempt })
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

        // Monitor connection state changes
        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState
            console.log(`🧊 ICE Connection State for ${peerId}:`, state)
            
            let status = 'connecting'
            switch (state) {
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
        }

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
                        }
                    }
                    
                    // Store for next calculation
                    if (peerData) {
                        peerData.lastBytesReceived = inboundRtp.bytesReceived
                        peerData.lastStatsTime = now
                    }
                }

                // Update ping from candidate pair
                if (candidatePair && candidatePair.currentRoundTripTime !== undefined) {
                    const pingMs = Math.round(candidatePair.currentRoundTripTime * 1000)
                    this.view.updatePing(peerId, pingMs)
                }

            } catch (error) {
                console.warn(`⚠️ Failed to get stats for ${peerId}:`, error)
            }
        }

        // Start monitoring with more frequent updates
        const statsInterval = setInterval(() => {
            if (this.peers.has(peerId)) {
                monitorStats()
            } else {
                clearInterval(statsInterval)
                if (pingInterval) clearInterval(pingInterval)
            }
        }, 5000) // Update every 5 seconds instead of 30

        // Simple ping measurement using data channel (if available)
        this._setupPingMeasurement(peerId, call)
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

            dataChannel.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.type === 'ping') {
                        // Echo back the ping
                        dataChannel.send(JSON.stringify({ type: 'pong', timestamp: data.timestamp }))
                    } else if (data.type === 'pong') {
                        // Calculate ping time
                        const pingMs = Date.now() - data.timestamp
                        this.view.updatePing(peerId, pingMs)
                    }
                } catch (error) {
                    console.warn('Failed to parse data channel message:', error)
                }
            }

            // Handle incoming data channels
            pc.ondatachannel = (event) => {
                const incomingChannel = event.channel
                incomingChannel.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data)
                        if (data.type === 'ping') {
                            // Echo back the ping
                            incomingChannel.send(JSON.stringify({ type: 'pong', timestamp: data.timestamp }))
                        } else if (data.type === 'pong') {
                            // Calculate ping time
                            const pingMs = Date.now() - data.timestamp
                            this.view.updatePing(peerId, pingMs)
                        }
                    } catch (error) {
                        console.warn('Failed to parse data channel message:', error)
                    }
                }
            }

        } catch (error) {
            console.warn(`⚠️ Failed to setup ping measurement for ${peerId}:`, error)
        }
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
}

export { VideoCallBusiness }