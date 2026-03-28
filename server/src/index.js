const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const isMobile =
    typeof window !== 'undefined' &&
    (window.matchMedia("(max-width: 768px)").matches ||
        /Mobi|Android/i.test(navigator.userAgent));

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
const enemies = {
  'enemy-1': { id: 'enemy-1', hp: 100 },
  'enemy-2': { id: 'enemy-2', hp: 100 },
  'enemy-3': { id: 'enemy-3', hp: 100 }
};

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
  socket.emit('currentEnemies', enemies);
  // Оповещаем остальных, что зашел новый игрок
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Обработка движения
  socket.on('playerMovement', (movementData) => {
    if (!players[socket.id]) return;

    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    if (typeof movementData.hp === 'number') {
      players[socket.id].hp = movementData.hp;
    }

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
        attackerId: socket.id,
        damage
      });
    }
  });

  socket.on('playerDamagedByEnemy', (data) => {
    if (!players[socket.id] || typeof data.hp !== 'number') {
      return;
    }

    players[socket.id].hp = Math.max(0, data.hp);

    io.emit('hpUpdate', {
      id: socket.id,
      hp: players[socket.id].hp,
      damage: typeof data.damage === 'number' ? data.damage : null
    });
  });

  socket.on('playerDied', () => {
    if (!players[socket.id]) {
      return;
    }

    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });

  socket.on('enemyHit', (data) => {
    const enemyId = data.enemyId;
    const damage = data.damage;

    if (!enemies[enemyId] || typeof damage !== 'number') {
      return;
    }

    enemies[enemyId].hp = Math.max(0, enemies[enemyId].hp - damage);

    io.emit('enemyHpUpdate', {
      id: enemyId,
      hp: enemies[enemyId].hp,
      attackerId: socket.id,
      damage
    });
  });
});

if ( process.env.NODE_ENV === 'development' && isMobile ) {
  import('eruda').then((eruda) => {
    eruda.default.init();
  });
}

// Все запросы, которые не обработаны иначе, отдают index.html из dist
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, PATH_PUBLIC, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
