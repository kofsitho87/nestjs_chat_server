<template>
  <div class="outgoing_msg text-right">
    <div class="sent_msg">
      <p :class="{active: message._id == findedMessageId}" v-if="message.data.type == 'TEXT'">
        {{ message.data.content.text }}
      </p>
      <div v-else-if="message.data.type == 'CARD'">
        <!-- <div
          v-if="
            message.data.content.rawData.cardType == 'VIDEO_CALL'
          "
        >
          <div>
            알림메세지
            <div>
              <button
                @click="joinVideoRoom(message)"
                style="background-color: purple; color: white"
              >
                비디오 수업참여
              </button>
            </div>
          </div>
        </div> -->
        <div
          v-if="
            message.data.content.rawData.cardType == 'ZOOM_LINK'
          "
        >
          <div>
            알림메세지
            <div>
              <button
                style="background-color: purple; color: white"
              >
                비디오 수업참여[ZOOM]
              </button>
              {{ message.data.content.rawData }}
            </div>
          </div>
        </div>
      </div>
      <div
        v-else-if="
          message.data.type == 'PHOTO' &&
          message.data.content.files
        "
      >
        <img :src="'https://dingdongu.s3.ap-northeast-2.amazonaws.com/' + message.data.content.files[0].path" />
      </div>
      <div
        v-else-if="
          message.data.type == 'VIDEO' &&
          message.data.content.files
        "
      >
        <video v-if="message._id" controls width="250">
          <source
            :src="message.data.content.files[0].path"
            type="video/webm"
          />
          <source
            :src="message.data.content.files[0].path"
            type="video/mp4"
          />
          Sorry, your browser doesn't support embedded videos.
        </video>
      </div>
      <div v-else>
        <a
          v-if="message._id"
          :href="
            message.data.content.files
              ? message.data.content.files[0].path
              : 'javascript:void(0)'
          "
          target="_blank"
          rel="noopener noreferrer"
        >
          file message!
        </a>
        <div v-else>
          uploading...
          {{ message.progress.progress }}
        </div>
      </div>
      <!-- <span v-if="message._id">
        {{ unReadMsgCount(message) }}
      </span> -->
      <span class="time_date" v-if="message.createdAt">
        {{ message.createdAt | moment('from', 'now') }}
      </span>
    </div>
  </div>
</template>


<script>
export default {
  name: 'MessageOldAdmin',
  props: ['message', 'activeRoom'],
  data(){
    return {
      findedMessageId: null,
    }
  },
  computed: {
    unReadMsgCount() {
      return function (message) {
        // console.log('unReadMsgCount');
        if (!this.activeRoom) {
          return null;
        }
        var totalUserCount = this.activeRoom.joinUsers.length;
        const currentMessageIndex = this.messages.indexOf(message);
        this.activeRoom.joinUsers.forEach((u) => {
          if (u.lastReadMessageId) {
            const lastMessageIndex = this.messages.findIndex(
              (m) => m._id == u.lastReadMessageId,
            );
            // console.log('lastMessageIndex', lastMessageIndex);
            if (currentMessageIndex <= lastMessageIndex) {
              totalUserCount--;
            }
          }
        });
        return totalUserCount;
      };
    },
  },
}
</script>