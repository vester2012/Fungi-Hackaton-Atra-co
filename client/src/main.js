import './style.css';
import { io } from "socket.io-client";
import { bootGame } from './game/bootGame.js';
import {unit_manager} from "./game/unit_manager.js";

async function startGame() {
    if (document.fonts?.load) {
        await document.fonts.load('16px "JungleAdventurer"');
    }

    bootGame('app');
}

startGame();

//* SOCKET *//

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
console.log('!!!SOCKET_URL:', SOCKET_URL);
const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling']
});
let players = unit_manager.info.players;

socket.on('connect', () => { unit_manager.my_id = socket.id; });

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


unit_manager.socket = socket;
