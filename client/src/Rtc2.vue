<template>
  <div class="container">
    {{ $socket.id }} {{ connstate }}
    <div v-show="!inCalling">
      <nav class="p-4">
        <form @submit.prevent="createRoom">
          <div class="form-group row input-group">
            <input type="text" class="form-conrol" v-model="form.title" />
            <div class="input-group-append">
              <button class="btn btn-primary">방생성</button>
            </div>
          </div>
        </form>
      </nav>
      <div>
        <ul class="list-group" v-for="room in rooms" :key="room.id">
          <li class="list-group-item">
            ({{ room.clients.length }}) {{ room.title }} roomId:
            {{ room.id }}
            <button class="btn btn-primary" @click="joinRoom(room)">
              입장
            </button>
          </li>
        </ul>
      </div>
    </div>
    <div v-show="inCalling" id="videos">
      <div>
        <button class="btn btn-danger" @click="closeRoom">close</button>
      </div>
      <video
        ref="preview"
        id="video-preview"
        class="video_preview"
        playsinline
        controls
        preload="metadata"
        autoplay
        muted
      ></video>
    </div>
  </div>
</template>

<script>
const OFFER_EVENT = 'offerEvent';
const ANSWER_EVENT = 'answerEvent';
const ICE_CANDIDATE_EVENT = 'iceCandidateEvent';
export default {
  data() {
    return {
      peers: {},
      form: {
        title: 'test 방',
      },
      connstate: null,
      stream: null,
      inCalling: false,
      constraints: {
        video: true,
        audio: false,
      },
      initLocalMedia: false,
      rooms: [],
      peerConnectionConfig: {
        iceServers: [
          {
            urls: 'stun:stun.dingdongu.com:5349',
          },
          {
            urls: 'turn:turn.dingdongu.com:5349',
            username: 'dingdongu',
            credential: 'dkswjsdnswjsgody',
          },
        ],
      },
    };
  },
  mounted() {
    this.$socket.connect();
  },
  sockets: {
    connect() {
      console.log('socket connected', this.$socket.id);
    },
    disconnected() {
      console.log('socket disconnect');
      this.rooms = [];
    },
    rooms(rooms) {
      this.rooms = rooms;
    },
    async offerEvent({ toPeerId, desc, roomId }) {
      console.log('----------------- OFFER_EVENT -----------------------');

      // var result = confirm('ok?');
      // console.log(result);

      this.inCalling = true;
      if (!this.initLocalMedia) {
        await this.loadLocalMedia();
      }

      // @nhancv 3/30/20: Create new PeerConnection
      console.log('Created remote peer connection object');
      const pc = await this.createPeerConnection(false, toPeerId);
      this.peers[toPeerId] = pc;

      // Set remote offer
      console.log('setRemoteDescription start');
      try {
        console.log(
          '******************************************************************',
        );
        console.log(desc['type']);
        await this.peers[toPeerId].setRemoteDescription(desc);
        console.log(`setRemoteDescription complete`);
      } catch (e) {
        throw e;
      }

      // console.log(currentClientId + ' createAnswer start');
      // Since the 'remote' side has no media stream we need
      // to pass in the right constraints in order for it to
      // accept the incoming offer of audio and video.
      try {
        const answer = await this.peers[toPeerId].createAnswer();
        await this.peers[toPeerId].setLocalDescription(answer);
        console.log('########################');
        console.log(answer);
        this.sendMessage(ANSWER_EVENT, {
          roomId: roomId,
          description: answer,
          toPeerId: toPeerId,
        });
      } catch (e) {
        throw e;
      }
    },
    async answerEvent({ desc, toPeerId }) {
      console.log('----------------- ANSWER_EVENT -----------------------');
      console.log('setRemoteDescription start');
      try {
        await this.peers[toPeerId].setRemoteDescription(desc);
        console.log(`setRemoteDescription complete`);
      } catch (e) {
        throw e;
      }
    },
    async iceCandidateEvent({ candidate, toPeerId }) {
      console.log(ICE_CANDIDATE_EVENT, candidate);
      try {
        if (this.peers[toPeerId]) {
          await this.peers[toPeerId].addIceCandidate(candidate);
          console.log(`peerConnection addIceCandidate success`);
        } else {
          console.log(`peerConnection is Null!!!!!!!!!`);
        }
      } catch (e) {
        throw e;
      }
      console.log(
        `ICE candidate:\n${candidate ? candidate.candidate : '(null)'}`,
      );
    },
    exception(exception) {
      console.log('exception', exception);
    },
  },
  methods: {
    async joinRoom(room) {
      this.inCalling = true;
      if (!this.initLocalMedia) {
        await this.loadLocalMedia();
      }

      var _room = await this.sendMessage('JoinRoomEvent', { roomId: room.id });
      console.log(_room);
      if (room.clients.length > 0) {
        for (let clientId of room.clients) {
          if (clientId != this.$socket.id) {
            this.peers[clientId] = null;
            this.call(room, clientId);
          }
        }
      }
    },
    closeRoom() {
      this.sendMessage('CloseRoomEvent', true);

      for (let clientId of Object.keys(this.peers)) {
        this.stopStreamedVideo();
        const senders = this.peers[clientId].getSenders();
        senders.forEach((sender) => this.peers[clientId].removeTrack(sender));
        this.peers[clientId].close();
      }

      this.inCalling = false;
    },
    stopStreamedVideo() {
      const stream = this.$refs.preview.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach(function (track) {
        track.stop();
      });

      this.$refs.preview.srcObject = null;

      for (let peerId in this.peers) {
        document.getElementById(peerId).srcObject = null;
      }
    },
    async sendMessage(event, data) {
      console.info('sendMessage: ', event);
      return new Promise((rs, rj) => {
        this.$socket.emit(event, data, (result) => {
          rs(result);
        });
      });
    },
    createRoom() {
      if (this.form.title) {
        this.sendMessage('CreateRoomEvent', { title: this.form.title });
      }
    },
    async call(room, peerId) {
      this.inCalling = true;
      if (!this.initLocalMedia) {
        await this.loadLocalMedia();
      }
      await this.createPeerConnection(true, peerId);

      const offer = await this.peers[peerId].createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
      });
      await this.peers[peerId].setLocalDescription(offer);
      this.sendMessage(OFFER_EVENT, {
        roomId: room.id,
        toPeerId: peerId,
        description: offer,
      });
    },
    async loadLocalMedia() {
      console.log('Requesting local stream');
      try {
        // Older browsers might not implement mediaDevices at all, so we set an empty object first
        if (navigator.mediaDevices === undefined) {
          navigator.mediaDevices = {};
        }

        // Some browsers partially implement mediaDevices. We can't just assign an object
        // with getUserMedia as it would overwrite existing properties.
        // Here, we will just add the getUserMedia property if it's missing.
        if (navigator.mediaDevices.getUserMedia === undefined) {
          navigator.mediaDevices.getUserMedia = function (constraints) {
            // First get ahold of the legacy getUserMedia, if present
            let getUserMedia =
              navigator.getUserMedia ||
              navigator.mozGetUserMedia ||
              navigator.webkitGetUserMedia ||
              navigator.msGetUserMedia;

            // Some browsers just don't implement it - return a rejected promise with an error
            // to keep a consistent interface
            if (!getUserMedia) {
              return Promise.reject(
                new Error('getUserMedia is not implemented in this browser'),
              );
            }

            // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
            return new Promise(function (resolve, reject) {
              getUserMedia.call(navigator, constraints, resolve, reject);
            });
          };
        }

        // const constraints = { audio: true, video: true };
        // const constraints = { audio: true, video: { facingMode: 'user' } };
        const constraints = { audio: true, video: { width: 100, height: 100 } };
        // const constraints = {audio: true, video: {facingMode: {exact: "environment"}}};
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        // console.log('Received local stream');
        var localVideo = this.$refs.preview;
        localVideo.srcObject = stream;
        this.localStream = stream;
      } catch (e) {
        alert(`getUserMedia() error: ${e.message}`);
        console.error(e);
      }
      this.initLocalMedia = true;
    },
    async createPeerConnection(isHost, peerId) {
      // startTime = window.performance.now();
      var self = this;
      var pc = new RTCPeerConnection(this.peerConnectionConfig);
      this.peers[peerId] = pc;
      pc.addEventListener('icecandidate', async function onIceCandidate(event) {
        if (event.candidate) {
          self.sendMessage(ICE_CANDIDATE_EVENT, {
            isHost: isHost,
            candidate: event.candidate,
            toPeerId: peerId,
          });
          console.log(`peerConnection addIceCandidate success`);
        }
      });

      pc.addEventListener('iceconnectionstatechange', (e) => {
        self.connstate = pc.iceConnectionState;
        console.log(`peerConnection ICE state: ${pc.iceConnectionState}`);
        console.log('ICE state change event: ', e);
        if (pc.iceConnectionState === 'disconnected') {
          self.closeRoom();
        } else if (pc.iceConnectionState === 'connected') {
          // @nhancv 3/30/20: Update control state
        }
      });

      // var remoteVideo = this.$refs.remote;
      pc.addEventListener('track', function (e) {
        const remoteStream = e.streams[0];
        var remoteVideo = document.getElementById(peerId);

        self.gotRemoteStream(remoteStream, peerId);
        if (remoteVideo && remoteVideo.srcObject !== remoteStream) {
          remoteVideo.srcObject = remoteStream;
          // self.gotRemoteStream(remoteStream, peerId);
          remoteStream
            .getTracks()
            .forEach((track) => pc.addTrack(track, remoteStream));
          console.log('peerConnection received remote stream');
        }
        // remoteStream
        //   .getTracks()
        //   .forEach((track) => pc.addTrack(track, remoteStream));
        console.log('peerConnection received remote stream');
      });

      if (this.localStream) {
        // const videoTracks = this.localStream.getVideoTracks();
        // const audioTracks = this.localStream.getAudioTracks();
        // if (videoTracks.length > 0) {
        //   console.log(`Using video device: ${videoTracks[0].label}`);
        // }
        // if (audioTracks.length > 0) {
        //   console.log(`Using audio device: ${audioTracks[0].label}`);
        // }
        this.localStream
          .getTracks()
          .forEach((track) => pc.addTrack(track, self.localStream));
      }
      console.log('Added local stream');
      return pc;
    },
    gotRemoteStream(stream, peerId) {
      console.log(`got remote stream, peer ${peerId}`);

      if (!document.getElementById(peerId)) {
        //assign stream to new HTML video element
        var vidElement = document.createElement('video');
        console.log(vidElement);
        vidElement.setAttribute('autoplay', '');
        vidElement.setAttribute('muted', '');
        vidElement.id = peerId;
        vidElement.class = 'video_preview';
        // vidElement.style.width = "";
        vidElement.srcObject = stream;
        document.getElementById('videos').appendChild(vidElement);
      }
    },
  },
};
</script>

<style scoped>
#video-preview {
  width: 200px;
  height: 200px;
}
#video-remote {
  width: 200px;
  height: 200px;
}
.video_preview {
  width: 200px;
  height: 200px;
}
</style>