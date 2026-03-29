const DEFAULT_ROOM_ENEMIES = [
  {
    id: 'enemy-1',
    type: 'walking',
    x: 360 * 2,
    y: 1342,
    spawnX: 360 * 2,
    spawnY: 1342,
    leftBound: 150 * 2,
    rightBound: (150 + 330) * 2,
    hp: 30,
    maxHp: 30,
    alive: true,
    facingDirection: -1,
    patrolDirection: -1,
    moveSpeed: 120,
    detectionRadius: 260,
    attackStopDistance: 56,
    attackRangeX: 90,
    attackRangeY: 100,
    attackCooldownMs: 2000,
    attackDurationMs: 220,
    lastAttackAt: 0,
    attackUntil: 0,
    state: 'idle'
  },
  {
    id: 'enemy-2',
    type: 'walking',
    x: 1120 * 2,
    y: 1402,
    spawnX: 1120 * 2,
    spawnY: 1402,
    leftBound: 980 * 2,
    rightBound: (980 + 300) * 2,
    hp: 30,
    maxHp: 30,
    alive: true,
    facingDirection: -1,
    patrolDirection: -1,
    moveSpeed: 120,
    detectionRadius: 260,
    attackStopDistance: 56,
    attackRangeX: 90,
    attackRangeY: 100,
    attackCooldownMs: 2000,
    attackDurationMs: 220,
    lastAttackAt: 0,
    attackUntil: 0,
    state: 'idle'
  },
  {
    id: 'enemy-3',
    type: 'walking',
    x: 1540 * 2,
    y: 568,
    spawnX: 1540 * 2,
    spawnY: 568,
    leftBound: 1490 * 2,
    rightBound: (1490 + 200) * 2,
    hp: 30,
    maxHp: 30,
    alive: true,
    facingDirection: -1,
    patrolDirection: -1,
    moveSpeed: 120,
    detectionRadius: 260,
    attackStopDistance: 56,
    attackRangeX: 90,
    attackRangeY: 100,
    attackCooldownMs: 2000,
    attackDurationMs: 220,
    lastAttackAt: 0,
    attackUntil: 0,
    state: 'idle'
  },
  {
    id: 'enemy-bee-1',
    type: 'flying',
    patrolMode: 'figure8',
    x: 800,
    y: 480,
    spawnX: 800,
    spawnY: 480,
    hp: 10,
    maxHp: 10,
    alive: true,
    facingDirection: -1,
    detectionRadius: 320,
    approachGap: 18,
    verticalAttackOffset: -8,
    horizontalLerp: 0.12,
    verticalLerp: 0.18,
    patrolRadiusX: 220,
    patrolRadiusY: 120,
    hoverPhase: 0.7,
    patrolSpeedX: 0.0018,
    patrolSpeedY: 0.0036,
    attackRangeX: 90,
    attackRangeY: 70,
    attackCooldownMs: 3000,
    attackDurationMs: 260,
    lastAttackAt: 0,
    attackUntil: 0,
    state: 'idle'
  },
  {
    id: 'enemy-bee-2',
    type: 'flying',
    patrolMode: 'sweep',
    x: 2000,
    y: 360,
    spawnX: 2000,
    spawnY: 360,
    hp: 10,
    maxHp: 10,
    alive: true,
    facingDirection: -1,
    detectionRadius: 320,
    approachGap: 18,
    verticalAttackOffset: -8,
    horizontalLerp: 0.12,
    verticalLerp: 0.18,
    patrolRadiusX: 320,
    patrolRadiusY: 60,
    hoverPhase: 1.9,
    patrolSpeedX: 0.0012,
    patrolSpeedY: 0.0044,
    driftX: 90,
    driftY: 24,
    driftSpeedX: 0.00055,
    driftSpeedY: 0.0015,
    attackRangeX: 90,
    attackRangeY: 70,
    attackCooldownMs: 3000,
    attackDurationMs: 260,
    lastAttackAt: 0,
    attackUntil: 0,
    state: 'idle'
  }
];

