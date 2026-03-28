const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Если нет uuid, используйте Math.random().toString(36)

const setupSocketHandlers = require('./soket/main'); // Импортируем наш коорддинатор

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const PATH_PUBLIC = path.resolve(__dirname, '../../client/dist');
const SPAWN_POINTS = [
  { x: 220, y: 650 },
  { x: 315, y: 650 },
  { x: 540, y: 560 },
  { x: 785, y: 485 },
  { x: 1050, y: 410 },
  { x: 1325, y: 340 },
  { x: 1590, y: 280 },
  { x: 1130, y: 680 },
  { x: 1450, y: 570 }
];
app.use(express.static(PATH_PUBLIC));

// Хранилища
const activePlayers = {}; // Кто сейчас в сети (socket.id => data)
const sessionDatabase = {}; // Все когда-либо заходившие (sessionId => data)
const enemies = {
  'enemy-1': { id: 'enemy-1', hp: 100 },
  'enemy-2': { id: 'enemy-2', hp: 100 },
  'enemy-3': { id: 'enemy-3', hp: 100 },
  'enemy-bee-1': { id: 'enemy-bee-1', hp: 10 }
};
let idCounter = 0;

const rooms = [
  {
    info: {
      name: 'sandbox',
      id: ++idCounter,
      lifespan: -1
    },
    password: ''
  },
  {
    info: {
      name: 'teamAtraCo',
      id: ++idCounter,
      lifespan: -1
    },
    password: 'tune123'
  }
];



function getRandomSpawnPoint() {
  const index = Math.floor(Math.random() * SPAWN_POINTS.length);
  return { ...SPAWN_POINTS[index] };
}

const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

//setupSocketHandlers(io);

//#region old_soket

io.on('connection', (socket) => {

  socket.on('login', (data) => {
    let sessionId = data.sessionId;
    let player;

    const spawnPoint = getRandomSpawnPoint();

    // 1. Проверяем, существует ли сессия
    if (sessionId && sessionDatabase[sessionId]) {
      player = sessionDatabase[sessionId];
      console.log(`Игрок вернулся по сессии: ${player.username}`);
    } else {
      // 2. Если сессии нет, создаем нового игрока
      sessionId = uuidv4(); // Генерируем новый ID сессии
      player = {
        sessionId: sessionId,
        username: data.username || `Guest_${socket.id.substring(0, 4)}`,
        hp: 100,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        score: 0
      };
      sessionDatabase[sessionId] = player;
      console.log(`Новый игрок создан: ${player.username}`);
    }

    player.x = spawnPoint.x;
    player.y = spawnPoint.y;

    // Привязываем актуальный socket.id к объекту игрока
    player.id = socket.id;
    activePlayers[socket.id] = player;

    // Отправляем игроку подтверждение и его sessionId (он его сохранит)
    socket.emit('loginSuccess', {
      id: socket.id,
      sessionId: player.sessionId,
      username: player.username,
      hp: player.hp,
      x: player.x,
      y: player.y
    });

    // Синхронизация мира
    socket.emit('currentPlayers', activePlayers);
    socket.emit('currentEnemies', enemies);
    socket.broadcast.emit('newPlayer', player);
  });

  // Все остальные события используют activePlayers[socket.id]
  socket.on('create_room', (arg) => {
    const { sid, roomName, roomPass } = arg;
    rooms.push({
      info: {
        name: roomName,
        id: ++idCounter,
        lifespan: -1
      },
      created: sid,
      password: roomPass
    });

    let list_rooms = rooms.map(obj => obj.info);
    socket.emit('update_list_rooms', { list_rooms });
  });

  // Все остальные события используют activePlayers[socket.id]
  socket.on('playerMovement', (movementData) => {
    const player = activePlayers[socket.id];
    if (!player) return;

    player.x = movementData.x;
    player.y = movementData.y;
    if (typeof movementData.hp === 'number') player.hp = movementData.hp;

    socket.broadcast.emit('playerMoved', player);
  });

  socket.on('disconnect', () => {
    if (activePlayers[socket.id]) {
      console.log(`Игрок ${activePlayers[socket.id].username} отключился`);
      delete activePlayers[socket.id]; // Удаляем только из активных
      io.emit('playerDisconnected', socket.id);
    }
  });

  // Обработка ударов и урона (без изменений)
  socket.on('playerAttack', (data) => {
    if (activePlayers[socket.id]) io.emit('playerAttacked', { attackerId: socket.id, ...data });
  });

  socket.on('playerHit', (data) => {
    const target = activePlayers[data.targetId];
    if (target) {
      target.hp = Math.max(0, target.hp - data.damage);
      io.emit('hpUpdate', { id: data.targetId, hp: target.hp, attackerId: socket.id, damage: data.damage });
    }
  });

  socket.on('enemyHit', (data) => {
    if (enemies[data.enemyId]) {
      enemies[data.enemyId].hp = Math.max(0, enemies[data.enemyId].hp - data.damage);
      io.emit('enemyHpUpdate', { id: data.enemyId, hp: enemies[data.enemyId].hp, attackerId: socket.id, damage: data.damage });
    }
  });
});

//#endregion

app.get('*', (req, res) => {
  res.sendFile(path.join(PATH_PUBLIC, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
