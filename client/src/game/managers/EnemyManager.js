import { FlyingEnemy } from "../entities/FlyingEnemy.js";
import { SkeletonBombEnemy } from "../entities/SkeletonBombEnemy.js";
import { unit_manager } from "../unit_manager.js";

const Phaser = window.Phaser;

export class EnemyManager {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.walkingSpawns = options.walkingSpawns ?? [];
    this.walkingEnemyIds = this.walkingSpawns.length
      ? this.walkingSpawns.map((spawn, index) => spawn.id ?? `enemy-walk-${index + 1}`)
      : [];
    this.targetWalkingCount = options.targetWalkingCount ?? this.walkingSpawns.length;
    this.targetFlyingCount = options.targetFlyingCount ?? 3;
    this.spawnCooldownMs = options.spawnCooldownMs ?? 1200;
    this.walkingSpawnCooldownMs = options.walkingSpawnCooldownMs ?? 900;
    this.walkingRespawnDelayMs = options.walkingRespawnDelayMs ?? 3000;
    this.minFlyingSpawnDistance = options.minFlyingSpawnDistance ?? 420;
    this.lastSpawnAt = -this.spawnCooldownMs;
    this.lastWalkingSpawnAt = -this.walkingSpawnCooldownMs;
    this.walkingEnemies = [];
    this.flyingEnemies = [];
    this.walkingRespawnAt = new Map();
    this.walkingLastPlatformKey = new Map();
    this.nextFlyingId = 1;
  }

  update(time, delta, player) {
    this.updateWalkingEnemies(time, delta, player);
    this.updateFlyingEnemies(time, delta, player);
    this.ensureWalkingEnemies(time);
    this.ensureFlyingEnemies(time);
  }

  updateWalkingEnemies(time, delta, player) {
    for (const enemy of this.walkingEnemies) {
      const enemyState = unit_manager.info.enemies[enemy.id];
      if (typeof enemyState?.hp === "number" && enemyState.hp !== enemy.getHp()) {
        enemy.setHp(enemyState.hp);
      }

      enemy.update(time, delta, player);
    }

    for (let i = this.walkingEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.walkingEnemies[i];
      if (!enemy.isDead() || (enemy.isReadyToDestroy && !enemy.isReadyToDestroy(time))) {
        continue;
      }

      this.walkingRespawnAt.set(enemy.id, time + this.walkingRespawnDelayMs);
      delete unit_manager.info.enemies[enemy.id];
      enemy.destroy();
      this.walkingEnemies.splice(i, 1);
    }
  }

  updateFlyingEnemies(time, delta, player) {
    for (const enemy of this.flyingEnemies) {
      const enemyState = unit_manager.info.enemies[enemy.id];
      if (typeof enemyState?.hp === "number" && enemyState.hp !== enemy.getHp()) {
        enemy.setHp(enemyState.hp);
      }

      enemy.update(time, delta, player);
    }

    for (let i = this.flyingEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.flyingEnemies[i];
      if (!enemy.isDead() || !enemy.isReadyToDestroy(time)) {
        continue;
      }

      delete unit_manager.info.enemies[enemy.id];
      enemy.destroy();
      this.flyingEnemies.splice(i, 1);
    }
  }

  ensureFlyingEnemies(time) {
    if (this.flyingEnemies.length >= this.targetFlyingCount) {
      return;
    }

    if (time - this.lastSpawnAt < this.spawnCooldownMs) {
      return;
    }

    const enemy = this.spawnFlyingEnemy();
    if (!enemy) {
      return;
    }

    this.lastSpawnAt = time;
    this.flyingEnemies.push(enemy);
    unit_manager.info.enemies[enemy.id] = {
      id: enemy.id,
      hp: enemy.getHp(),
      obj: enemy
    };
  }

  ensureWalkingEnemies(time) {
    if (!this.targetWalkingCount || this.walkingEnemies.length >= this.targetWalkingCount) {
      return;
    }

    if (time - this.lastWalkingSpawnAt < this.walkingSpawnCooldownMs) {
      return;
    }

    const spawn = this.getWalkingSpawnPoint();
    if (!spawn) {
      return;
    }

    const enemy = new SkeletonBombEnemy(this.scene, spawn.x, spawn.y, { id: spawn.id });
    enemy.spawnPlatformKey = spawn.platformKey ?? null;
    enemy.setDepth(2);
    this.scene.physics.add.collider(enemy.getPhysicsTarget(), this.scene.platforms);
    this.scene.zoneManager?.addInteractor(enemy.getPhysicsTarget());

    this.walkingEnemies.push(enemy);
    this.lastWalkingSpawnAt = time;
    unit_manager.info.enemies[enemy.id] = {
      id: enemy.id,
      hp: enemy.getHp(),
      obj: enemy
    };
  }

  getWalkingSpawnPoint() {
    const aliveIds = new Set(this.walkingEnemies.map((enemy) => enemy.id));
    const availableIds = this.walkingEnemyIds.filter((id) => {
      if (aliveIds.has(id)) {
        return false;
      }

      const readyAt = this.walkingRespawnAt.get(id) ?? 0;
      return readyAt <= this.scene.time.now;
    });

    if (!availableIds.length) {
      return null;
    }

    const enemyId = Phaser.Utils.Array.GetRandom(availableIds);
    const platformSpawn = this.getWalkingPlatformSpawn(enemyId);
    if (platformSpawn) {
      return {
        id: enemyId,
        ...platformSpawn
      };
    }

    const fallbackSpawn = this.getWalkingFallbackSpawn(enemyId);
    if (!fallbackSpawn) {
      return null;
    }

    return {
      id: enemyId,
      ...fallbackSpawn
    };
  }

  getWalkingPlatformSpawn(enemyId) {
    const candidates = this.getWalkingPlatformCandidates();
    if (!candidates.length) {
      return null;
    }

    const occupiedKeys = new Set(
      this.walkingEnemies.map((enemy) => enemy.spawnPlatformKey).filter(Boolean)
    );
    const lastPlatformKey = this.walkingLastPlatformKey.get(enemyId);

    let pool = candidates.filter((candidate) => !occupiedKeys.has(candidate.platformKey));
    if (!pool.length) {
      pool = candidates;
    }

    const differentPlatformPool = pool.filter((candidate) => candidate.platformKey !== lastPlatformKey);
    const selectedPool = differentPlatformPool.length ? differentPlatformPool : pool;
    const selected = Phaser.Utils.Array.GetRandom(selectedPool);

    if (!selected) {
      return null;
    }

    this.walkingLastPlatformKey.set(enemyId, selected.platformKey);
    return selected;
  }

  getWalkingPlatformCandidates() {
    const platforms = this.scene.platforms?.getChildren?.() ?? [];

    return platforms.map((platform, index) => {
      const body = platform.body;
      if (!body) {
        return null;
      }

      const width = body.right - body.left;
      const isGround = width >= this.scene.worldWidth * 0.8;
      if (isGround || width < 140) {
        return null;
      }

      const horizontalMargin = Math.min(60, Math.max(24, width * 0.2));
      const minX = Math.round(body.left + horizontalMargin);
      const maxX = Math.round(body.right - horizontalMargin);
      if (maxX <= minX) {
        return null;
      }

      return {
        platformKey: `platform-${index}`,
        x: Phaser.Math.Between(minX, maxX),
        y: Math.round(body.top - 20)
      };
    }).filter(Boolean);
  }

  getWalkingFallbackSpawn(enemyId) {
    const spawn = this.walkingSpawns.find((item) => (item.id ?? enemyId) === enemyId);
    if (!spawn) {
      return null;
    }

    return {
      x: spawn.x,
      y: spawn.y,
      platformKey: spawn.id ?? `fallback-${enemyId}`
    };
  }

  spawnFlyingEnemy() {
    const spawn = this.getFlyingSpawnPoint();
    if (!spawn) {
      return null;
    }

    const id = `enemy-bee-auto-${this.nextFlyingId++}`;
    const enemy = new FlyingEnemy(this.scene, spawn.x, spawn.y, { id });
    enemy.setDepth(2);
    return enemy;
  }

  getFlyingSpawnPoint() {
    const camera = this.scene.cameras.main;
    const margin = 220;
    const xMin = margin;
    const xMax = this.scene.worldWidth - margin;
    const yMin = 180;
    const yMax = this.scene.worldHeight - 260;

    if (xMax <= xMin || yMax <= yMin) {
      return null;
    }

    let x = Phaser.Math.Between(xMin, xMax);
    let y = Phaser.Math.Between(yMin, yMax);
    let attempts = 16;

    while (attempts > 0) {
      const insideView = camera ? camera.worldView.contains(x, y) : false;
      const tooCloseToOtherEnemy = this.flyingEnemies.some((enemy) => {
        return Phaser.Math.Distance.Between(x, y, enemy.baseX ?? enemy.x, enemy.baseY ?? enemy.y) < this.minFlyingSpawnDistance;
      });

      if (!insideView && !tooCloseToOtherEnemy) {
        break;
      }

      x = Phaser.Math.Between(xMin, xMax);
      y = Phaser.Math.Between(yMin, yMax);
      attempts -= 1;
    }

    return { x, y };
  }

  handlePlayerAttack(playerAttackBounds, attackId, damage) {
    if (!playerAttackBounds || !attackId) {
      return;
    }

    for (const enemy of this.walkingEnemies) {
      if (enemy.isDead()) {
        continue;
      }

      if (!Phaser.Geom.Intersects.RectangleToRectangle(playerAttackBounds, enemy.getPhysicsTarget().getBounds())) {
        continue;
      }

      const applied = enemy.takeDamage(damage, attackId);
      if (!applied) {
        continue;
      }

      unit_manager.info.enemies[enemy.id] = {
        id: enemy.id,
        hp: enemy.getHp(),
        obj: enemy
      };
    }

    for (const enemy of this.flyingEnemies) {
      if (enemy.isDead()) {
        continue;
      }

      if (!Phaser.Geom.Intersects.RectangleToRectangle(playerAttackBounds, enemy.getPhysicsTarget().getBounds())) {
        continue;
      }

      const applied = enemy.takeDamage(damage, attackId);
      if (!applied) {
        continue;
      }

      unit_manager.info.enemies[enemy.id] = {
        id: enemy.id,
        hp: enemy.getHp(),
        obj: enemy
      };
    }
  }

  destroy() {
    for (const enemy of this.walkingEnemies) {
      delete unit_manager.info.enemies[enemy.id];
      enemy.destroy();
    }

    for (const enemy of this.flyingEnemies) {
      delete unit_manager.info.enemies[enemy.id];
      enemy.destroy();
    }

    this.walkingEnemies = [];
    this.flyingEnemies = [];
    this.walkingRespawnAt.clear();
    this.walkingLastPlatformKey.clear();
  }
}