const ENEMY_TICK_MS = 33;
const ENEMY_RESPAWN_DELAY_MS = 3000;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function configureFlyingEnemy(enemy) {
  if (!enemy || enemy.type !== 'flying') {
    return enemy;
  }

  const variants = [
    {
      patrolMode: 'orbit',
      patrolRadiusX: 240,
      patrolRadiusY: 110,
      patrolSpeedX: 0.0014,
      patrolSpeedY: 0.0026,
      anchorDriftX: 120,
      anchorDriftY: 42,
      anchorDriftSpeedX: 0.00028,
      anchorDriftSpeedY: 0.00044,
      secondaryRadiusX: 70,
      secondaryRadiusY: 26,
      secondarySpeedX: 0.0032,
      secondarySpeedY: 0.0044
    },
    {
      patrolMode: 'lissajous',
      patrolRadiusX: 320,
      patrolRadiusY: 85,
      patrolSpeedX: 0.0011,
      patrolSpeedY: 0.0019,
      anchorDriftX: 80,
      anchorDriftY: 30,
      anchorDriftSpeedX: 0.00018,
      anchorDriftSpeedY: 0.00031,
      secondaryRadiusX: 36,
      secondaryRadiusY: 58,
      secondarySpeedX: 0.0037,
      secondarySpeedY: 0.0051
    },
    {
      patrolMode: 'sweep',
      patrolRadiusX: 300,
      patrolRadiusY: 60,
      patrolSpeedX: 0.00125,
      patrolSpeedY: 0.0042,
      driftX: 120,
      driftY: 28,
      driftSpeedX: 0.00052,
      driftSpeedY: 0.00145
    },
    {
      patrolMode: 'figure8',
      patrolRadiusX: 210,
      patrolRadiusY: 135,
      patrolSpeedX: 0.0019,
      patrolSpeedY: 0.0037,
      anchorDriftX: 56,
      anchorDriftY: 18,
      anchorDriftSpeedX: 0.00022,
      anchorDriftSpeedY: 0.00035
    }
  ];

  const variantIndex = Math.abs(
    [...enemy.id].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  ) % variants.length;
  const variant = variants[variantIndex];

  enemy.patrolMode = variant.patrolMode;
  enemy.hoverPhase = randomBetween(0, Math.PI * 2);
  enemy.patrolRadiusX = variant.patrolRadiusX + randomBetween(-35, 35);
  enemy.patrolRadiusY = variant.patrolRadiusY + randomBetween(-20, 20);
  enemy.patrolSpeedX = variant.patrolSpeedX + randomBetween(-0.00018, 0.00018);
  enemy.patrolSpeedY = variant.patrolSpeedY + randomBetween(-0.00028, 0.00028);
  enemy.anchorDriftX = (variant.anchorDriftX ?? 0) + randomBetween(-18, 18);
  enemy.anchorDriftY = (variant.anchorDriftY ?? 0) + randomBetween(-10, 10);
  enemy.anchorDriftSpeedX = (variant.anchorDriftSpeedX ?? 0.00025) + randomBetween(-0.00005, 0.00005);
  enemy.anchorDriftSpeedY = (variant.anchorDriftSpeedY ?? 0.00035) + randomBetween(-0.00007, 0.00007);
  enemy.secondaryRadiusX = (variant.secondaryRadiusX ?? 0) + randomBetween(-14, 14);
  enemy.secondaryRadiusY = (variant.secondaryRadiusY ?? 0) + randomBetween(-14, 14);
  enemy.secondarySpeedX = (variant.secondarySpeedX ?? 0.0034) + randomBetween(-0.0004, 0.0004);
  enemy.secondarySpeedY = (variant.secondarySpeedY ?? 0.0046) + randomBetween(-0.00045, 0.00045);
  enemy.driftX = (variant.driftX ?? 0) + randomBetween(-20, 20);
  enemy.driftY = (variant.driftY ?? 0) + randomBetween(-10, 10);
  enemy.driftSpeedX = (variant.driftSpeedX ?? 0.00055) + randomBetween(-0.00006, 0.00006);
  enemy.driftSpeedY = (variant.driftSpeedY ?? 0.0015) + randomBetween(-0.0001, 0.0001);

  return enemy;
}

function createRoomEnemies() {
  return Object.fromEntries(
    DEFAULT_ROOM_ENEMIES.map((enemy) => [
      enemy.id,
      enemy.type === 'flying'
        ? configureFlyingEnemy({ ...enemy })
        : { ...enemy }
    ])
  );
}

function getPlayersInRoom(activePlayers, roomId) {
  return Object.values(activePlayers).filter((player) => player.roomId == roomId);
}

function isEnemyTouchingPlayer(enemy, player) {
  return Math.abs(enemy.x - player.x) <= enemy.attackRangeX && Math.abs(enemy.y - player.y) <= enemy.attackRangeY;
}

function getNearestPlayer(enemy, players) {
  if (!players.length) {
    return null;
  }

  let nearest = null;
  let nearestDistance = Infinity;

  for (const player of players) {
    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (distance < nearestDistance) {
      nearest = player;
      nearestDistance = distance;
    }
  }

  return { player: nearest, distance: nearestDistance };
}

