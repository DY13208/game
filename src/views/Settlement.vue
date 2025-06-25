<template>
  <div class="settlement">
    <n-card class="result-card" :bordered="false">
      <template #header>
        <div class="result-header" :class="isDraw ? 'draw' : (isWinner ? 'winner' : 'loser')">
          <n-icon size="48">
            <TrophyOutline v-if="isWinner && !isDraw" />
            <SadOutline v-else-if="!isWinner && !isDraw" />
            <span v-else style="font-size:48px;">🤝</span>
          </n-icon>
          <h1>
            <template v-if="isDraw">平局</template>
            <template v-else-if="isWinner">恭喜胜利！</template>
            <template v-else>惜败</template>
          </h1>
        </div>
      </template>

      <n-text>
        <template v-if="isDraw">
          本局无人吃到毒点心，游戏平局！
        </template>
        <template v-else-if="isWinner">
          玩家 {{ loserName }} 吃到了你下的毒！
        </template>
        <template v-else>
          你吃到了玩家 {{ winnerName }} 的毒点心！
        </template>
      </n-text>

      <n-divider />

      <n-card title="游戏回放" embedded :bordered="false" content-style="padding: 10px;">
         <div class="replay-grid">
            <snack-item
              v-for="i in store.settings.snackCount"
              :key="i"
              :index="i - 1"
              :snack-style="store.settings.snackStyle"
              :is-eaten="isSnackEaten(i - 1)"
              :eaten-by="getEatenByPlayerName(i - 1)"
              :is-poison="isPoisonSnack(i - 1)"
              :revealed="true"
              :selectable="false"
            >
              <template #cover>
                  <div v-if="isPoisonSnack(i-1)" class="poison-owner">
                      {{ getPoisonOwnerName(i-1) }}'s ☠️
                  </div>
              </template>
            </snack-item>
          </div>
      </n-card>

      <template #footer>
        <n-space justify="center" size="large">
          <n-button
            type="primary"
            size="large"
            :disabled="!isHost || waitingRestart"
            @click="onPlayAgain"
          >
            再来一局
          </n-button>
          <n-button size="large" @click="backToHome">返回首页</n-button>
          <n-button size="large" @click="onLeaveRoom" style="margin-left:8px;">退出房间</n-button>
        </n-space>
        <div v-if="!isHost" class="waiting-text">等待房主开始新一局...</div>
      </template>
    </n-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../store/game';
import SnackItem from '../components/SnackItem.vue';
import { TrophyOutline, SadOutline } from '@vicons/ionicons5';
import { useSound } from '../composables/useSound';

const router = useRouter();
const store = useGameStore();

const { play: playWinSound } = useSound('/sounds/win.mp3');
const { play: playLoseSound } = useSound('/sounds/lose.mp3');

const isDraw = computed(() => store.gameStatus === 'ended' && (!store.winnerId || store.isDraw));
const isWinner = computed(() => store.winnerId === store.playerId && !isDraw.value);
const isHost = computed(() => store.isHost);
const waitingRestart = ref(false);

const winnerName = computed(() => {
    const player = store.players.find(p => p.id === store.winnerId);
    return player ? player.name : '胜利者';
});

const loserName = computed(() => {
    const player = store.players.find(p => p.id && p.id !== store.winnerId);
    return player ? player.name : '失败者';
});

const isSnackEaten = (index) => {
  return store.eatenSnacks.some(s => s.snackIndex === index);
};

const getEatenByPlayerName = (index) => {
  const eatenRecord = store.eatenSnacks.find(s => s.snackIndex === index);
  if (!eatenRecord) return '';
  const player = store.players.find(p => p.id === eatenRecord.eaterId);
  return player ? player.name : '??';
};

const isPoisonSnack = (index) => {
    return Object.values(store.poisonChoices).includes(index);
};

const getPoisonOwnerName = (index) => {
    const ownerId = Object.keys(store.poisonChoices).find(
        (playerId) => store.poisonChoices[playerId] === index
    );
    const owner = store.players.find(p => p.id === ownerId);
    return owner ? owner.name : '';
};

const onPlayAgain = () => {
  if (!isHost.value) return;
  waitingRestart.value = true;
  store.socket.emit('game:restart', store.roomId);
};

const backToHome = () => {
  store.fullReset();
  router.push('/');
};

const onLeaveRoom = () => {
  store.socket.emit('room:leave');
};

function handleGameStarted() {
  waitingRestart.value = false;
  store.resetGame();
  router.push('/preparation');
}

function handleForceEnded() {
  store.resetGame();
  router.push('/preparation');
}

function handleRoomLeft() {
  store.fullReset();
  router.push('/');
}

onMounted(() => {
    if (isDraw.value) return;
    if (isWinner.value) {
        playWinSound();
    } else {
        playLoseSound();
    }
    store.socket.socket.on('game:started', handleGameStarted);
    store.socket.socket.on('game:force-ended', handleForceEnded);
    store.socket.socket.on('room:left', handleRoomLeft);
});

onBeforeUnmount(() => {
    store.socket.socket.off('game:started', handleGameStarted);
    store.socket.socket.off('game:force-ended', handleForceEnded);
    store.socket.socket.off('room:left', handleRoomLeft);
});

if (store.players.length === 0) {
    router.replace('/');
}
</script>

<style scoped>
.settlement {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 10px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.result-card {
  width: 100%;
  max-width: 800px;
  text-align: center;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}
.result-header.winner { color: #52c41a; }
.result-header.loser { color: #f5222d; }
.result-header.draw { color: #888; }

.result-header h1 {
  margin: 0;
  font-size: 1.8em;
}

.replay-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.poison-owner {
    position: absolute;
    top: 2px;
    left: 4px;
    font-size: 10px;
    font-weight: bold;
    color: white;
    background-color: rgba(0,0,0,0.5);
    padding: 1px 4px;
    border-radius: 4px;
}

@media (min-width: 768px) {
    .result-header h1 {
        font-size: 2.5em;
    }
    .replay-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 16px;
    }
}

/* 响应式样式 */
@media (max-width: 600px) {
  .settlement-view {
    padding: 20px 12px;
  }

  .winner-announcement {
    font-size: 28px;
  }

  .poison-reveal-grid {
    gap: 8px;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  }
}
</style> 