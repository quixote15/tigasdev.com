import { VideoCallBusiness } from './business.js'
import { PeerBuilder } from './peer.js'
import { SocketBuilder } from './socket.js'
import { Media } from './media.js'
import { View } from './view.js'

export {
    VideoCallBusiness,
    PeerBuilder,
    SocketBuilder,
    Media,
    View
}

// Utility factory function to create a fully configured VideoCallBusiness
export const createVideoCallService = ({
    roomId,
    videoGridRef,
    setParticipantsCount,
    setMessages,
    setIsRecording,
    initialMuteState = true,
    socketUrl = 'https://signaling-server.tigasdev.com',
    peerConfig = null // Will be set below
}) => {
    // Primary config - your custom server
    const customPeerConfig = {
        host: 'peer-server.tigasdev.com',
        port: 80,
        path: '/',
        secure: true,
        debug: 3, // Increased debug level
        key: 'Bkiv2sHChaglEQOr50OjlOFMEE8ObzW2URwpC00iWsY',
        config: {
            iceServers: [
                // { urls: 'stun:stun.l.google.com:19302' },
                // { urls: 'stun:global.stun.twilio.com:3478' },
                // { urls: 'stun:stun1.l.google.com:19302' },
                // { urls: 'stun:stun2.l.google.com:19302' },
                {
                    urls: process.env.NEXT_PUBLIC_TURN_SERVER_URL, 
                    username: process.env.NEXT_PUBLIC_TURN_SERVER_USER, // Replace with your TURN username
                    credential: process.env.NEXT_PUBLIC_TURN_SERVER_PASSWORD // Replace with your TURN password
                }
            ],
            iceCandidatePoolSize: 10
        }
    }

    // Fallback config - PeerJS cloud service
    // const fallbackPeerConfig = {
    //     debug: 3,
    //     config: {
    //         iceServers: [
    //             { urls: 'stun:stun.l.google.com:19302' },
    //             { urls: 'stun:global.stun.twilio.com:3478' },
    //             { urls: 'stun:stun1.l.google.com:19302' },
    //             { urls: 'stun:stun2.l.google.com:19302' },
    //             { urls: 'stun:stun3.l.google.com:19302' },
    //             { urls: 'stun:stun4.l.google.com:19302' }
    //         ],
    //         iceCandidatePoolSize: 10
    //     }
    // }

    // Use provided config or default to custom config
    const finalPeerConfig = peerConfig || customPeerConfig

    // Create utility instances
    const media = new Media()
    const view = new View()
        .setVideoGridRef(videoGridRef)
        .setParticipantsCountCallback(setParticipantsCount)
    
    const socketBuilder = new SocketBuilder({ socketUrl })
    const peerBuilder = new PeerBuilder({ 
        peerConfig: [finalPeerConfig],
    })

    // Create and configure the video call business
    const videoCallBusiness = new VideoCallBusiness({
        roomId,
        media,
        view,
        socketBuilder,
        peerBuilder,
        initialMuteState
    }).setCallbacks({
        setMessages,
        setIsRecording,
        setParticipantsCount
    })

    return videoCallBusiness
}

// Export fallback function for testing
export const createVideoCallServiceWithFallback = (params) => {
    return createVideoCallService({
        ...params,
        peerConfig: {
            debug: 3,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' }
                ],
                iceCandidatePoolSize: 10
            }
        }
    })
} 