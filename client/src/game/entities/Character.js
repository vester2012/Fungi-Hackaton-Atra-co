// File: client/src/game/entities/Character.js

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
    this.hitbox = scene.add.rectangle(x, y + this.hitboxOffsetY, 120, 170, 0x38bdf8, 0).setVisible(false);
    scene.physics.add.existing(this.hitbox);

    // Ссылка для ZoneManager
    this.hitbox.parentCharacter = this;

    // Настройки физики
    this.hitbox.body.setCollideWorldBounds(true);
    this.hitbox.body.setBounce(0, 0);
    this.hitbox.body.setDragX(1600);

    // ВАЖНО: Увеличиваем макс. скорость, чтобы она не мешала дэшу (1600+)
    this.hitbox.body.setMaxVelocity(2000, 2000);
    this.hitbox.body.setSize(this.hitbox.width, this.hitbox.height);
    this.hitbox.body.setOffset(0, 0);

    // Параметры движения
    this.moveSpeed = 400;
    this.jumpSpeed = 800;
    this.maxJumps = 2;
    this.jumpCount = 0;

    // --- ПАРАМЕТРЫ ДЭША ---
    this.dashSpeed = 1800;         // Сделаем чуть быстрее для сочности
    this.dashDurationMs = 180;     // Длительность рывка
    this.dashCooldownMs = 1000;    // Перезарядка 1 сек
    this.dashWindowMs = 250;       // Время для двойного клика

    this.dashState = {
      isDashing: false,
      until: 0,
      cooldownUntil: 0,
      dirX: 0,
      dirY: 0
    };

    // Время последнего нажатия для отслеживания двойного клика
    this.lastTaps = { left: 0, right: 0, up: 0, down: 0 };

    // --- ПАРАМЕТРЫ СКОЛЬЖЕНИЯ ПО СТЕНЕ (WALL SLIDE) ---
    this.wallSlideMaxSpeed = 160;
    this.wallJumpForceX = 550;
    this.wallJumpForceY = 750;
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

    this.dropThroughUntil = 0;
    this.dropThroughDurationMs = 220;

    // Анимации Spine
    this.anim = scene.add.spine(0, -90, 'fish_SPO', 'idle', true);
    this.anim.setScale(0.1);
    this.anim.setMix('run', 'idle', 0.25);
    this.anim.setMix('jump', 'fly', 0.25);
    this.anim.setMix('fly', 'jump', 0.25);
    this.add(this.anim);

    if (options.showStats !== false) {
      this.healthIndicator = new HealthIndicator(scene, 0, -250, {nickname: this.nickname, textOffsetY: 0, barOffsetY: 14, textColor: '#e2e8f0', textStroke: '#0f172a'});
      this.add(this.healthIndicator);
    }

    this.attackHitbox = scene.add.rectangle(x, y, this.attackWidth, this.attackHeight, 0xf97316, 0).setVisible(false);

    this.syncHpText();
    this.events = new Phaser.Events.EventEmitter();
  }

  update(time = this.scene.time.now, delta = this.scene.game.loop.delta) {
    this.controller.update();
    const now = time;
    const dt = delta / 1000;

    const isGrounded = this.hitbox.body.blocked.down || this.hitbox.body.touching.down;

    const leftPressed = this.controller.left;
    const rightPressed = this.controller.right;
    const jumpPressed = this.controller.jumpJustPressed;
    const attackPressed = this.controller.attackJustPressed;

    const leftJust = this.controller.leftJustPressed;
    const rightJust = this.controller.rightJustPressed;
    const upJust = this.controller.upJustPressed;
    const downJust = this.controller.downJustPressed;

    const movingHorizontally = leftPressed !== rightPressed;

    // === 1. ОБРАБОТКА ЗАВЕРШЕНИЯ ДЭША ===
    if (this.dashState.isDashing && now > this.dashState.until) {
      this.dashState.isDashing = false;
      this.hitbox.body.setAllowGravity(true);
      this.hitbox.body.setVelocity(0, 0); // Резкая остановка после дэша
      this.anim.timeScale = 1.0;
    }

    // === 2. ИНИЦИАЦИЯ ДЭША (Двойной клик) ===
    if (!this.dashState.isDashing && now > this.dashState.cooldownUntil) {
      let dX = 0, dY = 0;

      if (leftJust)  { if (now - this.lastTaps.left < this.dashWindowMs) dX = -1; this.lastTaps.left = now; }
      if (rightJust) { if (now - this.lastTaps.right < this.dashWindowMs) dX = 1; this.lastTaps.right = now; }
      if (upJust)    { if (now - this.lastTaps.up < this.dashWindowMs) dY = -1; this.lastTaps.up = now; }
      if (downJust)  { if (now - this.lastTaps.down < this.dashWindowMs) dY = 1; this.lastTaps.down = now; }

      if (dX !== 0 || dY !== 0) {
        this.startDash(dX, dY, now);
      }
    }

    // === 3. ЛОГИКА ДВИЖЕНИЯ ИЛИ ДЭША ===
    if (this.dashState.isDashing) {
      // Во время дэша просто летим по вектору
      this.hitbox.body.setVelocity(
          this.dashState.dirX * this.dashSpeed,
          this.dashState.dirY * this.dashSpeed
      );
      this.createDashTrail();
    } else {
      if (now - this.wallSlideState.lastActiveTime > 100) {
        this.wallSlideState.isActive = false;
      }

      if (isGrounded) {
        this.jumpCount = 0;
        this.wallSlideState.isActive = false;
      }

      // Прыжок
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

      // Горизонтальное движение
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

      // Стены
      if (this.wallSlideState.isActive && !isGrounded && this.hitbox.body.velocity.y > this.wallSlideMaxSpeed) {
        this.hitbox.body.setVelocityY(this.wallSlideMaxSpeed);
      }

      // Спрыгивание
      if (downJust && isGrounded && this.isStandingOnDropThroughPlatform()) {
        this.dropThroughUntil = now + this.dropThroughDurationMs;
        this.hitbox.y += 10;
        this.hitbox.body.setVelocityY(200); // Немного толкаем вниз для уверенного прохода сквозь платформу
      }
    }

    // === 4. АТАКА ===
    if (attackPressed && !this.dashState.isDashing) {
      if (this.tryAttack(now)) {
        this.playKickSound();
        this.playAttackAnimation(movingHorizontally && isGrounded);
      }
    }

    // === 5. АНИМАЦИИ ===
    if (!this.isAttacking() && !this.isHit()) {
      if (this.dashState.isDashing) {
        this.setAnimation(this.dashState.dirY !== 0 ? 'fly' : 'run', true);
      } else if (!isGrounded) {
        this.setAnimation(this.hitbox.body.velocity.y < 0 ? 'jump' : 'fly');
      } else if (this.wallSlideState.isActive) {
        this.setAnimation('fly');
      } else {
        this.setAnimation(movingHorizontally ? 'run' : 'idle', true);
      }
    }

    // Цвет игрока
    if (this.currentTint !== undefined) {
      this.applySlotColor('body', this.currentTint);
    }

    // Полоска дэша
    if (this.showStats && this.healthIndicator && this.healthIndicator.updateDash) {
      const ratio = (this.dashState.cooldownUntil > now)
          ? 1 - ((this.dashState.cooldownUntil - now) / this.dashCooldownMs)
          : 1;
      this.healthIndicator.updateDash(ratio);
    }

    // Синхронизация хитбоксов и UI
    this.syncContainerToHitbox();
  }

  // --- МЕТОДЫ ДЭША ---
  startDash(dirX, dirY, now = this.scene.time.now) {
    this.dashState.isDashing = true;

    // Нормализация диагоналей
    let length = Math.sqrt(dirX * dirX + dirY * dirY);
    this.dashState.dirX = dirX / length;
    this.dashState.dirY = dirY / length;

    this.dashState.until = now + this.dashDurationMs;
    this.dashState.cooldownUntil = now + this.dashCooldownMs;

    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setMaxVelocity(this.dashSpeed, this.dashSpeed);

    if (dirX !== 0) this.applyFacingDirection(dirX);

    this.anim.timeScale = 2.5;
    this.playJumpSound();

    if (unit_manager.socket) {
      unit_manager.socket.emit('playerAction', { action: 'dash', dirX: this.dashState.dirX, dirY: this.dashState.dirY });
    }
  }

  createDashTrail() {
    if (this.scene.time.now % 4 !== 0) return;
    const trail = this.scene.add.rectangle(this.hitbox.x, this.hitbox.y, 80, 120, 0x0ea5e9, 0.4);
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 0.5,
      duration: 250,
      onComplete: () => trail.destroy()
    });
  }

  playRemoteDash(dirX, dirY) {
    this.startDash(dirX, dirY, this.scene.time.now);
  }

  // --- ОСТАЛЬНЫЕ МЕТОДЫ ИГРОКА ---
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
      const isOnTop = Math.abs(body.bottom - platform.body.top) <= 5;
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
    this.attackHitbox.setVisible(false);
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
    const jumpSoundKeys = ['jump', 'jump1', 'jump2'];
    if (this.scene.sound.locked) return;
    const key = Phaser.Utils.Array.GetRandom(jumpSoundKeys);
    this.scene.sound.play(key, { volume: 0.1 });
  }

  playKickSound() {
    const kickSoundKeys =['kick', 'kick1'];
    if (this.scene.sound.locked) return;
    const key = Phaser.Utils.Array.GetRandom(kickSoundKeys);
    this.scene.sound.play(key, { volume: 0.2 });
  }

  playDamageSound() {
    const damageSoundKeys =['damage', 'damage1', 'damage2', 'damage3'];
    if (this.scene.sound.locked) return;
    const key = Phaser.Utils.Array.GetRandom(damageSoundKeys);
    this.scene.sound.play(key, { volume: 0.2 });
  }

  applyRemoteState(targetX, targetY, now = this.scene ? this.scene.time.now : 0) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);

    let nextX = targetX;
    let nextY = targetY;

    //[FIX] Если дистанция огромная (телепорт черной дырой или спавн) - прыгаем мгновенно!
    if (dist > 300) {
      this.setPosition(targetX, targetY);
    } else {
      // [FIX] Иначе плавно скользим (Lerp) к цели. Это превращает дерганые пакеты сервера в плавные 60 FPS
      const lerpFactor = 0.25;
      nextX = Phaser.Math.Linear(this.x, targetX, lerpFactor);
      nextY = Phaser.Math.Linear(this.y, targetY, lerpFactor);
      this.setPosition(nextX, nextY);
    }

    const movedX = targetX - this.x;
    const movedY = targetY - this.y;
    const isMoving = Math.abs(movedX) > 2;

    if (movedX !== 0) this.applyFacingDirection(movedX < 0 ? -1 : 1);

    if (!this.isAttacking() && !this.isHit() && !this.dashState.isDashing) {
      if (Math.abs(movedY) > 5) {
        this.setAnimation(movedY < 0 ? 'jump' : 'fly');
      } else {
        this.setAnimation(isMoving ? 'run' : 'idle', true);
      }
    }
    this.syncAttackHitbox();
  }

  isAttacking() {
    return this.scene ? this.scene.time.now < this.attackUntil : false;
  }

  isHit() {
    return this.scene ? this.scene.time.now < this.hitUntil : false;
  }
  getAttackDamage() { return this.baseDamage; }
  getAttackHitbox() { return this.attackHitbox; }
  getAttackId() { return this.attackId; }
  getHp() { return this.hp; }
  getMaxHp() { return this.maxHp; }

  setHp(nextHp) {
    this.hp = Phaser.Math.Clamp(nextHp, 0, this.maxHp);
    this.syncHpText();
    return this.hp;
  }

  applySyncedDamage(amount, nextHp = null) {
    if (typeof nextHp === 'number') {
      this.hp = nextHp;
    } else {
      this.hp = Math.max(0, this.hp - amount);
    }
    this.syncHpText();
    this.playHitAnimation();
    this.playDamageSound();
    // Создаем всплывающий текст урона
    new DamagePopup(this.scene, this.hitbox.x, this.hitbox.y - this.hitbox.height * 0.5 - 8, amount);
    return this.hp;
  }

  isDead() { return this.hp <= 0; }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.syncHpText();
    this.playHitAnimation();
    this.playDamageSound();
    new DamagePopup(this.scene, this.hitbox.x, this.hitbox.y - this.hitbox.height * 0.5 - 8, amount);
    return this.hp;
  }

  shouldCollideWithPlatform(platform) {
    if (!platform.isDropThrough) return true;
    if (this.isDroppingThroughPlatform()) return false;
    return true;
  }

  setAnimation(name, loop) {
    if (this.currentAnimation === name) return;
    this.currentAnimation = name;
    this.anim.play(name, loop);
  }

  setSlotColor(slotName, colorHex) {
    this.currentTint = colorHex;
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
    if (this.events) {
      this.events.removeAllListeners();
      this.events.destroy();
    }
    if (this.anim) {
      this.anim.destroy();
      this.anim = null;
    }
    if (this.healthIndicator) this.healthIndicator.destroy();
    if (this.attackHitbox) this.attackHitbox.destroy();
    if (this.hitbox) this.hitbox.destroy();

    super.destroy(fromScene);
  }
}
