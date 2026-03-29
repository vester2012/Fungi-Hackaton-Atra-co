const Phaser = window.Phaser;

export class Cat {
  constructor(scene, x, y) {
    this.scene = scene;

    this.x = x;
    this.y = y;
    this.size = 26;
    this.speed = 220;

    this.hide = false;

    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      meow: Phaser.Input.Keyboard.KeyCodes.M,
    });

    this.lastMeowAt = 0;
    this.meowCooldownMs = 120;

    this.isSpinningMove = false;
    this.spinCooldownAfterStopMs = 500;
    this.lastMoveInputAt = 0;
    this.spinRotationSpeed = 720;

    this.sprite = scene.add.sprite(this.x, this.y, "cat", "cat_idle.png");
    this.sprite.setDepth(210);
    this.sprite.setDisplaySize(64, 64);
  }

  update(delta) {
    const dt = delta / 1000;
    const now = this.scene.time.now;

    let vx = 0;
    let vy = 0;

    if (!this.scene.catState.isBusy) {
      if (this.keys.left.isDown) vx -= this.speed;
      if (this.keys.right.isDown) vx += this.speed;
      if (this.keys.up.isDown) vy -= this.speed;
      if (this.keys.down.isDown) vy += this.speed;
    }

    const hasMoveInput = vx !== 0 || vy !== 0;

    if (hasMoveInput) {
      this.lastMoveInputAt = now;

      if (!this.isSpinningMove) {
        this.isSpinningMove = true;
        this.sprite.play("cat-spin", true);
        this.scene.onCatSpinStart?.();
      }
    } else if (
      this.isSpinningMove &&
      now - this.lastMoveInputAt >= this.spinCooldownAfterStopMs
    ) {
      this.isSpinningMove = false;
      this.sprite.stop();
      this.sprite.setTexture("cat", "cat_idle.png");
      this.sprite.setAngle(0);
      this.scene.onCatSpinStop?.();
    }

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    const nextX = this.x + vx * dt;
    const nextY = this.y + vy * dt;

    if (!this.scene.willCollide(nextX, this.y, this.size)) {
      this.x = Phaser.Math.Clamp(
        nextX,
        this.scene.mapBounds.x + this.size / 2,
        this.scene.mapBounds.x + this.scene.mapBounds.width - this.size / 2,
      );
    }

    if (!this.scene.willCollide(this.x, nextY, this.size)) {
      this.y = Phaser.Math.Clamp(
        nextY,
        this.scene.mapBounds.y + this.size / 2,
        this.scene.mapBounds.y + this.scene.mapBounds.height - this.size / 2,
      );
    }

    this.tryMeow();
    this.redraw(delta);
  }

  tryMeow() {
    const now = this.scene.time.now;

    if (!Phaser.Input.Keyboard.JustDown(this.keys.meow)) return;
    if (now - this.lastMeowAt < this.meowCooldownMs) return;

    this.lastMeowAt = now;
    this.scene.onCatMeow?.(this.x, this.y, now);
  }

  redraw(delta) {
    this.sprite.setPosition(this.x, this.y);

    // if (this.isSpinningMove) {
    //   this.sprite.angle += this.spinRotationSpeed * (delta / 1000);
    // }

    this.sprite.setAlpha(this.hide ? 0.55 : 1);
    this.sprite.setTint(this.hide ? 0xb7f5c5 : 0xffffff);
  }
}
