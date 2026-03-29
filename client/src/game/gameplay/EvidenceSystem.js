const Phaser = window.Phaser;

export class EvidenceSystem {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.graphics = scene.add.graphics();
  }

  spawn({ type, zoneId, x, y, points, label, radius = 44, expiresAt = null }) {
    const item = {
      id: `ev_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      type,
      zoneId,
      x,
      y,
      points,
      label,
      radius,
      seen: false,
      expiresAt,
    };

    this.items.push(item);
    this.redraw();

    return item;
  }

  update(now) {
    const before = this.items.length;

    this.items = this.items.filter((item) => {
      if (!item.expiresAt) return true;
      return now < item.expiresAt;
    });

    if (this.items.length !== before) {
      this.redraw();
    }
  }

  remove(id) {
    const before = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);

    if (this.items.length !== before) {
      this.redraw();
    }
  }

  findByType(type) {
    return this.items.filter((item) => item.type === type);
  }

  findNearby(type, x, y, radius) {
    return this.items.filter((item) => {
      if (item.type !== type) return false;

      const dist = Phaser.Math.Distance.Between(x, y, item.x, item.y);
      return dist <= radius;
    });
  }

  getUnseenVisibleForOwner(owner) {
    const result = [];

    for (const item of this.items) {
      if (item.seen) continue;

      const dist = Phaser.Math.Distance.Between(
        owner.x,
        owner.y,
        item.x,
        item.y,
      );
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

      let fillColor = 0xf97316;
      let strokeColor = 0xea580c;

      if (item.type === "pee") {
        fillColor = 0xfacc15;
        strokeColor = 0xca8a04;
      }

      if (item.type === "poop") {
        fillColor = 0x8b5e3c;
        strokeColor = 0x5c3b24;
      }

      if (item.type === "poop_smeared") {
        fillColor = 0x6b4423;
        strokeColor = 0x3f2a16;
      }

      if (item.type === "damage") {
        fillColor = 0xef4444;
        strokeColor = 0xb91c1c;
      }

      if (item.type === "mess") {
        fillColor = 0xf97316;
        strokeColor = 0xc2410c;
      }

      this.graphics.fillStyle(fillColor, 0.22);
      this.graphics.fillCircle(item.x, item.y, item.radius);

      this.graphics.lineStyle(2, strokeColor, 0.9);
      this.graphics.strokeCircle(item.x, item.y, item.radius);
    }
  }
}
