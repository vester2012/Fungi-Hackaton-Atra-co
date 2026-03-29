import './style.css';
import { io } from "socket.io-client";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { bootGame } from './game/bootGame.js';
import {unit_manager} from "./game/unit_manager.js";

import './style.css';
import App from './App.jsx';

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

ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

//* SOCKET *//

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling']
});
let players = unit_manager.info.players;

socket.on('connect', () => {
    unit_manager.my_id = socket.id;
});

// 1. Собираем данные для входа ОДИН РАЗ
let savedSession = localStorage.getItem('game_session_id');
let savedName = localStorage.getItem('game_username');
const savedTint = parseInt(localStorage.getItem('player_tint')) || 0xffffff;

// Если имени нет в истории, спрашиваем
if (!savedName) {
    savedName = prompt("Введите ник для регистрации:") || `Fish_${Math.floor(Math.random()*1000)}`;
    localStorage.setItem('game_username', savedName);
}

// 2. ЕДИНСТВЕННЫЙ вызов логина при старте
socket.emit('login', {
    sessionId: savedSession, // Сервер создаст новую, если эта null
    username: savedName,
    tint: savedTint
});


// Когда сервер подтвердил логин
socket.on('loginSuccess', (data) => {
    // Сохраняем ID сессии на будущее
    localStorage.setItem('game_session_id', data.sessionId);
    console.log(`Залогинены как ${data.username} с цветом ${data.tint}`);
    // Здесь можно инициализировать что-то специфичное для вашего игрока
});

socket.on('enemyDied', (data) => {
    const enemyEntry = unit_manager.info.enemies[data.id];
    if (enemyEntry) {
        enemyEntry.alive = false;
        enemyEntry.hp = 0;
    }
    if (enemyEntry && enemyEntry.obj) {
        enemyEntry.obj.setHp?.(0);
        enemyEntry.obj.destroy();
        enemyEntry.obj = null;
    }
});
// Получаем список всех игроков при входе
socket.on('currentPlayers', (serverPlayers) => {
    Object.assign(players, serverPlayers);
});

socket.on('currentEnemies', (serverEnemies) => {
    unit_manager.info.enemies = { ...serverEnemies };
});

socket.on('enemiesState', (serverEnemies) => {
    const nextEnemies = {};

    Object.entries(serverEnemies).forEach(([id, enemyState]) => {
        nextEnemies[id] = {
            ...(unit_manager.info.enemies[id] || {}),
            ...enemyState,
            obj: unit_manager.info.enemies[id]?.obj || null
        };
    });

    unit_manager.info.enemies = nextEnemies;
});

socket.on('enemyRespawned', (enemyInfo) => {
    unit_manager.info.enemies[enemyInfo.id] = {
        ...(unit_manager.info.enemies[enemyInfo.id] || {}),
        ...enemyInfo,
        obj: null
    };
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
        // Важно: сохраняем тинт, который прислал сервер для этого игрока
        if (playerInfo.tint !== undefined) {
            players[playerInfo.id].tint = playerInfo.tint;
        }
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
    if (enemyEntry) {
        enemyEntry.hp = data.hp;
    }
    if (enemyEntry && enemyEntry.obj && enemyEntry.obj.active) {
        enemyEntry.obj.setHp(data.hp);
    }
});

socket.on('update_list_rooms', (data) => {
    unit_manager.rooms = data.list_rooms;
});

socket.on('error_msg', (data) => {
    alert(data);
});

unit_manager.socket = socket;
