const Phaser = window.Phaser;

export class EvidenceSystem {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.graphics = scene.add.graphics().setDepth(118);
    this.iconLayer = scene.add.layer().setDepth(119);
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
      displayObject: null,
    };

    this.items.push(item);
    this.redraw();

    return item;
  }

  update(now) {
    const expired = this.items.filter(
      (item) => item.expiresAt && now >= item.expiresAt,
    );

    for (const item of expired) {
      this.destroyDisplayObject(item);
    }

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
    const item = this.items.find((i) => i.id === id);
    if (item) {
      this.destroyDisplayObject(item);
    }

    const before = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);

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

  destroyDisplayObject(item) {
    if (item.displayObject && item.displayObject.destroy) {
      item.displayObject.destroy();
    }
    item.displayObject = null;
  }

  ensurePoopSprite(item) {
    if (item.displayObject) {
      item.displayObject.setPosition(item.x, item.y);
      item.displayObject.setVisible(!item.seen);
      return;
    }

    const sprite = this.scene.add.image(item.x, item.y, "poop_img");
    sprite.setDepth(119);
    sprite.setDisplaySize(30, 30);
    sprite.setVisible(!item.seen);

    this.iconLayer.add(sprite);
    item.displayObject = sprite;
  }

  redraw() {
    this.graphics.clear();

    for (const item of this.items) {
      if (item.type === "poop") {
        this.ensurePoopSprite(item);
      } else if (item.displayObject) {
        this.destroyDisplayObject(item);
      }

      if (item.seen) {
        continue;
      }

      if (item.type === "pee") {
        this.graphics.fillStyle(0xf3d34a, 0.95);
        this.graphics.fillRoundedRect(item.x - 18, item.y - 10, 36, 20, 7);

        this.graphics.lineStyle(2, 0xca8a04, 0.95);
        this.graphics.strokeRoundedRect(item.x - 18, item.y - 10, 36, 20, 7);
        continue;
      }

      if (item.type === "vomit") {
        this.graphics.fillStyle(0x34a853, 0.95);
        this.graphics.fillCircle(item.x, item.y, 14);

        this.graphics.lineStyle(2, 0x1f7a35, 0.95);
        this.graphics.strokeCircle(item.x, item.y, 14);
        continue;
      }

      if (item.type === "poop_smeared") {
        this.graphics.fillStyle(0x6b4423, 0.9);
        this.graphics.fillRoundedRect(item.x - 34, item.y - 9, 68, 18, 8);

        this.graphics.lineStyle(2, 0x3f2a16, 0.95);
        this.graphics.strokeRoundedRect(item.x - 34, item.y - 9, 68, 18, 8);
        continue;
      }

      if (item.type === "damage") {
        this.graphics.fillStyle(0xef4444, 0.22);
        this.graphics.fillCircle(item.x, item.y, item.radius);

        this.graphics.lineStyle(2, 0xb91c1c, 0.9);
        this.graphics.strokeCircle(item.x, item.y, item.radius);
        continue;
      }

      if (item.type === "mess") {
        this.graphics.fillStyle(0xf97316, 0.22);
        this.graphics.fillCircle(item.x, item.y, item.radius);

        this.graphics.lineStyle(2, 0xc2410c, 0.9);
        this.graphics.strokeCircle(item.x, item.y, item.radius);
        continue;
      }
    }
  }
}
