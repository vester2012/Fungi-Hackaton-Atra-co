import './style.css';
import { io } from "socket.io-client";
import { bootGame } from './game/bootGame.js';
import {unit_manager} from "./game/unit_manager.js";

const params = new URLSearchParams(window.location.search);
const isDebug = params.has('debug');

// if (!import.meta.env.DEV) {
if (true) {
    console.log(
        '%cStop!',
        'color: red; font-size: 32px; font-weight: bold;'
    );

    console.log(
        '%cThis is a developer console. Do not paste code here unless you understand it.',
        'color: crimson; font-size: 14px;'
    );
    console.log(`
   ███████████████████████████████████
   █  HACKER TERMINAL - ROOT ACCESS  █
   ███████████████████████████████████

                // | \\
               ||     ||
               ||     ||
                '-----'
               ||     ||
               ||     ||
               ||     ||
              _||_   _||_
             /    \\ /    \\
           |      | |     |
            \\_____/\\_____/
`);
}

if (isDebug) {
    import('eruda').then((eruda) => {
        eruda.default.init();

        const entry = document.querySelector('.eruda-entry-btn');

        if (entry) {
            entry.style.left = 'auto';
            entry.style.right = '10vw';
            entry.style.top = '10vh';
            entry.style.bottom = 'auto';
        }
    });
}

async function startGame() {
    if (document.fonts?.load) {
        await document.fonts.load('16px "JungleAdventurer"');
    }

    bootGame('app');
}

startGame();

//* SOCKET *//

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling']
});
let players = unit_manager.info.players;



socket.on('connect', () => { unit_manager.my_id = socket.id; });

// Логика на клиенте (Phaser / JS)
const savedSession = localStorage.getItem('game_session_id');
const savedName = localStorage.getItem('game_username');

if (!savedSession) {
    const name = prompt("Введите ник для регистрации:");
    localStorage.setItem('game_username', name);
    // Отправляем пустую сессию и ник
    socket.emit('login', { sessionId: null, username: name });
} else {
    // Отправляем старую сессию (ник сервер возьмет из базы)
    socket.emit('login', { sessionId: savedSession });
}



// Когда сервер подтвердил логин
socket.on('loginSuccess', (data) => {
    // Сохраняем ID сессии на будущее
    localStorage.setItem('game_session_id', data.sessionId);
    console.log(`Залогинены как ${data.username}`);

    // ТУТ инициализируем вашего игрока в Phaser
});
socket.on('enemyDied', (data) => {
    const enemyEntry = unit_manager.info.enemies[data.id];
    if (enemyEntry && enemyEntry.obj) {
        enemyEntry.obj.destroy(); // Враг исчезнет у всех в комнате
    }
});
// Получаем список всех игроков при входе
socket.on('currentPlayers', (serverPlayers) => {
    Object.assign(players, serverPlayers);
});

socket.on('currentEnemies', (serverEnemies) => {
    Object.assign(unit_manager.info.enemies, serverEnemies);
});

// Новый игрок зашел
socket.on('newPlayer', (playerInfo) => {
    players[playerInfo.id] = playerInfo;
});

// Кто-то передвинулся
socket.on('playerMoved', (playerInfo) => {
    if (players[playerInfo.id]) {
        players[playerInfo.id].x = playerInfo.x;
        players[playerInfo.id].y = playerInfo.y;
        if (typeof playerInfo.hp === 'number') {
            players[playerInfo.id].hp = playerInfo.hp;
            if (players[playerInfo.id].obj?.setHp) {
                players[playerInfo.id].obj.setHp(playerInfo.hp);
            }
        }
    }
});

socket.on('playerAttacked', (attackInfo) => {
    if (players[attackInfo.attackerId]) {
        players[attackInfo.attackerId].pendingAttackId = attackInfo.attackId;
    }
});

// Удаление вышедшего игрока
socket.on('playerDisconnected', (playerId) => {
    if (players[playerId]?.obj?.destroy) {
        players[playerId].obj.destroy();
    }
    delete players[playerId];
});

socket.on('hpUpdate', (data) => {
    const playerEntry = players[data.id];
    // Проверяем: есть ли запись, есть ли объект и не уничтожен ли он в Phaser
    if (playerEntry && playerEntry.obj && playerEntry.obj.active) {
        playerEntry.hp = data.hp;
        playerEntry.obj.setHp(data.hp);
    }
});

socket.on('enemyHpUpdate', (data) => {
    const enemyEntry = unit_manager.info.enemies[data.id];
    // Аналогичная проверка для врагов
    if (enemyEntry && enemyEntry.obj && enemyEntry.obj.active) {
        enemyEntry.hp = data.hp;
        enemyEntry.obj.setHp(data.hp);
    }
});
//unit_manager.socket.emit("create_room", { sid: localStorage.getItem('game_session_id'), roomName, roomPass});
socket.on('update_list_rooms', (data) => {
    unit_manager.rooms = data.list_rooms;
});

socket.on('error_msg', (data) => {
    alert(data);
});

unit_manager.socket = socket;
