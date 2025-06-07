class SocketBuilder {
    constructor({ socketUrl }) {
        this.socketUrl = socketUrl
        this.onUserConnected = () => { }
        this.onUserDisconnected = () => { }
        this.onChatMessage = () => { }
        
        // Connection monitoring
        this.socket = null
        this.isDestroyed = false
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
    }
    setOnUserConnected(fn) {
        this.onUserConnected = fn

        return this
    }
    setOnUserDisconnected(fn) {
        this.onUserDisconnected = fn
        return this
    }
    setOnChatMessage(fn) {
        this.onChatMessage = fn
        return this
    }

    build() {
        const socket = io.connect(this.socketUrl, {
            withCredentials: false,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 10000
        })

        this.socket = socket

        // Connection monitoring
        socket.on('connect', () => {
            console.log('✅ Socket connected successfully')
            console.log('🏠 Socket ID:', socket.id)
            this.reconnectAttempts = 0
        })

        socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason)
            
            // Auto-reconnect for certain disconnect reasons
            if (reason === 'io server disconnect') {
                console.log('🔄 Server disconnected, attempting manual reconnect...')
                this._attemptReconnect()
            }
        })

        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error)
            this._attemptReconnect()
        })

        socket.on('reconnect', (attemptNumber) => {
            console.log('✅ Socket reconnected after', attemptNumber, 'attempts')
        })

        socket.on('reconnect_failed', () => {
            console.error('❌ Socket reconnection failed after max attempts')
        })

        socket.on('user-connected', (userId) => {
            console.log('🔔 Socket event: user-connected received:', userId)
            this.onUserConnected(userId)
        })
        socket.on('user-disconnected', (userId) => {
            console.log('🔔 Socket event: user-disconnected received:', userId)
            this.onUserDisconnected(userId)
        })
        socket.on('chat-message', (message) => {
            console.log('🔔 Socket event: chat-message received:', message)
            this.onChatMessage(message)
        })

        // Debug: Listen for join-room acknowledgment
        socket.on('room-joined', (data) => {
            console.log('🔔 Socket event: room-joined received:', data)
        })

        // Debug: Listen for any other events
        const originalOn = socket.on
        socket.on = function(event, handler) {
            if (!['connect', 'disconnect', 'connect_error', 'reconnect', 'reconnect_failed', 'user-connected', 'user-disconnected', 'chat-message', 'room-joined'].includes(event)) {
                console.log('🔔 Socket: Listening for event:', event)
            }
            return originalOn.call(this, event, handler)
        }

        // Debug: Listen for join-room emit
        const originalEmit = socket.emit
        socket.emit = function(event, ...args) {
            console.log('📤 Socket: Emitting event:', event, 'with args:', args)
            return originalEmit.call(this, event, ...args)
        }

        return socket
    }

    _attemptReconnect() {
        if (this.isDestroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
            return
        }

        this.reconnectAttempts++
        console.log(`🔄 Socket reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

        setTimeout(() => {
            if (this.socket && !this.isDestroyed) {
                this.socket.connect()
            }
        }, 2000 * this.reconnectAttempts) // Increasing delay
    }

    destroy() {
        console.log('🗑️ Destroying SocketBuilder...')
        this.isDestroyed = true
        
        if (this.socket) {
            this.socket.disconnect()
        }
    }
}

export { SocketBuilder }
