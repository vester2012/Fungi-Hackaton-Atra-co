import React, { useEffect, useRef, useState } from 'react';
import { io } from "socket.io-client";
import { bootGame } from './game/bootGame.js';
import { unit_manager } from "./game/unit_manager.js";
import MainMenu from './ui/MainMenu.jsx';
import RoomModal from './ui/RoomModal.jsx';

export default function GameRoot() {
    const phaserGameRef = useRef(null);

    const [isGameStarted, setIsGameStarted] = useState(false);
    const [modal, setModal] = useState({
        open: false,
        type: null
    });

    const colors = [
        { name: 'Default', value: 0xffffff },
        { name: 'Gold', value: 0xffd700 },
        { name: 'Red', value: 0xff4d4d },
        { name: 'Neon Green', value: 0x32ff7e },
        { name: 'Sky Blue', value: 0x18dcff },
        { name: 'Pink', value: 0xff9ff3 }
    ];

    const [currentColorIndex, setCurrentColorIndex] = useState(
        parseInt(localStorage.getItem('player_color_index')) || 0
    );

    useEffect(() => {
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

        //* SOCKET *//

        const SOCKET_URL = window.location.origin;
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
            // Аналогичная проверка для врагов
            if (enemyEntry && enemyEntry.obj && enemyEntry.obj.active) {
                enemyEntry.hp = data.hp;
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

        return () => {
            phaserGameRef.current?.destroy(true);
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isGameStarted) return;

        async function startGame() {
            if (document.fonts?.load) {
                await document.fonts.load('16px "JungleAdventurer"');
            }

            phaserGameRef.current = bootGame('game-root', {
                onExitToMenu: () => {
                    setIsGameStarted(false);
                }
            });
        }

        startGame();

        return () => {
            phaserGameRef.current?.destroy(true);
            phaserGameRef.current = null;
        };
    }, [isGameStarted]);

    function closeModal() {
        setModal({ open: false, type: null });
    }

    function handleStartGame() {
        unit_manager.socket.emit("join_room", {
            sid: localStorage.getItem('game_session_id'),
            idRoom: 1,
            passRoom: ''
        });

        unit_manager.socket.once('joined_room_success', () => {
            setIsGameStarted(true);
        });
    }

    function handleOpenCreateRoom() {
        setModal({ open: true, type: 'create-room' });
    }

    function handleOpenJoinRoom() {
        setModal({ open: true, type: 'join-room' });
    }

    function handleMatchmaking() {

    }

    function handleChangeColor() {
        const nextIndex = (currentColorIndex + 1) % colors.length;
        const selected = colors[nextIndex];

        localStorage.setItem('player_color_index', nextIndex);
        localStorage.setItem('player_tint', selected.value);

        setCurrentColorIndex(nextIndex);
    }

    function handleModalSubmit(formData) {
        const sid = localStorage.getItem('game_session_id');

        if (modal.type === 'create-room') {
            unit_manager.socket.emit("create_room", {
                sid,
                roomName: formData.roomName,
                roomPass: formData.roomPass
            });

            closeModal();
            return;
        }

        if (modal.type === 'join-room') {
            unit_manager.socket.emit("join_room", {
                sid,
                idRoom: formData.idRoom,
                passRoom: formData.passRoom
            });

            unit_manager.socket.once('joined_room_success', () => {
                closeModal();
                setIsGameStarted(true);
            });
        }
    }

    return (
        <div className="app-shell">
            {!isGameStarted && (
                <MainMenu
                    onStartGame={handleStartGame}
                    onCreateRoom={handleOpenCreateRoom}
                    onJoinRoom={handleOpenJoinRoom}
                    onMatchmaking={handleMatchmaking}
                    onChangeColor={handleChangeColor}
                    colorLabel={`Color: ${colors[currentColorIndex].name}`}
                />
            )}

            <div
                id="game-root"
                style={{ display: isGameStarted ? 'block' : 'none', width: '100%', height: '100%' }}
            />

            {modal.open && (
                <RoomModal
                    type={modal.type}
                    onClose={closeModal}
                    onSubmit={handleModalSubmit}
                />
            )}
        </div>
    );
}