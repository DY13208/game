<script setup>
import { watch } from 'vue';
import { useMessage, useNotification } from 'naive-ui';
import { useGameStore } from '@/store/game';

// 这个组件是 <n-message-provider> 的子组件，所以可以安全地调用 useMessage
const message = useMessage();
const notification = useNotification();
const game = useGameStore();

// 监听来自 store 的消息，并使用 Naive UI 显示
watch(() => game.message, (newMessage) => {
  if (newMessage) {
    if (newMessage.type === 'error') {
      message.error(newMessage.content, { duration: 5000 });
    } else if (newMessage.type === 'success') {
      message.success(newMessage.content, { duration: 3000 });
    }
    // 处理完后立即重置，防止重复显示
    game.message = null;
  }
}, { deep: true });

// 监听重连状态
watch(() => game.isReconnecting, (isReconnecting) => {
    if (isReconnecting) {
        notification.info({
            title: '网络连接中断',
            content: '正在尝试重新连接服务器...',
            duration: 5000,
        });
    }
});
</script>

<template>
  <!-- 这是一个功能性组件，不需要渲染任何 DOM -->
</template> 