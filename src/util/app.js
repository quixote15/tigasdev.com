

const recordClick = function (recorderBtn) {
  this.recordingEnabled = false
  return () => {
    this.recordingEnabled = !this.recordingEnabled
    recorderBtn.style.color = this.recordingEnabled ? 'red' : 'white'
  }
}

export const newVideoCall = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get('room');
  console.log('this is the room', room)
  const PEERJS_KEY = 'Bkiv2sHChaglEQOr50OjlOFMEE8ObzW2URwpC00iWsY';

  // const recorderBtn = document.getElementById('record')
  // recorderBtn.addEventListener('click', recordClick(recorderBtn))
  const socketUrl = 'http://signaling-server.tigasdev.com'
  const socketBuilder = new SocketBuilder({ socketUrl })

  const peerConfig = Object.values({
    id: undefined,
    config: {
      host: 'peer-server.tigasdev.com',
      port: 80,          // HTTP port 80 (standard web port)
      path: '/',
      secure: false,     // HTTP only (not HTTPS)
      debug: 2,          // Enable debug logs
      key: PEERJS_KEY    // Must match deployed server's key
    }
  })
  const peerBuilder = new PeerBuilder({ peerConfig })

  const view = new View()
  const media = new Media()
  const deps = {
    view,
    media,
    room,
    socketBuilder,
    peerBuilder
  }

  Business.initialize(deps)
  return Business

}

window.onload = onload