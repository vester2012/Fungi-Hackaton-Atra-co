const Phaser = window.Phaser;

export class HealthIndicator extends Phaser.GameObjects.Container {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y);

    scene.add.existing(this);

    this.maxWidth = options.width ?? 90;
    this.barHeight = options.height ?? 20;
    this.textOffsetY = options.textOffsetY ?? 0;
    this.barOffsetY = options.barOffsetY ?? 14;
    this.textColor = options.textColor ?? '#e2e8f0';
    this.textStroke = options.textStroke ?? '#0f172a';
    this.barBgColor = options.barBgColor ?? 0x0f172a;
    this.barStrokeColor = options.barStrokeColor ?? 0x475569;

    this.hpText = scene.add.text(0, this.textOffsetY, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: this.textColor,
      stroke: this.textStroke,
      strokeThickness: 4
    }).setOrigin(0.5, 1);

    this.barBg = scene.add.rectangle(0, this.barOffsetY, this.maxWidth, this.barHeight, this.barBgColor, 0.85)
      .setStrokeStyle(2, this.barStrokeColor, 0.9);

    this.barFill = scene.add.rectangle(-this.maxWidth * 0.5, this.barOffsetY, this.maxWidth, this.barHeight, 0x22c55e, 1)
      .setOrigin(0, 0.5);

    this.add(this.hpText);
    this.add(this.barBg);
    this.add(this.barFill);
  }

  updateHp(currentHp, maxHp) {
    const safeMaxHp = Math.max(1, maxHp);
    const hpRatio = Phaser.Math.Clamp(currentHp / safeMaxHp, 0, 1);

    this.hpText.setText(`HP ${currentHp}/${safeMaxHp}`);
    this.barFill.width = this.maxWidth * hpRatio;
    this.barFill.fillColor = hpRatio > 0.6 ? 0x22c55e : hpRatio > 0.3 ? 0xf59e0b : 0xef4444;
  }
}
