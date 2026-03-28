const Phaser = window.Phaser;

export class OwnerRouteEditorScene extends Phaser.Scene {
  constructor() {
    super("OwnerRouteEditorScene");
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

    this.mode = "nav"; // nav | action | select | block_rect | block_circle
    this.points = [];
    this.blockers = [];
    this.selectedPointIndex = -1;
    this.selectedBlockerIndex = -1;

    this.dragStart = null;
    this.previewGraphics = this.add.graphics();
    this.graphics = this.add.graphics();
    this.labels = [];

    this.keys = this.input.keyboard.addKeys({
      modeNav: Phaser.Input.Keyboard.KeyCodes.ONE,
      modeAction: Phaser.Input.Keyboard.KeyCodes.TWO,
      modeSelect: Phaser.Input.Keyboard.KeyCodes.THREE,
      modeBlockRect: Phaser.Input.Keyboard.KeyCodes.FOUR,
      modeBlockCircle: Phaser.Input.Keyboard.KeyCodes.FIVE,

      deleteKey: Phaser.Input.Keyboard.KeyCodes.DELETE,
      clearKey: Phaser.Input.Keyboard.KeyCodes.C,
      exportKey: Phaser.Input.Keyboard.KeyCodes.X,

      waitDown: Phaser.Input.Keyboard.KeyCodes.A,
      waitUp: Phaser.Input.Keyboard.KeyCodes.D,

      typeComputer: Phaser.Input.Keyboard.KeyCodes.Q,
      typeSofa: Phaser.Input.Keyboard.KeyCodes.W,
      typeToilet: Phaser.Input.Keyboard.KeyCodes.E,
      typeSleep: Phaser.Input.Keyboard.KeyCodes.R,
      typeFridge: Phaser.Input.Keyboard.KeyCodes.T,
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
      if (this.mode === "select") {
        this.selectedPointIndex = this.findPointAt(pointer.x, pointer.y);
        this.selectedBlockerIndex = this.findBlockerAt(pointer.x, pointer.y);
        this.redraw();
        return;
      }

      if (!this.isInsideMap(pointer.x, pointer.y)) return;

      if (this.mode === "nav") {
        this.points.push({
          id: `nav_${this.countByKind("nav") + 1}`,
          kind: "nav",
          x: Math.round(pointer.x),
          y: Math.round(pointer.y),
        });

        this.selectedPointIndex = this.points.length - 1;
        this.selectedBlockerIndex = -1;
        this.redraw();
        return;
      }

      if (this.mode === "action") {
        this.points.push({
          id: `act_${this.countByKind("action") + 1}`,
          kind: "action",
          x: Math.round(pointer.x),
          y: Math.round(pointer.y),
          actionType: "computer",
          wait: 3000,
        });

        this.selectedPointIndex = this.points.length - 1;
        this.selectedBlockerIndex = -1;
        this.redraw();
        return;
      }

      if (this.mode === "block_rect" || this.mode === "block_circle") {
        this.dragStart = { x: pointer.x, y: pointer.y };
      }
    });

    this.input.on("pointermove", (pointer) => {
      if (!this.dragStart) return;

      this.previewGraphics.clear();

      if (this.mode === "block_rect") {
        const x = Math.min(this.dragStart.x, pointer.x);
        const y = Math.min(this.dragStart.y, pointer.y);
        const width = Math.abs(pointer.x - this.dragStart.x);
        const height = Math.abs(pointer.y - this.dragStart.y);

        this.previewGraphics.fillStyle(0xef4444, 0.18);
        this.previewGraphics.fillRect(x, y, width, height);
        this.previewGraphics.lineStyle(2, 0xef4444, 0.9);
        this.previewGraphics.strokeRect(x, y, width, height);
      }

      if (this.mode === "block_circle") {
        const radius = Phaser.Math.Distance.Between(
          this.dragStart.x,
          this.dragStart.y,
          pointer.x,
          pointer.y,
        );

        this.previewGraphics.fillStyle(0xef4444, 0.18);
        this.previewGraphics.fillCircle(
          this.dragStart.x,
          this.dragStart.y,
          radius,
        );
        this.previewGraphics.lineStyle(2, 0xef4444, 0.9);
        this.previewGraphics.strokeCircle(
          this.dragStart.x,
          this.dragStart.y,
          radius,
        );
      }
    });

    this.input.on("pointerup", (pointer) => {
      if (!this.dragStart) return;

      if (this.mode === "block_rect") {
        const x = Math.min(this.dragStart.x, pointer.x);
        const y = Math.min(this.dragStart.y, pointer.y);
        const width = Math.abs(pointer.x - this.dragStart.x);
        const height = Math.abs(pointer.y - this.dragStart.y);

        if (width >= 12 && height >= 12) {
          this.blockers.push({
            id: `block_${this.blockers.length + 1}`,
            kind: "block",
            shape: "rect",
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      }

      if (this.mode === "block_circle") {
        const radius = Phaser.Math.Distance.Between(
          this.dragStart.x,
          this.dragStart.y,
          pointer.x,
          pointer.y,
        );

        if (radius >= 8) {
          this.blockers.push({
            id: `block_${this.blockers.length + 1}`,
            kind: "block",
            shape: "circle",
            x: Math.round(this.dragStart.x),
            y: Math.round(this.dragStart.y),
            radius: Math.round(radius),
          });
        }
      }

      this.dragStart = null;
      this.previewGraphics.clear();
      this.redraw();
    });

    this.redraw();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.modeNav)) this.mode = "nav";
    if (Phaser.Input.Keyboard.JustDown(this.keys.modeAction))
      this.mode = "action";
    if (Phaser.Input.Keyboard.JustDown(this.keys.modeSelect))
      this.mode = "select";
    if (Phaser.Input.Keyboard.JustDown(this.keys.modeBlockRect))
      this.mode = "block_rect";
    if (Phaser.Input.Keyboard.JustDown(this.keys.modeBlockCircle))
      this.mode = "block_circle";

    if (this.selectedPointIndex !== -1) {
      const point = this.points[this.selectedPointIndex];

      if (point?.kind === "action") {
        if (Phaser.Input.Keyboard.JustDown(this.keys.waitUp)) {
          point.wait += 500;
          this.redraw();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.waitDown)) {
          point.wait = Math.max(0, point.wait - 500);
          this.redraw();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.typeComputer)) {
          point.actionType = "computer";
          this.redraw();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.typeSofa)) {
          point.actionType = "sofa";
          this.redraw();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.typeToilet)) {
          point.actionType = "toilet";
          this.redraw();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.typeSleep)) {
          point.actionType = "sleep";
          this.redraw();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.typeFridge)) {
          point.actionType = "fridge";
          this.redraw();
        }
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.deleteKey)) {
      if (this.selectedPointIndex !== -1) {
        this.points.splice(this.selectedPointIndex, 1);
        this.selectedPointIndex = -1;
        this.reindexIds();
        this.redraw();
      } else if (this.selectedBlockerIndex !== -1) {
        this.blockers.splice(this.selectedBlockerIndex, 1);
        this.selectedBlockerIndex = -1;
        this.reindexIds();
        this.redraw();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.clearKey)) {
      this.points = [];
      this.blockers = [];
      this.selectedPointIndex = -1;
      this.selectedBlockerIndex = -1;
      this.redraw();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.exportKey)) {
      const exportData = {
        navPoints: this.points.filter((p) => p.kind === "nav"),
        actionPoints: this.points.filter((p) => p.kind === "action"),
        blockers: this.blockers,
      };

      const json = JSON.stringify(exportData, null, 2);

      console.log("=== OWNER NAV DATA ===");
      console.log(json);

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(json).catch(() => {});
      }
    }

    this.infoText.setText(
      [
        `Режим: ${this.mode}`,
        "1 nav | 2 action | 3 select | 4 block rect | 5 block circle",
        "Delete — удалить | X — экспорт | C — очистить",
        "Для action point:",
        "Q computer | W sofa | E toilet | R sleep | T fridge",
        "A/D — wait -/+ 500ms",
      ].join("\n"),
    );
  }

  isInsideMap(x, y) {
    return (
      x >= this.mapBounds.x &&
      x <= this.mapBounds.x + this.mapBounds.width &&
      y >= this.mapBounds.y &&
      y <= this.mapBounds.y + this.mapBounds.height
    );
  }

  countByKind(kind) {
    return this.points.filter((p) => p.kind === kind).length;
  }

  reindexIds() {
    let navCount = 1;
    let actCount = 1;
    let blockCount = 1;

    for (const point of this.points) {
      if (point.kind === "nav") point.id = `nav_${navCount++}`;
      if (point.kind === "action") point.id = `act_${actCount++}`;
    }

    for (const blocker of this.blockers) {
      blocker.id = `block_${blockCount++}`;
    }
  }

  findPointAt(x, y) {
    for (let i = this.points.length - 1; i >= 0; i--) {
      const p = this.points[i];
      const dist = Phaser.Math.Distance.Between(x, y, p.x, p.y);
      if (dist <= 16) return i;
    }
    return -1;
  }

  findBlockerAt(x, y) {
    for (let i = this.blockers.length - 1; i >= 0; i--) {
      const b = this.blockers[i];

      if (b.shape === "rect") {
        if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
          return i;
        }
      }

      if (b.shape === "circle") {
        const dist = Phaser.Math.Distance.Between(x, y, b.x, b.y);
        if (dist <= b.radius) {
          return i;
        }
      }
    }

    return -1;
  }

  redraw() {
    this.graphics.clear();
    this.labels.forEach((label) => label.destroy());
    this.labels = [];

    // blockers
    for (let i = 0; i < this.blockers.length; i++) {
      const b = this.blockers[i];
      const selected = i === this.selectedBlockerIndex;

      this.graphics.fillStyle(0xef4444, selected ? 0.28 : 0.16);
      this.graphics.lineStyle(2, selected ? 0xfacc15 : 0xef4444, 0.95);

      if (b.shape === "rect") {
        this.graphics.fillRect(b.x, b.y, b.width, b.height);
        this.graphics.strokeRect(b.x, b.y, b.width, b.height);
      }

      if (b.shape === "circle") {
        this.graphics.fillCircle(b.x, b.y, b.radius);
        this.graphics.strokeCircle(b.x, b.y, b.radius);
      }

      const label = this.add
        .text(
          b.shape === "rect" ? b.x + 8 : b.x + b.radius + 8,
          b.shape === "rect" ? b.y + 8 : b.y - 8,
          `${b.id} | ${b.shape}`,
          {
            fontFamily: "Arial",
            fontSize: "14px",
            color: "#7f1d1d",
            backgroundColor: "#fee2e2cc",
            padding: { left: 4, right: 4, top: 2, bottom: 2 },
          },
        )
        .setDepth(200);

      this.labels.push(label);
    }

    // nav graph hints
    const navPoints = this.points.filter((p) => p.kind === "nav");
    if (navPoints.length > 1) {
      for (let i = 0; i < navPoints.length; i++) {
        const a = navPoints[i];

        for (let j = i + 1; j < navPoints.length; j++) {
          const b = navPoints[j];
          const dist = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);

          if (dist <= 260) {
            this.graphics.lineStyle(2, 0x94a3b8, 0.25);
            this.graphics.beginPath();
            this.graphics.moveTo(a.x, a.y);
            this.graphics.lineTo(b.x, b.y);
            this.graphics.strokePath();
          }
        }
      }
    }

    // points
    this.points.forEach((point, index) => {
      const selected = index === this.selectedPointIndex;

      if (point.kind === "nav") {
        this.graphics.fillStyle(selected ? 0xf59e0b : 0x2563eb, 1);
        this.graphics.fillCircle(point.x, point.y, selected ? 12 : 9);
        this.graphics.lineStyle(2, selected ? 0x7c2d12 : 0x1e3a8a, 1);
        this.graphics.strokeCircle(point.x, point.y, selected ? 12 : 9);

        const label = this.add
          .text(point.x + 12, point.y - 10, point.id, {
            fontFamily: "Arial",
            fontSize: "14px",
            color: selected ? "#7c2d12" : "#1e3a8a",
            backgroundColor: selected ? "#fed7aa" : "#dbeafecc",
            padding: { left: 4, right: 4, top: 2, bottom: 2 },
          })
          .setDepth(200);

        this.labels.push(label);
      }

      if (point.kind === "action") {
        this.graphics.fillStyle(selected ? 0xf59e0b : 0x16a34a, 1);
        this.graphics.fillRect(
          point.x - 10,
          point.y - 10,
          selected ? 24 : 20,
          selected ? 24 : 20,
        );
        this.graphics.lineStyle(2, selected ? 0x7c2d12 : 0x14532d, 1);
        this.graphics.strokeRect(
          point.x - 10,
          point.y - 10,
          selected ? 24 : 20,
          selected ? 24 : 20,
        );

        const label = this.add
          .text(point.x + 12, point.y - 10, `s`, {
            fontFamily: "Arial",
            fontSize: "14px",
            color: selected ? "#7c2d12" : "#14532d",
            backgroundColor: selected ? "#fed7aa" : "#dcfce7cc",
            padding: { left: 4, right: 4, top: 2, bottom: 2 },
          })
          .setDepth(200);

        this.labels.push(label);
      }
    });
  }
}
