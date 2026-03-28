import { FlyingEnemy } from "../entities/FlyingEnemy.js";
import { unit_manager } from "../unit_manager.js";

const Phaser = window.Phaser;

export class EnemyManager {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.targetFlyingCount = options.targetFlyingCount ?? 3;
    this.spawnCooldownMs = options.spawnCooldownMs ?? 1200;
    this.minFlyingSpawnDistance = options.minFlyingSpawnDistance ?? 420;
    this.lastSpawnAt = -this.spawnCooldownMs;
    this.flyingEnemies = [];
    this.nextFlyingId = 1;
  }

  update(time, delta, player) {
    this.updateFlyingEnemies(time, delta, player);
    this.ensureFlyingEnemies(time);
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
    for (const enemy of this.flyingEnemies) {
      delete unit_manager.info.enemies[enemy.id];
      enemy.destroy();
    }

    this.flyingEnemies = [];
  }
}
