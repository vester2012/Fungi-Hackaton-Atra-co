const Phaser = window.Phaser;

export class OwnerNavigator {
  constructor(scene, x, y, navData) {
    this.scene = scene;

    this.x = x;
    this.y = y;
    this.size = 30;

    this.baseSpeed = 120;
    this.speed = 120;
    this.visionRadius = 120;
    this.catchRadius = 34;

    this.navPoints = navData?.navPoints || [];
    this.actionPoints = navData?.actionPoints || [];

    this.state = "choose_target";
    // choose_target | move | act | investigate | chase | search | return

    this.currentActionPoint = null;
    this.currentActionType = null;

    this.path = [];
    this.pathIndex = 0;
    this.actUntil = 0;

    this.searchUntil = 0;
    this.investigateUntil = 0;
    this.lastSeenCatPos = null;
    this.returnActionPoint = null;

    this.stuckTimer = 0;
    this.lastX = x;
    this.lastY = y;

    this.meowChainCount = 0;
    this.meowChainThreshold = 6;
    this.meowChainResetMs = 1200;
    this.lastHeardMeowAt = 0;
    this.lastHeardMeowPos = null;

    this.graphics = scene.add.graphics();
    this.pathGraphics = scene.add.graphics();
    this.visionGraphics = scene.add.graphics();

    this.actionLabel = scene.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#1e3a8a",
        backgroundColor: "#dbeafecc",
        padding: { left: 4, right: 4, top: 2, bottom: 2 },
      })
      .setDepth(220)
      .setVisible(false);
  }

  update(now, delta) {
    const dt = delta / 1000;

    this.updateBehaviorParams();
    this.updateStuckDetection(dt);
    this.processVisibleEvidence();
    this.trySeeCat(now);

    if (this.state === "choose_target") {
      this.chooseNextActionTarget();
    } else if (this.state === "move") {
      this.followPath(dt, now);
    } else if (this.state === "act") {
      this.updateAct(now);
    } else if (this.state === "investigate") {
      this.updateInvestigate(now, dt);
    } else if (this.state === "chase") {
      this.updateChase(now, dt);
    } else if (this.state === "search") {
      this.updateSearch(now, dt);
    } else if (this.state === "return") {
      this.updateReturn(now, dt);
    }

    this.redraw();
  }

  updateBehaviorParams() {
    const aggressionLevel = this.scene.ownerState.getAggressionLevel(
      this.scene.rageMeter,
    );

    if (aggressionLevel === 0) {
      this.speed = 120;
      this.visionRadius = 120;
      this.searchDurationMs = 1500;
      this.chaseSpeed = 150;
    } else if (aggressionLevel === 1) {
      this.speed = 132;
      this.visionRadius = 135;
      this.searchDurationMs = 2200;
      this.chaseSpeed = 165;
    } else if (aggressionLevel === 2) {
      this.speed = 145;
      this.visionRadius = 150;
      this.searchDurationMs = 3000;
      this.chaseSpeed = 180;
    } else {
      this.speed = 160;
      this.visionRadius = 175;
      this.searchDurationMs = 4000;
      this.chaseSpeed = 200;
    }
  }

  processVisibleEvidence() {
    const visible = this.scene.evidenceSystem.getUnseenVisibleForOwner(this);

    for (const evidence of visible) {
      this.scene.evidenceSystem.markSeen(evidence.id);
      this.scene.rageMeter.add(evidence.points);
      this.scene.ownerState.addAggression(1);
      this.scene.lastStatusMessage = `Хозяин увидел: ${evidence.label} (+${evidence.points})`;
    }
  }

  trySeeCat(now) {
    const cat = this.scene.cat;
    const catState = this.scene.catState;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, cat.x, cat.y);
    const canSee = dist <= this.visionRadius && !catState.hide;

    if (!canSee) return;

    this.lastSeenCatPos = { x: cat.x, y: cat.y };
    this.scene.ownerState.noteSawCat(now);

    if (this.state !== "chase") {
      this.returnActionPoint = this.currentActionPoint;
      this.finishActionState();
      this.path = [];
      this.pathIndex = 0;
      this.state = "chase";
      this.scene.lastStatusMessage = "Хозяин заметил кота!";
    }
  }

  hearMeow(x, y, now) {
    if (this.state === "chase" || this.state === "search") return;

    if (now - this.lastHeardMeowAt > this.meowChainResetMs) {
      this.meowChainCount = 0;
    }

    this.lastHeardMeowAt = now;
    this.lastHeardMeowPos = { x, y };
    this.meowChainCount += 1;

    this.scene.lastStatusMessage = `Мяу: ${this.meowChainCount}/${this.meowChainThreshold}`;

    if (this.meowChainCount < this.meowChainThreshold) return;

    this.meowChainCount = 0;
    this.scene.rageMeter.add(2);
    this.scene.ownerState.addAggression(1);

    this.returnActionPoint = this.currentActionPoint;
    this.finishActionState();

    this.path = this.buildPathToPoint(x, y);
    this.pathIndex = 0;
    this.state = "investigate";
    this.investigateUntil = now + 2000;

    this.scene.lastStatusMessage = "Хозяин отвлекся на мяуканье!";
  }

  chooseNextActionTarget() {
    if (!this.actionPoints.length) return;

    const candidates = this.actionPoints.filter(
      (p) => p.id !== this.currentActionPoint?.id,
    );
    const pool = candidates.length ? candidates : this.actionPoints;
    const target = Phaser.Utils.Array.GetRandom(pool);

    this.currentActionPoint = target;
    this.currentActionType = null;

    this.path = this.buildPathToPoint(target.x, target.y);
    this.pathIndex = 0;
    this.state = "move";
  }

  buildPathToPoint(targetX, targetY) {
    if (!this.navPoints.length) {
      return [{ x: targetX, y: targetY, isAction: true }];
    }

    const startNav = this.getNearestNavPoint(this.x, this.y);
    const endNav = this.getNearestNavPoint(targetX, targetY);
    const navPath = this.findPath(startNav, endNav);

    return [...navPath, { x: targetX, y: targetY, isAction: true }];
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

    return [start, goal];
  }

  updateStuckDetection(dt) {
    const dist = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.lastX,
      this.lastY,
    );

    if (
      dist < 0.5 &&
      (this.state === "move" ||
        this.state === "return" ||
        this.state === "investigate")
    ) {
      this.stuckTimer += dt;
    } else {
      this.stuckTimer = 0;
    }

    this.lastX = this.x;
    this.lastY = this.y;

    if (this.stuckTimer > 1.2) {
      this.stuckTimer = 0;
      this.finishActionState();

      if (this.state === "chase" || this.state === "search") {
        this.startSearch(this.scene.time.now);
      } else {
        this.state = "choose_target";
      }

      this.path = [];
      this.pathIndex = 0;
    }
  }

  followPath(dt, now) {
    if (!this.path.length || this.pathIndex >= this.path.length) {
      this.state = "choose_target";
      return;
    }

    const target = this.path[this.pathIndex];
    const reached = this.moveTowardPoint(target.x, target.y, dt, this.speed);

    if (!reached) return;

    this.pathIndex++;

    if (this.pathIndex >= this.path.length) {
      if (this.currentActionPoint) {
        this.startActionState(now);
      } else {
        this.state = "choose_target";
      }
    }
  }

  startActionState(now) {
    this.state = "act";
    this.currentActionType = this.currentActionPoint?.actionType || null;
    this.actUntil = now + (this.currentActionPoint?.wait || 2000);
    this.applyOwnerStateFlags();
  }

  updateAct(now) {
    if (now >= this.actUntil) {
      this.finishActionState();
      this.state = "choose_target";
    }
  }

  finishActionState() {
    this.clearOwnerStateFlags();
    this.currentActionType = null;
    this.actionLabel.setVisible(false);
  }

  updateInvestigate(now, dt) {
    if (this.path.length && this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex];
      const reached = this.moveTowardPoint(target.x, target.y, dt, this.speed);

      if (reached) {
        this.pathIndex++;
      }
      return;
    }

    if (now >= this.investigateUntil) {
      this.startReturn();
    }
  }

  updateChase(now, dt) {
    const cat = this.scene.cat;
    const catState = this.scene.catState;

    const visibleDist = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      cat.x,
      cat.y,
    );
    const canSee = visibleDist <= this.visionRadius && !catState.hide;

    if (canSee) {
      this.lastSeenCatPos = { x: cat.x, y: cat.y };
    }

    if (!this.lastSeenCatPos) {
      this.startReturn();
      return;
    }

    const reached = this.moveTowardPoint(
      this.lastSeenCatPos.x,
      this.lastSeenCatPos.y,
      dt,
      this.chaseSpeed,
    );

    const catchDist = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      cat.x,
      cat.y,
    );
    if (catchDist <= this.catchRadius && !catState.hide) {
      this.scene.onCatCaught?.();
      this.scene.ownerState.noteCaughtCat();
      this.startSearch(now);
      return;
    }

    if (!canSee && reached) {
      this.startSearch(now);
    }
  }

  startSearch(now) {
    this.state = "search";
    this.searchUntil = now + this.searchDurationMs;
    this.currentActionType = null;
    this.clearOwnerStateFlags();
  }

  updateSearch(now, dt) {
    const cat = this.scene.cat;
    const catState = this.scene.catState;

    const visibleDist = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      cat.x,
      cat.y,
    );
    const canSee = visibleDist <= this.visionRadius && !catState.hide;

    if (canSee) {
      this.lastSeenCatPos = { x: cat.x, y: cat.y };
      this.state = "chase";
      return;
    }

    if (this.lastSeenCatPos) {
      this.moveTowardPoint(
        this.lastSeenCatPos.x,
        this.lastSeenCatPos.y,
        dt,
        this.speed * 0.9,
      );
    }

    if (now >= this.searchUntil) {
      this.startReturn();
    }
  }

  startReturn() {
    this.state = "return";

    const target = this.returnActionPoint || this.currentActionPoint;

    if (target) {
      this.path = this.buildPathToPoint(target.x, target.y);
      this.pathIndex = 0;
    } else {
      this.state = "choose_target";
    }
  }

  updateReturn(now, dt) {
    if (!this.path.length || this.pathIndex >= this.path.length) {
      this.state = "choose_target";
      return;
    }

    const target = this.path[this.pathIndex];
    const reached = this.moveTowardPoint(target.x, target.y, dt, this.speed);

    if (!reached) return;

    this.pathIndex++;

    if (this.pathIndex >= this.path.length) {
      if (this.returnActionPoint) {
        this.currentActionPoint = this.returnActionPoint;
        this.startActionState(now);
      } else {
        this.state = "choose_target";
      }
    }
  }

  moveTowardPoint(targetX, targetY, dt, speed) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 8) {
      return true;
    }

    const nx = dx / dist;
    const ny = dy / dist;

    const stepX = nx * speed * dt;
    const stepY = ny * speed * dt;

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

    if (!movedX && !movedY) {
      const tryX = this.x + Math.sign(dx) * speed * dt;
      const tryY = this.y + Math.sign(dy) * speed * dt;

      if (!this.scene.willCollide(tryX, this.y, this.size)) {
        this.x = tryX;
      } else if (!this.scene.willCollide(this.x, tryY, this.size)) {
        this.y = tryY;
      }
    }

    return false;
  }

  applyOwnerStateFlags() {
    if (!this.scene.ownerState) return;

    this.clearOwnerStateFlags();

    if (this.currentActionType === "sleep") {
      this.scene.ownerState.goToSleep();
    }

    if (this.currentActionType === "computer") {
      this.scene.ownerState.isWorking = true;
      this.scene.ownerState.isSleeping = false;
    }
  }

  clearOwnerStateFlags() {
    if (!this.scene.ownerState) return;

    this.scene.ownerState.isWorking = false;

    if (this.currentActionType === "sleep") {
      this.scene.ownerState.isSleeping = false;
    }
  }

  getActionDisplayName() {
    if (this.state === "investigate") return "Идет на звук";
    // if (this.state === "chase") return "Гонится";
    // if (this.state === "search") return "Ищет кота";
    // if (this.state === "return") return "Возвращается";

    switch (this.currentActionType) {
      case "computer":
        return "Работает";
      case "sofa":
        return "Сидит на диване";
      case "toilet":
        return "В туалете";
      case "sleep":
        return "Спит";
      case "fridge":
        return "Смотрит в холодильник";
      default:
        return "";
    }
  }

  getActionColor() {
    if (this.state === "investigate") return 0xf59e0b;
    if (this.state === "chase") return 0xdc2626;
    if (this.state === "search") return 0xf59e0b;
    if (this.state === "return") return 0x0284c7;

    switch (this.currentActionType) {
      case "computer":
        return 0x2563eb;
      case "sofa":
        return 0x7c3aed;
      case "toilet":
        return 0x0891b2;
      case "sleep":
        return 0x475569;
      case "fridge":
        return 0x16a34a;
      default:
        return 0x2563eb;
    }
  }

  redraw() {
    this.graphics.clear();
    this.pathGraphics.clear();

    if (!this.visionGraphics) {
      this.visionGraphics = this.scene.add.graphics();
    }

    this.visionGraphics.clear();

    if (
      this.scene.debugMode &&
      this.path.length > 0 &&
      this.pathIndex < this.path.length
    ) {
      this.pathGraphics.lineStyle(3, 0x2563eb, 0.35);
      this.pathGraphics.beginPath();
      this.pathGraphics.moveTo(this.x, this.y);

      for (let i = this.pathIndex; i < this.path.length; i++) {
        this.pathGraphics.lineTo(this.path[i].x, this.path[i].y);
      }

      this.pathGraphics.strokePath();
    }

    if (this.scene.debugMode) {
      this.visionGraphics.fillStyle(
        this.state === "chase" ? 0xef4444 : 0x60a5fa,
        0.08,
      );
      this.visionGraphics.fillCircle(this.x, this.y, this.visionRadius);
      this.visionGraphics.lineStyle(
        1,
        this.state === "chase" ? 0xef4444 : 0x60a5fa,
        0.35,
      );
      this.visionGraphics.strokeCircle(this.x, this.y, this.visionRadius);
    }

    const fillColor = this.getActionColor();

    this.graphics.fillStyle(fillColor, 1);
    this.graphics.fillRect(this.x - 15, this.y - 15, 30, 30);

    this.graphics.lineStyle(2, 0x1e3a8a, 1);
    this.graphics.strokeRect(this.x - 15, this.y - 15, 30, 30);

    const actionName = this.getActionDisplayName();

    if (actionName) {
      this.actionLabel.setText(actionName);
      this.actionLabel.setPosition(this.x + 18, this.y - 28);
      this.actionLabel.setVisible(true);
    } else {
      this.actionLabel.setVisible(false);
    }
  }
}
