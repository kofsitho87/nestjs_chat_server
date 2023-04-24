import Vue from 'vue'
import store from './store'
import { createProvider } from './vue-apollo'
import VueSocketIO from 'vue-socket.io'
import SocketIO from 'socket.io-client'

import vueMoment from 'vue-moment'
import 'moment/locale/ko'

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(vueMoment)

Vue.config.productionTip = false


import App from './App.vue'
// import Rtc from './Rtc.vue'
import Rtc from './Rtc2.vue'
import VueMoment from 'vue-moment'

const cookies = document.cookie.split(";")
let token = ''
for(let cookie of cookies){
  const val = cookie.trim().split("=")
  if(val){
    if(val[0] === 'auth._token.apollo'){
      token = val[1]
    }
  }
}

localStorage.setItem("token", token);

const options = {
  reconnectionDelay: 1500,
  reconnection: true,
  rememberUpgrade: false,
  autoConnect: false,
  withCredentials: false,
  transports: ["websocket"],
  auth: {
    token: token,
  }
};
var querySplits = location.search.split("=");
var port = querySplits[1] || 3000;
Vue.use(new VueSocketIO({
  debug: true,
  // connection: SocketIO(`http://localhost:${port}/rtc`, options),
  connection: SocketIO(`http://localhost:${port}/chat`, options),
  // connection: SocketIO(`http://192.168.2.82:3000/chat`, options),
  // connection: SocketIO(`https://dev-chat.dingdongu.com/chat`, options),
  // connection: SocketIO(`https://staging-chat-new.dingdongu.com/chat`, options),
}));

new Vue({
  apolloProvider: createProvider(),
  store,
  render: h => h(App)
  // render: h => h(Rtc)
}).$mount('#app')
