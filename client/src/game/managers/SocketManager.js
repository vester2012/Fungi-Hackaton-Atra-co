import {io} from "socket.io-client";
import {unit_manager} from "../unit_manager";

let players = unit_manager.info.players;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling']
});

export function soketJoinRoom (username, roomName, password) {
    socket.emit('joinRoom', {
        username, roomName, password,
        sessionId: localStorage.getItem('game_session_id') // если есть
    });
}


// Обработка ошибки пароля
socket.on('errorMsg', (msg) => {
    alert(msg);
    // Здесь можно вернуть игрока на экран ввода пароля
});


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
    if (players[data.id]) {
        const previousHp = typeof players[data.id].hp === 'number' ? players[data.id].hp : null;
        players[data.id].hp = data.hp;
        if (players[data.id].obj) {
            const playerObject = players[data.id].obj;
            const tookDamage = typeof data.damage === 'number'
                && previousHp !== null
                && data.hp < previousHp
                && data.id !== unit_manager.my_id;

            if (tookDamage && playerObject.applySyncedDamage) {
                playerObject.applySyncedDamage(data.damage, data.hp);
            } else if (playerObject.setHp) {
                playerObject.setHp(data.hp);
            }
        }
    }
});

socket.on('enemyHpUpdate', (data) => {
    if (!unit_manager.info.enemies[data.id]) {
        unit_manager.info.enemies[data.id] = { id: data.id, hp: data.hp };
    } else {
        unit_manager.info.enemies[data.id].hp = data.hp;
    }

    if (unit_manager.info.enemies[data.id].obj?.setHp) {
        unit_manager.info.enemies[data.id].obj.setHp(data.hp);
    }
});