function damagePlayer(io, enemy, target, damage) {
  target.hp = Math.max(0, target.hp - damage);
  io.to(target.roomId).emit('hpUpdate', {
    id: target.id,
    hp: target.hp,
    damage,
    sourceId: enemy.id,
    sourceType: 'enemy'
  });
}

function updateWalkingEnemy(io, enemy, players, now, dt) {
  const leftBound = enemy.leftBound ?? (enemy.spawnX - 140);
  const rightBound = enemy.rightBound ?? (enemy.spawnX + 140);
  const nearest = getNearestPlayer(enemy, players);
  const hasTarget = nearest && nearest.distance <= enemy.detectionRadius;

  if (now < enemy.attackUntil) {
    enemy.state = 'attack';
  } else if (hasTarget) {
    const target = nearest.player;
    const dx = target.x - enemy.x;
    enemy.facingDirection = dx >= 0 ? 1 : -1;

    if (Math.abs(dx) > enemy.attackStopDistance) {
      enemy.x += enemy.facingDirection * enemy.moveSpeed * dt;
      enemy.x = Math.max(leftBound, Math.min(rightBound, enemy.x));
      enemy.state = 'run';
    } else {
      enemy.state = 'idle';
    }

    if (now >= enemy.lastAttackAt + enemy.attackCooldownMs && isEnemyTouchingPlayer(enemy, target)) {
      enemy.lastAttackAt = now;
      enemy.attackUntil = now + enemy.attackDurationMs;
      enemy.state = 'attack';
      damagePlayer(io, enemy, target, 10);
    }
  } else {
    if (enemy.x <= leftBound) {
      enemy.patrolDirection = 1;
    } else if (enemy.x >= rightBound) {
      enemy.patrolDirection = -1;
    }

    enemy.facingDirection = enemy.patrolDirection;
    enemy.x += enemy.patrolDirection * enemy.moveSpeed * 0.55 * dt;
    enemy.x = Math.max(leftBound, Math.min(rightBound, enemy.x));
    enemy.state = 'run';
  }
}

function updateFlyingEnemy(io, enemy, players, now) {
  const nearest = getNearestPlayer(enemy, players);
  const hasTarget = nearest && nearest.distance <= enemy.detectionRadius;

  if (now < enemy.attackUntil) {
    enemy.state = 'attack';
  }

  if (hasTarget) {
    const target = nearest.player;
    const dx = target.x - enemy.x;
    enemy.facingDirection = dx >= 0 ? 1 : -1;
    const targetX = enemy.facingDirection > 0 ? target.x - 78 : target.x + 78;
    const targetY = target.y + enemy.verticalAttackOffset;

    enemy.x += (targetX - enemy.x) * enemy.horizontalLerp;
    enemy.y += (targetY - enemy.y) * enemy.verticalLerp;
    if (now >= enemy.attackUntil) {
      enemy.state = 'idle';
    }

    if (now >= enemy.lastAttackAt + enemy.attackCooldownMs && isEnemyTouchingPlayer(enemy, target)) {
      enemy.lastAttackAt = now;
      enemy.attackUntil = now + enemy.attackDurationMs;
      enemy.state = 'attack';
      damagePlayer(io, enemy, target, 20);
    }
  } else {
    const centerX = enemy.spawnX + Math.sin(now * (enemy.anchorDriftSpeedX ?? 0) + enemy.hoverPhase * 0.5) * (enemy.anchorDriftX ?? 0);
    const centerY = enemy.spawnY + Math.cos(now * (enemy.anchorDriftSpeedY ?? 0) + enemy.hoverPhase * 0.8) * (enemy.anchorDriftY ?? 0);

    if (enemy.patrolMode === 'orbit') {
      const tX = now * enemy.patrolSpeedX + enemy.hoverPhase;
      const tY = now * enemy.patrolSpeedY + enemy.hoverPhase * 0.9;
      const tSecondaryX = now * (enemy.secondarySpeedX ?? 0.0034) + enemy.hoverPhase * 1.7;
      const tSecondaryY = now * (enemy.secondarySpeedY ?? 0.0046) + enemy.hoverPhase * 1.2;
      enemy.x = centerX + Math.cos(tX) * enemy.patrolRadiusX + Math.sin(tSecondaryX) * (enemy.secondaryRadiusX ?? 0);
      enemy.y = centerY + Math.sin(tY) * enemy.patrolRadiusY + Math.cos(tSecondaryY) * (enemy.secondaryRadiusY ?? 0);
    } else if (enemy.patrolMode === 'lissajous') {
      const t = now * enemy.patrolSpeedX + enemy.hoverPhase;
      const tSecondary = now * (enemy.secondarySpeedY ?? 0.0048) + enemy.hoverPhase * 1.4;
      enemy.x = centerX + Math.sin(t * 1.4) * enemy.patrolRadiusX + Math.cos(tSecondary) * (enemy.secondaryRadiusX ?? 0);
      enemy.y = centerY + Math.sin(t * 2.3 + enemy.hoverPhase * 0.5) * enemy.patrolRadiusY + Math.sin(tSecondary * 1.2) * (enemy.secondaryRadiusY ?? 0);
    } else if (enemy.patrolMode === 'figure8') {
      const tX = now * enemy.patrolSpeedX + enemy.hoverPhase;
      const tY = now * enemy.patrolSpeedY + enemy.hoverPhase * 0.7;
      enemy.x = centerX + Math.sin(tX) * enemy.patrolRadiusX;
      enemy.y = centerY + Math.sin(tY) * Math.cos(tY) * enemy.patrolRadiusY;
    } else if (enemy.patrolMode === 'sweep') {
      const tX = now * enemy.patrolSpeedX + enemy.hoverPhase;
      const tY = now * enemy.patrolSpeedY + enemy.hoverPhase * 1.1;
      const driftX = Math.sin(now * (enemy.driftSpeedX ?? 0.0006) + enemy.hoverPhase) * (enemy.driftX ?? 0);
      const driftY = Math.cos(now * (enemy.driftSpeedY ?? 0.0014) + enemy.hoverPhase) * (enemy.driftY ?? 0);
      enemy.x = centerX + Math.sin(tX) * enemy.patrolRadiusX + driftX;
      enemy.y = centerY + Math.sin(tY) * enemy.patrolRadiusY + driftY;
    } else {
      const tX = now * (enemy.patrolSpeedX ?? 0.0018) + enemy.hoverPhase;
      const tY = now * (enemy.patrolSpeedY ?? 0.0028) + enemy.hoverPhase * 1.3;
      enemy.x = centerX + Math.cos(tX) * enemy.patrolRadiusX;
      enemy.y = centerY + Math.sin(tY) * enemy.patrolRadiusY;
    }

    if (now >= enemy.attackUntil) {
      enemy.state = 'idle';
    }
  }
}

