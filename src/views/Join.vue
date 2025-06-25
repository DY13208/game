<template>
  <div class="join-view">
    <n-card class="join-card">
      <h2 class="title">加入房间 {{ roomId }}</h2>
      <div v-if="hasPlayerName" class="loading-text">
        <n-spin size="small" />
        <p>正在使用昵称 <strong>{{ playerName }}</strong> 加入房间...</p>
      </div>
      <n-space v-else vertical size="large">
        <p>请输入你的昵称以加入游戏：</p>
        <n-input v-model:value="newPlayerName" placeholder="请输入你的昵称" size="large" @keyup.enter="handleJoinRoom" />
        <n-button type="primary" size="large" block @click="handleJoinRoom" :disabled="!newPlayerName">
          确认加入
        </n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '@/store/game';
import { NCard, NInput, NButton, NSpace, NSpin } from 'naive-ui';

const route = useRoute();
const router = useRouter();
const game = useGameStore();

const roomId = ref(route.params.roomId);
const playerName = ref(localStorage.getItem('playerName') || '');
const newPlayerName = ref('');
const hasPlayerName = computed(() => !!playerName.value);

const handleJoinRoom = () => {
  const nameToJoin = playerName.value || newPlayerName.value;
  if (!nameToJoin) return;

  localStorage.setItem('playerName', nameToJoin);
  game.socket.joinRoom({
    roomId: roomId.value,
    playerName: nameToJoin,
  });
  // 之后由 socket 的 onRoomJoined 事件来处理跳转
};

onMounted(() => {
  if (hasPlayerName.value) {
    handleJoinRoom();
  }
});
</script>

<style scoped>
.join-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e0e5ec 100%);
}
.join-card {
  width: 100%;
  max-width: 400px;
  padding: 24px;
  border-radius: 12px;
}
.title {
  text-align: center;
  margin-bottom: 24px;
}
.loading-text {
  text-align: center;
  padding: 20px 0;
}
</style> 