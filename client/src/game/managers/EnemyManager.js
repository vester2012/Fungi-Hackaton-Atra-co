import { FlyingEnemy } from "../entities/FlyingEnemy.js";
import { SkeletonBombEnemy } from "../entities/SkeletonBombEnemy.js";
import { unit_manager } from "../unit_manager.js";

const Phaser = window.Phaser;

export class EnemyManager {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.walkingEnemies = [];
    this.flyingEnemies = [];
  }

  update(time, delta, player) {
    this.syncEnemiesFromServer();
    this.updateWalkingEnemies(time, delta, player);
    this.updateFlyingEnemies(time, delta, player);
  }

  updateWalkingEnemies(time, delta, player) {
    for (const enemy of this.walkingEnemies) {
      const enemyState = unit_manager.info.enemies[enemy.id];
      if (!enemyState) {
        continue;
      }

      enemy.applyServerState(enemyState, time);
    }

    for (let i = this.walkingEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.walkingEnemies[i];
      const enemyState = unit_manager.info.enemies[enemy.id];
      if (enemyState?.alive === false && !enemy.active) {
        this.walkingEnemies.splice(i, 1);
        continue;
      }
      if (enemyState?.alive !== false) {
        continue;
      }

      if (!enemy.isDead() || (enemy.isReadyToDestroy && !enemy.isReadyToDestroy(time))) {
        continue;
      }

      enemy.destroy();
      this.walkingEnemies.splice(i, 1);
    }
  }

  updateFlyingEnemies(time, delta, player) {
    for (const enemy of this.flyingEnemies) {
      const enemyState = unit_manager.info.enemies[enemy.id];
      if (!enemyState) {
        continue;
      }

      enemy.applyServerState(enemyState, time);
    }

    for (let i = this.flyingEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.flyingEnemies[i];
      const enemyState = unit_manager.info.enemies[enemy.id];
      if (enemyState?.alive === false && !enemy.active) {
        this.flyingEnemies.splice(i, 1);
        continue;
      }
      if (enemyState?.alive !== false) {
        continue;
      }

      if (!enemy.isDead() || !enemy.isReadyToDestroy(time)) {
        continue;
      }

      enemy.destroy();
      this.flyingEnemies.splice(i, 1);
    }
  }

  syncEnemiesFromServer() {
    const serverEnemies = unit_manager.info.enemies || {};

    for (const enemyState of Object.values(serverEnemies)) {
      if (!enemyState?.alive) {
        continue;
      }

      const list = enemyState.type === 'flying' ? this.flyingEnemies : this.walkingEnemies;
      const exists = list.some((enemy) => enemy.id === enemyState.id);
      if (exists) {
        continue;
      }

      const enemy = enemyState.type === 'flying'
        ? new FlyingEnemy(this.scene, enemyState.x, enemyState.y, { id: enemyState.id })
        : new SkeletonBombEnemy(this.scene, enemyState.x, enemyState.y, { id: enemyState.id });

      enemy.setDepth(2);

      if (enemyState.type !== 'flying') {
        this.scene.physics.add.collider(enemy.getPhysicsTarget(), this.scene.platforms);
        this.scene.zoneManager?.addInteractor(enemy.getPhysicsTarget());
      }

      list.push(enemy);
      serverEnemies[enemyState.id].obj = enemy;
    }
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
      unit_manager.socket?.emit('enemyHit', { enemyId: enemy.id, damage });
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
      unit_manager.socket?.emit('enemyHit', { enemyId: enemy.id, damage });
    }
  }

  destroy() {
    for (const enemy of this.walkingEnemies) {
      enemy.destroy();
    }

    for (const enemy of this.flyingEnemies) {
      enemy.destroy();
    }

    this.walkingEnemies = [];
    this.flyingEnemies = [];
  }
}
