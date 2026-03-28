const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const PATH_PUBLIC = path.resolve(__dirname, '../../client/dist');
app.use(express.static(PATH_PUBLIC));

const sessionDatabase = {};
const activePlayers = {};

// Функция для создания врагов
const createInitialEnemies = () => ({
  'enemy-1': { id: 'enemy-1', hp: 100 },
  'enemy-2': { id: 'enemy-2', hp: 100 },
  'enemy-3': { id: 'enemy-3', hp: 100 },
  'enemy-bee-1': { id: 'enemy-bee-1', hp: 10 }
});


// --- Инициализация комнат ---
const rooms = {
  'sandbox': {
    password: '',            // Без пароля
    enemies: createInitialEnemies(),
    playersCount: 0,
    isPersistent: true       // Флаг, чтобы комната не удалялась
  }
};

const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {

  socket.on('joinRoom', (data) => {
    // Если roomName не указан, отправляем в песочницу
    const roomName = data.roomName || 'sandbox';
    const password = data.password || '';
    const { username, sessionId: clientSessionId } = data;

    let sessionId = clientSessionId;
    let player;

    if (sessionId && sessionDatabase[sessionId]) {
      player = sessionDatabase[sessionId];
    } else {
      sessionId = uuidv4();
      player = {
        sessionId: sessionId,
        username: username || `Guest_${socket.id.substring(0, 4)}`,
        x: 100, y: 100, hp: 100, score: 0,
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
      };
      sessionDatabase[sessionId] = player;
    }

    // Логика комнат
    if (!rooms[roomName]) {
      rooms[roomName] = {
        password: password,
        enemies: createInitialEnemies(),
        playersCount: 0,
        isPersistent: false
      };
    } else {
      // Проверка пароля (для sandbox пароль пустой, так что пройдет)
      if (rooms[roomName].password !== password) {
        socket.emit('errorMsg', 'Неверный пароль!');
        return;
      }
    }

    socket.join(roomName);
    player.id = socket.id;
    player.roomName = roomName;
    activePlayers[socket.id] = player;
    rooms[roomName].playersCount++;

    socket.emit('loginSuccess', {
      id: socket.id,
      sessionId: player.sessionId,
      username: player.username,
      roomName: roomName
    });

    const playersInRoom = {};
    for (let id in activePlayers) {
      if (activePlayers[id].roomName === roomName) {
        playersInRoom[id] = activePlayers[id];
      }
    }

    socket.emit('currentPlayers', playersInRoom);
    socket.emit('currentEnemies', rooms[roomName].enemies);
    socket.to(roomName).emit('newPlayer', player);
  });

  // События движения и боя (используют player.roomName как в прошлом ответе)
  socket.on('playerMovement', (movementData) => {
    const player = activePlayers[socket.id];
    if (!player) return;
    player.x = movementData.x;
    player.y = movementData.y;
    if (typeof movementData.hp === 'number') player.hp = movementData.hp;
    socket.to(player.roomName).emit('playerMoved', player);
  });

  socket.on('playerAttack', (data) => {
    const player = activePlayers[socket.id];
    if (player) io.to(player.roomName).emit('playerAttacked', { attackerId: socket.id, ...data });
  });

  socket.on('playerHit', (data) => {
    const player = activePlayers[socket.id];
    const target = activePlayers[data.targetId];
    if (player && target && target.roomName === player.roomName) {
      target.hp = Math.max(0, target.hp - data.damage);
      io.to(player.roomName).emit('hpUpdate', { id: data.targetId, hp: target.hp, attackerId: socket.id, damage: data.damage });
    }
  });

  socket.on('enemyHit', (data) => {
    const player = activePlayers[socket.id];
    if (player && rooms[player.roomName]) {
      const roomEnemies = rooms[player.roomName].enemies;
      if (roomEnemies[data.enemyId]) {
        roomEnemies[data.enemyId].hp = Math.max(0, roomEnemies[data.enemyId].hp - data.damage);
        io.to(player.roomName).emit('enemyHpUpdate', { id: data.enemyId, hp: roomEnemies[data.enemyId].hp, attackerId: socket.id, damage: data.damage });
      }
    }
  });

  socket.on('disconnect', () => {
    const player = activePlayers[socket.id];
    if (player) {
      const { roomName } = player;
      delete activePlayers[socket.id];
      io.to(roomName).emit('playerDisconnected', socket.id);

      if (rooms[roomName]) {
        rooms[roomName].playersCount--;
        // Удаляем комнату только если она не "sandbox" (isPersistent: false)
        if (!rooms[roomName].isPersistent && rooms[roomName].playersCount <= 0) {
          delete rooms[roomName];
          console.log(`Комната ${roomName} удалена`);
        }
      }
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(PATH_PUBLIC, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Сервер запущен. Песочница готова.`);
});
