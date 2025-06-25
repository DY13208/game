<template>
  <div class="battle">
    <!-- 调试信息 -->
    <p style="color:red;text-align:center;font-size:14px;margin:8px 0;">
      [调试] 状态: {{ store.gameStatus }} | 当前回合: {{ store.currentPlayerId }} | 我的ID: {{ store.playerId }}
    </p>
    
    <n-layout>
      <n-layout-header class="header">
        <n-space justify="space-between" align="center">
          <n-tag :type="isMyTurn ? 'success' : 'default'" size="large">
            <template v-if="store.gameStatus === 'preparing'">
              请选择你要下毒的点心
            </template>
            <template v-else>
              {{ isMyTurn ? "你的回合" : `等待 ${currentPlayerName} 操作...` }}
              <n-text v-if="store.settings.turnTimer && isMyTurn"> ({{ timeLeft }}s)</n-text>
            </template>
          </n-tag>
          <div class="players-bar">
            <n-tag
              v-for="player in store.players"
              :key="player.id"
              :type="player.id === store.currentPlayerId ? 'primary' : 'default'"
              round
            >
              {{ player.name }}
            </n-tag>
          </div>
        </n-space>
      </n-layout-header>
      <n-layout-content class="content">
        <n-grid :x-gap="12" :y-gap="8" :cols="store.settings.showHistory && store.gameStatus === 'playing' ? '1 768:2' : '1'">
          <n-grid-item>
             <n-card :title="store.gameStatus === 'preparing' ? '选择毒点心' : '点心阵列'" content-style="padding: 10px;">
              <!-- 等待提示 -->
              <div v-if="store.gameStatus === 'preparing'" class="waiting-notice">
                <n-alert type="info" :show-icon="false">
                  <template #header>
                    等待所有玩家选择毒点心...
                  </template>
                  <template #default>
                    请点击下方点心选择你要下毒的位置。当所有玩家都选择完毕后，游戏将自动开始。
                  </template>
                </n-alert>
              </div>
              <div class="snacks-grid">
                <template v-if="store.gameStatus === 'preparing'">
                  <snack-item
                    v-for="i in store.settings.snackCount"
                    :key="i"
                    :index="i - 1"
                    :snack-style="store.settings.snackStyle"
                    :is-eaten="isSnackEaten(i - 1)"
                    :eaten-by="getEatenByPlayerName(i - 1)"
                    :selectable="true"
                    @click="handleSelectPoison(i - 1)"
                  />
                </template>
                <template v-else>
                  <snack-item
                    v-for="i in store.settings.snackCount"
                    :key="i"
                    :index="i - 1"
                    :snack-style="store.settings.snackStyle"
                    :is-eaten="isSnackEaten(i - 1)"
                    :eaten-by="getEatenByPlayerName(i - 1)"
                    :selectable="isMyTurn && !isSnackEaten(i - 1)"
                    @click="handleEatSnack(i - 1)"
                  />
                </template>
              </div>
            </n-card>
          </n-grid-item>
          <n-grid-item v-if="store.settings.showHistory && store.gameStatus === 'playing'">
            <n-card title="历史记录" content-style="padding: 10px;">
              <n-timeline>
                <n-timeline-item
                  v-for="(record, index) in history"
                  :key="index"
                  :type="record.isPoison ? 'error' : 'success'"
                  :title="`${record.player} ${record.action}`"
                  :time="record.time"
                />
              </n-timeline>
            </n-card>
          </n-grid-item>
        </n-grid>
      </n-layout-content>
    </n-layout>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../store/game';
import gameSocket from '../socket';
import SnackItem from '../components/SnackItem.vue';
import { useSound } from '../composables/useSound';
import { NAlert } from 'naive-ui';

const router = useRouter();
const store = useGameStore();
const { play: playEatSound } = useSound('/sounds/eat.mp3');
const { play: playTurnSound } = useSound('/sounds/turn.mp3');

const timeLeft = ref(30);
const history = ref([]);
let timer = null;

const currentPlayerName = computed(() => {
  const player = store.players.find(p => p.id === store.currentPlayerId);
  return player ? player.name : '';
});

const isMyTurn = computed(() => store.currentPlayerId === store.playerId);

const isSnackEaten = (index) => {
  return store.eatenSnacks.some(s => s.snackIndex === index);
};

