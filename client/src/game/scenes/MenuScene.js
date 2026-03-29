const Phaser = window.Phaser;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#f9f0e3");

    this.drawBackground(width, height);
    this.drawPanel(width, height);

    // Заголовок
    this.add
      .text(width * 0.5, 122, "CAT CHAOS", {
        fontFamily: "Arial",
        fontSize: "70px",
        fontStyle: "bold",
        color: "#fff9f0",
        stroke: "#5c3a2a",
        strokeThickness: 7,
      })
      .setOrigin(0.5);

    this.add
      .text(width * 0.5, 188, "доведи хозяина до точки кипения", {
        fontFamily: "Arial",
        fontSize: "23px",
        color: "rgb(75, 60, 42)",
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(width * 0.5, height - 102, "Выбери действие", {
        fontFamily: "Arial",
        fontSize: "21px",
        color: "#5f3f2e",
      })
      .setOrigin(0.5);

    // Кнопки — более насыщенные цвета
    this.createMenuButton({
      x: width * 0.5,
      y: 310 + 88,
      width: 360,
      height: 70,
      label: "Играть",
      fill: 0xffa47f, // насыщенный тёплый персик
      hoverFill: 0xffb492,
      onClick: () => this.scene.start("MainScene"),
    });

    this.createMenuButton({
      x: width * 0.5,
      y: 395 + 88,
      width: 360,
      height: 70,
      label: "Настройки",
      fill: 0xfed9a8, // насыщенный кремово-оранжевый
      hoverFill: 0xffe4b8,
      onClick: () => this.statusText.setText("Настройки пока в разработке"),
    });

    this.createMenuButton({
      x: width * 0.5,
      y: 480 + 88,
      width: 360,
      height: 70,
      label: "Как играть",
      fill: 0xfed9a8,
      hoverFill: 0xffe4b8,
      onClick: () =>
        this.statusText.setText("Пакость, прячься и избегай хозяина"),
    });

    this.createMenuButton({
      x: width * 0.5,
      y: 565 + 88,
      width: 360,
      height: 70,
      label: "Выход",
      fill: 0xff8f6e, // более насыщенный тёплый коралл
      hoverFill: 0xffa07f,
      onClick: () => this.statusText.setText("Выхода нет.."),
    });
  }

  drawBackground(width, height) {
    this.add.rectangle(width * 0.5, height * 0.5, width, height, 0xf9f0e3, 1);

    const g = this.add.graphics();

    // Более насыщенные low-poly пятна
    g.fillStyle(0xe8d1b5, 1);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(width * 0.39, 0);
    g.lineTo(width * 0.21, height * 0.31);
    g.lineTo(0, height * 0.23);
    g.closePath();
    g.fillPath();

    g.fillStyle(0xffe4c2, 1);
    g.beginPath();
    g.moveTo(width, 0);
    g.lineTo(width, height * 0.27);
    g.lineTo(width * 0.76, height * 0.16);
    g.lineTo(width * 0.89, 0);
    g.closePath();
    g.fillPath();

    g.fillStyle(0xd9c4a9, 1);
    g.beginPath();
    g.moveTo(0, height);
    g.lineTo(0, height * 0.73);
    g.lineTo(width * 0.27, height * 0.87);
    g.lineTo(width * 0.13, height);
    g.closePath();
    g.fillPath();

    g.fillStyle(0xffd9b8, 1);
    g.beginPath();
    g.moveTo(width, height);
    g.lineTo(width * 0.79, height);
    g.lineTo(width * 0.66, height * 0.74);
    g.lineTo(width, height * 0.63);
    g.closePath();
    g.fillPath();

    // Световые пятна
    this.add.ellipse(150, 102, 255, 148, 0xffffff, 0.14);
    this.add.ellipse(width - 160, height - 122, 295, 168, 0x000000, 0.05);
  }

  drawPanel(width, height) {
    const panelX = width * 0.5;
    const panelY = height * 0.5 + 16;
    const panelW = 725;
    const panelH = 625;

    // Тень
    this.add.rectangle(panelX + 16, panelY + 24, panelW, panelH, 0x000000, 0.1);

    // Основная панель
    this.add.rectangle(panelX, panelY, panelW, panelH, 0xfff4e4, 1);

    // Верхняя акцентная полоска (насыщеннее)
    this.add.rectangle(
      panelX,
      panelY - panelH * 0.5 + 29,
      panelW,
      54,
      0xffe0be,
      1,
    );
  }

  createMenuButton({ x, y, width, height, label, fill, hoverFill, onClick }) {
    const shadow = this.add
      .rectangle(x + 7, y + 8, width, height, 0x000000, 0.12)
      .setOrigin(0.5);

    const button = this.add
      .rectangle(x, y, width, height, fill, 1)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const highlight = this.add
      .rectangle(x, y - height * 0.25, width - 28, 13, 0xffffff, 0.24)
      .setOrigin(0.5);

    const text = this.add
      .text(x, y, label, {
        fontFamily: "Arial",
        fontSize: "30px",
        fontStyle: "bold",
        color: "#3a2a21",
      })
      .setOrigin(0.5);

    button
      .on("pointerover", () => {
        button.setFillStyle(hoverFill);
        button.setScale(1.04);
        shadow.setScale(1.04);
        highlight.setScale(1.04);
      })
      .on("pointerout", () => {
        button.setFillStyle(fill);
        button.setScale(1);
        shadow.setScale(1);
        highlight.setScale(1);
      })
      .on("pointerdown", () => {
        button.setScale(0.96);
        shadow.setScale(0.96);
        highlight.setScale(0.96);
      })
      .on("pointerup", () => {
        button.setScale(1.04);
        shadow.setScale(1.04);
        highlight.setScale(1.04);
        onClick();
      });

    text.setDepth(2);
    highlight.setDepth(1);
  }
}
