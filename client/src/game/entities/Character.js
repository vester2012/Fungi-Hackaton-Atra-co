import {InputManager} from "../managers/InputManager";

const Phaser = window.Phaser;
import {unit_manager} from "../unit_manager.js";

export class Character extends Phaser.GameObjects.Container {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y);

    scene.add.existing(this);
    this.controller = new InputManager(scene);
    this.hitboxOffsetY = -44;
    this.hitbox = scene.add.rectangle(x, y + this.hitboxOffsetY, 80, 130, 0x38bdf8, 0.18).setStrokeStyle(2, 0x7dd3fc, 0.9);

    scene.physics.add.existing(this.hitbox);

    this.hitbox.body.setCollideWorldBounds(true);
    this.hitbox.body.setBounce(0, 0);
    this.hitbox.body.setDragX(1600);
    this.hitbox.body.setMaxVelocity(420, 1200);
    this.hitbox.body.setSize(80, 130);
    this.hitbox.body.setOffset(0, 0);

    this.moveSpeed = 400;
    this.jumpSpeed = 800;
    this.maxJumps = 2;
    this.jumpCount = 0;
    this.maxHp = 100;
    this.hp = 100;
    this.baseDamage = 10;
    this.attackCooldownMs = 250;
    this.attackDurationMs = 120;
    this.attackRange = 110;
    this.attackWidth = 90;
    this.attackHeight = 80;
    this.lastAttackAt = -this.attackCooldownMs;
    this.attackUntil = 0;
    this.attackId = 0;
    this.facingDirection = 1;
    this.lastExternalX = x;
    this.isSyncingFromHitbox = false;
    this.showStats = options.showStats ?? true;
    this.currentAnimation = 'idle';
    this.lastDownTapAt = 0;
    this.dropThroughUntil = 0;
    this.downTapWindowMs = 250;
    this.dropThroughDurationMs = 220;

    this.anim = scene.add.spine(0, 0, 'person_SPO', 'idle', true);
    this.anim.setScale(0.15);
    this.anim.setMix('run', 'idle', 0.25);

    this.add(this.anim);

    if (this.showStats) {
      this.hpText = scene.add.text(0, -150, '', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#e2e8f0',
        stroke: '#0f172a',
        strokeThickness: 4
      }).setOrigin(0.5, 1);

      this.add(this.hpText);
    }

    this.attackHitbox = scene.add.rectangle(x, y, this.attackWidth, this.attackHeight, 0xf97316, 0.2).setStrokeStyle(2, 0xfb923c, 0.95).setVisible(false);

    this.syncHpText();
  }

  update() {
    this.controller.update();

    const now = this.scene.time.now;
    const leftPressed = this.controller.left;
    const rightPressed = this.controller.right;
    const jumpPressed = this.controller.jumpJustPressed;
    const attackPressed = this.controller.attackJustPressed;
    const downPressed = this.controller.downJustPressed;

    const isGrounded = this.hitbox.body.blocked.down || this.hitbox.body.touching.down;
    const movingHorizontally = leftPressed !== rightPressed;

    if (isGrounded) {
      this.jumpCount = 0;
    }

    if (downPressed) {
      if (now - this.lastDownTapAt <= this.downTapWindowMs && isGrounded && this.isStandingOnDropThroughPlatform()) {
        this.dropThroughUntil = now + this.dropThroughDurationMs;
        this.hitbox.body.setVelocityY(120);
      }

      this.lastDownTapAt = now;
    }

    if (leftPressed && !rightPressed) {
      this.hitbox.body.setVelocityX(-this.moveSpeed);
      this.applyFacingDirection(-1);
    } else if (rightPressed && !leftPressed) {
      this.hitbox.body.setVelocityX(this.moveSpeed);
      this.applyFacingDirection(1);
    } else {
      this.hitbox.body.setVelocityX(0);
    }

    if (jumpPressed && this.jumpCount < this.maxJumps) {
      this.hitbox.body.setVelocityY(-this.jumpSpeed);
      this.jumpCount += 1;
    }

    if (attackPressed) {
      if (this.tryAttack(now)) {
        this.playAttackAnimation();
      }
    }

    if (!this.isAttacking()) {
      this.setAnimation(movingHorizontally ? 'run' : 'idle', true);
    }
    this.syncContainerToHitbox();
  }

  getPhysicsTarget() {
    return this.hitbox;
  }

  isDroppingThroughPlatform() {
    return this.scene.time.now < this.dropThroughUntil;
  }

  isStandingOnDropThroughPlatform() {
    const body = this.hitbox.body;
    const feetX = body.center.x;
    const feetY = body.bottom + 2;

    return this.scene.platforms.getChildren().some((platform) => {
      if (!platform.isDropThrough) {
        return false;
      }

      const halfWidth = platform.width * 0.5;
      const nearTop = Math.abs(body.bottom - platform.body.top) <= 8;
      const withinWidth = feetX >= platform.x - halfWidth && feetX <= platform.x + halfWidth;
      const abovePlatform = feetY >= platform.body.top && feetY <= platform.body.top + 12;

      return nearTop && withinWidth && abovePlatform;
    });
  }

  syncContainerToHitbox() {
    this.isSyncingFromHitbox = true;
    super.setPosition(Math.round(this.hitbox.x), Math.round(this.hitbox.y + this.hitbox.height * 0.5));
    this.isSyncingFromHitbox = false;
    this.syncHpText();
    this.syncAttackHitbox();
  }

  syncHpText() {
    if (!this.showStats || !this.hpText || !this.hitbox) {
      return;
    }

    this.hpText.setText(`HP ${this.hp}/${this.maxHp}`);
  }

  syncAttackHitbox() {
    const isActive = this.isAttacking();
    const directionOffset = (this.hitbox.width * 0.5 + this.attackWidth * 0.5) * this.facingDirection;

    this.attackHitbox.setPosition(
      Math.round(this.hitbox.x + directionOffset),
      Math.round(this.hitbox.y - 8)
    );
    this.attackHitbox.setVisible(isActive);
  }

  applyFacingDirection(direction) {
    if (!direction || direction === this.facingDirection) {
      return;
    }

    this.facingDirection = direction;
    this.anim.scaleX = direction < 0 ? -Math.abs(this.anim.scaleX) : Math.abs(this.anim.scaleX);
  }

  setPosition(x, y, z, w) {
    super.setPosition(x, y, z, w);

    if (this.isSyncingFromHitbox || !this.hitbox?.body) {
      return this;
    }

    const deltaX = x - this.lastExternalX;
    if (deltaX !== 0) {
      this.applyFacingDirection(deltaX < 0 ? -1 : 1);
    }
    this.lastExternalX = x;

    this.hitbox.body.reset(x, y + this.hitboxOffsetY);
    this.syncAttackHitbox();
    return this;
  }

  tryAttack(now = this.scene.time.now) {
    if (now - this.lastAttackAt < this.attackCooldownMs) {
      return false;
    }

    this.lastAttackAt = now;
    this.attackUntil = now + this.attackDurationMs;
    this.attackId += 1;
    this.syncAttackHitbox();

    if (unit_manager.socket) {
      unit_manager.socket.emit('playerAttack', { attackId: this.attackId });
    }

    return true;
  }

  playAttackAnimation() {
    this.anim.off('complete');
    this.anim.play('hit_low');
    this.anim.on('complete', () => {
      this.anim.off('complete');
      this.anim.play('idle', true);
    });
  }

  playRemoteAttack(now = this.scene.time.now) {
    this.lastAttackAt = now;
    this.attackUntil = now + this.attackDurationMs;
    this.syncAttackHitbox();
    this.playAttackAnimation();
  }

  applyRemoteState(x, y, now = this.scene.time.now) {
    const previousX = this.x;
    const previousY = this.y;
    const movedX = x - previousX;
    const movedY = y - previousY;
    const isMoving = Math.abs(movedX) > 1 || Math.abs(movedY) > 1;

    this.setPosition(x, y);

    if (movedX !== 0) {
      this.applyFacingDirection(movedX < 0 ? -1 : 1);
    }

    if (!this.isAttacking()) {
      this.setAnimation(isMoving ? 'run' : 'idle', true);
    }

    this.syncAttackHitbox();
  }

  isAttacking() {
    return this.scene.time.now < this.attackUntil;
  }

  getAttackDamage() {
    return this.baseDamage;
  }

  getAttackHitbox() {
    return this.attackHitbox;
  }

  getAttackId() {
    return this.attackId;
  }

  getHp() {
    return this.hp;
  }

  getMaxHp() {
    return this.maxHp;
  }

  isDead() {
    return this.hp <= 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.syncHpText();
    return this.hp;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.syncHpText();
    return this.hp;
  }

  shouldCollideWithPlatform(platform) {
    if (!platform.isDropThrough) {
      return true;
    }

    if (this.isDroppingThroughPlatform()) {
      return false;
    }

    const body = this.hitbox.body;
    const platformTop = platform.body.top;
    const bodyBottom = body.bottom;
    const previousBottom = bodyBottom - body.velocity.y * this.scene.game.loop.delta / 1000;
    const fallingOrStill = body.velocity.y >= 0;

    return fallingOrStill && previousBottom <= platformTop + 8;
  }

  setAnimation(name, loop) {
    if (this.currentAnimation === name) {
      return;
    }

    this.currentAnimation = name;
    this.anim.play(name, loop);
  }

  destroy(fromScene) {
    if (this.hpText) {
      this.hpText.destroy();
      this.hpText = null;
    }

    if (this.attackHitbox) {
      this.attackHitbox.destroy();
      this.attackHitbox = null;
    }

    if (this.hitbox) {
      this.hitbox.destroy();
      this.hitbox = null;
    }

    // Если нужно, чистим ивенты инпута
    if (this.controller) {
      this.controller = null;
    }

    super.destroy(fromScene);
  }
}
