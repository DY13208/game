<script setup>
import { NMessageProvider, NNotificationProvider, NDialogProvider, NConfigProvider } from 'naive-ui';
import { defineComponent } from 'vue';

// Naive UI 主题配置
const themeOverrides = {
  // 可以在这里覆盖默认主题变量
};
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-dialog-provider>
      <n-notification-provider>
        <n-message-provider>
          <slot></slot>
        </n-message-provider>
      </n-notification-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>
