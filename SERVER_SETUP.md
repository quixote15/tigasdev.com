# Video Call Signaling Server Setup

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Signaling Server
```bash
# Run server only
npm run server

# Run server with auto-restart (development)
npm run dev:server

# Run both Next.js app and signaling server together
npm run dev:all
```

### 3. Access the Application
- **Next.js App**: http://localhost:3000 (or 3001/3002 if port is busy)
- **Signaling Server**: http://localhost:3333
- **Server API**: http://localhost:3333/api/rooms

## 📡 Server Features

### Chat Message Broadcasting
- ✅ Real-time message broadcasting to all room participants
- ✅ Message history storage (last 100 messages per room)
- ✅ Server-side timestamps for message ordering
- ✅ Proper sender identification

### Room Management
- ✅ Automatic room creation and cleanup
- ✅ Participant tracking and management
- ✅ User connection/disconnection notifications
- ✅ Empty room cleanup

### API Endpoints
- `GET /` - Server status and statistics
- `GET /api/rooms` - List all active rooms

## 🔧 Configuration

### Environment Variables
```bash
PORT=3333  # Server port (default: 3333)
```

### CORS Origins
The server is configured to accept connections from:
- http://localhost:3000
- http://localhost:3001  
- http://localhost:3002
- https://tigasdev.com
- https://www.tigasdev.com

## 📝 Socket Events

### Client → Server
- `join-room(roomId, userId)` - Join a video call room
- `chat-message(message)` - Send a chat message
- `leave-room()` - Leave the current room

### Server → Client  
- `room-joined(data)` - Confirmation of room join
- `user-connected(userId)` - New user joined the room
- `user-disconnected(userId)` - User left the room
- `chat-message(message)` - Received chat message from another user

## 🛠️ Development

### Server Logs
The server provides detailed logging:
- 🔌 Connection events
- 🏠 Room join/leave events  
- 💬 Chat message broadcasting
- 🧹 Room cleanup operations

### Testing Chat
1. Open multiple browser tabs
2. Join the same room from different tabs
3. Send messages from any tab
4. Messages should appear in all other tabs

## 🚨 Troubleshooting

### Chat Messages Not Broadcasting
- ✅ Server is running on port 3333
- ✅ Client is connecting to correct server URL
- ✅ Users are in the same room
- ✅ Check browser console for socket connection errors

### Connection Issues
- Check if port 3333 is available
- Verify CORS configuration matches your domain
- Check firewall settings for local development

## 📦 Production Deployment

For production deployment:

1. Update socket URL in `src/util/index.js`
2. Add your production domain to CORS origins
3. Set proper environment variables
4. Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name "videocall-server"
``` 