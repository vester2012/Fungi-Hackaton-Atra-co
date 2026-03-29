// File: client/src/game/entities/Enemy.js

const Phaser = window.Phaser;
import { HealthIndicator } from "./HealthIndicator.js";
import { DamagePopup } from "./DamagePopup.js";
import { unit_manager } from "../unit_manager.js";

export class Enemy extends Phaser.GameObjects.Container {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y);

    scene.add.existing(this);

    this.id = options.id ?? null;
    this.maxHp = 100;
    this.hp = 100;
    this.baseDamage = 10;
    this.attackCooldownMs = 2000;
    this.attackDurationMs = 220;
    this.lastAttackAt = -this.attackCooldownMs;
    this.attackUntil = 0;
    this.facingDirection = -1;
    this.lastHitByAttackId = 0;
    this.damageFlashTimer = null;
    this.showStats = options.showStats ?? true;

    this.hitbox = scene.add.rectangle(x, y - 38, 76, 116, 0xef4444, 0.2).setStrokeStyle(2, 0xfca5a5, 0.95);
    scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setCollideWorldBounds(true);
    this.hitbox.body.setBounce(0, 0);
    this.hitbox.body.setDragX(1600);
    this.hitbox.body.setMaxVelocity(0, 1200);
    this.hitbox.body.setSize(76, 116);
    this.hitbox.body.setOffset(0, 0);

    // [FIX] Отключаем гравитацию на клиенте, так как сервер отправляет абсолютный Y
    this.hitbox.body.setAllowGravity(false);

    this.visual = scene.add.rectangle(0, 0, 66, 106, 0xb91c1c, 0.85).setStrokeStyle(3, 0xfca5a5, 1);
    this.add(this.visual);

    this.healthIndicator = new HealthIndicator(scene, x, y, {
      textOffsetY: 0,
      barOffsetY: 10,
      textColor: '#fee2e2',
      textStroke: '#450a0a'
    });

    this.attackZone = scene.add.rectangle(x, y - 24, 45, 45, 0xf59e0b, 0.14).setStrokeStyle(2, 0xfbbf24, 0.95);
  }

  update(time, delta, player) {
    if (!this.hitbox || !this.hitbox.body) return;

    this.syncAttackZone(time);
    this.syncHpText();
    this.visual.setFillStyle(this.isAttacking(time) ? 0xf97316 : 0xb91c1c, this.isAttacking(time) ? 1 : 0.85);

    this.setPosition(Math.round(this.hitbox.x), Math.round(this.hitbox.y + this.hitbox.height * 0.5));
  }

  applyServerState(state, time = this.scene.time.now) {
    if (!state || !this.hitbox?.body) return;

    this.facingDirection = state.facingDirection ?? this.facingDirection;
    this.hp = Phaser.Math.Clamp(state.hp ?? this.hp, 0, this.maxHp);
    this.hitbox.body.enable = state.alive !== false;
    this.attackZone.setVisible(state.alive !== false);

    if (typeof state.x === 'number' && typeof state.y === 'number') {
      this.hitbox.body.reset(state.x, state.y);
    }

    this.syncAttackZone(time);
    this.syncHpText();
    this.applyVisualState(state, time);
    this.setPosition(Math.round(this.hitbox.x), Math.round(this.hitbox.y + this.hitbox.height * 0.5));
  }

  applyVisualState(state, time = this.scene.time.now) {
    const isAttackState = state.state === 'attack' || this.isAttacking(time);
    if (this.visual.setFillStyle) this.visual.setFillStyle(isAttackState ? 0xf97316 : 0xb91c1c, isAttackState ? 1 : 0.85);
  }

  syncHpText() {
    if (!this.active || !this.showStats || !this.healthIndicator) return;
    const textX = Math.round(this.hitbox.x);
    const textY = Math.round(this.hitbox.y - this.hitbox.height * 0.5 - 14);
    this.healthIndicator.setPosition(textX, textY - 20);
    this.healthIndicator.updateHp(this.hp, this.maxHp);
  }

  syncAttackZone(time) {
    const offsetX = (this.hitbox.width * 0.5 + this.attackZone.width * 0.5) * this.facingDirection;
    this.attackZone.setPosition(Math.round(this.hitbox.x + offsetX), Math.round(this.hitbox.y - 6));
    this.attackZone.setFillStyle(0xf59e0b, this.isAttacking(time) ? 0.26 : 0.14);
  }

  isAttacking(time) {
    const now = time ?? this.scene.time.now;
    return now < this.attackUntil;
  }

  canAttackPlayer(time, player) {
    if (time - this.lastAttackAt < this.attackCooldownMs) return false;
    return Phaser.Geom.Intersects.RectangleToRectangle(
        this.attackZone.getBounds(),
        player.getPhysicsTarget().getBounds()
    );
  }

  tryAttack(time, player) {
    this.lastAttackAt = time;
    this.attackUntil = time + this.attackDurationMs;

    player.takeDamage(this.baseDamage);
    if (unit_manager.socket && player.getHp) {
      unit_manager.socket.emit('playerDamagedByEnemy', {
        hp: player.getHp(),
        damage: this.baseDamage
      });
    }
    this.syncAttackZone(time);
    return true;
  }

  takeDamage(amount, attackId = 0) {
    if (attackId && this.lastHitByAttackId === attackId) return false;
    if (attackId) this.lastHitByAttackId = attackId;

    this.hp = Math.max(0, this.hp - amount);
    this.visual.setFillStyle(0xf87171, 1);
    new DamagePopup(this.scene, this.hitbox.x, this.hitbox.y - this.hitbox.height * 0.5 - 8, amount, { color: '#fecaca', stroke: '#7f1d1d' });

    if (this.damageFlashTimer) {
      this.damageFlashTimer.remove();
      this.damageFlashTimer = null;
    }

    this.damageFlashTimer = this.scene.time.delayedCall(100, () => {
      this.damageFlashTimer = null;
      if (this.visual) {
        this.visual.setFillStyle(this.isAttacking(this.scene.time.now) ? 0xf97316 : 0xb91c1c, 0.85);
      }
    });

    return true;
  }

  getPhysicsTarget() { return this.hitbox; }
  getHp() { return this.hp; }

  setHp(nextHp) {
    this.hp = Phaser.Math.Clamp(nextHp, 0, this.maxHp);
    this.syncHpText();
    return this.hp;
  }

  isDead() { return this.hp <= 0; }

  destroy(fromScene) {
    if (this.damageFlashTimer) this.damageFlashTimer.remove();
    if (this.healthIndicator) this.healthIndicator.destroy();
    if (this.attackZone) this.attackZone.destroy();

    if (this.hitbox) {
      this.hitbox.destroy();
    }

    super.destroy(fromScene);
  }
}