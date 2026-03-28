import { InputManager } from "../managers/InputManager";import { HealthIndicator } from "./HealthIndicator.js";
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
    this.hitbox = scene.add.rectangle(x, y + this.hitboxOffsetY, 80, 130, 0x38bdf8, 0.18).setStrokeStyle(2, 0x7dd3fc, 0.9);
    scene.physics.add.existing(this.hitbox);

    // Ссылка для ZoneManager
    this.hitbox.parentCharacter = this;

    // Настройки физики
    this.hitbox.body.setCollideWorldBounds(true);
    this.hitbox.body.setBounce(0, 0);
    this.hitbox.body.setDragX(1600);
    this.hitbox.body.setMaxVelocity(600, 1200); // Немного увеличил макс. скорость для сочности прыжка
    this.hitbox.body.setSize(80, 130);
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
    this.attackDurationMs = 120;
    this.attackRange = 110;
    this.attackWidth = 90;
    this.attackHeight = 80;
    this.lastAttackAt = -this.attackCooldownMs;
    this.attackUntil = 0;
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
    this.anim = scene.add.spine(0, 0, 'person_SPO', 'idle', true);
    this.anim.setScale(0.15);
    this.anim.setMix('run', 'idle', 0.25);
    this.add(this.anim);

    if (this.showStats) {
      this.healthIndicator = new HealthIndicator(scene, 0, -170, {
        nickname:
      this.nickname, textOffsetY: 0, barOffsetY: 14,
        textColor: '#e2e8f0',
        textStroke: '#0f172a'
      });
      this.add(this.healthIndicator);
    }

    this.attackHitbox = scene.add.rectangle(x, y, this.attackWidth, this.attackHeight, 0xf97316, 0.2).setStrokeStyle(2, 0xfb923c, 0.95).setVisible(false);

    this.syncHpText();
    this.events = new Phaser.Events.EventEmitter();
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

    // 1. Сброс состояния Wall Slide (если зона не обновила его в текущем кадре)
    if (now - this.wallSlideState.lastActiveTime > 100) {
      this.wallSlideState.isActive = false;
    }

    if (isGrounded) {
      this.jumpCount = 0;
      this.wallSlideState.isActive = false;
    }

    // 2. Логика прыжка (обычный или Wall Jump)
    if (jumpPressed) {
      if (this.wallSlideState.isActive && !isGrounded) {
        // ПРЫЖОК ОТ СТЕНЫ
        const jumpDir = -this.wallSlideState.direction; // В противоположную от стены сторону
        this.hitbox.body.setVelocity(
            jumpDir * this.wallJumpForceX,
            -this.wallJumpForceY
        );
        this.applyFacingDirection(jumpDir);
        this.jumpCount = 1;
        this.wallSlideState.isActive = false;
      } else if (this.jumpCount < this.maxJumps) {
        // ОБЫЧНЫЙ ПРЫЖОК
        this.hitbox.body.setVelocityY(-this.jumpSpeed);
        this.jumpCount += 1;
      }
    }

    // 3. Замедление падения на стене
    if (this.wallSlideState.isActive && !isGrounded) {
      if (this.hitbox.body.velocity.y > this.wallSlideMaxSpeed) {
        this.hitbox.body.setVelocityY(this.wallSlideMaxSpeed);
      }
    }

    // 4. Горизонтальное движение
    // Если мы только что отпрыгнули от стены, даем физике поработать, не перебивая velocityX сразу
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

    // 5. Платформы (Drop Through)
    if (downPressed) {
      // Я чуть увеличил окно двойного клика (с 250 до 350 мс), чтобы было легче нажимать
      if (now - this.lastDownTapAt <= 350 && isGrounded && this.isStandingOnDropThroughPlatform()) {
        this.dropThroughUntil = now + this.dropThroughDurationMs;

        // ВАЖНО: сдвигаем хитбокс принудительно на 5 пикселей вниз, чтобы пройти границу (platform.top)
        this.hitbox.y += 5;

        // Даем начальную скорость вниз
        this.hitbox.body.setVelocityY(200);
      }
      this.lastDownTapAt = now;
    }

    // 6. Атака
    if (attackPressed) {
      if (this.tryAttack(now)) {
        this.playAttackAnimation();
      }
    }

    // 7. Анимации
    if (!this.isAttacking()) {
      if (this.wallSlideState.isActive && !isGrounded) {
        this.setAnimation('idle', true); // Здесь можно поставить спец. анимацию стены
      } else {
        this.setAnimation(movingHorizontally ? 'run' : 'idle', true);
      }
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
    const movedX = x - this.x;
    const isMoving = Math.abs(movedX) > 1;
    this.setPosition(x, y);
    if (movedX !== 0) this.applyFacingDirection(movedX < 0 ? -1 : 1);
    if (!this.isAttacking()) this.setAnimation(isMoving ? 'run' : 'idle', true);
    this.syncAttackHitbox();
  }

  isAttacking() { return this.scene.time.now < this.attackUntil; }
  getAttackDamage() { return this.baseDamage; }
  getAttackHitbox() { return this.attackHitbox; }
  getAttackId() { return this.attackId; }
  isDead() { return this.hp <= 0; }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.syncHpText();
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

  destroy(fromScene) {
    if (this.healthIndicator) {
      this.healthIndicator.destroy();
      this.healthIndicator = null;
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