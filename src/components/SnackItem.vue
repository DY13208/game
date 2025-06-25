<script setup>
import { computed, ref } from 'vue';
import { useGameStore } from '@/store/game';
import { useSound } from '@/composables/useSound.js';

const props = defineProps({
  index: {
    type: Number,
    required: true
  },
  snackStyle: {
    type: String,
    default: 'default'
  },
  isEaten: {
    type: Boolean,
    default: false
  },
  eatenBy: {
    type: String,
    default: ''
  },
  selectable: {
    type: Boolean,
    default: false
  },
  isPoison: {
    type: Boolean,
    default: false
  },
  revealed: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);

const game = useGameStore();
const { play: playSound } = useSound();

const isRevealedPoison = computed(() => {
  return props.isPoison && (game.isGameOver || props.revealed);
});

const onEat = () => {
  if (props.selectable) {
    playSound();
    emit('click');
  }
};

const snackContent = computed(() => {
  // 优先使用自定义图片
  if (game.settings.customImageUrls && game.settings.customImageUrls.length > 0) {
    return game.settings.customImageUrls[props.index] || '/snacks/fallback.png';
  }
  // 其次使用 Emoji
  if (game.settings.emojis && game.settings.emojis.length > 0) {
    return game.settings.emojis[props.index] || '❓';
  }
  // 最后使用默认图片
  return `/snacks/default/${props.index + 1}.png`;
});

const isImage = computed(() => {
    if (game.settings.customImageUrls && game.settings.customImageUrls.length > 0) {
        return true;
    }
    if (game.settings.emojis && game.settings.emojis.length > 0) {
        return false;
    }
    return true;
});

const fallbackEmoji = ref(false);
const handleImageError = (event) => {
  fallbackEmoji.value = true;
  event.target.style.display = 'none';
};
</script>

<template>
  <div 
    class="snack-item" 
    :class="{ 'is-eaten': isEaten, 'is-poison': isRevealedPoison, 'selectable': selectable }" 
    @click="onEat"
  >
    <div class="snack-content">
      <template v-if="isEaten">
        <span class="eaten-x">✖</span>
      </template>
      <template v-else-if="isImage && !fallbackEmoji">
        <img :src="snackContent" @error="handleImageError" class="snack-image" draggable="false" />
      </template>
      <template v-else-if="fallbackEmoji">
        <span class="snack-emoji">❓</span>
      </template>
      <template v-else>
        <span class="snack-emoji">{{ snackContent }}</span>
      </template>
    </div>
    <div v-if="isRevealedPoison" class="poison-overlay">
      <span class="poison-icon">☠️</span>
    </div>
    <div v-if="eatenBy" class="eaten-by-avatar">
      {{ eatenBy.charAt(0) || '?' }}
    </div>
    <slot name="cover"></slot>
  </div>
</template>

<style scoped>
.snack-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  cursor: pointer;
  perspective: 1000px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

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

.eaten-x {
  font-size: 48px;
  color: #e74c3c;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>