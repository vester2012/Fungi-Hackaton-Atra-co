// socket/playerHandler.js
module.exports = (io, socket, state) => {
    const { activePlayers, sessionDatabase, getRandomSpawnPoint } = state;

    const handleMovement = (data) => {
        const player = activePlayers[socket.id];
        if (!player) return;

        player.x = data.x;
        player.y = data.y;
        player.flipX = data.flipX;
        player.anim = data.anim; // Передаем название текущей анимации (run, idle, jump)

        socket.broadcast.emit('playerMoved', {
            id: socket.id,
            x: player.x,
            y: player.y,
            flipX: player.flipX,
            anim: player.anim
        });
    };

    const handleAttack = (data) => {
        // data: { type: 'kick', direction: 'left' }
        const player = activePlayers[socket.id];
        if (player) {
            io.emit('playerAttacked', {
                attackerId: socket.id,
                attackType: data.type,
                x: player.x,
                y: player.y
            });
        }
    };

    const handleHit = (data) => {
        const target = activePlayers[data.targetId];
        const attacker = activePlayers[socket.id];

        if (target && attacker) {
            const damage = data.damage || 10;
            target.hp -= damage;

            if (target.hp <= 0) {
                target.hp = 0;
                io.emit('playerKilled', { victimId: target.id, attackerId: socket.id });
                // Логика респауна...
            }

            io.emit('hpUpdate', {
                id: target.id,
                hp: target.hp,
                attackerId: socket.id,
                knockback: true // Флаг, чтобы клиент проиграл анимацию получения урона
            });
        }
    };

    // Регистрируем события
    socket.on('playerMovement', handleMovement);
    socket.on('playerAttack', handleAttack);
    socket.on('playerHit', handleHit);
};