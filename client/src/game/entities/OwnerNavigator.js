const Phaser = window.Phaser;

export class OwnerNavigator {
  constructor(scene, x, y, navData) {
    this.scene = scene;

    this.x = x;
    this.y = y;
    this.size = 30;

    this.speed = 120;

    this.navPoints = navData?.navPoints || [];
    this.actionPoints = navData?.actionPoints || [];

    this.state = "choose_target"; // choose_target | move | act
    this.currentActionPoint = null;
    this.path = [];
    this.pathIndex = 0;
    this.actUntil = 0;

    this.stuckTimer = 0;
    this.lastX = x;
    this.lastY = y;

    this.graphics = scene.add.graphics();
    this.pathGraphics = scene.add.graphics();
  }

  update(now, delta) {
    const dt = delta / 1000;

    this.updateStuckDetection(dt);

    if (this.state === "choose_target") {
      this.chooseNextActionTarget();
    } else if (this.state === "move") {
      this.followPath(dt, now);
    } else if (this.state === "act") {
      if (now >= this.actUntil) {
        this.state = "choose_target";
      }
    }

    this.redraw();
  }

  updateStuckDetection(dt) {
    const dist = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.lastX,
      this.lastY,
    );

    if (dist < 0.5 && this.state === "move") {
      this.stuckTimer += dt;
    } else {
      this.stuckTimer = 0;
    }

    this.lastX = this.x;
    this.lastY = this.y;

    if (this.stuckTimer > 1.2) {
      this.stuckTimer = 0;
      this.state = "choose_target";
      this.path = [];
      this.pathIndex = 0;
    }
  }

  chooseNextActionTarget() {
    if (!this.actionPoints.length) return;

    const candidates = this.actionPoints.filter(
      (p) => p.id !== this.currentActionPoint?.id,
    );
    const pool = candidates.length ? candidates : this.actionPoints;
    const target = Phaser.Utils.Array.GetRandom(pool);

    this.currentActionPoint = target;

    if (!this.navPoints.length) {
      this.path = [{ x: target.x, y: target.y, isAction: true }];
      this.pathIndex = 0;
      this.state = "move";
      return;
    }

    const startNav = this.getNearestNavPoint(this.x, this.y);
    const endNav = this.getNearestNavPoint(target.x, target.y);

    const navPath = this.findPath(startNav, endNav);

    this.path = [...navPath, { x: target.x, y: target.y, isAction: true }];
    this.pathIndex = 0;
    this.state = "move";
  }

  getNearestNavPoint(x, y) {
    let best = null;
    let bestDist = Infinity;

    for (const point of this.navPoints) {
      const dist = Phaser.Math.Distance.Between(x, y, point.x, point.y);
      if (dist < bestDist) {
        best = point;
        bestDist = dist;
      }
    }

    return best;
  }

  getNeighbors(point) {
    return this.navPoints.filter((other) => {
      if (other.id === point.id) return false;

      const dist = Phaser.Math.Distance.Between(
        point.x,
        point.y,
        other.x,
        other.y,
      );
      return dist <= 260;
    });
  }

  findPath(start, goal) {
    if (!start || !goal) return [];
    if (start.id === goal.id) return [start];

    const queue = [[start]];
    const visited = new Set([start.id]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current.id === goal.id) {
        return path;
      }

      const neighbors = this.getNeighbors(current);

      for (const neighbor of neighbors) {
        if (visited.has(neighbor.id)) continue;
        visited.add(neighbor.id);
        queue.push([...path, neighbor]);
      }
    }

    // fallback
    return [start, goal];
  }

  followPath(dt, now) {
    if (!this.path.length || this.pathIndex >= this.path.length) {
      this.state = "choose_target";
      return;
    }

    const target = this.path[this.pathIndex];

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 8) {
      this.pathIndex++;

      if (this.pathIndex >= this.path.length) {
        if (this.currentActionPoint) {
          this.state = "act";
          this.actUntil = now + (this.currentActionPoint.wait || 2000);
        } else {
          this.state = "choose_target";
        }
      }
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;

    const stepX = nx * this.speed * dt;
    const stepY = ny * this.speed * dt;

    const nextX = this.x + stepX;
    const nextY = this.y + stepY;

    let movedX = false;
    let movedY = false;

    if (!this.scene.willCollide(nextX, this.y, this.size)) {
      this.x = nextX;
      movedX = true;
    }

    if (!this.scene.willCollide(this.x, nextY, this.size)) {
      this.y = nextY;
      movedY = true;
    }

    // если уперся по диагонали, пробуем немного подрулить
    if (!movedX && !movedY) {
      const tryX = this.x + Math.sign(dx) * this.speed * dt;
      const tryY = this.y + Math.sign(dy) * this.speed * dt;

      if (!this.scene.willCollide(tryX, this.y, this.size)) {
        this.x = tryX;
      } else if (!this.scene.willCollide(this.x, tryY, this.size)) {
        this.y = tryY;
      }
    }
  }

  redraw() {
    this.graphics.clear();
    this.pathGraphics.clear();

    if (this.path.length > 0 && this.pathIndex < this.path.length) {
      this.pathGraphics.lineStyle(3, 0x2563eb, 0.45);
      this.pathGraphics.beginPath();
      this.pathGraphics.moveTo(this.x, this.y);

      for (let i = this.pathIndex; i < this.path.length; i++) {
        this.pathGraphics.lineTo(this.path[i].x, this.path[i].y);
      }

      this.pathGraphics.strokePath();
    }

    this.graphics.fillStyle(0x2563eb, 1);
    this.graphics.fillRect(this.x - 15, this.y - 15, 30, 30);

    this.graphics.lineStyle(2, 0x1e3a8a, 1);
    this.graphics.strokeRect(this.x - 15, this.y - 15, 30, 30);
  }
}
