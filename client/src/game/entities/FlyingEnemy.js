const Phaser = window.Phaser;

import { Enemy } from "./Enemy.js";
import { DamagePopup } from "./DamagePopup.js";

export class FlyingEnemy extends Enemy {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y, options);

    this.maxHp = 20;
    this.hp = 20;
    this.usesPlatformCollider = false;
    this.baseX = x;
    this.baseY = y - 38;
    this.hoverAmplitude = options.hoverAmplitude ?? 36;
    this.hoverSpeed = options.hoverSpeed ?? 0.003;
    this.horizontalLerp = options.horizontalLerp ?? 0.02;
    this.verticalLerp = options.verticalLerp ?? 0.04;
    this.hoverPhase = options.hoverPhase ?? Math.random() * Math.PI * 2;
    this.approachGap = options.approachGap ?? 18;
    this.verticalAttackOffset = options.verticalAttackOffset ?? -8;
    this.deadAt = 0;
    this.deathAnimationDurationMs = 600;

    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);

    if (this.visual) {
      this.visual.destroy();
    }

    this.visual = scene.add.spine(0, -50, 'enemy_bee_SPO', 'idle', true);
    this.visual.setScale(0.5);
    this.add(this.visual);
  }

  update(time, delta, player) {
    if (!this.hitbox || !this.hitbox.body) {
      return;
    }

    const now = time ?? this.scene.time.now;

    if (this.isDead()) {
      this.syncHpText();
      this.syncAttackZone(now);
      this.setPosition(Math.round(this.hitbox.x), Math.round(this.hitbox.y + this.hitbox.height * 0.5));
      return;
    }

    if (player) {
      const playerBody = player.getPhysicsTarget();
      this.facingDirection = playerBody.x >= this.hitbox.x ? 1 : -1;

      const hoverOffsetY = Math.sin(now * this.hoverSpeed + this.hoverPhase) * this.hoverAmplitude;
      const playerHalfWidth = playerBody.width * 0.5;
      const enemyHalfWidth = this.hitbox.width * 0.5;
      const targetEdgeX = this.facingDirection > 0
        ? playerBody.x - playerHalfWidth - enemyHalfWidth - this.approachGap
        : playerBody.x + playerHalfWidth + enemyHalfWidth + this.approachGap;
      const desiredX = Phaser.Math.Linear(this.hitbox.x, targetEdgeX, this.horizontalLerp);
      const targetY = playerBody.y + this.verticalAttackOffset + hoverOffsetY;
      const desiredY = Phaser.Math.Linear(this.hitbox.y, targetY, this.verticalLerp);
      this.hitbox.body.reset(desiredX, desiredY);
    } else {
      const hoverY = this.baseY + Math.sin(now * this.hoverSpeed + this.hoverPhase) * this.hoverAmplitude;
      this.hitbox.body.reset(this.baseX, hoverY);
    }

    this.visual.scaleX = this.facingDirection < 0 ? Math.abs(this.visual.scaleX) : -Math.abs(this.visual.scaleX);
    if (this.isAttacking(now)) {
      this.visual.state.setAnimation(0, 'attack', false);
      this.visual.state.addAnimation(0, 'idle', true, 0);
      this.attackUntil = 0;
    }
    this.syncAttackZone(now);
    this.syncHpText();
    this.setPosition(Math.round(this.hitbox.x), Math.round(this.hitbox.y + this.hitbox.height * 0.5));

    if (player && this.canAttackPlayer(now, player)) {
      this.tryAttack(now, player);
    }
  }

  takeDamage(amount, attackId = 0) {
    if (attackId && this.lastHitByAttackId === attackId) {
      return false;
    }

    if (attackId) {
      this.lastHitByAttackId = attackId;
    }

    this.hp = Math.max(0, this.hp - amount);
    new DamagePopup(this.scene, this.hitbox.x, this.hitbox.y - this.hitbox.height * 0.5 - 8, amount, {
      color: '#fde68a',
      stroke: '#92400e'
    });

    if (this.hp <= 0) {
      this.deadAt = this.scene.time.now;
      this.hitbox.body.enable = false;
      this.attackZone.setVisible(false);
      this.visual.state.setAnimation(0, 'dead', false);
      this.syncHpText();
      return true;
    }

    this.visual.setAlpha(0.55);

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

  isReadyToDestroy(time = this.scene.time.now) {
    if (!this.isDead()) {
      return false;
    }

    return time - this.deadAt >= this.deathAnimationDurationMs;
  }
}
