const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const CLIENT_URL = process.env.CLIENT_URL;

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL || true,
    methods: ['GET', 'POST']
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// Хранилище игроков
const players = {};

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
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      // Рассылаем всем обновленную позицию этого игрока
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
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
});


const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Сервер запущен на http://${HOST}:${PORT}`);
});

// import http from 'node:http';
//
// const port = Number(process.env.PORT || 3000);
//
// const server = http.createServer((req, res) => {
//   res.writeHead(200, { 'Content-Type': 'application/json' });
//   res.end(JSON.stringify({
//     ok: true,
//     service: 'fungi-hackaton-server',
//     path: req.url
//   }));
// });
//
// server.listen(port, () => {
//   console.log(`Server listening on http://localhost:${port}`);
// });
//
