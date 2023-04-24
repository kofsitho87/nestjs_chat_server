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
        <p 
          v-if="message.template == 'text_type_1'"
          :class="{active: message._id == findedMessageId}">
          {{ message.content.text }}
        </p>
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