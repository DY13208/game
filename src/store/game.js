import { defineStore } from 'pinia';

export const useGameStore = defineStore('game', {
  state: () => ({
    socket: null,
    router: null,
    roomId: null,
    isHost: false,
    players: [],
    currentPlayerId: null,
    playerId: null,
    settings: {
      maxPlayers: 2,
      snackCount: 6,
      poisonCount: 1,
      snackStyle: 'default',
      turnTimer: 0,
      showHistory: true,
      emojis: [],
      customImageUrls: [],
    },
    snacks: [],
    eatenSnacks: [],
    gameState: {},
    gameStatus: 'waiting',
    isMyTurn: false,
    isGameOver: false,
    winner: null,
    winnerId: null,
    poisonChoices: {},
    history: [],
    isReconnecting: false,
    message: null, 
  }),
  getters: {
    getPlayer: (state) => (playerId) => {
      return state.players.find(p => p.id === playerId);
    }
  },
  actions: {
    setRouter(routerInstance) {
        this.router = routerInstance;
    },

    initSocket(socketInstance) {
        this.socket = socketInstance;
        this.playerId = socketInstance.socket.id;
        this.listenToEvents();
    },

    listenToEvents() {
      if (!this.socket) return;
      console.log('Setting up event listeners...');

      this.socket.onRoomCreated((data) => {
        this.roomId = data.roomId;
        this.players = data.players;
        this.settings = data.settings;
        this.isHost = true;
        this.router.push('/preparation');
      });

      this.socket.onRoomJoined((data) => {
        this.roomId = data.roomId;
        this.players = data.players;
        this.settings = data.settings;
        this.isHost = data.isHost;
        this.router.push('/preparation');
      });

      this.socket.onSettingsUpdated((newSettings) => {
        console.log('Store: received settings update:', newSettings);
        console.log('Store: current settings before update:', this.settings);
        this.settings = newSettings;
        console.log('Store: settings after update:', this.settings);
      });

      this.socket.onPlayerListUpdated((players) => {
        this.players = players;
      });

      console.log('Setting up onGameStarted listener...');
      this.socket.onGameStarted((data) => {
        console.log('Game started event received:', data);
        this.snacks = data.snacks;
        this.eatenSnacks = [];
        this.poisonChoices = {};
        this.gameState = data.gameState;
        this.gameStatus = data.gameState.status;
        if (data.settings) {
          this.settings = data.settings;
        }
        this.isGameOver = false;
        this.winner = null;
        this.history = [];
        console.log('About to navigate to battle page');
        this.router.push('/battle');
      });

      console.log('Setting up onAllPrepared listener...');
      this.socket.onAllPrepared((data) => {
        console.log('收到all:prepared', data);
        this.currentPlayerId = data.firstPlayerId;
        this.isMyTurn = data.firstPlayerId === this.playerId;
        this.gameStatus = 'playing';
      });

      this.socket.onGameTurn((data) => {
        this.currentPlayerId = data.nextPlayerId;
        this.isMyTurn = data.nextPlayerId === this.playerId;
        this.gameStatus = 'playing';
        this.eatenSnacks.push({
          snackIndex: data.eatenSnackIndex,
          eaterId: data.eaterId
        });
        this.history.push({
          player: data.eaterId,
          action: `吃掉了点心 #${data.eatenSnackIndex + 1}`,
          time: new Date().toLocaleTimeString(),
          isPoison: false
        });
      });

      this.socket.onGameStateUpdated((data) => {
        this.snacks = data.snacks;
        this.gameState = data.gameState;
        this.isMyTurn = data.gameState.currentPlayer === this.socket.id;
        this.history.push(data.lastAction);
      });

      this.socket.onGameOver((data) => {
        this.isGameOver = true;
        this.winner = data.winner;
        this.winnerId = data.winner;
        this.gameStatus = 'ended';
        this.poisonChoices = data.poisonChoices;
        this.snacks = data.poisonSnacks.map(s => ({...s, isPoison: true}));
        this.router.push('/settlement');
      });
      
      this.socket.onReconnectAttempt(() => {
        this.isReconnecting = true;
      });

      this.socket.onReconnectSuccess(() => {
        this.isReconnecting = false;
        this.message = { type: 'success', content: '重新连接成功！' };
      });

       this.socket.onError((error) => {
        this.message = { type: 'error', content: error.message || '发生未知错误' };
      });
    },
    
    fullReset() {
      const socket = this.socket;
      const router = this.router;
      this.$reset();
      this.socket = socket;
      this.router = router;
    },

    resetGame() {
      this.snacks = [];
      this.eatenSnacks = [];
      this.gameState = {};
      this.gameStatus = 'waiting';
      this.isMyTurn = false;
      this.isGameOver = false;
      this.winner = null;
      this.winnerId = null;
      this.poisonChoices = {};
      this.history = [];
    }
  },
});