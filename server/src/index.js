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
   // socket.emit('currentPlayers', activePlayers);
    socket.emit('currentEnemies', enemies);
    //socket.broadcast.emit('newPlayer', player);
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
      password: roomPass,
      enemies: JSON.parse(JSON.stringify(enemies)) // Сразу даем комнате своих врагов
    });

    let list_rooms = rooms.map(obj => obj.info);
    socket.emit('update_list_rooms', { list_rooms });
  });

  socket.on('join_room', (data) => {
    const { sid, idRoom, passRoom } = data;
    const player = sessionDatabase[sid];

    // Ищем комнату в массиве по ID (приводим к числу, если нужно)
    const roomIndex = rooms.findIndex(r => r.info.id == idRoom);
    const room = rooms[roomIndex];

    if (!room) {
      return socket.emit('error_msg', 'Комната не найдена');
    }

    // Проверяем пароль
    if (room.password !== "" && room.password !== passRoom) {
      return socket.emit('error_msg', 'Неверный пароль');
    }

    if (player) {
      // 1. Уходим из предыдущей комнаты, если она была
      if (player.roomId) {
        socket.leave(player.roomId);
      }

      // 2. Привязываем игрока к новой комнате
      player.roomId = idRoom;
      socket.join(idRoom);

      // 3. Если в этой комнате еще нет своих врагов — создаем их (копируем дефолтных)
      if (!room.enemies) {
        room.enemies = JSON.parse(JSON.stringify(enemies));
      }

      console.log(`Игрок ${player.username} зашел в комнату ${idRoom}`);

      // 4. Сообщаем клиенту, что вход успешен
      socket.emit('joined_room_success', { roomId: idRoom });

      // 5. Синхронизируем ТОЛЬКО тех, кто в этой комнате
      const playersInRoom = {};
      Object.values(activePlayers).forEach(p => {
        if (p.roomId == idRoom) playersInRoom[p.id] = p;
      });

      socket.emit('currentPlayers', playersInRoom);
      socket.emit('currentEnemies', room.enemies);

      // Оповещаем остальных ВНУТРИ комнаты
      socket.to(idRoom).emit('newPlayer', player);
    }
  });


  socket.on('playerMovement', (movementData) => {
    const player = activePlayers[socket.id];
    if (!player || !player.roomId) return;

    player.x = movementData.x;
    player.y = movementData.y;
    if (typeof movementData.hp === 'number') player.hp = movementData.hp;

    // Отправляем только людям в той же комнате
    socket.to(player.roomId).emit('playerMoved', player);
  });

  socket.on('playerAttack', (data) => {
    const player = activePlayers[socket.id];
    if (player && player.roomId) {
      // Отправляем всем в комнату, включая себя (или socket.to если себе не надо)
      io.to(player.roomId).emit('playerAttacked', { attackerId: socket.id, ...data });
    }
  });

  socket.on('playerHit', (data) => {
    const player = activePlayers[socket.id];
    const target = activePlayers[data.targetId];
    if (target && player && player.roomId) {
      target.hp = Math.max(0, target.hp - data.damage);
      // Рассылка только в текущую комнату
      io.to(player.roomId).emit('hpUpdate', { id: data.targetId, hp: target.hp, attackerId: socket.id, damage: data.damage });
    }
  });

  socket.on('enemyHit', (data) => {
    const player = activePlayers[socket.id];
    if (!player || !player.roomId) return;

    // Ищем врага именно в этой комнате
    const room = rooms.find(r => r.info.id === player.roomId);
    if (room && room.enemies && room.enemies[data.enemyId]) {
      const enemy = room.enemies[data.enemyId];
      enemy.hp = Math.max(0, enemy.hp - data.damage);

      io.to(player.roomId).emit('enemyHpUpdate', {
        id: data.enemyId,
        hp: enemy.hp,
        attackerId: socket.id,
        damage: data.damage
      });
    }
  });

  socket.on('disconnect', () => {
    if (activePlayers[socket.id]) {
      console.log(`Игрок ${activePlayers[socket.id].username} отключился`);
      delete activePlayers[socket.id]; // Удаляем только из активных
      io.emit('playerDisconnected', socket.id);
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
