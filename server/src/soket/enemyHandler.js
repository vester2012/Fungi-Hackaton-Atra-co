// socket/enemyHandler.js

module.exports = (io, socket, state) => {
    const { enemies, activePlayers } = state;

    // 1. Когда игрок бьет врага
    const handleEnemyHit = (data) => {
        // data: { enemyId: 'enemy-1', damage: 20 }
        const enemy = enemies[data.enemyId];
        const player = activePlayers[socket.id];

        if (!enemy || !player) return;
        if (enemy.hp <= 0) return; // Враг уже мертв

        // Уменьшаем HP
        enemy.hp = Math.max(0, enemy.hp - data.damage);

        // Оповещаем всех об изменении HP врага
        io.emit('enemyHpUpdate', {
            id: enemy.id,
            hp: enemy.hp,
            attackerId: socket.id,
            damage: data.damage
        });

        // Проверяем смерть врага
        if (enemy.hp <= 0) {
            handleEnemyDeath(enemy.id, socket.id);
        }
    };

    // 2. Логика смерти врага
    const handleEnemyDeath = (enemyId, killerId) => {
        console.log(`Враг ${enemyId} убит игроком ${killerId}`);

        // Начисляем очки убийце (если нужно)
        if (activePlayers[killerId]) {
            activePlayers[killerId].score += 50;
            io.emit('scoreUpdate', { id: killerId, score: activePlayers[killerId].score });
        }

        io.emit('enemyKilled', { id: enemyId, killerId: killerId });

        // Респаун врага через 10 секунд
        setTimeout(() => {
            respawnEnemy(enemyId);
        }, 10000);
    };

    // 3. Возрождение врага
    const respawnEnemy = (enemyId) => {
        if (enemies[enemyId]) {
            enemies[enemyId].hp = 100; // Или начальное HP этого типа врага
            // Можно даже сменить позицию врага при респауне
            // enemies[enemyId].x = newX;

            io.emit('enemyRespawned', enemies[enemyId]);
            console.log(`Враг ${enemyId} возродился`);
        }
    };

    // Регистрируем события
    socket.on('enemyHit', handleEnemyHit);
};