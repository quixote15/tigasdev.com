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

        socket.on('user-connected', this.onUserConnected)
        socket.on('user-disconnected', this.onUserDisconnected)
        socket.on('chat-message', this.onChatMessage)

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
