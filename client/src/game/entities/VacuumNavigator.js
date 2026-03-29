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

    this.isDirtyTrailActive = false;
    this.dirtyTrailPoints = [];
    this.maxDirtyTrailPoints = 220;

    if (!this.route.length) {
      this.enabled = false;
    }
  }

  update(delta) {
    if (!this.enabled || !this.route.length) {
      this.updateDirtyTrail();
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
      this.updateDirtyTrail();
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

    this.updateDirtyTrail();
    this.redraw();
  }

  activateDirtyTrail() {
    if (!this.isDirtyTrailActive) {
      this.isDirtyTrailActive = true;
      this.dirtyTrailPoints = [{ x: this.x, y: this.y }];
      return;
    }

    // если уже грязный, просто продолжаем тянуть след
    if (!this.dirtyTrailPoints.length) {
      this.dirtyTrailPoints = [{ x: this.x, y: this.y }];
    }
  }

  clearDirtyTrail() {
    this.isDirtyTrailActive = false;
    this.dirtyTrailPoints = [];
  }

  updateDirtyTrail() {
    if (!this.isDirtyTrailActive) {
      return;
    }

    const lastPoint = this.dirtyTrailPoints[this.dirtyTrailPoints.length - 1];
    const dist = lastPoint
      ? Phaser.Math.Distance.Between(lastPoint.x, lastPoint.y, this.x, this.y)
      : Infinity;

    if (!lastPoint || dist >= 8) {
      this.dirtyTrailPoints.push({ x: this.x, y: this.y });
    }

    if (this.dirtyTrailPoints.length > this.maxDirtyTrailPoints) {
      this.dirtyTrailPoints.shift();
    }
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

    // Постоянный серый маршрут не рисуем.
    // Рисуем только временно накопившийся грязный след.
    if (this.dirtyTrailPoints.length > 1) {
      this.pathGraphics.lineStyle(14, 0x5b3a29, 0.42);
      this.pathGraphics.beginPath();
      this.pathGraphics.moveTo(
        this.dirtyTrailPoints[0].x,
        this.dirtyTrailPoints[0].y,
      );

      for (let i = 1; i < this.dirtyTrailPoints.length; i++) {
        this.pathGraphics.lineTo(
          this.dirtyTrailPoints[i].x,
          this.dirtyTrailPoints[i].y,
        );
      }

      this.pathGraphics.strokePath();

      this.pathGraphics.lineStyle(8, 0x7a4a2f, 0.86);
      this.pathGraphics.beginPath();
      this.pathGraphics.moveTo(
        this.dirtyTrailPoints[0].x,
        this.dirtyTrailPoints[0].y,
      );

      for (let i = 1; i < this.dirtyTrailPoints.length; i++) {
        this.pathGraphics.lineTo(
          this.dirtyTrailPoints[i].x,
          this.dirtyTrailPoints[i].y,
        );
      }

      this.pathGraphics.strokePath();
    }

    this.graphics.fillStyle(0x334155, 1);
    this.graphics.fillCircle(this.x, this.y, this.width / 2);

    this.graphics.lineStyle(3, 0x94a3b8, 1);
    this.graphics.strokeCircle(this.x, this.y, this.width / 2);

    this.graphics.fillStyle(0xe2e8f0, 0.9);
    this.graphics.fillCircle(this.x, this.y, 6);

    if (this.isDirtyTrailActive) {
      this.graphics.fillStyle(0x5b3a29, 0.9);
      this.graphics.fillCircle(this.x + 7, this.y + 5, 5);
      this.graphics.fillCircle(this.x - 6, this.y + 3, 4);
    }
  }
}
