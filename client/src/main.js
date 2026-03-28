import './style.css';
import { io } from "socket.io-client";
import { bootGame } from './game/bootGame.js';
import {unit_manager} from "./game/unit_manager.js";

bootGame('app');



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

// Новый игрок зашел
socket.on('newPlayer', (playerInfo) => {
    players[playerInfo.id] = playerInfo;
});

// Кто-то передвинулся
socket.on('playerMoved', (playerInfo) => {
    if (players[playerInfo.id]) {
        players[playerInfo.id].x = playerInfo.x;
        players[playerInfo.id].y = playerInfo.y;
    }
});

socket.on('playerAttacked', (attackInfo) => {
    if (players[attackInfo.attackerId]) {
        players[attackInfo.attackerId].pendingAttackId = attackInfo.attackId;
    }
});

// Удаление вышедшего игрока
socket.on('playerDisconnected', (playerId) => {
    delete players[playerId];
});


unit_manager.socket = socket;
