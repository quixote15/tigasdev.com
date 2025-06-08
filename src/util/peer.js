class PeerBuilder {
    constructor({ peerConfig, fallbackConfig = null }) {
        this.peerConfig = peerConfig
        this.fallbackConfig = fallbackConfig
        this.currentConfigIndex = 0

        const defaultFunctionValue = () => { }
        this.onError = defaultFunctionValue
        this.onCallReceived = defaultFunctionValue
        this.onConnectionOpened = defaultFunctionValue
        this.onPeerStreamReceived = defaultFunctionValue
        this.onCallError = defaultFunctionValue
        this.onCallClose = defaultFunctionValue
        
        // Connection monitoring
        this.peer = null
        this.isDestroyed = false
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
        this.reconnectDelay = 2000
        this.keepAliveInterval = null
        this.lastReconnectAttempt = null
        this.connectionStartTime = null
        this.hasEverConnected = false
    }

    setOnError(fn) {
        this.onError = fn
        return this
    }

    setOnCallReceived(fn) {
        this.onCallReceived = fn
        return this
    }

    setOnConnectionOpened(fn) {
        this.onConnectionOpened = fn
        return this
    }

    setOnPeerStreamReceived(fn) {
        this.onPeerStreamReceived = fn
        return this
    }

    setOnCallError(fn) {
        this.onCallError = fn
        return this
    }

    setOnCallClose(fn) {
        this.onCallClose = fn
        return this
    }

    _prepareCallEvent(call) {
        call.on('stream', stream => this.onPeerStreamReceived(call, stream))
        call.on('error', error => this.onCallError(call, error))
        call.on('close', () => this.onCallClose(call))

        this.onCallReceived(call)
    }

    _preparePeerInstanceFunction(peerModule) {
        class PeerCustomModule extends peerModule {}

        const peerCall = PeerCustomModule.prototype.call 
        const context = this 
        PeerCustomModule.prototype.call = function (id, stream) {
            const call = peerCall.apply(this, [ id, stream ])
            context._prepareCallEvent(call)

            return call
        }

        return PeerCustomModule
    }

    _getCurrentConfig() {
        return this.currentConfigIndex === 0 ? this.peerConfig : this.fallbackConfig
    }

    _createPeer() {
        const currentConfig = this._getCurrentConfig()
        console.log(`🚀 Creating PeerJS instance (attempt ${this.currentConfigIndex + 1}) with config:`, currentConfig)
        
        try {
            const PeerCustomInstance = this._preparePeerInstanceFunction(Peer)
            const peer = new PeerCustomInstance(...currentConfig)
            
            // Add comprehensive connection monitoring
            this._addConnectionDiagnostics(peer)
            
            return peer
        } catch (error) {
            console.error('❌ Failed to create PeerJS instance:', error)
            throw error
        }
    }

    _addConnectionDiagnostics(peer) {
        // Monitor socket events
        if (peer.socket) {
            peer.socket.on('connect', () => {
                console.log('🔌 PeerJS socket connected')
            })
            
            peer.socket.on('disconnect', () => {
                console.log('🔌 PeerJS socket disconnected')
            })

            peer.socket.on('error', (error) => {
                console.error('🔌 PeerJS socket error:', error)
            })
        }

        // Monitor WebRTC connection states
        const originalCall = peer.call
        peer.call = (id, stream, options) => {
            console.log('📞 Initiating call to:', id)
            const call = originalCall.call(peer, id, stream, options)
            
            if (call && call.peerConnection) {
                this._monitorRTCConnection(call.peerConnection, id)
            }
            
            return call
        }
    }

    _monitorRTCConnection(pc, peerId) {
        console.log(`🔍 Monitoring RTC connection to ${peerId}`)
        
        pc.oniceconnectionstatechange = () => {
            console.log(`🧊 ICE Connection State (${peerId}):`, pc.iceConnectionState)
            
            if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                console.error(`❌ ICE Connection failed for ${peerId}`)
            }
        }

        pc.onconnectionstatechange = () => {
            console.log(`🔗 Connection State (${peerId}):`, pc.connectionState)
        }

        pc.onicegatheringstatechange = () => {
            console.log(`🧊 ICE Gathering State (${peerId}):`, pc.iceGatheringState)
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`🧊 ICE Candidate (${peerId}):`, event.candidate.type, event.candidate.candidate)
            } else {
                console.log(`🧊 ICE Gathering complete for ${peerId}`)
            }
        }
    }

    _setupPeerEvents(peer, resolve, reject) {
        peer.on('open', (id) => {
            const connectionTime = Date.now() - this.connectionStartTime
            console.log(`✅ Peer connected with ID: ${id} (took ${connectionTime}ms)`)
            
            this.reconnectAttempts = 0
            this.hasEverConnected = true
            this._startKeepAlive(peer)
            this.onConnectionOpened(peer)
            resolve(peer)
        })

        peer.on('error', (error) => {
            console.error('❌ Peer error:', error)
            
            // Stop keep-alive on critical errors
            this._stopKeepAlive()
            
            // Handle specific error types that warrant reconnection
            if (error.type === 'disconnected' || 
                error.type === 'network' || 
                error.type === 'server-error' ||
                (error.message && error.message.includes('Lost connection'))) {
                
                console.log('🔄 Connection lost, attempting to reconnect...')
                this._attemptReconnect()
            } else if (error.message && error.message.includes('Invalid message')) {
                // Don't reconnect on invalid message errors - these are protocol issues
                console.error('❌ Protocol error - not reconnecting:', error.message)
                this.onError(error)
            } else {
                this.onError(error)
            }
        })

        peer.on('disconnected', () => {
            console.log('⚠️ Peer disconnected')
            this._stopKeepAlive()
            
            if (!this.isDestroyed) {
                console.log('🔄 Attempting to reconnect...')
                this._attemptReconnect()
            }
        })

        peer.on('close', () => {
            console.log('❌ Peer connection closed')
            this._stopKeepAlive()
        })

        peer.on('call', this._prepareCallEvent.bind(this))

        // Connection timeout with fallback logic
        const connectionTimeout = setTimeout(() => {
            if (!peer.id && !this.isDestroyed) {
                console.error('❌ Peer connection timeout')
                peer.destroy()
                
                // Try fallback config if available and not tried yet
                if (this.fallbackConfig && this.currentConfigIndex === 0) {
                    console.log('🔄 Trying fallback configuration...')
                    this.currentConfigIndex = 1
                    this._initializePeer().then(resolve).catch(reject)
                } else {
                    reject(new Error('Peer connection timeout - all configurations tried'))
                }
            }
        }, 15000) // Increased timeout to 15 seconds

        peer.on('open', () => {
            clearTimeout(connectionTimeout)
        })
    }

    _startKeepAlive(peer) {
        this._stopKeepAlive()
        
        // Use connection monitoring instead of custom pings
        this.keepAliveInterval = setInterval(() => {
            if (peer && !peer.destroyed) {
                // Check if peer is still connected by checking its socket state
                if (!peer.socket || peer.socket.readyState !== 1) {
                    console.warn('⚠️ Peer connection lost, attempting reconnect...')
                    this._attemptReconnect()
                } else {
                    console.log('📡 Peer connection healthy')
                }
            }
        }, 30000) // Check every 30 seconds
    }

    _stopKeepAlive() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval)
            this.keepAliveInterval = null
            console.log('⏹️ Keep-alive stopped')
        }
    }

    _attemptReconnect() {
        if (this.isDestroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached`)
            this._stopKeepAlive()
            return
        }

        // Prevent rapid reconnection attempts
        const now = Date.now()
        if (this.lastReconnectAttempt && (now - this.lastReconnectAttempt) < 5000) {
            console.log('⏳ Reconnection cooldown active, skipping attempt')
            return
        }

        this.lastReconnectAttempt = now
        this.reconnectAttempts++
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

        console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)

        this._stopKeepAlive() // Stop monitoring during reconnection

        setTimeout(() => {
            if (this.isDestroyed) return

            try {
                if (this.peer && !this.peer.destroyed) {
                    console.log('🔄 Attempting peer reconnect...')
                    this.peer.reconnect()
                } else {
                    console.log('🔄 Creating new peer connection...')
                    // Clean up old peer first
                    if (this.peer) {
                        this.peer.destroy()
                    }
                    this._initializePeer()
                }
            } catch (error) {
                console.error('❌ Reconnection failed:', error)
                // Don't immediately retry on error, let the normal error handling deal with it
            }
        }, delay)
    }

    _initializePeer() {
        if (this.isDestroyed) return Promise.reject(new Error('PeerBuilder destroyed'))

        this.connectionStartTime = Date.now()
        
        return new Promise((resolve, reject) => {
            try {
                const peer = this._createPeer()
                this.peer = peer
                this._setupPeerEvents(peer, resolve, reject)
            } catch (error) {
                console.error('❌ Failed to create peer:', error)
                
                // Try fallback if available and not tried yet
                if (this.fallbackConfig && this.currentConfigIndex === 0) {
                    console.log('🔄 Trying fallback configuration due to creation error...')
                    this.currentConfigIndex = 1
                    this._initializePeer().then(resolve).catch(reject)
                } else {
                    reject(error)
                }
            }
        })
    }

    build() {
        return this._initializePeer()
    }

    destroy() {
        console.log('🗑️ Destroying PeerBuilder...')
        this.isDestroyed = true
        this._stopKeepAlive()
        
        if (this.peer && !this.peer.destroyed) {
            this.peer.destroy()
        }
    }
}

export { PeerBuilder }
