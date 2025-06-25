<script setup>
import { RouterView } from 'vue-router';
import { 
  NMessageProvider, 
  NNotificationProvider, 
  NDialogProvider, 
  NConfigProvider 
} from 'naive-ui';
import GlobalMessageHandler from './components/GlobalMessageHandler.vue';
</script>

<template>
  <n-config-provider>
    <n-notification-provider>
      <n-message-provider>
        <n-dialog-provider>
          <RouterView />
          <global-message-handler />
        </n-dialog-provider>
      </n-message-provider>
    </n-notification-provider>
  </n-config-provider>
</template>

<style>
/* 一些基础的全局样式 */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  background-color: #f8f8fa;
  color: #333;
}
</style>