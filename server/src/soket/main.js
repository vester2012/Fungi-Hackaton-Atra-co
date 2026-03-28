// socket/index.js
const playerHandler = require('./playerHandler');
const enemyHandler = require('./enemyHandler');

// Храним состояние игры прямо здесь (или передаем извне)
const state = {
    activePlayers: {},
    sessionDatabase: {},
    enemies: { /* ... твои враги */ },
    getRandomSpawnPoint: () => ({ x: Math.random() * 500, y: 500 }) // Для примера
};

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Логика логина (можно тоже вынести в отдельный файл authHandler)
        socket.on('login', (data) => { /* твоя логика логина */ });

        // Подключаем модули, передавая им io, socket и общее состояние
        playerHandler(io, socket, state);
        enemyHandler(io, socket, state);

        socket.on('disconnect', () => {
            delete state.activePlayers[socket.id];
            io.emit('playerDisconnected', socket.id);
        });
    });
};