const Phaser = window.Phaser;

export class VacuumRouteEditorScene extends Phaser.Scene {
  constructor() {
    super("VacuumRouteEditorScene");
  }

  preload() {
    this.load.image("apartment", "assets/apartment.png");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#1e1e1e");

    this.bg = this.add.image(width / 2, height / 2, "apartment");

    const texture = this.textures.get("apartment").getSourceImage();
    const scale = Math.min(width / texture.width, height / texture.height);
    this.bg.setScale(scale);

    this.mapBounds = {
      x: this.bg.x - (texture.width * scale) / 2,
      y: this.bg.y - (texture.height * scale) / 2,
      width: texture.width * scale,
      height: texture.height * scale,
    };

    this.points = [];
    this.labels = [];
    this.selectedIndex = -1;

    this.graphics = this.add.graphics();

    this.keys = this.input.keyboard.addKeys({
      exportKey: Phaser.Input.Keyboard.KeyCodes.X,
      clearKey: Phaser.Input.Keyboard.KeyCodes.C,
      deleteKey: Phaser.Input.Keyboard.KeyCodes.DELETE,
    });

    this.infoText = this.add
      .text(16, 16, "", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#111827",
        backgroundColor: "#ffffffdd",
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setDepth(100);

    this.input.on("pointerdown", (pointer) => {
      const idx = this.findPointAt(pointer.x, pointer.y);

      if (idx !== -1) {
        this.selectedIndex = idx;
        this.redraw();
        return;
      }

      if (!this.isInsideMap(pointer.x, pointer.y)) return;

      this.points.push({
        x: Math.round(pointer.x),
        y: Math.round(pointer.y),
      });

      this.selectedIndex = this.points.length - 1;
      this.redraw();
    });

    this.redraw();
  }

  update() {
    this.infoText.setText(
      [
        "Клик — добавить точку / выбрать точку",
        "Delete — удалить точку",
        "X — экспорт",
        "C — очистить всё",
      ].join("\n"),
    );

    if (Phaser.Input.Keyboard.JustDown(this.keys.deleteKey)) {
      if (this.selectedIndex !== -1) {
        this.points.splice(this.selectedIndex, 1);
        this.selectedIndex = -1;
        this.redraw();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.clearKey)) {
      this.points = [];
      this.selectedIndex = -1;
      this.redraw();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.exportKey)) {
      const json = JSON.stringify(this.points, null, 2);
      console.log("=== VACUUM_ROUTE ===");
      console.log(json);

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(json).catch(() => {});
      }
    }
  }

  isInsideMap(x, y) {
    return (
      x >= this.mapBounds.x &&
      x <= this.mapBounds.x + this.mapBounds.width &&
      y >= this.mapBounds.y &&
      y <= this.mapBounds.y + this.mapBounds.height
    );
  }

  findPointAt(x, y) {
    for (let i = this.points.length - 1; i >= 0; i--) {
      const p = this.points[i];
      const dist = Phaser.Math.Distance.Between(x, y, p.x, p.y);
      if (dist <= 14) return i;
    }
    return -1;
  }

  redraw() {
    this.graphics.clear();
    this.labels.forEach((l) => l.destroy());
    this.labels = [];

    if (this.points.length > 1) {
      this.graphics.lineStyle(4, 0x334155, 0.6);
      this.graphics.beginPath();
      this.graphics.moveTo(this.points[0].x, this.points[0].y);

      for (let i = 1; i < this.points.length; i++) {
        this.graphics.lineTo(this.points[i].x, this.points[i].y);
      }

      this.graphics.lineTo(this.points[0].x, this.points[0].y);
      this.graphics.strokePath();
    }

    this.points.forEach((point, index) => {
      const selected = index === this.selectedIndex;

      this.graphics.fillStyle(selected ? 0xf59e0b : 0x334155, 1);
      this.graphics.fillCircle(point.x, point.y, selected ? 11 : 9);

      this.graphics.lineStyle(2, selected ? 0x7c2d12 : 0x94a3b8, 1);
      this.graphics.strokeCircle(point.x, point.y, selected ? 11 : 9);

      const label = this.add
        .text(
          point.x + 12,
          point.y - 10,
          `${index + 1}, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: selected ? "#7c2d12" : "#e2e8f0",
        backgroundColor: selected ? "#fed7aa" : "#334155cc",
        padding: { left: 4, right: 4, top: 2, bottom: 2 },
      }`,
        )
        .setDepth(200);

      this.labels.push(label);
    });
  }
}
