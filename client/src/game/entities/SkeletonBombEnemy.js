// File: client/src/game/entities/SkeletonBombEnemy.js

const Phaser = window.Phaser;
import { Enemy } from "./Enemy.js";
import { DamagePopup } from "./DamagePopup.js";

export class SkeletonBombEnemy extends Enemy {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y, options);

    this.maxHp = 30;
    this.hp = 30;

    this.baseX = x;
    this.baseY = y - 38;
    this.moveSpeed = options.moveSpeed ?? 120;
    this.detectionRadius = options.detectionRadius ?? 260;
    this.attackStopDistance = options.attackStopDistance ?? 56;
    this.patrolRadius = options.patrolRadius ?? 90;
    this.patrolPauseUntil = 0;
    this.patrolDirection = -1;
    this.platformEdgeMargin = options.platformEdgeMargin ?? 28;
    this.currentAnimation = '';
    this.currentPlatform = null;

    if (this.visual) {
      this.visual.destroy();
    }

    this.visual = scene.add.spine(0, -60, 'skeleton_bomb_SPO', 'idle', true);
    this.visual.setScale(options.visualScale ?? 0.18);
    this.add(this.visual);

    this.hitbox.body.setMaxVelocity(this.moveSpeed, 1200);
  }

  // [FIX] Убран конфликтующий клиентский ИИ. Мы просто отображаем состояние сервера.
  update(time, delta, player) {
    if (!this.hitbox || !this.hitbox.body) return;

    const now = time ?? this.scene.time.now;

    this.syncAttackZone(now);
    this.syncHpText();
    this.syncAnimation(now);
    this.visual.scaleX = this.facingDirection > 0 ? -Math.abs(this.visual.scaleX) : Math.abs(this.visual.scaleX);

    this.setPosition(Math.round(this.hitbox.x), Math.round(this.hitbox.y + this.hitbox.height * 0.5));
  }

  applyServerState(state, time = this.scene.time.now) {
    super.applyServerState(state, time);

    if (!state || !this.visual?.state) return;

    this.visual.scaleX = this.facingDirection > 0 ? -Math.abs(this.visual.scaleX) : Math.abs(this.visual.scaleX);

    if (state.alive === false) {
      this.setAnimation('idle', true);
      this.visual.setAlpha(0.35);
      return;
    }

    this.visual.setAlpha(1);
    this.setAnimation(state.state === 'run' ? 'run' : 'idle', true);
  }

  syncAnimation(time) {
    if (!this.visual?.state) return;

    if (this.isAttacking(time)) {
      this.setAnimation('idle', true);
      return;
    }
  }

  setAnimation(name, loop = true) {
    if (this.currentAnimation === name) return;
    this.currentAnimation = name;
    this.visual.state.setAnimation(0, name, loop);
  }

  takeDamage(amount, attackId = 0) {
    if (attackId && this.lastHitByAttackId === attackId) return false;
    if (attackId) this.lastHitByAttackId = attackId;

    this.hp = Math.max(0, this.hp - amount);
    this.visual.setAlpha(0.55);
    new DamagePopup(this.scene, this.hitbox.x, this.hitbox.y - this.hitbox.height * 0.5 - 8, amount, {
      color: '#fecaca',
      stroke: '#7f1d1d'
    });

    if (this.damageFlashTimer) {
      this.damageFlashTimer.remove();
      this.damageFlashTimer = null;
    }

    this.damageFlashTimer = this.scene.time.delayedCall(100, () => {
      this.damageFlashTimer = null;
      if (this.visual) {
        this.visual.setAlpha(1);
      }
    });

    return true;
  }
}