function updateRoomEnemies(io, room, activePlayers, now, dt) {
  const players = getPlayersInRoom(activePlayers, room.info.id);
  if (!room.enemies) {
    return;
  }

  for (const enemy of Object.values(room.enemies)) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.type === 'flying') {
      updateFlyingEnemy(io, enemy, players, now);
    } else {
      updateWalkingEnemy(io, enemy, players, now, dt);
    }
  }

  io.to(room.info.id).emit('enemiesState', room.enemies);
}

function respawnEnemy(io, rooms, roomId, enemyId) {
  const activeRoom = rooms.find((room) => room.info.id === roomId);
  const respawnEnemyState = activeRoom?.enemies?.[enemyId];
  if (!respawnEnemyState) {
    return;
  }

  respawnEnemyState.x = respawnEnemyState.spawnX;
  respawnEnemyState.y = respawnEnemyState.spawnY;
  respawnEnemyState.hp = respawnEnemyState.maxHp;
  respawnEnemyState.alive = true;
  respawnEnemyState.state = 'idle';
  respawnEnemyState.attackUntil = 0;
  respawnEnemyState.lastAttackAt = 0;

  if (respawnEnemyState.type === 'flying') {
    configureFlyingEnemy(respawnEnemyState);
  }

  io.to(roomId).emit('enemyRespawned', { ...respawnEnemyState });
}

function handleEnemyHit(io, rooms, roomId, enemyId, damage) {
  const room = rooms.find((item) => item.info.id === roomId);
  if (!room?.enemies?.[enemyId]) {
    return;
  }

  const enemy = room.enemies[enemyId];
  if (!enemy.alive) {
    return;
  }

  enemy.hp = Math.max(0, enemy.hp - damage);

  io.to(roomId).emit('enemyHpUpdate', {
    id: enemyId,
    hp: enemy.hp
  });

  if (enemy.hp > 0) {
    return;
  }

  enemy.alive = false;
  io.to(roomId).emit('enemyDied', { id: enemyId });

  setTimeout(() => {
    respawnEnemy(io, rooms, roomId, enemyId);
  }, ENEMY_RESPAWN_DELAY_MS);
}

module.exports = {
  ENEMY_TICK_MS,
  createRoomEnemies,
  updateRoomEnemies,
  handleEnemyHit
};
