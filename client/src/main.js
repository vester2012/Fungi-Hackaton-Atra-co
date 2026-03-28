import './style.css';
import { io } from "socket.io-client";
import { bootGame } from './game/bootGame.js';
import {unit_manager} from "./game/unit_manager.js";

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

socket.on('hpUpdate', (data) => {
    // Находим игрока в нашем локальном списке и обновляем его HP
    if (players[data.id]) {
        //players[data.id].hp = data.hp;
        players[data.id].newHP = data.hp;//сделал чтобы потом вызвать евент

        // Визуальное отображение (например, отнять полоску HP)
        console.log(`У игрока ${data.id} осталось ${data.hp} HP`);

        if (data.hp <= 0) {
            // Анимация смерти или скрытие модели
        }
    }
});

unit_manager.socket = socket;
