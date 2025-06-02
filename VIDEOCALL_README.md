# Tigasdev Meet - Video Calling Platform

A Google Meet-style video calling platform built with WebRTC, Next.js, and Socket.io for real-time communication.

## 🌟 Features

- **HD Video Calls**: Crystal clear video quality with adaptive streaming
- **Multi-participant Support**: Connect multiple users in a single room
- **Real-time Chat**: Built-in text messaging during video calls
- **Mute/Unmute Audio**: Toggle microphone on/off
- **Enable/Disable Video**: Toggle camera on/off
- **Recording Capability**: Record video calls (framework ready)
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **No Registration Required**: Join calls instantly with just a room ID

## 🏗️ Architecture

The video calling system follows a modular architecture inspired by the existing `app.js` pattern:

### Core Components

1. **VideoCallBusiness Class**: Central business logic handling:
   - WebRTC peer connections
   - Socket.io signaling
   - Media stream management
   - User connection/disconnection
   - Chat messaging

2. **React Components**:
   - **videocall.js**: Main video call interface page
   - **meet.js**: Landing page for starting/joining calls

3. **Infrastructure**:
   - **Signaling Server**: `signaling-server.tigasdev.com`
   - **STUN/TURN Server**: `peer-server.tigasdev.com`
   - **PeerJS**: WebRTC abstraction layer

### Data Flow

```
User A ←→ Socket.io Signaling Server ←→ User B
   ↓                                      ↓
PeerJS ←────── Direct WebRTC Connection ──→ PeerJS
```

## 🚀 Usage

### Starting a Meeting

1. Go to `/meet` page
2. Click "Start Instant Meeting" for immediate access
3. Or enter a custom room ID and click "Join"
4. Share the room ID with other participants

### Joining a Meeting

1. Receive a room ID from meeting organizer
2. Go to `/meet` or `/videocall?room=ROOM_ID`
3. Enter the room ID and join
4. Grant camera/microphone permissions when prompted

## 🛠️ Technical Implementation

### WebRTC Configuration

```javascript
const peerConfig = {
  host: 'peer-server.tigasdev.com',
  port: 80,
  path: '/',
  secure: false,
  debug: 2,
  key: 'Bkiv2sHChaglEQOr50OjlOFMEE8ObzW2URwpC00iWsY'
}
```

### Socket Events

- `join-room`: User joins a specific room
- `user-connected`: New user joins the room
- `user-disconnected`: User leaves the room
- `chat-message`: Text message broadcast

### Video Grid Layout

The interface automatically adjusts the video grid based on participant count:
- 1 participant: Single full-screen view
- 2-4 participants: 2x2 grid
- 5+ participants: 3x3 grid

## 🎨 UI/UX Features

### Google Meet-Style Interface

- **Header**: Shows room ID and participant count
- **Video Grid**: Adaptive layout for multiple participants
- **Controls Bar**: Mute, video toggle, record, chat, leave buttons
- **Chat Sidebar**: Toggleable real-time messaging
- **Responsive Design**: Mobile-friendly interface

### Visual Indicators

- **Blue Border**: Indicates local user video
- **Name Labels**: Shows "You" for local user, shortened ID for others
- **Button States**: Visual feedback for muted/unmuted, video on/off
- **Recording Indicator**: Red color when recording is active

## 🔧 Dependencies

### Client-Side Libraries

```html
<script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
<script src="https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js"></script>
```

### NPM Packages (Built-in with Next.js)

- React & React Hooks
- Next.js for routing and SSR
- Tailwind CSS for styling

## 📱 Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11+)
- **Edge**: Full support

## 🔒 Security & Privacy

- **Peer-to-peer Communication**: Direct WebRTC connections
- **No Data Storage**: No call recordings stored on servers
- **Room-based Access**: Only users with room ID can join
- **Media Permissions**: Users control camera/microphone access

## 🚀 Deployment

The video calling feature is integrated into the main Tigasdev website:

1. **Pages**:
   - `/meet` - Landing page
   - `/videocall` - Video call interface

2. **Navigation**: Accessible via "Meet" in the main header

3. **Infrastructure Dependencies**:
   - Signaling server must be running
   - STUN/TURN server for peer connection

## 🛣️ Future Enhancements

- [ ] Screen sharing capability
- [ ] File sharing during calls
- [ ] Meeting recording and playback
- [ ] Virtual backgrounds
- [ ] Breakout rooms
- [ ] Calendar integration
- [ ] Meeting scheduling
- [ ] Dial-in support

## 🤝 Contributing

This video calling feature follows the same architectural patterns as the existing codebase. When extending functionality:

1. Keep business logic in dedicated classes
2. Use React hooks for state management
3. Follow the modular component structure
4. Maintain responsive design principles

## 📞 Support

For issues or questions about the video calling feature, please refer to the main project documentation or contact the development team.

---

Built with ❤️ using WebRTC, Next.js, and modern web technologies. 