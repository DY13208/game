<script setup>
import { ref, watch, computed, nextTick } from 'vue';
import { useGameStore } from '@/store/game';
import { NGrid, NGi, NForm, NFormItem, NSelect, NSlider, NSwitch, NInputNumber, NUpload, NText } from 'naive-ui';
import { useMessage } from 'naive-ui';

const game = useGameStore();
const message = useMessage();

const localSettings = ref({});

// 监听 store 中 settings 的变化，同步到本地
watch(() => game.settings, async (newSettings) => {
    console.log('RoomPanel: game.settings changed:', newSettings);
    // 增加一个保护，确保 newSettings 是一个有内容的有效对象
    if (newSettings && newSettings.maxPlayers) {
        console.log('RoomPanel: updating localSettings from:', localSettings.value, 'to:', newSettings);
        localSettings.value = JSON.parse(JSON.stringify(newSettings));
        // 使用 nextTick 确保 DOM 更新
        await nextTick();
        console.log('RoomPanel: localSettings after nextTick:', localSettings.value);
    }
}, { deep: true, immediate: true });

// 创建一个统一的处理函数，当任何设置项被用户主动修改时调用
const handleSettingsChange = () => {
    if (game.isHost) {
        console.log('RoomPanel: Host updating settings:', localSettings.value);
        // v-model 已经更新了 localSettings 的值
        // 我们在这里把更新后的整个设置对象发给服务器
        game.socket.emit('room:update_settings', localSettings.value);
    }
};

const fileList = ref([]); // for custom image upload

const snackStyleOptions = [
  { label: '默认图片', value: 'default' },
  { label: '食物 Emoji', value: 'food' },
  { label: '动物 Emoji', value: 'animals' },
  { label: '交通工具 Emoji', value: 'transport' },
  { label: '物品 Emoji', value: 'objects' },
  { label: '自定义图片', value: 'custom' },
];

const playerOptions = Array.from({ length: 6 }, (_, i) => ({ label: `${i + 2}人`, value: i + 2 }));
const snackCountOptions = [
  { label: '6个', value: 6 },
  { label: '8个', value: 8 },
  { label: '10个', value: 10 },
  { label: '12个', value: 12 },
  { label: '14个', value: 14 },
  { label: '16个', value: 16 },
];

const handleUploadFinish = ({ file, event }) => {
  // ... (上传逻辑)
};

// 监听玩家数量变化，自动更新毒药数量
watch(() => localSettings.value.maxPlayers, (newMaxPlayers) => {
    localSettings.value.poisonCount = newMaxPlayers;
    handleSettingsChange();
});

// 暴露当前设置给父组件
defineExpose({
  getCurrentSettings: () => localSettings.value
});

</script>

<template>
  <div class="room-settings-panel" v-if="game.roomId && localSettings.maxPlayers">
    <n-form :model="localSettings" :disabled="!game.isHost">
      <n-grid :x-gap="24" :y-gap="12" :cols="2">
         <n-gi>
            <n-form-item label="游戏人数" path="maxPlayers">
                <n-select v-model:value="localSettings.maxPlayers" :options="playerOptions" @update:value="handleSettingsChange" />
            </n-form-item>
        </n-gi>
        <n-gi>
            <n-form-item label="点心总数" path="snackCount">
                <n-select v-model:value="localSettings.snackCount" :options="snackCountOptions" @update:value="handleSettingsChange" />
            </n-form-item>
        </n-gi>
        <n-gi :span="2">
            <n-form-item label="毒药数量" path="poisonCount">
                 <n-slider v-model:value="localSettings.poisonCount" :min="1" :max="10" :disabled="true" />
                 <template #help>毒药数量将自动设置为玩家人数（{{ localSettings.maxPlayers }}个），每人一个毒药。</template>
            </n-form-item>
        </n-gi>
        <n-gi>
            <n-form-item label="点心风格" path="snackStyle">
                <n-select v-model:value="localSettings.snackStyle" :options="snackStyleOptions" @update:value="handleSettingsChange" />
            </n-form-item>
        </n-gi>
        
        <n-gi :span="2" v-if="localSettings.snackStyle === 'custom'">
            <n-form-item label="上传图片">
                <n-upload
                    action="http://localhost:3000/upload"
                    v-model:file-list="fileList"
                    list-type="image-card"
                    multiple
                    accept="image/*"
                    name="snacks"
                    :max="100"
                    @finish="handleUploadFinish"
                >
                 点击上传
                </n-upload>
                <template #help>
                    <n-text depth="3">请确保上传的图片数量不少于"点心总数" ({{ localSettings.snackCount }})。</n-text>
                </template>
            </n-form-item>
        </n-gi>

        <n-gi>
             <n-form-item label="开启回合计时器(秒)" path="turnTimer">
                <n-input-number v-model:value="localSettings.turnTimer" :min="0" placeholder="0为不开启" @update:value="handleSettingsChange" />
            </n-form-item>
        </n-gi>
        <n-gi>
            <n-form-item label="显示历史记录" path="showHistory">
                <n-switch v-model:value="localSettings.showHistory" @update:value="handleSettingsChange" />
            </n-form-item>
        </n-gi>
      </n-grid>
    </n-form>
  </div>
</template>

<style scoped>
  /* 可以在这里添加特定于此面板的样式 */
</style>