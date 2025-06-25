import { ref } from 'vue';

export function useSound(src, options = { volume: 0.5 }) {
  const audio = ref(new Audio(src));
  audio.value.volume = options.volume;

  const play = () => {
    // 允许在用户有交互后重复播放声音
    audio.value.currentTime = 0;
    audio.value.play().catch(err => {
        // 自动播放策略可能会阻止播放，这在用户首次与页面交互前很常见
        console.warn('Audio play failed:', err);
    });
  };

  return { play };
}
