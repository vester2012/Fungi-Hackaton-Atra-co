// File: server/src/index.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const {getPlayerDamage} = require("./distributions/player_distribution");
const {
  ENEMY_TICK_MS,
  createRoomEnemies,
  updateRoomEnemies,
  handleEnemyHit
} = require('./enemies');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const PATH_PUBLIC = path.resolve(__dirname, '../../client/dist');
const SPAWN_POINTS =[
  { x: 220, y: 650 }, { x: 315, y: 650 }, { x: 540, y: 560 },
  { x: 785, y: 485 }, { x: 1050, y: 410 }, { x: 1325, y: 340 },
  { x: 1590, y: 280 }, { x: 1130, y: 680 }, { x: 1450, y: 570 }
];
app.use(express.static(PATH_PUBLIC));

const activePlayers = {};
const sessionDatabase = {};
let idCounter = 0;

let arrQueue =[
  { totalLots: 4, remainLots: 0, players: [] }
];

const rooms =[
  { info: { name: 'sandbox', id: ++idCounter, lifespan: -1 }, password: '' },
  { info: { name: 'teamAtraCo', id: ++idCounter, lifespan: -1 }, password: 'tune123' }
];

function getRandomSpawnPoint() {
  const index = Math.floor(Math.random() * SPAWN_POINTS.length);
  return { ...SPAWN_POINTS[index] };
}

const io = new Server(server, {
  cors: { origin: "*", methods:["GET", "POST"] } // [FIX] Разрешаем любые CORS для дебага на джеме
});

io.on('connection', (socket) => {

  socket.on('login', (data) => {
    let sessionId = data.sessionId;
    let player;
    const spawnPoint = getRandomSpawnPoint();

    if (sessionId && sessionDatabase[sessionId]) {
      player = sessionDatabase[sessionId];
      if (data.tint) player.tint = data.tint;
    } else {
      sessionId = uuidv4();
      player = {
        sessionId: sessionId,
        username: data.username || `Guest_${socket.id.substring(0, 4)}`,
        hp: 100,
        damage: getPlayerDamage(),
        tint: data.tint || 0xffffff,
        score: 0
      };
      sessionDatabase[sessionId] = player;
    }

    player.id = socket.id;
    player.x = spawnPoint.x;
    player.y = spawnPoint.y;
    activePlayers[socket.id] = player;

    socket.emit('loginSuccess', {
      id: socket.id,
      sessionId: player.sessionId,
      username: player.username,
      hp: player.hp,
      damage: player.damage,
      tint: player.tint,
      x: player.x,
      y: player.y
    });
  });

  socket.on('mm', (arg) => {
    const { sid, numPlayersOfRoom } = arg;
    let queue = arrQueue.find(q => q.totalLots === numPlayersOfRoom && !q.isStarted);

    if (!queue) {
      let listRooms = createRoom({sid, roomName: 'mm' + sid, roomPass: sid});
      let room = rooms[rooms.length - 1];

      queue = {
        totalLots: numPlayersOfRoom,
        remainLots: numPlayersOfRoom - 1,
        players: [sid],
        idRoom: room.info.id,
        passRoom: room.password,
        isStarted: false
      };
      arrQueue.push(queue);

      joinToRoom(socket, { sid, idRoom: queue.idRoom, passRoom: queue.passRoom }, true);

      let list_rooms = rooms.map(obj => obj.info);
      socket.emit('update_list_rooms', { list_rooms });
    } else {
      queue.remainLots--;
      queue.players.push(sid);

      joinToRoom(socket, { sid, idRoom: queue.idRoom, passRoom: queue.passRoom }, true);

      if (queue.remainLots === 0) {
        queue.isStarted = true;
        io.to(queue.idRoom).emit('mm_is_already', {
          idRoom: queue.idRoom,
          passRoom: queue.passRoom
        });
        arrQueue = arrQueue.filter(el => el.idRoom !== queue.idRoom);
      }
    }
  });

  socket.on('create_room', (arg) => {
    let list_rooms = createRoom(arg);
    socket.emit('update_list_rooms', { list_rooms });
  });

  socket.on('join_room', (data) => {
    joinToRoom(socket, data);
  });

  // [FIX] Игрок не удаляется из activePlayers насовсем, чтобы мог переподключиться
  socket.on('playerDied', () => {
    const player = activePlayers[socket.id];
    if (!player) return;

    const roomId = player.roomId;
    player.roomId = null; // Убираем из комнаты

    if (roomId) {
      io.to(roomId).emit('playerDisconnected', socket.id);
      socket.leave(roomId);
    }
  });

  socket.on('playerMovement', (movementData) => {
    const player = activePlayers[socket.id];
    if (!player || !player.roomId) return;

    player.x = movementData.x;
    player.y = movementData.y;
    if (typeof movementData.hp === 'number') player.hp = movementData.hp;

    socket.to(player.roomId).emit('playerMoved', player);
  });

  socket.on('playerAttack', (data) => {
    const player = activePlayers[socket.id];
    if (player && player.roomId) {
      io.to(player.roomId).emit('playerAttacked', { attackerId: socket.id, ...data });
    }
  });

  socket.on('playerAction', (data) => {
    const player = activePlayers[socket.id];
    if (player && player.roomId) {
      socket.to(player.roomId).emit('playerActionReceive', {
        playerId: socket.id,
        action: data.action,
        dirX: data.dirX,
        dirY: data.dirY
      });
    }
  });

  socket.on('playerHit', (data) => {
    const player = activePlayers[socket.id];
    const target = activePlayers[data.targetId];
    if (target && player && player.roomId) {
      const damage = getPlayerDamage();
      target.hp = Math.max(0, target.hp - damage);
      io.to(player.roomId).emit('hpUpdate', { id: data.targetId, hp: target.hp, attackerId: socket.id, damage });
    }
  });

  socket.on('enemyHit', (data) => {
    const player = activePlayers[socket.id];
    if (!player || !player.roomId) return;
    handleEnemyHit(io, rooms, player.roomId, data.enemyId, data.damage);
  });

  socket.on('disconnect', () => {
    const player = activePlayers[socket.id];
    if (player) {
      const roomId = player.roomId;
      delete activePlayers[socket.id];

      if (roomId) {
        io.to(roomId).emit('playerDisconnected', socket.id);

        // [FIX] Утечка памяти: удаляем комнату, если она пуста и не дефолтная
        const room = rooms.find(r => r.info.id === roomId);
        if (room && room.info.lifespan !== -1) {
          const playersInRoom = Object.values(activePlayers).filter(p => p.roomId === roomId);
          if (playersInRoom.length === 0) {
            const idx = rooms.indexOf(room);
            if (idx !== -1) rooms.splice(idx, 1);
          }
        }
      }
    }
  });
});

