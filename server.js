const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // 在生产环境中应配置为前端地址
    methods: ["GET", "POST"]
  }
});

// -- 文件上传设置 --
// 确保 uploads 目录存在
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// 配置 multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 设置 uploads 文件夹为静态资源目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 文件上传路由
app.post('/upload', upload.array('snacks', 100), (req, res) => {
  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }
  // 生成可访问的 URL 列表
  const fileUrls = req.files.map(file => {
    // 假设服务器运行在 localhost:3000
    return `http://localhost:3000/uploads/${file.filename}`;
  });
  res.json({ urls: fileUrls });
});
// -- 文件上传设置结束 --

const EMOJI_THEMES = {
    food: [
        '🍎', '🍇', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍑', '🍓', '🥝', '🍅', 
        '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🧄', '🧅', 
        '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', 
        '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🥙', '🧆', '🌮', '🌯', 
        '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', 
        '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', 
        '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🧃', '🥤', '🍶'
    ],
    animals: [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
        '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
        '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️'
    ],
    transport: [
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛',
        '🚜', '🛴', '🚲', '🛵', '🏍️', '🛺', '✈️', '🛫', '🛬', '🚀', '🛸', '🚁',
        '🛶', '⛵️', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓️', '⛽️', '🚧', '🚦', '🚥'
    ],
    objects: [
        '⌚️', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '💽', '💾', '💿', '📀', 'VCR',
        '📷', '📸', '📹', '🎥', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️',
        '🧭', '⏰', '🕰️', '⌛️', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🗑️'
    ]
};

