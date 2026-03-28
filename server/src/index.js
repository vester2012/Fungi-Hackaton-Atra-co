const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const PATH_PUBLIC = path.resolve(__dirname, '../../client/dist');

// Health check
app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

// Static files from Phaser build
app.use(express.static(PATH_PUBLIC));

// Хранилище игроков
const players = {};

// Socket.IO
const io = new Server(server, {
  cors: {
    // origin: true
    origin: "http://localhost:5173", // Порт твоего Webpack Dev Server
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`Игрок подключился: ${socket.id}`);

  // Создаем нового игрока при подключении
  players[socket.id] = {
    id: socket.id,
    x: 100,
    y: 100,
    hp: 100,
    color: '#' + Math.floor(Math.random()*16777215).toString(16), // Случайный цвет
    score: 0
  };

  // Отправляем текущему игроку список всех остальных
  socket.emit('currentPlayers', players);
  // Оповещаем остальных, что зашел новый игрок
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Обработка движения
  socket.on('playerMovement', (movementData) => {
    if (!players[socket.id]) return;

    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;

    // Рассылаем всем обновленную позицию этого игрока
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  // Обработка удара (атаки)
  socket.on('playerAttack', (attackData) => {
    // attackData может содержать координаты удара или ID цели
    console.log(`Игрок ${socket.id} совершил удар`);

    // Транслируем событие атаки всем, чтобы они отрисовали анимацию
    io.emit('playerAttacked', {
      attackerId: socket.id,
      ...attackData
    });
  });

  // Отключение игрока
  socket.on('disconnect', () => {
    console.log(`Игрок отключился: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });

  // Внутри io.on('connection', (socket) => { ... })

  socket.on('playerHit', (data) => {
    const targetId = data.targetId;
    const damage = data.damage;

    if (players[targetId]) {
      // Уменьшаем HP на сервере
      players[targetId].hp -= damage;

      if (players[targetId].hp <= 0) {
        players[targetId].hp = 0;
        // Можно добавить логику смерти / респауна
        console.log(`Игрок ${targetId} погиб`);
      }

      // Рассылаем ВСЕМ новое состояние здоровья этого игрока
      io.emit('hpUpdate', {
        id: targetId,
        hp: players[targetId].hp,
        attackerId: socket.id // опционально: кто ударил
      });
    }
  });
});

// Все запросы, которые не обработаны иначе, отдают index.html из dist
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, PATH_PUBLIC, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
