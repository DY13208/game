import { createRouter, createWebHashHistory } from 'vue-router'
import { useGameStore } from '@/store/game';
import { h, render } from 'vue';
// import NicknameDialog from '@/components/NicknameDialog.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/preparation',
    name: 'Preparation',
    component: () => import('../views/Preparation.vue')
  },
  {
    path: '/battle',
    name: 'Battle',
    component: () => import('../views/Battle.vue')
  },
  {
    path: '/settlement',
    name: 'Settlement',
    component: () => import('../views/Settlement.vue')
  },
  {
    path: '/join/:roomId',
    name: 'JoinRoom',
    component: () => import('../views/Join.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router 