// [FIX] Передаем `io` в функцию, чтобы отправить данные всем
function getPlayersAndEnemiesByRoom(ioInstance, prefix, room) {
  const playersInRoom = {};
  Object.values(activePlayers).forEach(p => {
    if (p.roomId == room.info.id) playersInRoom[p.id] = p;
  });

  ioInstance.to(room.info.id).emit('currentPlayers', playersInRoom);
  ioInstance.to(room.info.id).emit('currentEnemies', room.enemies);
  return playersInRoom;
}

function createRoom(arg) {
  const { sid, roomName, roomPass } = arg;
  rooms.push({
    info: { name: roomName, id: ++idCounter, lifespan: 1 }, // 1 = кастомная комната
    created: sid,
    password: roomPass,
    enemies: createRoomEnemies()
  });
  return rooms.map(obj => obj.info);
}

function joinToRoom(socket, data, ismm) {
  const prefix = ismm ? '_queue' : '';
  const { sid, idRoom, passRoom } = data;
  const playerState = sessionDatabase[sid];

  const roomIndex = rooms.findIndex(r => r.info.id == idRoom);
  const room = rooms[roomIndex];

  if (!ismm) {
    if (!room) return socket.emit('error_msg', 'Комната не найдена');
    if (room.password !== "" && room.password !== passRoom) return socket.emit('error_msg', 'Неверный пароль');
  }

  if (playerState) {
    //[FIX] Возвращаем игрока к жизни, если он был "мертв" и удален
    if (!activePlayers[socket.id]) {
      activePlayers[socket.id] = playerState;
      activePlayers[socket.id].id = socket.id;
      activePlayers[socket.id].hp = 100; // Респаун
    }

    const player = activePlayers[socket.id];

    if (player.roomId) socket.leave(player.roomId);

    player.roomId = room.info.id;
    socket.join(room.info.id);

    if (!room.enemies) room.enemies = createRoomEnemies();

    // 4. Сообщаем клиенту, что вход успешен
    socket.emit('joined_room_success' + prefix, { roomId: room.info.id });

    // 5. Синхронизируем ТОЛЬКО тех, кто в этой комнате
    //[ИСПРАВЛЕНИЕ ТУТ] Передаем io вместо socket!
    getPlayersAndEnemiesByRoom(io, prefix, room);

    // Оповещаем остальных ВНУТРИ комнаты
    socket.to(room.info.id).emit('newPlayer' + prefix, player);
  }
}

app.get('*', (req, res) => {
  res.sendFile(path.join(PATH_PUBLIC, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

setInterval(() => {
  const now = Date.now();
  const dt = ENEMY_TICK_MS / 1000;
  for (const room of rooms) {
    updateRoomEnemies(io, room, activePlayers, now, dt);
  }
}, ENEMY_TICK_MS);