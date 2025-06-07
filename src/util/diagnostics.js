class PeerConnectionDiagnostics {
    constructor() {
        this.results = {}
    }

    async runFullDiagnostics() {
        console.log('🔍 Starting peer connection diagnostics...')
        
        const results = {
            timestamp: new Date().toISOString(),
            browser: this.getBrowserInfo(),
            network: await this.testNetworkConnectivity(),
            webrtc: await this.testWebRTCSupport(),
            media: await this.testMediaAccess(),
            stun: await this.testStunServers(),
            custom_server: await this.testCustomPeerServer()
        }

        console.log('📋 Diagnostic Results:', results)
        this.results = results
        return results
    }

    getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            webrtc_supported: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection),
            getUserMedia_supported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
        }
    }

    async testNetworkConnectivity() {
        const tests = []
        
        // Test basic internet connectivity
        try {
            const response = await fetch('https://www.google.com/favicon.ico', { 
                method: 'HEAD', 
                mode: 'no-cors',
                cache: 'no-cache'
            })
            tests.push({ test: 'Internet connectivity', status: 'pass' })
        } catch (error) {
            tests.push({ test: 'Internet connectivity', status: 'fail', error: error.message })
        }

        return tests
    }

    async testWebRTCSupport() {
        const tests = []

        // Test RTCPeerConnection
        try {
            const pc = new RTCPeerConnection()
            tests.push({ test: 'RTCPeerConnection creation', status: 'pass' })
            pc.close()
        } catch (error) {
            tests.push({ test: 'RTCPeerConnection creation', status: 'fail', error: error.message })
        }

        // Test data channel
        try {
            const pc = new RTCPeerConnection()
            const channel = pc.createDataChannel('test')
            tests.push({ test: 'Data channel creation', status: 'pass' })
            pc.close()
        } catch (error) {
            tests.push({ test: 'Data channel creation', status: 'fail', error: error.message })
        }

        return tests
    }

    async testMediaAccess() {
        const tests = []

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            })
            
            tests.push({ 
                test: 'Media access', 
                status: 'pass',
                details: {
                    videoTracks: stream.getVideoTracks().length,
                    audioTracks: stream.getAudioTracks().length
                }
            })
            
            stream.getTracks().forEach(track => track.stop())
        } catch (error) {
            tests.push({ test: 'Media access', status: 'fail', error: error.message })
        }

        return tests
    }

    async testStunServers() {
        const stunServers = [
            'stun:stun.l.google.com:19302',
            'stun:global.stun.twilio.com:3478',
            'stun:stun1.l.google.com:19302'
        ]

        const tests = []

        for (const stunUrl of stunServers) {
            try {
                const result = await this.testStunServer(stunUrl)
                tests.push({ 
                    test: `STUN server: ${stunUrl}`, 
                    status: result ? 'pass' : 'fail' 
                })
            } catch (error) {
                tests.push({ 
                    test: `STUN server: ${stunUrl}`, 
                    status: 'fail', 
                    error: error.message 
                })
            }
        }

        return tests
    }

    async testStunServer(stunUrl) {
        return new Promise((resolve) => {
            const pc = new RTCPeerConnection({ iceServers: [{ urls: stunUrl }] })
            let resolved = false

            pc.onicecandidate = (event) => {
                if (event.candidate && !resolved) {
                    resolved = true
                    resolve(true)
                    pc.close()
                }
            }

            pc.onicegatheringstatechange = () => {
                if (pc.iceGatheringState === 'complete' && !resolved) {
                    resolved = true
                    resolve(false)
                    pc.close()
                }
            }

            // Create a data channel to trigger ICE gathering
            pc.createDataChannel('test')
            pc.createOffer().then(offer => pc.setLocalDescription(offer))

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!resolved) {
                    resolved = true
                    resolve(false)
                    pc.close()
                }
            }, 10000)
        })
    }

    async testCustomPeerServer() {
        const tests = []
        
        try {
            // Test if your custom peer server is reachable
            const response = await fetch('http://peer-server.tigasdev.com', { 
                method: 'HEAD',
                mode: 'no-cors'
            })
            tests.push({ test: 'Custom PeerJS server reachability', status: 'pass' })
        } catch (error) {
            tests.push({ 
                test: 'Custom PeerJS server reachability', 
                status: 'fail', 
                error: error.message 
            })
        }

        return tests
    }

    generateReport() {
        if (!this.results) {
            return 'No diagnostics have been run yet. Call runFullDiagnostics() first.'
        }

        let report = `
🔍 PEER CONNECTION DIAGNOSTIC REPORT
=====================================
Timestamp: ${this.results.timestamp}

🌐 Browser Information:
- User Agent: ${this.results.browser.userAgent}
- WebRTC Supported: ${this.results.browser.webrtc_supported ? '✅' : '❌'}
- getUserMedia Supported: ${this.results.browser.getUserMedia_supported ? '✅' : '❌'}

🔗 Network Tests:
${this.results.network.map(test => `- ${test.test}: ${test.status === 'pass' ? '✅' : '❌'} ${test.error || ''}`).join('\n')}

🎥 WebRTC Tests:
${this.results.webrtc.map(test => `- ${test.test}: ${test.status === 'pass' ? '✅' : '❌'} ${test.error || ''}`).join('\n')}

🎤 Media Tests:
${this.results.media.map(test => `- ${test.test}: ${test.status === 'pass' ? '✅' : '❌'} ${test.error || ''}`).join('\n')}

🧊 STUN Server Tests:
${this.results.stun.map(test => `- ${test.test}: ${test.status === 'pass' ? '✅' : '❌'} ${test.error || ''}`).join('\n')}

🖥️ Custom Server Tests:
${this.results.custom_server.map(test => `- ${test.test}: ${test.status === 'pass' ? '✅' : '❌'} ${test.error || ''}`).join('\n')}
`

        return report
    }
}

export { PeerConnectionDiagnostics } 