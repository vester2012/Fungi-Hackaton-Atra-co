const Phaser = window.Phaser;

export class Owner {
  constructor(scene, x, y, patrolPoints = []) {
    this.scene = scene;

    this.x = x;
    this.y = y;
    this.size = 30;

    this.speed = 120;
    this.visionRadius = 120;

    this.patrolPoints = patrolPoints;
    this.currentPatrolIndex = 0;
    this.target = null;

    this.state = 'patrol'; // patrol | idle
    this.idleUntil = 0;

    this.graphics = scene.add.graphics();
    this.visionGraphics = scene.add.graphics();

    if (this.patrolPoints.length > 0) {
      this.setPatrolTarget(0);
    }
  }

  setPatrolTarget(index) {
    if (!this.patrolPoints.length) return;

    this.currentPatrolIndex = index;
    const point = this.patrolPoints[index];
    this.target = { x: point.x, y: point.y };
  }

  gotoNextPatrol(now) {
    if (!this.patrolPoints.length) return;

    const nextIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    this.setPatrolTarget(nextIndex);
    this.state = 'patrol';
  }

  update(now, delta) {
    const dt = delta / 1000;

    if (this.state === 'patrol') {
      this.moveToTarget(dt);
      this.checkArrival(now);
    } else if (this.state === 'idle') {
      if (now >= this.idleUntil) {
        this.gotoNextPatrol(now);
      }
    }

    this.redraw();
  }

  moveToTarget(dt) {
    if (!this.target) return;

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return;

    const nx = dx / dist;
    const ny = dy / dist;

    const nextX = this.x + nx * this.speed * dt;
    const nextY = this.y + ny * this.speed * dt;

    if (!this.scene.willCollide(nextX, this.y, this.size)) {
      this.x = nextX;
    }

    if (!this.scene.willCollide(this.x, nextY, this.size)) {
      this.y = nextY;
    }
  }

  checkArrival(now) {
    if (!this.target || !this.patrolPoints.length) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

    if (dist <= 8) {
      const point = this.patrolPoints[this.currentPatrolIndex];
      this.state = 'idle';
      this.idleUntil = now + (point.wait || 1500);
    }
  }

  redraw() {
    this.graphics.clear();
    this.visionGraphics.clear();

    this.visionGraphics.fillStyle(0x60a5fa, 0.08);
    this.visionGraphics.fillCircle(this.x, this.y, this.visionRadius);
    this.visionGraphics.lineStyle(1, 0x60a5fa, 0.35);
    this.visionGraphics.strokeCircle(this.x, this.y, this.visionRadius);

    this.graphics.fillStyle(0x2563eb, 1);
    this.graphics.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );

    this.graphics.lineStyle(2, 0x1e3a8a, 1);
    this.graphics.strokeRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );
  }
}
