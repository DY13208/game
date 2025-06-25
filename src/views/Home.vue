<template>
  <div class="home-view">
    <n-card class="main-card">
      <h1 class="title">GO GO GO 出发咯!!</h1>
      <n-space vertical size="large">
        <n-input v-model:value="playerName" placeholder="请输入你的昵称" size="large" class="main-input" />
        <n-tabs type="line" animated v-model:value="activeTab" justify-content="center">
          <n-tab-pane name="create" tab="创建房间">
            <n-space vertical align="center" style="width: 100%;">
              <n-alert title="创建新游戏" type="info" :show-icon="false">
                你将成为房主，可以邀请朋友加入。
              </n-alert>
              <n-button type="primary" size="large" block class="main-btn" @click="handleCreateRoom" :disabled="!playerName">
                立即创建
              </n-button>
            </n-space>
          </n-tab-pane>
          <n-tab-pane name="join" tab="加入房间">
            <n-space vertical>
              <n-input v-model:value="roomIdToJoin" placeholder="请输入6位房间号" :maxlength="6" size="large" class="main-input" />
              <n-button type="primary" size="large" block class="main-btn" @click="handleJoinRoom" :disabled="!playerName || !roomIdToJoin">
                加入房间
              </n-button>
            </n-space>
          </n-tab-pane>
        </n-tabs>
        <n-button type="info" block class="main-btn" @click="handleShowRules">游戏规则</n-button>
        <n-modal v-model:show="showRules" preset="dialog" title="游戏规则" :mask-closable="true" :closable="true" @close="handleHideRules">
          <div style="padding:8px 0 0 0;">
            <p style="font-weight:bold;">欢迎来到这个紧张刺激的推理游戏！</p>
            <ul style="margin:0 0 0 1.2em;padding:0;line-height:1.8;">
              <li>游戏开始时，每位玩家 secretly 指定一个"毒点心"。</li>
              <li>玩家轮流选择并"吃掉"一个点心。</li>
              <li>如果一位玩家吃到了自己指定的毒点心，他将立刻出局。</li>
              <li>最后存活下来的玩家获得胜利！</li>
            </ul>
          </div>
        </n-modal>
      </n-space>
    </n-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useGameStore } from '@/store/game';
import { useMessage } from 'naive-ui';
import { 
  NInput, NTabs, NTabPane, NButton, 
  NAlert, NModal 
} from 'naive-ui';

const game = useGameStore();
const message = useMessage();

const playerName = ref('');
const roomIdToJoin = ref('');
const activeTab = ref('create');

const showRules = ref(false);
const handleShowRules = () => { showRules.value = true; };
const handleHideRules = () => { showRules.value = false; };

const handleCreateRoom = () => {
  if (!playerName.value) {
    message.error('请输入一个昵称！');
    return;
  }
  game.socket.createRoom({ playerName: playerName.value });
};

const handleJoinRoom = () => {
  if (!playerName.value || !roomIdToJoin.value) {
    message.error('请输入昵称和6位房间号！');
    return;
  }
  game.socket.joinRoom({
    roomId: roomIdToJoin.value.toUpperCase(),
    playerName: playerName.value,
  });
};
</script>

<style scoped>
.home-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e0e5ec 100%);
}

.main-card {
  width: 100%;
  max-width: 420px;
  border-radius: 18px;
  background: #f7f9fb;
  box-shadow: 0 4px 24px #e0e5ec, 0 1.5px 4px #c8d0e7;
  padding: 36px 32px 32px 32px;
  margin: 32px 0;
}

.title {
  text-align: center;
  font-size: 2.2em;
  color: #18a058;
  margin-bottom: 32px;
  letter-spacing: 2px;
  font-weight: 700;
}

.main-input {
  border-radius: 8px;
  background: #fff;
}

.main-btn {
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 1px;
  margin-top: 0.5em;
}

@media (max-width: 600px) {
  .main-card {
    padding: 18px 6px 18px 6px;
    max-width: 98vw;
  }
  .title {
    font-size: 1.4em;
  }
}
</style>