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

  update(time, delta, player) {
    if (!this.hitbox || !this.hitbox.body) {
      return;
    }

    const now = time ?? this.scene.time.now;
    this.currentPlatform = this.findStandingPlatform();

    if (player) {
      const playerBody = player.getPhysicsTarget();
      const distanceToPlayer = Phaser.Math.Distance.Between(this.hitbox.x, this.hitbox.y, playerBody.x, playerBody.y);
      const seesPlayer = distanceToPlayer <= this.detectionRadius;
      const distanceX = playerBody.x - this.hitbox.x;
      const absDistanceX = Math.abs(distanceX);

      this.facingDirection = distanceX >= 0 ? 1 : -1;

      if (seesPlayer && absDistanceX > this.attackStopDistance) {
        this.moveOnPlatform(this.facingDirection * this.moveSpeed, now);
      } else if (seesPlayer) {
        this.hitbox.body.setVelocityX(0);
      } else {
        this.updatePatrol(now);
      }
    } else {
      this.updatePatrol(now);
    }

    this.syncAttackZone(now);
    this.syncHpText();
    this.syncAnimation(now);
    this.visual.scaleX = this.facingDirection > 0 ? -Math.abs(this.visual.scaleX) : Math.abs(this.visual.scaleX);

    this.setPosition(Math.round(this.hitbox.x), Math.round(this.hitbox.y + this.hitbox.height * 0.5));

    if (player && this.canAttackPlayer(now, player)) {
      this.tryAttack(now, player);
    }
  }

  applyServerState(state, time = this.scene.time.now) {
    super.applyServerState(state, time);

    if (!state || !this.visual?.state) {
      return;
    }

    this.visual.scaleX = this.facingDirection > 0 ? -Math.abs(this.visual.scaleX) : Math.abs(this.visual.scaleX);

    if (state.alive === false) {
      this.setAnimation('idle', true);
      this.visual.setAlpha(0.35);
      return;
    }

    this.visual.setAlpha(1);
    this.setAnimation(state.state === 'run' ? 'run' : 'idle', true);
  }

  updatePatrol(time) {
    const bounds = this.getPatrolBounds();
    const leftBound = bounds.left;
    const rightBound = bounds.right;

    if (time < this.patrolPauseUntil) {
      this.hitbox.body.setVelocityX(0);
      return;
    }

    if (this.hitbox.x <= leftBound) {
      this.patrolDirection = 1;
      this.patrolPauseUntil = time + 220;
    } else if (this.hitbox.x >= rightBound) {
      this.patrolDirection = -1;
      this.patrolPauseUntil = time + 220;
    }

    this.facingDirection = this.patrolDirection;
    this.moveOnPlatform(this.patrolDirection * this.moveSpeed * 0.55, time);
  }

  syncAnimation(time) {
    if (!this.visual?.state) {
      return;
    }

    if (this.isAttacking(time)) {
      this.setAnimation('idle', true);
      return;
    }

    const movingHorizontally = Math.abs(this.hitbox.body.velocity.x) > 8;
    this.setAnimation(movingHorizontally ? 'run' : 'idle', true);
  }

  setAnimation(name, loop = true) {
    if (this.currentAnimation === name) {
      return;
    }

    this.currentAnimation = name;
    this.visual.state.setAnimation(0, name, loop);
  }

  takeDamage(amount, attackId = 0) {
    if (attackId && this.lastHitByAttackId === attackId) {
      return false;
    }

    if (attackId) {
      this.lastHitByAttackId = attackId;
    }

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

  findStandingPlatform() {
    const body = this.hitbox.body;
    if (!body || !this.scene.platforms) {
      return null;
    }

    return this.scene.platforms.getChildren().find((platform) => {
      const platformBody = platform.body;
      if (!platformBody) {
        return false;
      }

      const isOnTop = Math.abs(body.bottom - platformBody.top) <= 10;
      const overlapsX = body.right > platformBody.left + this.platformEdgeMargin && body.left < platformBody.right - this.platformEdgeMargin;

      return isOnTop && overlapsX;
    }) ?? null;
  }

  getPatrolBounds() {
    if (this.currentPlatform?.body) {
      return {
        left: this.currentPlatform.body.left + this.platformEdgeMargin,
        right: this.currentPlatform.body.right - this.platformEdgeMargin
      };
    }

    return {
      left: this.baseX - this.patrolRadius,
      right: this.baseX + this.patrolRadius
    };
  }

  moveOnPlatform(targetVelocityX, time) {
    const bounds = this.getPatrolBounds();
    const halfWidth = this.hitbox.width * 0.5;
    const nextLeft = this.hitbox.x - halfWidth;
    const nextRight = this.hitbox.x + halfWidth;

    if (targetVelocityX < 0 && nextLeft <= bounds.left) {
      this.patrolDirection = 1;
      this.facingDirection = 1;
      this.patrolPauseUntil = time + 220;
      this.hitbox.body.setVelocityX(0);
      return;
    }

    if (targetVelocityX > 0 && nextRight >= bounds.right) {
      this.patrolDirection = -1;
      this.facingDirection = -1;
      this.patrolPauseUntil = time + 220;
      this.hitbox.body.setVelocityX(0);
      return;
    }

    this.hitbox.body.setVelocityX(targetVelocityX);
  }
}
