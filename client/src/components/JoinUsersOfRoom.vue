<template>
  <div class="d-flex-column">
    <div class="p-2">
      <b-button-group>
        <b-button
          v-if="activeRoom.rules.canLeaveOutRoom"
          variant="danger"
          @click="$emit('leaveOutRoom')"
        >
          나가기
        </b-button>
        <b-button
          v-if="activeRoom.rules.canInviteMemebrs"
          @click="$emit('getInvitableUsers')"
        >
          초대하기
        </b-button>
      </b-button-group>
    </div>
    <div class="user-list-wrap overflow-auto flex-fill px-2" v-if="activeRoom.rules.canShowMemberList">
      <div
        v-for="user in activeRoom.joinUsers"
        :key="user.id"
        class="chat_people mb-2"
        @dblclick="$emit('kickOutUser', user)"
      >
        <div class="d-flex">
          <img src="https://ptetutorials.com/images/user-profile.png" />
          <h6>{{ user.nickName }}{{ user.master ? '(master)' : '' }}</h6>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'JoinUsersOfRoom',
  props: {
    activeRoom: {
      type: Object,
      required: true,
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h6 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.user-list-wrap {
  height: 76vh;
}
</style>
