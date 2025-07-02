import { createRouter, createWebHashHistory } from 'vue-router'
import { useGameStore } from '@/store/game';
import { h, render } from 'vue';
// import NicknameDialog from '@/components/NicknameDialog.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '主页' }
  },
  {
    path: '/preparation',
    name: 'Preparation',
    component: () => import('../views/Preparation.vue'),
    meta: { title: '准备阶段' }
  },
  {
    path: '/battle',
    name: 'Battle',
    component: () => import('../views/Battle.vue'),
    meta: { title: '战斗阶段' }
  },
  {
    path: '/settlement',
    name: 'Settlement',
    component: () => import('../views/Settlement.vue'),
    meta: { title: '结算阶段' }
  },
  {
    path: '/join/:roomId',
    name: 'JoinRoom',
    component: () => import('../views/Join.vue'),
    meta: { title: '加入房间' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router 