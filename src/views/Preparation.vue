<script setup>
import { computed, ref } from 'vue';
import { useGameStore } from '@/store/game';
import { NCard, NList, NListItem, NButton, NSpace, NTag, NInputGroup, NInput, useMessage, NTabs, NTabPane } from 'naive-ui';
import RoomPanel from '@/components/RoomPanel.vue';
import QrcodeVue from 'qrcode.vue';

const game = useGameStore();
const message = useMessage();

const canStartGame = computed(() => {
  // 至少需要2个玩家才能开始
  return game.isHost && game.players.length >= 2;
});

const startGame = () => {
  console.log('startGame called, canStartGame:', canStartGame.value, 'roomId:', game.roomId);
  if (canStartGame.value) {
    console.log('Calling socket.startGame with roomId:', game.roomId);
    game.socket.startGame(game.roomId);
  }
};

const inviteUrl = computed(() => {
  return `${window.location.origin}/#/join/${game.roomId}`;
});

const copyRoomId = async () => {
  await navigator.clipboard.writeText(game.roomId);
  message.success('房间号已复制');
};

const copyInviteUrl = async () => {
  await navigator.clipboard.writeText(inviteUrl.value);
  message.success('邀请链接已复制');
};

const onLeaveRoom = () => {
  game.socket.emit('room:leave');
};

const renameDialogVisible = ref(false);
const newName = ref('');
const selfId = computed(() => game.playerId);

const showRenameDialog = () => {
  newName.value = '';
  renameDialogVisible.value = true;
};
const confirmRename = () => {
  if (newName.value.trim()) {
    localStorage.setItem('playerName', newName.value.trim());
    game.socket.emit('room:rename', { roomId: game.roomId, playerId: selfId.value, newName: newName.value.trim() });
    renameDialogVisible.value = false;
    message.success('昵称修改成功');
  }
};
const kickPlayer = (playerId) => {
  game.socket.emit('room:kick', { roomId: game.roomId, playerId });
};

const shareTab = ref('qrcode');
</script>

<template>
  <div class="preparation-view">
    <n-card class="main-panel">
      <template #header>
        <div style="display:flex;align-items:center;gap:12px;">
          <span>房间号: <b>{{ game.roomId }}</b></span>
          <n-button size="small" @click="showRenameDialog">改名</n-button>
        </div>
      </template>
      <n-tabs v-model:value="shareTab" type="line" animated style="margin: 12px 0 20px 0;">
        <n-tab-pane name="qrcode" tab="二维码邀请">
          <div style="text-align:center;">
            <qrcode-vue
              :value="inviteUrl"
              :size="120"
              :level="'H'"
              :bg-color="'#fff'"
              :fg-color="'#2d8cf0'"
              :render-as="'svg'"
              style="border-radius:12px;box-shadow:0 2px 8px #0001;cursor:pointer;"
              @click="copyInviteUrl"
            />
            <div style="font-size:12px;color:#2d8cf0;cursor:pointer;" @click="copyInviteUrl">
              点击二维码复制邀请链接
            </div>
          </div>
        </n-tab-pane>
        <n-tab-pane name="roomid" tab="房间号">
          <n-input-group>
            <n-input :value="game.roomId" readonly />
            <n-button @click="copyRoomId">复制房间号</n-button>
          </n-input-group>
        </n-tab-pane>
        <n-tab-pane name="link" tab="邀请链接">
          <n-input-group>
            <n-input :value="inviteUrl" readonly />
            <n-button @click="copyInviteUrl">复制邀请链接</n-button>
          </n-input-group>
        </n-tab-pane>
      </n-tabs>
      <p style="color: red; font-weight: bold; text-align: center; margin-bottom: 1rem;">
        [诊断信息] 当前是否为房主: {{ game.isHost }} | 玩家数量: {{ game.players.length }} | 可以开始游戏: {{ canStartGame }}
      </p>
      <div class="content-wrapper">
        <div class="settings-panel">
          <h2>房间设置</h2>
          <room-panel />
        </div>
        <div class="player-list-panel">
          <h2>玩家列表 ({{ game.players.length }} / {{ game.settings.maxPlayers }})</h2>
          <n-list bordered>
            <n-list-item v-for="player in game.players" :key="player.id">
              <n-space justify="space-between">
                <span>
                  <n-tag v-if="player.isHost" type="success" size="small" style="margin-right:4px;">房主</n-tag>
                  {{ player.name }}
                  <span v-if="player.id === selfId">（你）</span>
                </span>
                <n-space>
                  <n-button v-if="game.isHost && player.id !== selfId" size="small" type="error" @click="kickPlayer(player.id)">踢出</n-button>
                </n-space>
              </n-space>
            </n-list-item>
          </n-list>
        </div>
      </div>
      <template #footer>
        <n-space vertical>
          <n-button v-if="game.isHost" type="primary" size="large" block @click="startGame" :disabled="!canStartGame">
            开始游戏
          </n-button>
          <div v-else class="waiting-text">
            等待房主开始游戏...
          </div>
          <n-button size="large" block @click="onLeaveRoom" style="margin-top:8px;">退出房间</n-button>
        </n-space>
      </template>
      <n-modal v-model:show="renameDialogVisible" preset="dialog" title="修改昵称" :mask-closable="false">
        <n-input v-model:value="newName" placeholder="请输入新昵称" @keyup.enter="confirmRename" />
        <template #action>
          <n-button type="primary" @click="confirmRename" :disabled="!newName">确定</n-button>
        </template>
      </n-modal>
    </n-card>
  </div>
</template>

<style scoped>
.preparation-view {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  min-height: 100vh;
}
.main-panel {
  max-width: 900px;
  width: 100%;
}
.content-wrapper {
  display: flex;
  gap: 24px;
}
.settings-panel {
  flex: 2;
}
.player-list-panel {
  flex: 1;
}
h2 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.2em;
}
.waiting-text {
  text-align: center;
  color: #888;
}
@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
  }
}
</style>