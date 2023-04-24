export enum RoomType {
  SYSTEM_ALARM = 'SYSTEM_ALARM',
  ALARM = 'ALARM',
  GROUP = 'GROUP',
  INQUIRY = 'INQUIRY',
}

export enum MessageType {
  TEXT = 'TEXT',
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  CARD = 'CARD',
  ADMIN = 'ADMIN',
  ANNOUNCE = 'ANNOUNCE',
}

export enum MessageEventType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

//! deprecated
export enum MessageCardType {
  PRODUCT_DRAWING = 'PRODUCT_DRAWING',

  //deprecated
  PRODUCT_DRAWING_WINNER = 'PRODUCT_DRAWING_WINNER',
  PRODUCT_DRAWING_LOSER = 'PRODUCT_DRAWING_LOSER',

  PRODUCT_DRAWING_WINNER_RANDOM = 'PRODUCT_DRAWING_WINNER_RANDOM',
  PRODUCT_DRAWING_LOSER_RANDOM = 'PRODUCT_DRAWING_LOSER_RANDOM',

  PRODUCT_DRAWING_WINNER_CONFIRMED_FCFS = 'PRODUCT_DRAWING_WINNER_CONFIRMED_FCFS', //선착순일때 확정된 카드
  PRODUCT_DRAWING_WINNER_FCFS = 'PRODUCT_DRAWING_WINNER_FCFS',
  PRODUCT_DRAWING_LOSER_FCFS = 'PRODUCT_DRAWING_LOSER_FCFS',
  //수업신청후 추첨결과 나오기전 카드
  PRODUCT_DRAWING_APPLIED_RANDOM = 'PRODUCT_DRAWING_APPLIED_RANDOM',
  // 랜덤 신청 탈락 알림
  PRODUCT_DRAWING_FAILED_RANDOM = 'PRODUCT_DRAWING_FAILED_RANDOM',
  //선착순 신청 탈락 알림
  PRODUCT_DRAWING_FAILED_FCFS = 'PRODUCT_DRAWING_FAILED_FCFS',

  LINK_INVITATION = 'LINK_INVITATION',
  ZOOM_LINK = 'ZOOM_LINK',
  REGISTER_CONFIRM = 'REGISTER_CONFIRM',
  ADVERTISEMENT = 'ADVERTISEMENT',
}

export enum MessageTemplateType {
  card_type_1 = 'card_type_1',
  text_type_1 = 'text_type_1',
  admin_type_1 = 'admin_type_1',
  photo_type_1 = 'photo_type_1',
  video_type_1 = 'video_type_1',
  file_type_1 = 'file_type_1',
  announce_type_1 = 'announce_type_1',
}

export enum MessageTemplateButtonAction {
  none = 'none',
  screen = 'screen',
  web = 'web',
  api = 'api',
  alert = 'alert',
}

export enum ChatEvents {
  UpdateRoomSetting = 'updateRoomSetting',
  UpdateMessage = 'updateMessage',
  UpdateReadMessage = 'updateReadMessage',

  ListenRoom = 'listenRoom', //deprecated!
  UpdatedRoom = 'updatedRoom',

  CreateRoom = 'createNewRoom',
  QueryRoom = 'QueryRoom', //
  ListenRooms = 'listenRooms',
  UpdateRoomLastMessage = 'updateRoomLastMessage',
  QueryMessagesByRoom = 'listenMessagesByRoom', //deprecated
  GetMessagesByRoom = 'getMessagesByRoom',
  SearchMessagesByRoom = 'searchMessagesByRoom',

  JoinRoom = 'joinRoom',
  LeaveRoom = 'leaveRoom',
  LeaveOutRoom = 'leaveOutRoom',
  KickOutUsers = 'kickOutUsers',
  InviteUsers = 'inviteRoom',
  SendTextMessage = 'sendMessage',
  SendFileMessage = 'sendFileMessage',
  SendAnnounceMessage = 'sendAnnounceMessage',
  RoomAlarmTurnOnOff = 'roomAlarmTurnOnOff',
  AddAnnouncement = 'addAnnouncement',
}

export enum ChatEmitEvents {
  ListenRoom = 'listenRoom',
}

export enum ChatErrorCodes {
  CLIENT_ID_NOT_EXISTS = 'CLIENT_ID_NOT_EXISTS',
  ROOM_NO_EXISTS = 'ROOM_NO_EXISTS', // 계정은 이미 링크 회원입니다.
  YOU_ARE_NO_JOINED_ROOM = 'YOU_ARE_NO_JOINED_ROOM',
  YOU_HAVE_NO_AUTHORIZATION = 'YOU_HAVE_NO_AUTHORIZATION',
  FAILED_LEAVEOUT_USERS = 'FAILED_LEAVEOUT_USERS',
  EMPTY_TARGET_USERS = 'EMPTY_TARGET_USERS',
  MESSAGE_NO_EXISTS = 'MESSAGE_NO_EXISTS',
  MESSAGE_IS_NOT_MINE = 'MESSAGE_IS_NOT_MINE',
}

export enum PlatformApiErrorCodes {
  CLIENT_ID_NOT_EXISTS = 'CLIENT_ID_NOT_EXISTS',
  ROOM_ALREADY_EXISTS = 'ROOM_ALREADY_EXISTS',
  ROOM_NO_EXISTS = 'ROOM_NO_EXISTS',
  INVITER_ID_IS_NOT_MASTER = 'INVITER_ID_IS_NOT_MASTER',
  JOIN_USERS_EMPTY = 'JOIN_USERS_EMPTY',
  ROOM_IS_FREEZED_CAN_NOT_BE_CHANGED = 'ROOM_IS_FREEZED_CAN_NOT_BE_CHANGED',
  ROOM_RULES_CAN_NOT_INVITE_MEMBERS = 'ROOM_RULES_CAN_NOT_INVITE_MEMBERS',
  MISSING_PAYLOAD = 'MISSING_PAYLOAD',
}

export enum ChatAdminEventMsg {
  ROOM_CREATED = '채팅방이 생성되었습니다.',
}

export enum CompareOperator {
  $GT = '$gt',
  $GTE = '$gte',
  $LT = '$lt',
  $LTE = '$lte',
}

export enum OrderbyOperator {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum CardButtonAction {
  Link = 'link',
  Product = 'product',
  Webview = 'webview',
}

export enum OrderBy {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum FreezingReasonCode {
  MASTER_LEFT = 'MASTER_LEFT',
}
