import { InputManager } from "../managers/InputManager";
import { HealthIndicator } from "./HealthIndicator.js";
import { DamagePopup } from "./DamagePopup.js";
const Phaser = window.Phaser;
import { unit_manager } from "../unit_manager.js";

export class Character extends Phaser.GameObjects.Container {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y);

    scene.add.existing(this);
    this.controller = new InputManager(scene);
    this.hitboxOffsetY = -44;

    // Создание хитбокса
    this.hitbox = scene.add.rectangle(x, y + this.hitboxOffsetY, 120, 170, 0x38bdf8, 0.18).setStrokeStyle(2, 0x7dd3fc, 0.9);
    scene.physics.add.existing(this.hitbox);

    // Ссылка для ZoneManager
    this.hitbox.parentCharacter = this;

    // Настройки физики
    this.hitbox.body.setCollideWorldBounds(true);
    this.hitbox.body.setBounce(0, 0);
    this.hitbox.body.setDragX(1600);
    this.hitbox.body.setMaxVelocity(600, 1200); // Немного увеличил макс. скорость для сочности прыжка
    this.hitbox.body.setSize(this.hitbox.width, this.hitbox.height);
    this.hitbox.body.setOffset(0, 0);

    // Параметры движения
    this.moveSpeed = 400;
    this.jumpSpeed = 800;
    this.maxJumps = 2;
    this.jumpCount = 0;

    // --- ПАРАМЕТРЫ СКОЛЬЖЕНИЯ ПО СТЕНЕ (WALL SLIDE) ---
    this.wallSlideMaxSpeed = 160; // Скорость падения по стене
    this.wallJumpForceX = 550;   // Сила отскока от стены по горизонтали
    this.wallJumpForceY = 750;   // Сила отскока от стены по вертикали
    this.wallSlideState = {
      isActive: false,
      direction: 0,
      lastActiveTime: 0
    };

    // Параметры боя
    this.maxHp = 100;
    this.hp = 100;
    this.baseDamage = 10;
    this.attackCooldownMs = 250;
    this.attackDurationMs = 300;
    this.hitDurationMs = 250;
    this.attackRange = 110;
    this.attackWidth = 50;
    this.attackHeight = 80;
    this.lastAttackAt = -this.attackCooldownMs;
    this.attackUntil = 0;
    this.hitUntil = 0;
    this.attackId = 0;

    // Другие стейты
    this.facingDirection = 1;
    this.lastExternalX = x;
    this.isSyncingFromHitbox = false;
    this.showStats = options.showStats ?? true;
    this.nickname = options.nickname ?? 'Player';
    this.currentAnimation = 'idle';
    this.lastDownTapAt = 0;
    this.dropThroughUntil = 0;
    this.downTapWindowMs = 250;
    this.dropThroughDurationMs = 220;

    // Анимации Spine
    this.anim = scene.add.spine(0, -90, 'fish_SPO', 'idle', true);
    this.anim.setScale(0.1);
    this.anim.setMix('run', 'idle', 0.25);
    this.anim.setMix('jump', 'fly', 0.25);
    this.anim.setMix('fly', 'jump', 0.25);
    this.add(this.anim);

    if (this.showStats) {
      this.healthIndicator = new HealthIndicator(scene, 0, -250, {nickname: this.nickname, textOffsetY: 0, barOffsetY: 14, textColor: '#e2e8f0', textStroke: '#0f172a'});
      this.add(this.healthIndicator);
    }

    this.attackHitbox = scene.add.rectangle(x, y, this.attackWidth, this.attackHeight, 0xf97316, 0.2).setStrokeStyle(2, 0xfb923c, 0.95).setVisible(false);

    this.syncHpText();
    this.events = new Phaser.Events.EventEmitter();
  }

  // Обновляем сигнатуру метода
  update(time = this.scene.time.now, delta = this.scene.game.loop.delta) {
    this.controller.update();
    const now = time; // Используем время из аргумента
    const dt = delta / 1000; // Дельта в секундах для расчетов

    const leftPressed = this.controller.left;
    const rightPressed = this.controller.right;
    const jumpPressed = this.controller.jumpJustPressed;
    const attackPressed = this.controller.attackJustPressed;
    const downPressed = this.controller.downJustPressed;

    const isGrounded = this.hitbox.body.blocked.down || this.hitbox.body.touching.down;
    const movingHorizontally = leftPressed !== rightPressed;

    if (now - this.wallSlideState.lastActiveTime > 100) {
      this.wallSlideState.isActive = false;
    }

    if (isGrounded) {
      this.jumpCount = 0;
      this.wallSlideState.isActive = false;
    }

    if (jumpPressed) {
      if (this.wallSlideState.isActive && !isGrounded) {
        const jumpDir = -this.wallSlideState.direction;
        this.hitbox.body.setVelocity(jumpDir * this.wallJumpForceX, -this.wallJumpForceY);
        this.applyFacingDirection(jumpDir);
        this.jumpCount = 1;
        this.wallSlideState.isActive = false;
        this.playJumpSound();
      } else if (this.jumpCount < this.maxJumps) {
        this.hitbox.body.setVelocityY(-this.jumpSpeed);
        this.jumpCount += 1;
        this.playJumpSound();
      }
    }

    if (this.wallSlideState.isActive && !isGrounded) {
      if (this.hitbox.body.velocity.y > this.wallSlideMaxSpeed) {
        this.hitbox.body.setVelocityY(this.wallSlideMaxSpeed);
      }
    }

    const isWallJumping = !isGrounded && Math.abs(this.hitbox.body.velocity.x) > this.moveSpeed;

    if (!isWallJumping) {
      if (leftPressed && !rightPressed) {
        this.hitbox.body.setVelocityX(-this.moveSpeed);
        this.applyFacingDirection(-1);
      } else if (rightPressed && !leftPressed) {
        this.hitbox.body.setVelocityX(this.moveSpeed);
        this.applyFacingDirection(1);
      } else {
        this.hitbox.body.setVelocityX(0);
      }
    }

    if (downPressed) {
      if (now - this.lastDownTapAt <= 350 && isGrounded && this.isStandingOnDropThroughPlatform()) {
        this.dropThroughUntil = now + this.dropThroughDurationMs;
        // Delta time fix: вместо жесткого +5, сдвигаем на величину, зависящую от скорости падения
        this.hitbox.y += 300 * dt;
        this.hitbox.body.setVelocityY(200);
      }
      this.lastDownTapAt = now;
    }

    if (attackPressed) {
      if (this.tryAttack(now)) {
        this.playKickSound();
        this.playAttackAnimation(movingHorizontally && isGrounded);
      }
    }

    if (!this.isAttacking() && !this.isHit()) {
      if (!isGrounded) {
        this.setAnimation(this.hitbox.body.velocity.y < 0 ? 'jump' : 'fly');
      } else if (this.wallSlideState.isActive) {
        this.setAnimation('fly');
      } else {
        this.setAnimation(movingHorizontally ? 'run' : 'idle', true);
      }
    }
    if (this.currentTint !== undefined) {
      this.applySlotColor('body', this.currentTint);
    }
    this.syncContainerToHitbox();
  }

  // МЕТОД ДЛЯ ЗОН (ВЫЗЫВАЕТСЯ ИЗ WallSlideZone)
  setWallSliding(direction) {
    this.wallSlideState.isActive = true;
    this.wallSlideState.direction = direction;
    this.wallSlideState.lastActiveTime = this.scene.time.now;
  }

  getPhysicsTarget() {
    return this.hitbox;
  }

  isDroppingThroughPlatform() {
    return this.scene.time.now < this.dropThroughUntil;
  }

  isStandingOnDropThroughPlatform() {
    const body = this.hitbox.body;
    return this.scene.platforms.getChildren().some((platform) => {
      if (!platform.isDropThrough) return false;

      // 1. Проверяем, что низ игрока совпадает с верхом платформы (с допуском 5 пикселей)
      const isOnTop = Math.abs(body.bottom - platform.body.top) <= 5;

      // 2. Проверяем, что игрок находится внутри ширины платформы
      const isWithinX = body.right > platform.body.left && body.left < platform.body.right;

      return isOnTop && isWithinX;
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
    if (!this.showStats || !this.healthIndicator || !this.hitbox) return;
    this.healthIndicator.updateHp(this.hp, this.maxHp);
  }

  syncAttackHitbox() {
    const isActive = this.isAttacking();
    const directionOffset = (this.hitbox.width * 0.5 + this.attackWidth * 0.5) * this.facingDirection;
    this.attackHitbox.setPosition(Math.round(this.hitbox.x + directionOffset), Math.round(this.hitbox.y - 8));
    this.attackHitbox.setVisible(isActive);
  }

  applyFacingDirection(direction) {
    if (!direction || direction === this.facingDirection) return;
    this.facingDirection = direction;
    this.anim.scaleX = direction < 0 ? -Math.abs(this.anim.scaleX) : Math.abs(this.anim.scaleX);
  }

  setPosition(x, y, z, w) {
    super.setPosition(x, y, z, w);
    if (this.isSyncingFromHitbox || !this.hitbox?.body) return this;
    const deltaX = x - this.lastExternalX;
    if (deltaX !== 0) this.applyFacingDirection(deltaX < 0 ? -1 : 1);
    this.lastExternalX = x;
    this.hitbox.body.reset(x, y + this.hitboxOffsetY);
    this.syncAttackHitbox();
    return this;
  }

  tryAttack(now = this.scene.time.now) {
    if (now - this.lastAttackAt < this.attackCooldownMs) return false;
    this.lastAttackAt = now;
    this.attackUntil = now + this.attackDurationMs;
    this.attackId += 1;
    this.syncAttackHitbox();
    this.events.emit('attack');

    if (unit_manager.socket) unit_manager.socket.emit('playerAttack', { attackId: this.attackId });
    return true;
  }

  playAttackAnimation(isRunningAttack = false) {
    this.anim.off('complete');
    this.anim.play(isRunningAttack ? 'run_and_attack' : 'attack_1');
    this.anim.on('complete', () => {
      this.anim.off('complete');
      this.currentAnimation = '';
    });
  }

  playRemoteAttack(now = this.scene.time.now) {
    this.lastAttackAt = now;
    this.attackUntil = now + this.attackDurationMs;
    this.syncAttackHitbox();
    this.playAttackAnimation();
  }

  playHitAnimation(now = this.scene.time.now) {
    this.hitUntil = now + this.hitDurationMs;
    this.anim.off('complete');
    this.anim.play('hit_1');
    this.anim.on('complete', () => {
      this.anim.off('complete');
      this.currentAnimation = '';
    });
  }

  playJumpSound() {
    const jumpSoundKeys = ['jump', 'jump1', 'jump2', 'jump3'];

    if (this.scene.sound.locked) {
      return;
    }

    const key = Phaser.Utils.Array.GetRandom(jumpSoundKeys);
    this.scene.sound.play(key, { volume: 0.1 });
  }

  playKickSound() {
    const kickSoundKeys = ['kick', 'kick1'];

    if (this.scene.sound.locked) {
      return;
    }

    const key = Phaser.Utils.Array.GetRandom(kickSoundKeys);
    this.scene.sound.play(key, { volume: 0.2 });
  }


  applyRemoteState(x, y, now = this.scene.time.now) {
    const movedX = x - this.x;
    const movedY = y - this.y;
    const isMoving = Math.abs(movedX) > 1;
    this.setPosition(x, y);
    if (movedX !== 0) this.applyFacingDirection(movedX < 0 ? -1 : 1);
    if (!this.isAttacking() && !this.isHit()) {
      if (Math.abs(movedY) > 1) {
        this.setAnimation(movedY < 0 ? 'jump' : 'fly');
      } else {
        this.setAnimation(isMoving ? 'run' : 'idle', true);
      }
    }
    this.syncAttackHitbox();
  }

  isAttacking() {
    return this.scene.time.now < this.attackUntil;
  }

  isHit() {
    return this.scene.time.now < this.hitUntil;
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

  setHp(nextHp) {
    this.hp = Phaser.Math.Clamp(nextHp, 0, this.maxHp);
    this.syncHpText();
    return this.hp;
  }

  applySyncedDamage(amount, nextHp = null) {
    if (typeof nextHp === 'number') {
      this.hp = Phaser.Math.Clamp(nextHp, 0, this.maxHp);
    } else {
      this.hp = Math.max(0, this.hp - amount);
    }

    this.syncHpText();
    new DamagePopup(this.scene, this.hitbox.x, this.hitbox.y - this.hitbox.height * 0.5 - 8, amount);
    return this.hp;
  }

  isDead() {
    return this.hp <= 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.syncHpText();
    this.playHitAnimation();
    new DamagePopup(this.scene, this.hitbox.x, this.hitbox.y - this.hitbox.height * 0.5 - 8, amount);
    return this.hp;
  }

  shouldCollideWithPlatform(platform) {
    // Твердые платформы — всегда сталкиваемся
    if (!platform.isDropThrough) return true;

    // Если активировано падение (спрыгивание вниз двойным кликом S / Вниз) — отключаем коллизию!
    if (this.isDroppingThroughPlatform()) return false;
    
    return true;
  }


  setAnimation(name, loop) {
    if (this.currentAnimation === name) return;
    this.currentAnimation = name;
    this.anim.play(name, loop);
  }
  /**
   * Устанавливает цвет для конкретного слота Spine
   * @param {string} slotName - Имя слота из Spine (например, 'body', 'hat', 'hand_l')
   * @param {number} colorHex - Цвет в формате 0xRRGGBB
   */
  setSlotColor(slotName, colorHex) {
    this.currentTint = colorHex; // Запоминаем для update
    this.applySlotColor(slotName, colorHex);
  }
  applySlotColor(slotName, colorHex) {
    if (!this.anim || !this.anim.skeleton) return;
    const slot = this.anim.skeleton.findSlot(slotName);
    if (slot) {
      const phaserColor = Phaser.Display.Color.ValueToColor(colorHex);
      slot.color.r = phaserColor.red / 255;
      slot.color.g = phaserColor.green / 255;
      slot.color.b = phaserColor.blue / 255;
    }
  }
  destroy(fromScene) {
    // 1. Снимаем все слушатели с собственного эмиттера
    if (this.events) {
      this.events.removeAllListeners();
      this.events.destroy(); // В новых версиях Phaser лучше использовать destroy вместо shutdown
    }

    // 2. Явно уничтожаем Spine объект
    if (this.anim) {
      this.anim.destroy();
      this.anim = null;
    }

    if (this.healthIndicator) {
      this.healthIndicator.destroy();
    }

    if (this.attackHitbox) {
      this.attackHitbox.destroy();
    }

    if (this.hitbox) {
      // Удален ручной вызов disableBody, Phaser очистит его сам при destroy
      this.hitbox.destroy();
    }

    super.destroy(fromScene);
  }
}
