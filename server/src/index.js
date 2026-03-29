const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Если нет uuid, используйте Math.random().toString(36)

const setupSocketHandlers = require('./soket/main');
const {getPlayerDamage} = require("./distributions/player_distribution"); // Импортируем наш коорддинатор

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

let arrQueue = [
  {
    totalLots: 4,
    remainLots: 0,
    players: []
  }
];

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

const animals = [
  {
    name: 'корови',
    id: 0,
    hp: 100,
    damage: 20
  },
  {
    name: 'тупорыба',
    atlas: 'fish',
    id: 1,
    hp: 100,
    damage: 20
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

    if (sessionId && sessionDatabase[sessionId]) {
      player = sessionDatabase[sessionId];
      if (data.tint) player.tint = data.tint; // Обновляем цвет, если пришел новый
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

    // Привязываем актуальные данные к сессии
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
      tint: player.tint, // Отправляем тинт обратно
      x: player.x,
      y: player.y
    });

    socket.emit('currentEnemies', enemies);
  });

  // Все остальные события используют activePlayers[socket.id]
  socket.on('mm', (arg) => {
    const { sid, numPlayersOfRoom } = arg;

    let queue = arrQueue.find(q => q.totalLots === numPlayersOfRoom && !q.isStarted);

    if (!queue) {
      // Создаем новую комнату
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


      socket.join(queue.idRoom);

      let list_rooms = rooms.map(obj => obj.info);
      socket.emit('update_list_rooms', { list_rooms });
    } else {
      // Игрок присоединяется к существующей очереди
      queue.remainLots--;
      queue.players.push(sid);

      // // ВАЖНО: Присоединяем текущий сокет к комнате
      // socket.join(queue.idRoom);

      // Вызываем вашу функцию логики (если она делает socket.join внутри, убедитесь в этом)
      joinToRoom(socket, { sid, idRoom: queue.idRoom, passRoom: queue.passRoom }, true);

      if (queue.remainLots === 0) {
        queue.isStarted = true;

        // ИСПРАВЛЕНИЕ: Отправляем ВСЕМ в этой комнате
        // Используйте io.to(...), а не socket.emit(...)

        getPlayersAndEnemiesByRoom(io, '_queue', rooms.find(room => room.info.id === queue.idRoom))
        io.to(queue.idRoom).emit('mm_is_already', {
          idRoom: queue.idRoom,
          passRoom: queue.passRoom
        });

        arrQueue = arrQueue.filter(el => el.idRoom !== queue.idRoom);
      }
    }

    // Это событие тоже можно отправить всей комнате, чтобы все видели, что кто-то зашел
    io.to(queue.idRoom).emit('mm_newPlayer', { queue });
  });

  // Все остальные события используют activePlayers[socket.id]
  socket.on('create_room', (arg) => {
    let list_rooms = createRoom(arg);
    socket.emit('update_list_rooms', { list_rooms });
  });

  socket.on('join_room', (data) => {
    joinToRoom(socket, data);
  });

  socket.on('playerDied', () => {
    const player = activePlayers[socket.id];
    if (!player) return;

    console.log(`Игрок ${player.username} погиб и удален из активных`);

    const roomId = player.roomId;

    // 1. Удаляем игрока из списка активных на сервере,
    // чтобы он не участвовал в рассылках позиций
    delete activePlayers[socket.id];

    // 2. Оповещаем комнату, что этот объект игрока нужно уничтожить
    // Мы используем существующее событие 'playerDisconnected',
    // так как клиент уже умеет удалять спрайт по этому событию.
    if (roomId) {
      io.to(roomId).emit('playerDisconnected', socket.id);
    } else {
      io.emit('playerDisconnected', socket.id);
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
      const damage = getPlayerDamage();
      target.hp = Math.max(0, target.hp - damage);
      // Рассылка только в текущую комнату
      io.to(player.roomId).emit('hpUpdate', { id: data.targetId, hp: target.hp, attackerId: socket.id, damage });
    }
  });

  socket.on('enemyHit', (data) => {
    const player = activePlayers[socket.id];
    if (!player || !player.roomId) return;

    const room = rooms.find(r => r.info.id === player.roomId);
    if (room && room.enemies && room.enemies[data.enemyId]) {
      const enemy = room.enemies[data.enemyId];
      enemy.hp = Math.max(0, enemy.hp - data.damage);

      io.to(player.roomId).emit('enemyHpUpdate', {
        id: data.enemyId,
        hp: enemy.hp
      });

      // Если враг умер — сообщаем об этом
      if (enemy.hp <= 0) {
        io.to(player.roomId).emit('enemyDied', { id: data.enemyId });
        // Можно удалить его из списка комнаты или запустить таймер респауна
      }
    }
  });

  socket.on('disconnect', () => {
    const player = activePlayers[socket.id];
    if (player) {
      console.log(`Игрок ${player.username} отключился`);
      const roomId = player.roomId;
      delete activePlayers[socket.id];

      if (roomId) {
        io.to(roomId).emit('playerDisconnected', socket.id);
      } else {
        io.emit('playerDisconnected', socket.id);
      }
    }
  });

});

function getPlayersAndEnemiesByRoom(io, prefix, room) {
  const playersInRoom = {};
  Object.values(activePlayers).forEach(p => {
    if (!room.info)
      console.log();
    if (p.roomId == room.info.id) playersInRoom[p.id] = p;
  });

  io.to(room.info.id).emit('currentPlayers' + prefix, playersInRoom);
  io.to(room.info.id).emit('currentEnemies' + prefix, room.enemies);
  return playersInRoom;
}
function createRoom(arg) {
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
  return list_rooms;
}
function joinToRoom( socket, data, ismm ) {
  const prefix = ismm ? '_queue' : '';
  const { sid, idRoom, passRoom } = data;
  const player = sessionDatabase[sid];

  // Ищем комнату в массиве по ID (приводим к числу, если нужно)
  const roomIndex = rooms.findIndex(r => r.info.id === idRoom);
  const room = rooms[roomIndex];

  if (!ismm) {
    if (!room) {
      return socket.emit('error_msg', 'Комната не найдена');
    }

    // Проверяем пароль
    if (room.password !== "" && room.password !== passRoom) {
      return socket.emit('error_msg', 'Неверный пароль');
    }
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

    console.log(`Игрок ${player.username} зашел в комнату ${room.info.name} (${idRoom})`);

    // 4. Сообщаем клиенту, что вход успешен
    socket.emit('joined_room_success' + prefix, { roomId: idRoom });

    // 5. Синхронизируем ТОЛЬКО тех, кто в этой комнате

    getPlayersAndEnemiesByRoom(socket, prefix, room);
    // Оповещаем остальных ВНУТРИ комнаты
    socket.to(idRoom).emit('newPlayer' + prefix, player);
  }
}

//#endregion

app.get('*', (req, res) => {
  res.sendFile(path.join(PATH_PUBLIC, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
