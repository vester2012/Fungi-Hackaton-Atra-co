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

    this.graphics = scene.add.graphics();
  }

  update(delta) {
    const dt = delta / 1000;

    let vx = 0;
    let vy = 0;

    if (!this.scene.catState.isBusy) {
      if (this.keys.left.isDown) vx -= this.speed;
      if (this.keys.right.isDown) vx += this.speed;
      if (this.keys.up.isDown) vy -= this.speed;
      if (this.keys.down.isDown) vy += this.speed;
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
    this.redraw();
  }

  tryMeow() {
    const now = this.scene.time.now;

    if (!Phaser.Input.Keyboard.JustDown(this.keys.meow)) return;
    if (now - this.lastMeowAt < this.meowCooldownMs) return;

    this.lastMeowAt = now;
    this.scene.onCatMeow?.(this.x, this.y, now);
  }

  redraw() {
    this.graphics.clear();

    this.graphics.fillStyle(
      this.hide ? 0x86efac : 0x22c55e,
      this.hide ? 0.55 : 1,
    );
    this.graphics.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size,
    );

    this.graphics.lineStyle(2, this.hide ? 0x166534 : 0x14532d, 1);
    this.graphics.strokeRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size,
    );
  }
}