const rooms = {}; // 存放所有房间信息
const ALLOWED_SNACK_COUNTS = [6, 8, 10, 12, 14, 16];

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // 创建房间
  socket.on('room:create', (data) => {
    const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // 使用默认设置
    const settings = {
      maxPlayers: 2,
      snackCount: 16,
      poisonCount: 2, // 根据maxPlayers设置
      snackStyle: 'default',
      turnTimer: 0,
      showHistory: true,
      emojis: [],
      customImageUrls: [],
    };
    
    // 如果是 emoji 模式，根据主题生成 emoji 列表
    const themeKey = settings.snackStyle;
    if (EMOJI_THEMES[themeKey]) {
        const themeEmojis = EMOJI_THEMES[themeKey];
        const shuffled = [...themeEmojis].sort(() => 0.5 - Math.random());
        settings.emojis = shuffled.slice(0, settings.snackCount);
    }

    rooms[roomId] = {
      id: roomId,
      settings: settings, 
      players: [],
      gameState: {
        status: 'waiting',
        poisonChoices: {}, // { playerId: poisonSnackIndex }
        eatenSnacks: [],
        currentPlayerIndex: 0
      }
    };
    
    const player = { id: socket.id, name: data.playerName, isHost: true };
    rooms[roomId].players.push(player);
    socket.join(roomId);

    socket.emit('room:created', { roomId, players: rooms[roomId].players, settings: rooms[roomId].settings });
  });

  // 新增：更新房间设置
  socket.on('room:update_settings', (newSettings) => {
    const room = findRoomBySocketId(socket.id);
    if (room && room.players.find(p => p.id === socket.id && p.isHost)) {
      // 只有房主能修改设置
      console.log(`Server: Host ${socket.id} updating settings in room ${room.id}:`, newSettings);
      
      // 处理 emoji 生成
      const themeKey = newSettings.snackStyle;
      if (EMOJI_THEMES[themeKey] && newSettings.snackStyle !== room.settings.snackStyle) {
        const themeEmojis = EMOJI_THEMES[themeKey];
        const shuffled = [...themeEmojis].sort(() => 0.5 - Math.random());
        newSettings.emojis = shuffled.slice(0, newSettings.snackCount);
      } else if (newSettings.snackStyle === 'custom') {
        // 自定义图片URL由客户端处理
        newSettings.emojis = [];
      } else if (newSettings.snackStyle === 'default') {
        newSettings.emojis = [];
      }
      
      room.settings = newSettings;
      console.log(`Server: Broadcasting settings update to room ${room.id}:`, room.settings);
      io.to(room.id).emit('room:settings_updated', room.settings);
    }
  });

  // 加入房间
  socket.on('room:join', (data) => {
    const { roomId, playerName } = data;
    const room = rooms[roomId];
    
    if (room && room.players.length < room.settings.maxPlayers) {
      if (room.players.some(p => p.name === playerName)) {
        socket.emit('server_error', { message: '该昵称已被使用，请换一个。' });
        return;
      }
      const newPlayer = { id: socket.id, name: playerName, isHost: false };
      room.players.push(newPlayer);
      socket.join(roomId);

      // 1. 单独通知加入者，让他拿到所有房间信息并跳转页面
      socket.emit('room:joined', { 
        roomId: room.id, 
        players: room.players, 
        settings: room.settings,
        isHost: false 
      });

      // 2. 向房间里的所有人（包括刚加入的）广播最新的玩家列表
      io.to(roomId).emit('room:player_list_updated', room.players);
    } else {
      socket.emit('server_error', { message: '房间不存在或已满。' });
    }
  });
  
  // 游戏开始（由房主触发）
  socket.on('game:start', (data) => {
    let roomId = typeof data === 'object' ? data.roomId : data;
    const room = rooms[roomId];
    if (room && room.players[0].id === socket.id) { // 只有房主能开始
      // 强制同步 snackCount
      if (typeof data === 'object' && data.snackCount && ALLOWED_SNACK_COUNTS.includes(data.snackCount)) {
        room.settings.snackCount = data.snackCount;
      }
      room.gameState.status = 'preparing';
      // 根据实际玩家数量设置毒药数量
      room.settings.poisonCount = room.players.length;
      // 限制点心数量
      if (!ALLOWED_SNACK_COUNTS.includes(room.settings.snackCount)) {
        room.settings.snackCount = 8;
      }
      // 生成点心数据
      const snacks = [];
      for (let i = 0; i < room.settings.snackCount; i++) {
        snacks.push({
          id: i + 1,
          index: i,
          isEaten: false,
          eatenBy: null
        });
      }
      const gameStartedData = { 
        roomId: roomId,
        snacks: snacks,
        gameState: room.gameState,
        settings: room.settings  // 添加最新的设置
      };
      io.to(roomId).emit('game:started', gameStartedData);
    }
  });

  // 玩家选择毒点心
  socket.on('game:set-poison', ({ roomId, snackIndex }) => {
    const room = rooms[roomId];
    if (!room || room.gameState.status !== 'preparing') return;

    room.gameState.poisonChoices[socket.id] = snackIndex;
    console.log(`Player ${socket.id} in room [${roomId}] chose poison snack: ${snackIndex}`);

    // 检查是否所有人都已选择
    if (Object.keys(room.gameState.poisonChoices).length === room.players.length) {
      room.gameState.status = 'playing';
      // 随机决定第一个回合的玩家
      room.gameState.currentPlayerIndex = Math.floor(Math.random() * room.players.length);
      const firstPlayer = room.players[room.gameState.currentPlayerIndex];
      io.to(roomId).emit('all:prepared', { firstPlayerId: firstPlayer.id });
      console.log(`All players in room [${roomId}] are ready. First turn: ${firstPlayer.name}`);
    }
  });

  // 玩家吃点心
  socket.on('game:eat-snack', ({ roomId, snackIndex }) => {
    const room = rooms[roomId];
    if (!room || room.gameState.status !== 'playing') return;
    const currentPlayer = room.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) return; // 不是该玩家的回合
    console.log(`Player ${currentPlayer.name} eats snack ${snackIndex} in room [${roomId}]`);
    room.gameState.eatenSnacks.push(snackIndex);
    // 检查是否吃到任何毒药
    let gameOver = false;
    let winner = null;
    let isDraw = false;
    for (const playerId in room.gameState.poisonChoices) {
        if (room.gameState.poisonChoices[playerId] === snackIndex) {
            // 吃到任何毒药，当前玩家出局，其他玩家胜利
            gameOver = true;
            // 找到除了当前玩家之外的其他玩家作为胜利者
            const otherPlayers = room.players.filter(p => p.id !== socket.id);
            winner = otherPlayers.length > 0 ? otherPlayers[0] : null;
            break;
        }
    }
    // 检查所有点心是否被吃完
    if (!gameOver && room.gameState.eatenSnacks.length >= room.settings.snackCount) {
        gameOver = true;
        isDraw = true;
    }
    if (gameOver) {
        room.gameState.status = 'ended';
        io.to(roomId).emit('game:over', {
            winner: isDraw ? null : (winner ? winner.id : null),
            isDraw,
            poisonChoices: room.gameState.poisonChoices,
            poisonSnacks: room.gameState.eatenSnacks,
        });
        console.log(`Game over in room [${roomId}]. ${isDraw ? 'Draw.' : ('Winner: ' + (winner ? winner.name : ''))}`);
        // 不再立即 delete rooms[roomId]，等待房主发起新一局或房间解散
    } else {
      // 切换到下一个玩家
      room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % room.players.length;
      const nextPlayer = room.players[room.gameState.currentPlayerIndex];
      io.to(roomId).emit('game:turn', { nextPlayerId: nextPlayer.id, eatenSnackIndex: snackIndex, eaterId: socket.id });
      console.log(`Next turn in room [${roomId}]: ${nextPlayer.name}`);
    }
  });

  // 新增：再来一局（只有房主能发起）
  socket.on('game:restart', (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.players[0].id !== socket.id) {
      socket.emit('server_error', { message: '只有房主可以发起新一局' });
      return;
    }
    // 重置房间状态，重新开始
    room.gameState = {
      status: 'preparing',
      poisonChoices: {},
      eatenSnacks: [],
      currentPlayerIndex: 0
    };
    // 重新生成点心数据
    if (!ALLOWED_SNACK_COUNTS.includes(room.settings.snackCount)) {
      room.settings.snackCount = 8;
    }
    const snacks = [];
    for (let i = 0; i < room.settings.snackCount; i++) {
      snacks.push({
        id: i + 1,
        index: i,
        isEaten: false,
        eatenBy: null
      });
    }
    const gameStartedData = {
      roomId: roomId,
      snacks: snacks,
      gameState: room.gameState,
      settings: room.settings  // 添加最新的设置
    };
    io.to(roomId).emit('game:started', gameStartedData);
    console.log(`房主发起新一局，room [${roomId}]`);
  });

  // 玩家主动退出房间
  socket.on('room:leave', () => {
    const room = findRoomBySocketId(socket.id);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    socket.leave(room.id);

    if (room.players.length > 0 && !room.players.some(p => p.isHost)) {
      room.players[0].isHost = true;
    }
    io.to(room.id).emit('room:player_list_updated', room.players);

    if (room.players.length === 0) {
      delete rooms[room.id];
    }
    socket.emit('room:left');
  });

  // 房主主动结束游戏
  socket.on('game:force-end', (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.players[0].id !== socket.id) {
      socket.emit('server_error', { message: '只有房主可以结束游戏' });
      return;
    }
    room.gameState.status = 'ended';
    io.to(roomId).emit('game:force-ended');
  });

  // 断开连接
  socket.on('disconnect', () => {
    const room = findRoomBySocketId(socket.id);
    if (room) {
      // 从玩家列表中移除
      room.players = room.players.filter(p => p.id !== socket.id);
      
      if (room.players.length === 0) {
        // 如果房间空了，删除房间
        delete rooms[room.id];
        return;
      }

      // 如果房主离开了，指定下一个玩家为新房主
      const isHostStillIn = room.players.some(p => p.isHost);
      if (!isHostStillIn && room.players.length > 0) {
        room.players[0].isHost = true;
      }
      
      // 向房间里剩下的人广播最新的玩家列表
      io.to(room.id).emit('room:player_list_updated', room.players);
    }
  });

  // 玩家改名
  socket.on('room:rename', ({ roomId, playerId, newName }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.players.some(p => p.name === newName && p.id !== playerId)) {
      socket.emit('server_error', { message: '该昵称已被使用，请换一个。' });
      return;
    }
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.name = newName;
      io.to(roomId).emit('room:player_list_updated', room.players);
    }
  });

  // 房主踢人
  socket.on('room:kick', ({ roomId, playerId }) => {
    const room = rooms[roomId];
    if (!room) return;
    // 只有房主能踢人，且不能踢自己
    if (room.players[0].id !== socket.id || playerId === socket.id) return;
    const kickedPlayer = room.players.find(p => p.id === playerId);
    if (kickedPlayer) {
      // 通知被踢玩家
      io.to(playerId).emit('room:left');
      // 移除玩家
      room.players = room.players.filter(p => p.id !== playerId);
      io.to(roomId).emit('room:player_list_updated', room.players);
      // 如果房间没人，销毁房间
      if (room.players.length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

function findRoomBySocketId(socketId) {
    return Object.values(rooms).find(r => r.players.some(p => p.id === socketId));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});