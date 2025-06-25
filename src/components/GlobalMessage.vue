<!-- components/GlobalMessage.vue -->
<script setup>
import { watch } from 'vue'
import { useMessage, useNotification } from 'naive-ui'
import { useGameStore } from '@/store/game'

const message = useMessage()
const notification = useNotification()
const game = useGameStore()

watch(() => game.message, (newMessage) => {
  if (newMessage) {
    if (newMessage.type === 'error') {
      message.error(newMessage.content)
    } else if (newMessage.type === 'success') {
      message.success(newMessage.content)
    } else if (newMessage.type === 'info') {
      notification.info({ title: '通知', content: newMessage.content })
    }
    game.message = null
  }
})
</script>

<template>
  <div style="display: none;" />
</template>
