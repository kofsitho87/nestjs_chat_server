<template>
  <b-container id="app" fluid>
    <!-- <h2 v-if="isLoading" class="text-center">Loading...</h2> -->
    <div class="messaging">
      <div>
        소켓연결상태: {{ isConnected }}
        <b-button v-if="isConnected" variant="danger" @click="disConnect">
          연결끊기
        </b-button>
        <b-button v-if="isConnected" variant="danger" @click="logout">
          로그아웃
        </b-button>
        <b-button v-else variant="primary" @click="connect">연결하기</b-button>
      </div>
      <div v-if="me">
        <div>email: {{ me.email }}</div>
        <div>nickName: {{ me.nickName }}</div>
      </div>
      <div class="inbox_msg d-flex">
        <div class="inbox_people">
          <div class="headind_srch">
            <div class="recent_heading">
              <h4 class="">Recent</h4>
              <b-button @click="readyForCreateRoom">방생성하기</b-button>
            </div>
            <!-- <div class="srch_bar">
              <div class="stylish-input-group">
                <input type="text" class="search-bar" placeholder="Search" />
                <span class="input-group-addon">
                  <button type="button">
                    <i class="fa fa-search" aria-hidden="true"></i>
                  </button>
                </span>
              </div>
            </div> -->
          </div>
          <div class="inbox_chat">
            <div
              v-for="room in rooms"
              :key="room._id"
              class="chat_list"
              :class="{ active_chat: activeRoomId == room._id }"
              @click="joinRoom(room)"
            >
              <div class="chat_people">
                <div class="chat_img">
                  <img
                    src="https://ptetutorials.com/images/user-profile.png"
                    alt="sunil"
                  />
                </div>
                <div class="chat_ib">
                  <h5>
                    {{ room.name }}({{ room.roomType }})
                    <span v-if="room.unreadMsgCount">
                      ({{ room.unreadMsgCount }})
                    </span>
                  </h5>
                  <div class="info" v-if="room.lastMessage">
                    <div>
                      <strong>
                        {{
                          getUserName(room, room.lastMessage.author.authorId)
                        }}
                      </strong>
                      <template v-if="room.lastMessage.data">
                        <div v-if="room.lastMessage.data.type == 'TEXT'">
                          {{ room.lastMessage.data.content.text }}
                        </div>
                        <div v-else>
                          {{ room.lastMessage.data.type }}
                        </div>
                      </template>
                    </div>
                    <span class="chat_date">
                      {{ room.lastMessage.createdAt | moment('from', 'now') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="activeRoomId" class="mesgs d-flex flex-fill">
          <div class="d-flex-column flex-fill">
            <div class="py-2 px-2 message_top border-bottom">
              <b-button-group>
                <b-button variant="primary" size="sm" @click="filterMessages('PHOTO')">이미지모아보기</b-button>
                <b-button variant="info" size="sm" @click="openInviteUserModal(activeRoomId)">방초대하기</b-button>
                <b-button variant="" size="sm" @click="showUpdateRoomSetting()">방설정변경하기</b-button>
              </b-button-group>
              <div class="search_wrap">
                <b-form class="mt-2" @submit.prevent="searchMessages">
                  <b-input type="search" placeholder="검색어를 입력해주세요." v-model="keyword"></b-input>
                </b-form>
                <div v-if="searchResults.length > 0" class="search_control">
                  {{ searchIndex + 1 }}/{{ searchResults.length }}
                  <b-button size="sm" :disabled="searchResults.length - 1 <= searchIndex" @click="searchIndex=searchIndex+1">up</b-button>
                  <b-button size="sm" :disabled="searchIndex == 0" @click="searchIndex--">down</b-button>
                  <b-button size="sm" @click="closeSearchMode">close</b-button>
                </div>
              </div>
            </div>
            <div class="message_list">
              <div
                ref="msg_history"
                class="msg_history"
                v-on:scroll="handleScroll"
              >
                <div
                  v-for="message in filteredMessages"
                  :key="message._id"
                  :id="'chat-message-' + message._id"
                  class="text-center"
                > 
                  <template v-if="message.data">
                    <AdminMessage 
                      v-if="message.data.type == 'ADMIN'" 
                      :message="message"
                      :activeRoom="activeRoom"
                    />
                    <OldIncomingMessage 
                      v-else-if="message.author.authorId != me._id" 
                      :message="message"
                      :activeRoom="activeRoom"
                    />
                    <OldOutgoingMessage v-else 
                      :message="message"
                      :activeRoom="activeRoom"
                    />
                  </template>
                  <template v-else>
                    <NewIncomingMessage 
                      v-if="message.author.authorId != me._id" 
                      :message="message"
                      :activeRoom="activeRoom"
                    />
                    <NewOutgoingMessage v-else :message="message" :activeRoom="activeRoom" />
                  </template>
                </div>
              </div>
              <div class="type_msg">
                <!-- <b-button @click="startAutoMsg">auto message</b-button>
                <b-button @click="stopAutoMsg">stop message</b-button> -->
                <div class="input_msg_write">
                  <input
                    type="file"
                    class=""
                    ref="file"
                    @change="uploadFileAction"
                    v-if="!activeRoom.rules.isFreezed"
                  />
                  <input
                    type="text"
                    class="write_msg"
                    placeholder="Type a message"
                    :disabled="activeRoom.rules.isFreezed"
                    v-model="text"
                    @keyup.enter="sendMessage(text)"
                  />
                </div>
              </div>
            </div>
          </div>
          <div v-if="activeRoom" class="user_list">
            <!-- {{ activeRoom }} -->
            <JoinUsersOfRoom
              :activeRoom="activeRoom"
              @leaveOutRoom="leaveOutRoom"
              @getInvitableUsers="openInviteUserModal(activeRoomId)"
              @kickOutUser="kickOutUser"
            />
          </div>
        </div>
      </div>
    </div>

    <b-modal id="modal-1" scrollable title="방생성" hide-footer>
      <b-form @submit.prevent="createNewRoom">
        <b-list-group>
          <b-list-group-item
            v-for="user in invitableUsers"
            :key="user._id"
            @click="toggleInviteUser(user)"
            :active="selectedInviteUsers.has(user._id)"
          >
            {{ user.username }}({{ user.email }})
          </b-list-group-item>
        </b-list-group>
        <b-form-group
          label="room name:"
          label-for="input-1"
          description="We'll never share your email with anyone else."
        >
          <b-form-input
            id="input-1"
            v-model="form.roomName"
            type="text"
            placeholder="room name"
            required
          ></b-form-input>
        </b-form-group>
        <b-button-group>
          <b-button type="button" @click="$bvModal.hide('modal-1')">
            cancle
          </b-button>
          <b-button type="submit" variant="primary">ok</b-button>
        </b-button-group>
      </b-form>
      <!-- <b-list-group>
        <b-list-group-item
          v-for="user in invitableUsers"
          :key="user._id"
          @click="createRoomWithUser(user)"
        >
          {{ user.nickName }}
        </b-list-group-item>
      </b-list-group> -->
    </b-modal>

    <b-modal ref="modal-2" id="modal-2" scrollable title="초대하기" @ok="inviteUsers">
      <b-list-group>
        <b-list-group-item
          v-for="user in invitableUsers"
          :key="user._id"
          :active="activeInvitableUserRow(user)"
          @click="toggleSelectedInvitableUsers(user)"
        >
          {{ user.username }}({{ user.email }})
        </b-list-group-item>
      </b-list-group>
    </b-modal>

    <b-modal id="photos" title="이미지" size="lg">
      <div v-for="message in currentRoom.photos" :key="message._id">
        <img :src="'https://dingdongu.s3.ap-northeast-2.amazonaws.com/' + message.data.content.files[0].path">
      </div>
    </b-modal>

    <b-modal id="room_setting" title="방설정변경" size="md" @ok="updateRoomSetting">
      <b-form>
        <b-form-group>
          <b-input placeholder="방이름" v-model="roomSetting.name"></b-input>
        </b-form-group>
        <b-form-group>
          <b-form-checkbox
            v-model="roomSetting.rules.canCopyMessage"
          >
            canCopyMessage
          </b-form-checkbox>
          <b-form-checkbox
            v-model="roomSetting.rules.canCaptureMessage"
          >
            canCaptureMessage
          </b-form-checkbox>
          <b-form-checkbox
            v-model="roomSetting.rules.canDeleteMessage"
          >
            canDeleteMessage
          </b-form-checkbox>
          <b-form-checkbox
            v-model="roomSetting.rules.canShareMessage"
          >
            canShareMessage
          </b-form-checkbox>
          <b-form-checkbox
            v-model="roomSetting.rules.canInviteMemebrs"
          >
            canInviteMemebrs
          </b-form-checkbox>
          <b-form-checkbox
            v-model="roomSetting.rules.canLeaveOutRoom"
          >
            canLeaveOutRoom
          </b-form-checkbox>
          <b-form-checkbox
            v-model="roomSetting.rules.canShowMemberList"
          >
            canShowMemberList
          </b-form-checkbox>
          <b-form-checkbox
            v-model="roomSetting.rules.isFreezed"
          >
            isFreezed
          </b-form-checkbox>
        </b-form-group>
      </b-form>
    </b-modal>
  </b-container>
</template>

<script>
const OFFER_EVENT = 'offerEvent';
const ANSWER_EVENT = 'answerEvent';
const ICE_CANDIDATE_EVENT = 'iceCandidateEvent';
import axios from 'axios';
import JoinUsersOfRoom from '@/components/JoinUsersOfRoom';
import AdminMessage from '@/components/MessageOld/Admin';
import OldIncomingMessage from '@/components/MessageOld/Incoming';
import OldOutgoingMessage from '@/components/MessageOld/Outgoing';

import NewIncomingMessage from '@/components/MessageNew/Incoming';
import NewOutgoingMessage from '@/components/MessageNew/Outgoing';

export default {
  name: 'App',
  components: {
    JoinUsersOfRoom,
    AdminMessage,
    OldIncomingMessage,
    OldOutgoingMessage,
    NewIncomingMessage,
    NewOutgoingMessage
  },
  data() {
    return {
      keyword: null,
      searchResults: [],
      searchIndex: 0,
      findedMessageId: null,
      roomSetting: {
        name: null,
        rules: {

        }
      },
      currentRoom: {
        photos: [],
        videos: [],
      },
      timer: null,
      selectedInviteUsers: new Set(),
      isConnected: false,
      form: {
        roomName: null,
      },
      isLoading: true,
      text: null,
      rooms: [],
      activeRoom: null,
      messages: [],
      invitableUsersPage: 1,
      invitableUsers: [],
      selectedInvitableUsers: new Set(),
      fileReader: null,
      tempFile: null,
      tempFileName: null,
      page: 1,
      allLoaded: false,
      splicedSize: 1000 * 1000, //100mb
    };
  },
  computed: {
    token() {
      return this.$store.state.userId;
    },
    activeRoomId() {
      return this.activeRoom ? this.activeRoom._id : '';
    },
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
    filteredMessages(){
      let messages = this.messages
      // if(this.searchResults.length > 0){
      //   const message = this.searchResults[this.searchIndex]
      //   this.findedMessageId = message._id
      //   const findedIndex = messages.findIndex(m => m._id == message._id)
      //   if(findedIndex > -1){
      //     const item = document.getElementById(`chat-message-${message._id}`)
      //     this.$nextTick(function () {
      //       this.$refs.msg_history.scrollTop = item.offsetTop - 300;
      //     });
      //   }
      // }
      return messages
    }
  },
  sockets: {
    connect() {
      console.log('socket connected');
      this.isConnected = true;
      this.isLoading = false;

      const payload = {
        roomTypes: ['SYSTEM_ALARM',  "GROUP"],
        linkSid: "grapemarket"
      }
      this.$socket.emit('listenRooms', payload, (data) => {
        console.log('listenRooms', data);
        var rooms = data.data.list || [];
        if (rooms.length > 0) {
          rooms.sort((a, b) => {
            if (!a.lastMessage) {
              return 1;
            }
            if (!b.lastMessage) {
              return 0;
            }
            return (
              new Date(b.lastMessage.createdAt).getTime() -
              new Date(a.lastMessage.createdAt).getTime()
            );
          });

          // this.joinRoom(rooms[0]);
          const findRoom = rooms.find(r => r.name == 'cgjj')
          // console.log(findRoom);
          console.log(rooms[0]);
          this.rooms = rooms;
        }
      });
    },
    disconnected() {
      console.log('socket disconnect');
      this.isConnected = false;
    },
    updateRoomLastMessage(room) {
      let index = this.rooms.findIndex((r) => r._id == room._id);
      if (index > -1) {
        if (this.activeRoomId == room._id) {
          this.activeRoom = room;
        } else {
          this.rooms[index].unreadMsgCount++;
        }
        this.rooms[index].lastMessage = room.lastMessage;
        this.rooms[index].joinUsers = room.joinUsers;
      } else {
        console.log('new room: ', room);
        room.unReadMsgCount = 0;
        this.rooms.push(room);
      }

      this.$nextTick(function () {
        this.$forceUpdate();
      });
    },
    listenRoom(room) {
      let index = this.rooms.findIndex((r) => r._id == room._id);
      if (index > -1) {
        const existMe = room.joinUsers.findIndex((ju) => ju._id == this.me._id);
        console.log('existMe', existMe);
        if (existMe < 0) {
          var roomIdx = this.rooms.findIndex((r) => r._id == room._id);
          this.rooms.splice(roomIdx, 1);
          this.activeRoom = null
          return;
        }
        if (this.activeRoomId == room._id) {
          this.activeRoom = room;
        }
        const previousRoom = this.rooms[index];
        room.unReadMsgCount = previousRoom.unReadMsgCount;
        var _rooms = this.rooms;
        _rooms[index] = room;
        this.rooms = _rooms;
      } else {
        console.log('new room: ', room);
        room.unReadMsgCount = 0;
        this.rooms.push(room);
      }

      this.$nextTick(function () {
        this.$forceUpdate();
      });
    },
    exception(exception) {
      console.log('exception', exception);
    },
  },
  apollo: {
    me: {
      query: require('@/graphql/me.gql'),
      result({ data }) {
        if (data) {
          this.$socket.connect();
        } else {
          localStorage.removeItem('token');
        }
      },
    },
  },
  mounted() {
    this.$socket.on('error', (d) => {
      console.error('cached error', d);
    });
    this.$socket.on('disconnect', () => {
      console.log('disconnected..............');
      this.isConnected = false;
      this.rooms = [];
      this.activeRoom = null;
      this.messages = [];
    });
    this.$moment.locale('ko');
  },
  methods: {
    closeSearchMode(){
      this.keyword = null
      this.searchResults = []
      this.searchIndex = 0
    },
    searchMessages(){
      if(!this.keyword) {
        return
      }
      const payload = {
        roomId: this.activeRoom._id,
        keyword: this.keyword,
      }
      this.$socket.emit('searchMessagesByRoom', payload, ({data}) => {
        console.log(data.list);
        if(data.list){
          this.searchResults = data.list
        }
      })
    },
    filterMessages(type){
      const payload = { 
        roomId: this.activeRoomId,
        messageType: type,
      };
      this.$socket.emit('listenMessagesByRoom', payload, ({data}) => {
        console.log(data.list);
        this.currentRoom.photos = data.list
        this.$bvModal.show("photos")
      })
    },
    activeInvitableUserRow(user) {
      var result = this.selectedInvitableUsers.has(user._id);
      return result;
    },
    toggleSelectedInvitableUsers(user) {
      console.log(this.selectedInvitableUsers);
      if (this.selectedInvitableUsers.has(user._id)) {
        this.selectedInvitableUsers.delete(user._id);
      } else {
        this.selectedInvitableUsers.add(user._id);
      }

      this.$nextTick(function () {
        this.$forceUpdate();
      });
    },
    startAutoMsg() {
      var index = 0;
      var self = this;
      this.timer = setInterval(function () {
        index++;
        self.sendMessage(index.toString());
        console.log(index);
      }, 500);
    },
    stopAutoMsg() {
      clearInterval(this.timer);
      this.timer = null;
    },
    toggleInviteUser(user) {
      // console.log(this.selectedInviteUsers.has(user._id));
      if (this.selectedInviteUsers.has(user._id)) {
        this.selectedInviteUsers.delete(user._id);
      } else {
        this.selectedInviteUsers.add(user._id);
      }
      this.$nextTick(function () {
        this.$forceUpdate();
      });
    },
    connect() {
      this.$socket.connect();
    },
    disConnect() {
      this.$socket.close();
    },
    logout(){
      localStorage.removeItem("token");
      this.$socket.close();
    },
    handleScroll(e) {
      if (!this.allLoaded) {
        if (e.target.scrollTop == 0) {
          if (this.messages.length > 0) {
            const firstMessageId = this.messages[0];
            this.getMessagesByRoom(this.activeRoom._id, firstMessageId._id);
          }
        }
      }
    },
    scrollToBottom() {
      // console.log('scrollToBottom');
      this.$nextTick(function () {
        this.$refs.msg_history.scrollTop = 9999999999999;
      });
    },
    async createNewRoom() {
      const roomName = this.form.roomName;
      if (!roomName) {
        alert('방이름은 필수값!');
        return;
      }
      if (this.selectedInviteUsers.size < 1) {
        alert('초대할 유저선택!');
        return;
      }
      this.$bvModal.hide('modal-1');
      const roomPayload = {
        link: {
          sid: "chattest",
          name: "채팅테스트",
        },
        roomType: "INQUIRY",
        users: [...this.selectedInviteUsers],
        name: roomName,
        rules: {
          canInviteMemebrs: true,
          canLeaveOutRoom: true,
          // canCopyMessage: true,
          // canCaptureMessage: true,
          // canDeleteMessage: true,
          // canShareMessage: true,
          // canShowMemberList: true,
          // isFreezed: false,
        },
      };
      this.$socket.emit('createNewRoom', roomPayload, (data) => {
        if (data.success) {
          var room = data.data;
          console.log(room);
          this.rooms.unshift(room);
          this.joinRoom(room);
        }
      });
      // console.log(roomPayload);
      // const { data } = await this.$apollo.mutate({
      //   client: 'link',
      //   mutation: require('@/graphql/createChatRoom.gql'),
      //   variables: {
      //     input: {
      //       linkSid: "shwtest",
      //       linkMembers: [...this.selectedInviteUsers],
      //     }
      //   }
      // })
    },
    showUpdateRoomSetting(){
      this.roomSetting.name = this.activeRoom.name
      this.roomSetting.rules = JSON.parse(JSON.stringify(this.activeRoom.rules))

      this.$bvModal.show("room_setting");
    },
    updateRoomSetting(){
      console.log(this.roomSetting);
      const payload = {
        roomId: this.activeRoomId,
        updateData: {
          name: this.roomSetting.name,
          rules: this.roomSetting.rules,
        }
      }
      this.$socket.emit('updateRoomSetting', payload, (data) => {
        if (data.error) {
          alert(data.error);
        }
      });
    },
    createRoomWithUser(user) {
      console.log(user);
      this.$socket.emit('createNewRoom', { name: 'hahahaha' }, (room) => {
        console.log(room);
      });
    },
    readyForCreateRoom() {
      if(this.invitableUsers.length < 1){
        this.getInvitableUsers();
      }
      this.$bvModal.show('modal-1');
    },
    // unReadMsgCount(message) {
    //   if (!this.activeRoom) {
    //     return null;
    //   }
    //   var totalUserCount = this.activeRoom.joinUsers.length;

    //   const currentMessageIndex = this.messages.indexOf(message);
    //   this.activeRoom.joinUsers.forEach((u) => {
    //     if (u.lastReadMessageId) {
    //       const lastMessageIndex = this.messages.findIndex(
    //         (m) => m._id == u.lastReadMessageId,
    //       );
    //       console.log('lastMessageIndex', lastMessageIndex);
    //       if (currentMessageIndex <= lastMessageIndex) {
    //         totalUserCount--;
    //       }
    //     }
    //   });
    //   return totalUserCount;
    // },
    openInviteUserModal(roomId){
      if(this.invitableUsers.length < 1){
        this.getInvitableUsers();
      }

      this.$bvModal.show('modal-2');
      const self = this;
      this.$nextTick(() => {
        const scrollEl = document.getElementById("modal-2").querySelector(".modal-body");
        scrollEl.addEventListener("scroll", function(e){
          if(e.target.offsetHeight + e.target.scrollTop >=  e.target.scrollHeight){
            self.invitableUsersPage++
            self.getInvitableUsers(self.activeRoomId)
          }
        })
      })
    },
    getInvitableUsers(roomId) {
      const payload = {
        roomId: roomId,
        page: this.invitableUsersPage,
        count: 200,
      };
      this.$socket.emit('getInvitableUsers', payload, (data) => {
        if (data.success && data.data && data.data.list) {
          var users = data.data.list;
          this.invitableUsers = [...this.invitableUsers, ...users];
        }
      });
    },
    inviteUsers() {
      if (this.selectedInvitableUsers.size < 1) {
        return;
      }
      console.log(this.selectedInvitableUsers);
      this.$bvModal.hide('modal-2');

      let payload = {
        targetUserIds: [...this.selectedInvitableUsers],
        roomId: this.activeRoomId,
      };
      this.$socket.emit('inviteRoom', payload, (data) => {
        console.log(data);
      });
    },
    getUserName(room, authorId) {
      // if (!room.lastMessage) return;
      var user = room.joinUsers.find((u) => u.id == authorId);
      return user ? user.nickName : '';
    },
    joinRoom(room) {
      if (this.activeRoom && this.activeRoom._id == room._id) {
        return;
      }
      console.log('joinRoom');

      if (this.activeRoom) {
        this.sockets.unsubscribe(`listenMessage_${this.activeRoom._id}`);
        this.$socket.emit('leaveRoom', this.activeRoom._id);
      }
      this.$socket.emit('joinRoom', room._id, (data) => {
        console.log('joinRoom', data);
        if (data) {
          this.activeRoom = room;
          this.allLoaded = false;
          room.unReadMsgCount = 0;
          this.getMessagesByRoom(room._id);
        }
      });

      this.sockets.subscribe(`listenMessage_${room._id}`, ({eventType, message}) => {
        console.log("new Message", message);
        if (message) {
          // switch(eventType){
          //   case "CREATE": {
          //     this.messages.push(message);
          //     break
          //   }
          //   case "UPDATE":{
          //     const findIdx = this.messages.findIndex(
          //       (m) => m.syncKey == message.syncKey,
          //     );
          //     if (findIdx > -1) {
          //       this.messages[findIdx] = message;
          //     }
          //     break
          //   }
          // }
          const findIdx = this.messages.findIndex(
            (m) => m.syncKey == message.syncKey,
          );
          if (findIdx > -1) {
            this.messages[findIdx] = message;
          } else {
            this.messages.push(message);
          }
          this.$nextTick(function () {
            this.$forceUpdate();
          });
          this.scrollToBottom();
        }
      });
    },
    disableScroll() {
      var keys = { 37: 1, 38: 1, 39: 1, 40: 1 };
      function preventDefault(e) {
        e.preventDefault();
      }

      function preventDefaultForScrollKeys(e) {
        if (keys[e.keyCode]) {
          preventDefault(e);
          return false;
        }
      }
      window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
      window.addEventListener('wheel', preventDefault, { passive: false }); // modern desktop
      window.addEventListener('touchmove', preventDefault, false); // mobile
      window.addEventListener('keydown', preventDefaultForScrollKeys, false);
    },
    getMessagesByRoom(roomId, lastMessageId) {
      console.log('getMessagesByRoom', lastMessageId);
      const payload = { 
        roomId, 
        lastMessageId, 
        count: 50,
        sort: {
          fieldName: "_id",
          orderBy: "DESC"
        }
      };
      this.$socket.emit('getMessagesByRoom', payload, (data) => {
        data.data.list.reverse()
        var messages = data.data.list;
        // console.log(messages);
        if (messages.length < 1) {
          this.allLoaded = true;
        }
        if (lastMessageId) {
          //keep scroll position
          const previousScrollHeight = this.$refs.msg_history.scrollHeight;
          this.messages = [...messages, ...this.messages];
          this.$nextTick(() => {
            const currentScrollHeight = this.$refs.msg_history.scrollHeight;
            this.$refs.msg_history.scrollTo(
              0,
              currentScrollHeight - previousScrollHeight,
            );
          });
        } else {
          this.messages = messages;
          if (messages.length > 0) {
            this.updateReadMessage(messages[messages.length - 1]);
          }
          this.scrollToBottom();
        }
      });
    },
    leaveRoom() {
      if (this.activeRoom) {
        this.$socket.emit('leaveRoom', this.activeRoom._id);
      }
    },
    leaveOutRoom() {
      if (!confirm('정말 나가시겠습니까?')) return;
      if (this.activeRoom) {
        this.$socket.emit('leaveOutRoom', this.activeRoom._id, (result) => {
          console.log('leaveOutRoom', result);
          if (result) {
            var findIndex = this.rooms.findIndex(
              (r) => r._id == this.activeRoom._id,
            );
            this.rooms.splice(findIndex, 1);
            this.messages = [];
            this.activeRoom = null;

            this.$nextTick(function () {
              this.$forceUpdate();
            });
          }
        });
      }
    },
    sendMessage(message) {
      if (!message) return;

      const payload = {
        syncKey: new Date().getTime().toString(),
        roomId: this.activeRoom._id,
        content: message,
      };
      this.messages.push({
        _id: null,
        syncKey: payload.syncKey,
        roomId: this.activeRoom._id,
        author: {
          authorId: this.me._id,
        },
        data: {
          type: 'TEXT',
          content: {
            text: message
          },
        },
      });
      this.$socket.emit('sendMessage', payload, (data) => {
        //console.log(data);
      });
      this.text = null;
    },
    uploadFileAction(e) {
      // console.log(e.target.files);
      this.fileReader = new FileReader();
      let file = e.target.files[0];
      // console.log(file.type);
      // return;
      if (file) {
        this.tempFile = file;
        this.messageKey = new Date().getTime();
        const messagePayload = {
          _id: null,
          syncKey: this.messageKey,
          roomId: this.activeRoom._id,
          author: {
            authorId: this.me._id,
          },
          progress: 0,
          data: {
            type: 'FILE',
            content: null,
          },
        };
        this.messages.push(messagePayload);
        this.scrollToBottom();
        const maxSizeForSlice = Math.min(this.tempFile.size, this.splicedSize);
        let slice = this.tempFile.slice(0, maxSizeForSlice, file.type);
        this.sendFileMessage(slice);
      }
    },
    async uploadFile(file) {
      console.log(file.size);
      const sizeInMB = +(Math.ceil(file.size / (1000 * 1000) + 'e+1') + 'e-1');
      const splitsBy1mb = Math.ceil(file.size / (1000 * 1000));
      console.log('splitsBy1mb', splitsBy1mb);

      const splicedSize = 1000 * 1000;
      var files = [];
      for (var i = 0; i < splitsBy1mb; i++) {
        var start = i * splicedSize;
        let slicedFile = file.slice(
          start,
          start + Math.min(splicedSize, file.size - start),
          file.type,
        );
        files.push(slicedFile);
      }
      console.log(files);
      const form = new FormData();
      form.append('files', files);
      const res = await axios.post('http://localhost:3000/chat/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log(res);
    },
    sendFileMessage(slice) {
      this.fileReader.readAsArrayBuffer(slice);
      this.fileReader.onload = () => {
        var arrayBuffer = this.fileReader.result;
        var type = 'FILE';
        if (this.tempFile.type.startsWith('image/')) {
          type = 'PHOTO';
        } else if (this.tempFile.type.startsWith('video/')) {
          type = 'VIDEO';
        }
        this.$socket.emit(
          'sendFileMessage',
          {
            syncKey: this.messageKey,
            data: arrayBuffer,
            type: type,
            size: this.tempFile.size,
            name: this.tempFile.name,
            roomId: this.activeRoomId,
          },
          (data) => {
            console.log('currentSlice', data);
            var result = data.data;
            if (result && result.slice) {
              var offset = result.slice * this.splicedSize;
              var slice = this.tempFile.slice(
                offset,
                offset +
                  Math.min(this.splicedSize, this.tempFile.size - offset),
                this.tempFile.type,
              );
              this.sendFileMessage(slice);
            }
          },
        );

        this.sockets.subscribe(`progress_${this.messageKey}`, (progress) => {
          // console.log(progress);
          var idx = this.messages.findIndex(
            (m) => m.syncKey == this.messageKey,
          );
          if (idx > -1) {
            this.messages[idx].progress = progress;
          }
        });
      };
    },
    updateReadMessage(lastMessage) {
      // console.log(lastMessage);
      if (lastMessage) {
        const payload = {
          roomId: this.activeRoom._id,
          messageId: lastMessage._id,
        };
        this.$socket.emit('updateReadMessage', payload);
      }
    },
    kickOutUser(targetUser) {
      if (targetUser._id == this.me._id) {
        alert('자기자신은 제외할 수 없습니다.');
        return;
      }
      const payload = {
        roomId: this.activeRoomId,
        targetUserIds: [targetUser._id],
      };
      this.$socket.emit('kickOutUsers', payload, (data) => {
        console.log(data);
        if (data) {
          //success
        }
      });
    },
    async sendVideoMessage(event, data) {
      console.info('sendVideoMessage: ', event);
      return new Promise((rs, rj) => {
        this.$socket.emit(event, data, (result) => {
          rs(result);
        });
      });
    },
    createRoom() {
      if (this.form.title) {
        this.sendVideoMessage('CreateRoomEvent', { title: this.form.title });
      }
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}

.container {
  /* max-width: 1170px;
  margin: auto; */
}
img {
  max-width: 100%;
}
.inbox_people {
  background: #f8f8f8 none repeat scroll 0 0;
  /* float: left; */
  overflow: hidden;
  /* width: 40%; */
  width: 300px;
  border-right: 1px solid #c4c4c4;
}
.inbox_msg {
  border: 1px solid #c4c4c4;
  clear: both;
  overflow: hidden;
}
.top_spac {
  margin: 20px 0 0;
}

.recent_heading {
  /* float: left; */
  width: 40%;
}
.srch_bar {
  display: inline-block;
  text-align: right;
  width: 60%;
}
.headind_srch {
  padding: 10px 29px 10px 20px;
  overflow: hidden;
  border-bottom: 1px solid #c4c4c4;
}

.recent_heading h4 {
  color: #05728f;
  font-size: 21px;
  margin: auto;
}
.srch_bar input {
  border: 1px solid #cdcdcd;
  border-width: 0 0 1px 0;
  width: 80%;
  padding: 2px 0 4px 6px;
  background: none;
}
.srch_bar .input-group-addon button {
  background: rgba(0, 0, 0, 0) none repeat scroll 0 0;
  border: medium none;
  padding: 0;
  color: #707070;
  font-size: 18px;
}
.srch_bar .input-group-addon {
  margin: 0 0 0 -27px;
}

.chat_ib h5 {
  font-size: 15px;
  color: #464646;
  margin: 0 0 8px 0;
}
.chat_ib h5 span {
  font-size: 13px;
  float: right;
}
.chat_ib .info {
  font-size: 14px;
  color: #989898;
  margin: auto;
}
.chat_img {
  float: left;
  width: 11%;
}
.chat_ib {
  float: left;
  padding: 0 0 0 15px;
  width: 88%;
}

.chat_people {
  overflow: hidden;
  clear: both;
}
.chat_list {
  border-bottom: 1px solid #c4c4c4;
  margin: 0;
  padding: 18px 16px 10px;
}
.inbox_chat {
  height: 550px;
  overflow-y: scroll;
}

.active_chat {
  background: #ebebeb;
}

.incoming_msg_img {
  display: inline-block;
  width: 6%;
}
.received_msg {
  display: inline-block;
  padding: 0 0 0 10px;
  vertical-align: top;
  width: 92%;
}
.received_withd_msg_center {
  display: inline-block;
  text-align: center;
  background: #ebebeb none repeat scroll 0 0;
}
.received_withd_msg p {
  background: #ebebeb none repeat scroll 0 0;
  border-radius: 3px;
  color: #646464;
  font-size: 14px;
  margin: 0;
  padding: 5px 10px 5px 12px;
  width: 100%;
}
.time_date {
  color: #747474;
  display: block;
  font-size: 12px;
  margin: 8px 0 0;
}
.received_withd_msg {
  width: 200px;
}
.mesgs {
  /* float: left; */
  /* padding: 30px 15px 0 25px; */
  /* width: 60%; */
  /* display: flex; */
}

.sent_msg p {
  background: #05728f none repeat scroll 0 0;
  border-radius: 3px;
  font-size: 14px;
  margin: 0;
  color: #fff;
  padding: 5px 10px 5px 12px;
  width: 100%;
}
.outgoing_msg {
  overflow: hidden;
  margin: 26px 0 26px;
}
.sent_msg {
  float: right;
  max-width: 200px;
  /* width: 46%; */
}
.input_msg_write input {
  background: rgba(0, 0, 0, 0) none repeat scroll 0 0;
  border: medium none;
  color: #4c4c4c;
  font-size: 15px;
  min-height: 48px;
  width: 100%;
}
.input_msg_write input:disabled {
  background-color: #ddd;
}

.type_msg {
  border-top: 1px solid #c4c4c4;
  position: relative;
}
.msg_send_btn {
  background: #05728f none repeat scroll 0 0;
  border: medium none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  font-size: 17px;
  height: 33px;
  position: absolute;
  right: 0;
  top: 11px;
  width: 33px;
}
.messaging {
  padding: 0 0 50px 0;
}
.msg_history {
  /* height: 585px; */
  height: 70vh;
  overflow-y: auto;
  padding: 0 10px;
}
.msg_history > div .active{
  border: 2px solid blue;
}

.message_list {
  flex: 1;
}
.user_list {
  width: 300px;
  border-left: 1px solid;
  box-sizing: border-box;
  /* margin-left: 10px; */
  /* padding: 10px; */
}
.user_list img {
  width: 34px;
  margin-right: 3px;
}

/*  */
#video-preview {
  position: fixed;
  width: 200px;
  height: 220px;
  right: 50px;
  top: 100px;
}
.video_preview {
  width: 200px;
  height: 200px;
}
</style>
