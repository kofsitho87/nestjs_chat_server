<template>
  <div class="incoming_msg">
    <div class="incoming_msg_img">
      <img
        src="https://ptetutorials.com/images/user-profile.png"
        alt="sunil"
      />
    </div>
    <div class="received_msg">
      <div class="received_withd_msg text-left">
        {{ getUserName(activeRoom, message.author.authorId) }}
        <p :class="{active: message._id == findedMessageId}" v-if="message.data.type == 'TEXT'">
          {{ message.data.content.text }}
        </p>
        <div v-else-if="message.data.type == 'CARD'">
          <div
            v-if="
              message.data.content.rawData.cardType ==
              'VIDEO_CALL'
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
          </div>
          <div
            v-else-if="
              message.data.content.rawData.cardType == 'ADVERTISEMENT'
            "
          >
            <div>
              알림메세지
              <div>
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
              :src="message.data.content.files[0].origin"
              type="video/webm"
            />
            <source
              :src="message.data.content.files[0].origin"
              type="video/mp4"
            />
            Sorry, your browser doesn't support embedded videos.
          </video>
        </div>
        <div v-else>file message!</div>
        <span class="time_date">
          {{ message.createdAt | moment('from', 'now') }}
        </span>
        <!-- <span v-if="message._id">
          {{ unReadMsgCount(message) }}
        </span> -->
      </div>
    </div>
  </div>
</template>


<script>
export default {
  name: 'MessageOldIncoming',
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
  methods: {
    getUserName(room, authorId) {
      // if (!room.lastMessage) return;
      var user = room.joinUsers.find((u) => u.id == authorId);
      return user ? user.nickName : '';
    },
  }
}
</script>