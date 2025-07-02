import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useGameStore } from './store/game'
import GameSocket from './socket'
import naive from 'naive-ui'   // 这一行
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(naive) 
// Pinia store 必须在 app.use(pinia) 之后才能获取
const gameStore = useGameStore()

// Socket.IO 初始化
const socket = new GameSocket('http://localhost:3000');

// 将 socket 和 router 实例注入到 store 中
socket.socket.on('connect', () => {
    gameStore.initSocket(socket);
    gameStore.setRouter(router);
  });

router.afterEach((to) => {
  document.title = to.meta.title || import.meta.env.VITE_APP_TITLE || '默认标题';
});

app.mount('#app')