const getEatenByPlayerName = (index) => {
  const eatenRecord = store.eatenSnacks.find(s => s.snackIndex === index);
  if (!eatenRecord) return '';
  const player = store.players.find(p => p.id === eatenRecord.eaterId);
  return player ? player.name : '??';
};

const handleEatSnack = (index) => {
  if (!isMyTurn.value || isSnackEaten(index)) return;
  playEatSound();
  store.socket.eatSnack(store.roomId, index);
};

const handleSelectPoison = (index) => {
  if (store.gameStatus !== 'preparing') return;
  store.socket.emit('game:set-poison', { roomId: store.roomId, snackIndex: index });
};

const addToHistory = (eaterId, snackIndex) => {
    const player = store.players.find(p => p.id === eaterId);
    if(player) {
        history.value.unshift({
            player: player.name,
            action: `吃掉了点心 #${snackIndex + 1}`,
            time: new Date().toLocaleTimeString(),
            isPoison: false // 这个逻辑在后端判断，前端只做展示
        });
    }
}

watch(() => store.eatenSnacks, (newEatenSnacks, oldEatenSnacks) => {
    if (newEatenSnacks.length > oldEatenSnacks.length) {
        const lastEaten = newEatenSnacks[newEatenSnacks.length - 1];
        addToHistory(lastEaten.eaterId, lastEaten.snackIndex);
    }
}, { deep: true });

watch(isMyTurn, (newTurn, oldTurn) => {
    if (newTurn && oldTurn !== undefined) { // oldTurn check prevents playing on initial load
        playTurnSound();
    }
    if (newTurn && store.settings.turnTimer) {
        timeLeft.value = 30;
        if (timer) clearInterval(timer);
        timer = setInterval(() => {
            if (timeLeft.value > 0) {
                timeLeft.value--;
            } else {
                clearInterval(timer);
                // 时间到，自动选择一个
                const availableSnacks = Array.from({ length: store.settings.snackCount }, (_, i) => i)
                    .filter(i => !isSnackEaten(i));
                if (availableSnacks.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableSnacks.length);
                    handleEatSnack(availableSnacks[randomIndex]);
                }
            }
        }, 1000);
    } else {
        if (timer) clearInterval(timer);
    }
}, { immediate: true });

// 监听游戏状态变化，如果结束则跳转
watch(() => store.gameStatus, (status) => {
  if (status === 'ended') {
    if (timer) clearInterval(timer);
    router.push('/settlement');
  }
});

onUnmounted(() => {
    if(timer) clearInterval(timer);
});

// 如果没有玩家信息，可能是中途加入或刷新，则跳回主页
if (store.players.length === 0) {
    router.replace('/');
}
</script>

<style scoped>
.battle {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f2f5 0%, #d6e4f0 100%);
  padding: 0 8px;
}

.header {
  padding: 8px 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.players-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.content {
  padding: 12px;
  max-width: 900px;
  margin: 0 auto;
}

.waiting-notice {
  margin-bottom: 16px;
}

.snacks-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 12px;
  overflow-x: auto;
}

@media (max-width: 900px) {
  .snacks-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (max-width: 600px) {
  .snacks-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .content {
    padding: 4px;
  }
}

.snack-item {
  width: 100%;
  aspect-ratio: 1/1;
  min-width: 0;
  min-height: 0;
  /* 保持原有动画和样式 */
}

/* 保留原有的动画和细节样式 */
.snack-item:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}
.snack-item.selectable:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}
.snack-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.snack-image {
  width: 70%;
  height: 70%;
  object-fit: contain;
}
.snack-emoji {
  font-size: 48px;
  line-height: 1;
}
.snack-item.is-eaten {
  transform: scale(0);
  opacity: 0;
  cursor: default;
  transition: transform 0.5s cubic-bezier(0.55, 0.06, 0.68, 0.19), opacity 0.5s ease;
}
.poison-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(139, 0, 0, 0.7);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: reveal 0.4s ease-out;
}
.poison-icon {
  font-size: 40px;
  transform: scale(1.5);
  animation: pulse 1s infinite;
}
.eaten-by-avatar {
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 24px;
  height: 24px;
  background-color: #333;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid white;
}
@keyframes reveal {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes pulse {
  0% { transform: scale(1.5); }
  50% { transform: scale(1.7); }
  100% { transform: scale(1.5); }
}
</style>