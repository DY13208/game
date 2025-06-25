import { io } from 'socket.io-client'
import { useGameStore } from '../store/game'

export default class GameSocket {
  socket;

  constructor(uri) {
    this.socket = io(uri, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }

  // --- Emitting events ---

  createRoom(settings) {
    this.socket.emit('room:create', settings);
  }

  joinRoom(payload) {
    this.socket.emit('room:join', payload);
  }

  startGame(roomId) {
    this.socket.emit('game:start', roomId);
  }

  eatSnack(roomId, snackIndex) {
    this.socket.emit('game:eat-snack', { roomId, snackIndex });
  }

  // 添加通用的 emit 方法
  emit(event, data) {
    this.socket.emit(event, data);
  }

  // --- Listening to events ---

  onRoomCreated(callback) {
    this.socket.on('room:created', callback);
  }

  onRoomJoined(callback) {
    this.socket.on('room:joined', callback);
  }
  
  onSettingsUpdated(callback) {
    this.socket.on('room:settings_updated', callback);
  }

  onPlayerListUpdated(callback) {
    this.socket.on('room:player_list_updated', callback);
  }

  onGameStarted(callback) {
    console.log('Setting up game:started event listener');
    this.socket.on('game:started', (data) => {
      console.log('Raw game:started event received:', data);
      callback(data);
    });
  }

  onAllPrepared(callback) {
    console.log('Setting up all:prepared event listener');
    this.socket.on('all:prepared', (data) => {
      console.log('Raw all:prepared event received:', data);
      callback(data);
    });
  }

  onGameTurn(callback) {
    this.socket.on('game:turn', callback);
  }

  onGameStateUpdated(callback) {
    this.socket.on('game:state_updated', callback);
  }

  onGameOver(callback) {
    this.socket.on('game:over', (data) => {
      console.log('收到 game:over', data);
      callback(data);
    });
  }

  onError(callback) {
    this.socket.on('server_error', callback);
  }

  onReconnectAttempt(callback) {
    this.socket.io.on('reconnect_attempt', callback);
  }

  onReconnectSuccess(callback) {
    this.socket.io.on('reconnect', callback);
  }
} 