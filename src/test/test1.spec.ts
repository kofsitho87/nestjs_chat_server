import * as io from 'socket.io-client';

const jsonUser = {
  master: false,
  meta: null,
  nickName: 'json',
  _id: '611afe7cffbc61795890e7b5',
};
const cookieUser = {
  master: false,
  meta: null,
  nickName: 'sadfasdf',
  _id: '6065754500b0c4b7248fc002',
};

const room = {
  _id: '619d8b2656f9ba3a7d5b35e2',
};

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxZTkxZmRiMmVlOWQwNjU0MjYyY2NhMCIsImlkZW50aXR5IjoiczFAcy5jb20iLCJuYW1lIjoic2h3Iiwia2VlcCI6dHJ1ZSwidHlwZSI6IkFDQ09VTlQiLCJ0b2tlblR5cGUiOiJBQ0NFU1MiLCJpYXQiOjE2NDgxNzcyNDMsImV4cCI6MTY0ODI2MzY0M30.ICLmppOFv4B2LCJ_QJ-QcqxEr92pWoBkIdAgOPnZLZc';

describe('my awesome project', () => {
  let clientSocket: io.Socket;
  // const chatEndPoint = 'https://chat.dingdongu.com/chat';
  const chatEndPoint = 'ws://localhost:3000/chat';
  // const chatEndPoint = 'wss://dev-chat.dingdongu.com/chat';
  beforeAll((done) => {
    clientSocket = io.connect(chatEndPoint, {
      auth: {
        token: token,
      },
    });
    clientSocket.on('connect', () => {
      console.log('connected!');
      done();
    });
  });

  afterAll(() => {
    // io.close();
    clientSocket.disconnect();
    clientSocket.close();
  });

  // test('listenToUpdateMessageFromKafka', (done) => {
  //   const payload = {
  //     messageId: '623983e8830fdd378c66c571',
  //     data: {
  //       type: 'CARD',
  //       content: {
  //         rawData: {
  //           cardType: 'LINK_INVITATION',
  //           link: {
  //             sid: 'link.sid',
  //             name: 'link.name',
  //             profileUrl: 'link.additionalFields?.ICON_IMAGE',
  //           },
  //           acceptedStatus: true,
  //         },
  //       },
  //     },
  //   };
  //   clientSocket.emit('test', payload, (response) => {
  //     expect(response).toBe(true);
  //     done();
  //   });
  // });

  // test('sendTextMessage', (done) => {
  //   const payload = {
  //     syncKey: new Date().getTime().toString(),
  //     roomId: room._id,
  //     content: 'send Message!',
  //   };

  //   // clientSocket.on('listenRoom', (roomData) => {
  //   //   expect(roomData.lastMessage.syncKey).toBe(payload.syncKey);
  //   //   // console.log(roomData);
  //   //   done();
  //   // });

  //   clientSocket.emit('joinRoom', payload.roomId, (response) => {
  //     expect(response.success).toBe(true);
  //     if (response.success == false) {
  //       done();
  //     }

  //     clientSocket.emit('sendMessage', payload, (response) => {
  //       expect(response.success).toBe(true);
  //       done();
  //       // console.log(response);
  //       // expect(rooms).toBeCalledWith(expect.any(Array));
  //     });
  //   });
  // });

  // test('queryRooms', (done) => {
  //   const payload = {
  //     roomType: 'ALARM',
  //     linkSid: 'gayaelement',
  //     // masterUser: false,
  //   };
  //   clientSocket.emit('listenRooms', payload, (response) => {
  //     console.log(response.data.list[0].joinUsers);

  //     expect(response.data.list).toBeInstanceOf(Array);
  //     expect(typeof response.data.list[0].unReadMsgCount).toBe('number');
  //     done();
  //   });
  // });

  // test('queryRoom', (done) => {
  //   const payload = {
  //     roomId: '619d8b2656f9ba3a7d5b35e2',
  //   };
  //   clientSocket.emit('QueryRoom', payload, (response) => {
  //     // console.log(response.data);
  //     expect(response.success).toBe(true);
  //     expect(response.data).toBeInstanceOf(Object);
  //     expect(typeof response.data._id).toBe('string');
  //     done();
  //   });
  // });

  // test('queryRoom2', (done) => {
  //   const payload = {
  //     roomId: '619d8b2656f9ba3a7d5b35e2',
  //   };
  //   clientSocket.emit('listenRoom', payload, (response) => {
  //     // console.log(response.data);
  //     expect(response.success).toBe(true);
  //     expect(response.data).toBeInstanceOf(Object);
  //     expect(typeof response.data._id).toBe('string');
  //     done();
  //   });
  // });

  // test('InviteUsers', (done) => {
  //   clientSocket.on('updateRoomLastMessage', (room) => {
  //     // expect(room.joinUsers.length).toBe(6);
  //     console.log(room.joinUsers.length);
  //     done();
  //   });
  //   const payload = {
  //     roomId: '619d8b2656f9ba3a7d5b35e2',
  //     joinUsers: [jsonUser, cookieUser],
  //   };
  //   clientSocket.emit('inviteRoom', payload, (response) => {
  //     expect(response.success).toBe(true);
  //     // console.log(response);
  //     if (response.success == false) {
  //       done();
  //     }
  //   });
  // });

  // test('KickOutUsers', (done) => {
  //   clientSocket.on('updateRoomLastMessage', (room) => {
  //     // expect(room.joinUsers.length).toBe(4);
  //     console.log(room.joinUsers.length);
  //     done();
  //   });
  //   const payload = {
  //     roomId: '619d8b2656f9ba3a7d5b35e2',
  //     targetUserIds: [jsonUser._id, cookieUser._id],
  //   };
  //   clientSocket.emit('kickOutUsers', payload, (response) => {
  //     // console.log(response);
  //     expect(response.success).toBe(true);
  //     if (response.success == false) {
  //       done();
  //     }
  //   });
  // });

  // test('queryMessagesByRoom', (done) => {
  //   const payload = {
  //     roomId: '619d8b2656f9ba3a7d5b35e2',
  //   };
  //   clientSocket.emit('listenMessagesByRoom', payload, (response) => {
  //     expect(response.success).toBe(true);
  //     expect(response.data.list).toBeInstanceOf(Array);
  //     expect(response.data.list[0]).toBeInstanceOf(Object);
  //     expect(
  //       ['TEXT', 'VIDEO', 'FILE', 'PHOTO', 'ADMIN'].includes(
  //         response.data.list[0].data.type,
  //       ),
  //     ).toBe(true);
  //     done();
  //   });
  // });

  // test('getMessagesByRoom', (done) => {
  //   const payload = {
  //     roomId: '619d8b2656f9ba3a7d5b35e2',
  //   };
  //   clientSocket.emit('getMessagesByRoom', payload, (response) => {
  //     expect(response.success).toBe(true);
  //     // console.log(response.success);
  //     // console.log(response.data);
  //     done();
  //   });
  // });

  // test('searchMessagesByRoom', (done) => {
  //   const payload = {
  //     roomId: '62317bceabcc55a7e1afec8f',
  //     messageType: 'ANNOUNCE',
  //   };
  //   clientSocket.emit('searchMessagesByRoom', payload, (response) => {
  //     expect(response.success).toBe(true);
  //     expect(response.data).not.toBe(null);
  //     done();
  //   });
  // });

  // test('updateRoomSetting', (done) => {
  //   const isFreezed = false;
  //   clientSocket.on('listenRoom', (room) => {
  //     expect(room.rules.isFreezed).toBe(isFreezed);
  //     // console.log(room);
  //     done();
  //   });

  //   clientSocket.emit('joinRoom', room._id, (response) => {
  //     expect(response.success).toBe(true);
  //     if (response.success == false) {
  //       done();
  //     }
  //   });

  //   const payload = {
  //     roomId: room._id,
  //     updateData: {
  //       rules: {
  //         canCopyMessage: true,
  //         canCaptureMessage: true,
  //         canDeleteMessage: false,
  //         canShareMessage: true,
  //         canShowMemberList: true,
  //         isFreezed: isFreezed,
  //         canInviteMemebrs: true,
  //         canLeaveOutRoom: true,
  //       },
  //     },
  //   };
  //   clientSocket.emit('updateRoomSetting', payload, (response) => {
  //     expect(response.success).toBe(true);
  //     // console.log(response);
  //     if (response.success == false) {
  //       done();
  //     }
  //   });
  // });

  // test('roomAlarmTurnOnOff', (done) => {
  //   const roomAlarmPayload = {
  //     roomId: room._id,
  //     turnOn: true,
  //   };
  //   clientSocket.emit('roomAlarmTurnOnOff', roomAlarmPayload, (response) => {
  //     expect(response.success).toBe(true);
  //     done();
  //   });
  // });

  // test('addAnnouncement', (done) => {
  //   const payload: CreateAnnouncementDto = {
  //     syncKey: new Date().getTime().toString(),
  //     roomId: room._id,
  //     content: 'Announce!',
  //     authorId: cookieUser._id,
  //   };

  //   clientSocket.emit('joinRoom', payload.roomId, (response) => {
  //     expect(response.success).toBe(true);
  //     if (response.success == false) {
  //       done();
  //     }

  //     clientSocket.emit('addAnnouncement', payload, (response) => {
  //       expect(response.success).toBe(true);
  //       done();
  //       // console.log(response);
  //       // expect(rooms).toBeCalledWith(expect.any(Array));
  //     });
  //   });
  // });

  test('updateMessage', (done) => {
    const payload = {
      messageId: '623d12168b9dcb19f5dfb575',
      data: {
        type: 'TEXT',
        content: {},
      },
    };
    clientSocket.emit('updateMessage', payload, (response) => {
      if (response.success) {
        expect(response.data).not.toBe(null);
      } else {
        expect(response.error).toBe('MESSAGE_IS_NOT_MINE');
      }
      done();
    });
  });
});
