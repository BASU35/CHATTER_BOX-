const socket = io();
const roomId = 'default-room'; // simple single room

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messages = document.getElementById('messages');

let localStream;
let peerConnection;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// 1. Get local media
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
    socket.emit('join', roomId);
  });

// 2. Signaling
socket.on('user-connected', async (id) => {
  peerConnection = createPeerConnection();
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', { offer });
});

socket.on('offer', async ({ offer }) => {
  peerConnection = createPeerConnection();
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', { answer });
});

socket.on('answer', async ({ answer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', async ({ candidate }) => {
  if (candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

function createPeerConnection() {
  const pc = new RTCPeerConnection(config);
  pc.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('ice-candidate', { candidate: event.candidate });
    }
  };
  pc.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };
  return pc;
}

// 3. Chat
sendBtn.onclick = () => {
  const msg = messageInput.value;
  if (msg.trim()) {
    appendMessage(`You: ${msg}`);
    socket.emit('chat-message', msg);
    messageInput.value = '';
  }
};

socket.on('chat-message', msg => {
  appendMessage(`Stranger: ${msg}`);
});

function appendMessage(msg) {
  const div = document.createElement('div');
  div.textContent = msg;
  messages.appendChild(div);
}
