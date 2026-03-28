const Phaser = window.Phaser;

export class Enemy extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    scene.add.existing(this);

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

    this.hitbox = scene.add.rectangle(x, y - 38, 76, 116, 0xef4444, 0.2).setStrokeStyle(2, 0xfca5a5, 0.95);
    scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setCollideWorldBounds(true);
    this.hitbox.body.setBounce(0, 0);
    this.hitbox.body.setDragX(1600);
    this.hitbox.body.setMaxVelocity(0, 1200);
    this.hitbox.body.setSize(76, 116);
    this.hitbox.body.setOffset(0, 0);

    this.visual = scene.add.rectangle(0, 0, 66, 106, 0xb91c1c, 0.85).setStrokeStyle(3, 0xfca5a5, 1);
    this.add(this.visual);

    this.hpText = scene.add.text(x, y - 118, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#fee2e2',
      stroke: '#450a0a',
      strokeThickness: 4
    }).setOrigin(0.5, 1);

    this.attackZone = scene.add.rectangle(x, y - 24, 65, 45, 0xf59e0b, 0.14).setStrokeStyle(2, 0xfbbf24, 0.95);
  }

  update(player) {
    if (!this.hitbox) {
      return;
    }

    if (player) {
      const playerBody = player.getPhysicsTarget();
      this.facingDirection = playerBody.x >= this.hitbox.x ? 1 : -1;
    }

    this.syncAttackZone();
    this.syncHpText();
    this.visual.setFillStyle(this.isAttacking() ? 0xf97316 : 0xb91c1c, this.isAttacking() ? 1 : 0.85);
    this.setPosition(Math.round(this.hitbox.x), Math.round(this.hitbox.y + this.hitbox.height * 0.5));

    if (player && this.canAttackPlayer(player)) {
      this.tryAttack(player);
    }
  }

  syncAttackZone() {
    const offsetX = (this.hitbox.width * 0.5 + this.attackZone.width * 0.5) * this.facingDirection;
    this.attackZone.setPosition(Math.round(this.hitbox.x + offsetX), Math.round(this.hitbox.y - 6));
    this.attackZone.setFillStyle(0xf59e0b, this.isAttacking() ? 0.26 : 0.14);
  }

  syncHpText() {
    this.hpText.setPosition(Math.round(this.hitbox.x), Math.round(this.hitbox.y - this.hitbox.height * 0.5 - 14));
    this.hpText.setText(`HP ${this.hp}/${this.maxHp}`);
  }

  canAttackPlayer(player) {
    const now = this.scene.time.now;

    if (now - this.lastAttackAt < this.attackCooldownMs) {
      return false;
    }

    return Phaser.Geom.Intersects.RectangleToRectangle(
      this.attackZone.getBounds(),
      player.getPhysicsTarget().getBounds()
    );
  }

  tryAttack(player) {
    const now = this.scene.time.now;

    if (now - this.lastAttackAt < this.attackCooldownMs) {
      return false;
    }

    this.lastAttackAt = now;
    this.attackUntil = now + this.attackDurationMs;
    player.takeDamage(this.baseDamage);
    this.syncAttackZone();
    return true;
  }

  isAttacking() {
    return this.scene.time.now < this.attackUntil;
  }

  takeDamage(amount, attackId = 0) {
    if (attackId && this.lastHitByAttackId === attackId) {
      return false;
    }

    if (attackId) {
      this.lastHitByAttackId = attackId;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.visual.setFillStyle(0xf87171, 1);

    if (this.damageFlashTimer) {
      this.damageFlashTimer.remove(false);
      this.damageFlashTimer = null;
    }

    this.damageFlashTimer = this.scene.time.delayedCall(100, () => {
      this.damageFlashTimer = null;
      if (this.visual) {
        this.visual.setFillStyle(this.isAttacking() ? 0xf97316 : 0xb91c1c, this.isAttacking() ? 1 : 0.85);
      }
    });

    return true;
  }

  getPhysicsTarget() {
    return this.hitbox;
  }

  getHp() {
    return this.hp;
  }

  isDead() {
    return this.hp <= 0;
  }

  destroy(fromScene) {
    if (this.damageFlashTimer) {
      this.damageFlashTimer.remove(false);
      this.damageFlashTimer = null;
    }

    if (this.hpText) {
      this.hpText.destroy();
      this.hpText = null;
    }

    if (this.attackZone) {
      this.attackZone.destroy();
      this.attackZone = null;
    }

    if (this.hitbox) {
      this.hitbox.destroy();
      this.hitbox = null;
    }

    super.destroy(fromScene);
  }
}
