const Phaser = window.Phaser;

export class EvidenceSystem {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.graphics = scene.add.graphics();
  }

  spawn({
    type,
    zoneId,
    x,
    y,
    points,
    label,
    radius = 44
  }) {
    this.items.push({
      id: `ev_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      type,
      zoneId,
      x,
      y,
      points,
      label,
      radius,
      seen: false
    });

    this.redraw();
  }

  getUnseenVisibleForOwner(owner) {
    const result = [];

    for (const item of this.items) {
      if (item.seen) continue;

      const dist = Phaser.Math.Distance.Between(owner.x, owner.y, item.x, item.y);
      if (dist <= owner.visionRadius) {
        result.push(item);
      }
    }

    return result;
  }

  markSeen(id) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    item.seen = true;
    this.redraw();
  }

  redraw() {
    this.graphics.clear();

    for (const item of this.items) {
      if (item.seen) continue;

      this.graphics.fillStyle(0xf97316, 0.22);
      this.graphics.fillCircle(item.x, item.y, item.radius);

      this.graphics.lineStyle(2, 0xea580c, 0.9);
      this.graphics.strokeCircle(item.x, item.y, item.radius);
    }
  }
}
