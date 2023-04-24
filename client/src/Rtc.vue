<template>
  <div class="container">
    <video ref="preview" id="video-preview" playsinline controls preload="metadata" autoplay muted></video>
    <video ref="remote" id="video-remote" playsinline controls preload="metadata" autoplay></video>
    <br>
    <!-- <div v-for="item in peers" :key="item">
      {{ item }}
    </div>-->
    <button id="connect" type="button" @click="initVideo()">서버 접속</button>
    <button type="button" @click="initVideo2()">서버 접속2</button>
  </div>
</template>

<script>
export default {
  name: 'RTC',
  data() {
    return {
      peers: [],
      uuid: null,
      myName: null,
      localStream: null,
      rtcPeerConnection: null,
      peerConnectionConfig: {
        iceServers: [
          {
            urls: "stun:stun.dingdongu.com:5349"
          },
          {
            urls: "turn:turn.dingdongu.com:5349",
            username: "dingdongu",
            credential: "dkswjsdnswjsgody",
          }
        ],
      }
    }
  },
  sockets: {
    connect() {
      console.log('socket connected');
    },
    disconnected() {
      console.log('socket disconnect');
    },
    // message(signal){
    //   console.log("#########", signal)
    //    if(!this.peerConnection){
    //      this.start(false);
    //    }
    //   // var signal = JSON.parse(message.data);
    //   //   // Ignore messages from ourself
    //   if(signal.uuid == this.uuid) return;
    //   var self = this;
    //   if(signal.sdp) {
    //     this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
    //       // Only create answers in response to offers
    //       if(signal.sdp.type == 'offer') {
    //         self.peerConnection.createAnswer().then(self.createdDescription.bind(self)).catch(self.errorHandler);
    //       }
    //     }).catch(self.errorHandler);
    //   } else if(signal.ice) {
    //     self.peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(self.errorHandler);
    //   }
    // }
  },
  mounted(){
    this.uuid = this.createUUID();
    this.$socket.connect();
  },
  methods: {
    initVideo(){
      var constraints = {
        video: true,
        audio: false,
      };
      if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          this.localStream = stream;
          this.$refs.preview.srcObject = stream;

          this.rtcPeerConnection = new RTCPeerConnection();
          stream.getTracks().forEach(track => this.rtcPeerConnection.addTrack(track));

          this.rtcPeerConnection.addEventListener('negotiationneeded', async () => {
            // 이쪽편에 접속하기 위한 정보를 생성해서 local session description에 설정
            const sdpOffer = await this.rtcPeerConnection.createOffer(); // { type: 'offer', sdp: '...' }
            this.rtcPeerConnection.setLocalDescription(sdpOffer);
            // 상대편에게 전송 -> callee.js, onMessage('SDP')
            // sendMessage('SDP', sdpOffer)
            this.$socket.emit("SDP", sdpOffer);
          });

          this.rtcPeerConnection.addEventListener('track', e => {
            this.$refs.remote.srcObject = new MediaStream([e.track])
          });

          this.sockets.subscribe("SDP", (sdpAnswer) => {
            console.log("on SDP: ", sdpAnswer);
            this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(sdpAnswer));
          })

          this.sockets.subscribe("ICE", (iceCandidate) => {
            this.rtcPeerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate));
          });

          this.rtcPeerConnection.addEventListener('icecandidate', e => {
            if (e.candidate === null) return;
            this.$socket.emit("ICE", e.candidate);
          });
        });
      } else {
        alert('Your browser does not support getUserMedia API');
      }
    },
    initVideo2(){
      var constraints = {
        video: true,
        audio: false,
      };
      if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          this.localStream = stream;
          this.$refs.preview.srcObject = stream;

          this.rtcPeerConnection = new RTCPeerConnection();
          stream.getTracks().forEach(track => this.rtcPeerConnection.addTrack(track));


          //Subscribe: SDP
          this.sockets.subscribe("SDP", async (sdpOffer) => {
            console.log("on SDP: ", sdpOffer);
            await this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(sdpOffer));
            const sdpAnswer = await this.rtcPeerConnection.createAnswer();
            await this.rtcPeerConnection.setLocalDescription(sdpAnswer);
            this.$socket.emit("SDP", sdpAnswer);
          })

          this.rtcPeerConnection.addEventListener('track', e => {
            this.$refs.remote.srcObject = new MediaStream([e.track])
          });

          //Subscribe: ICE
          this.sockets.subscribe("ICE", (iceCandidate) => {
            this.rtcPeerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate));
          });

          this.rtcPeerConnection.addEventListener('icecandidate', e => {
            if (e.candidate === null) return;
            this.$socket.emit("ICE", e.candidate);
          });
        });
      } else {
        alert('Your browser does not support getUserMedia API');
      }
    },
    createUUID() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
  }
}
</script>