<template>
  <div class="outgoing_msg text-right">
    <div class="sent_msg">
      <p 
        v-if="message.template == 'text_type_1'" 
        :class="{active: message._id == findedMessageId}">
        {{ message.content.text }}
      </p>
      <div
        v-else-if="
          message.template == 'photo_type_1' &&
          message.content.files
        "
      >
        <img :src="'https://dingdongu.s3.ap-northeast-2.amazonaws.com/' + message.content.files[0].path" />
      </div>
      <div
        v-else-if="
          message.template == 'video_type_1' &&
          message.content.files
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
            message.content.files
              ? message.content.files[0].path
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