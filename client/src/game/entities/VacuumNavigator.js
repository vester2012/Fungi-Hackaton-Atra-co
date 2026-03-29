const Phaser = window.Phaser;

export class VacuumNavigator {
  constructor(scene, x, y, route = []) {
    this.scene = scene;

    this.x = x;
    this.y = y;

    this.width = 42;
    this.height = 42;

    this.speed = 90;
    this.route = route;
    this.currentIndex = 0;
    this.enabled = true;

    this.graphics = scene.add.graphics();
    this.pathGraphics = scene.add.graphics();

    if (!this.route.length) {
      this.enabled = false;
    }
  }

  update(delta) {
    if (!this.enabled || !this.route.length) {
      this.redraw();
      return;
    }

    const dt = delta / 1000;
    const target = this.route[this.currentIndex];

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 6) {
      this.currentIndex = (this.currentIndex + 1) % this.route.length;
      this.redraw();
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;

    const nextX = this.x + nx * this.speed * dt;
    const nextY = this.y + ny * this.speed * dt;

    if (
      !this.scene.willCollideWithStatic(nextX, this.y, this.width, this.height)
    ) {
      this.x = nextX;
    }

    if (
      !this.scene.willCollideWithStatic(this.x, nextY, this.width, this.height)
    ) {
      this.y = nextY;
    }

    this.redraw();
  }

  getBodyRect(nextX = this.x, nextY = this.y) {
    return {
      x: nextX - this.width / 2,
      y: nextY - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  redraw() {
    this.graphics.clear();
    this.pathGraphics.clear();

    if (this.route.length > 1) {
      this.pathGraphics.lineStyle(2, 0x64748b, 0.35);
      this.pathGraphics.beginPath();
      this.pathGraphics.moveTo(this.route[0].x, this.route[0].y);

      for (let i = 1; i < this.route.length; i++) {
        this.pathGraphics.lineTo(this.route[i].x, this.route[i].y);
      }

      this.pathGraphics.lineTo(this.route[0].x, this.route[0].y);
      this.pathGraphics.strokePath();
    }

    this.graphics.fillStyle(0x334155, 1);
    this.graphics.fillCircle(this.x, this.y, this.width / 2);

    this.graphics.lineStyle(3, 0x94a3b8, 1);
    this.graphics.strokeCircle(this.x, this.y, this.width / 2);

    this.graphics.fillStyle(0xe2e8f0, 0.9);
    this.graphics.fillCircle(this.x, this.y, 6);
  }
}
