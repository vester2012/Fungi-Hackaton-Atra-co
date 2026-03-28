const Phaser = window.Phaser;

export class HealthIndicator extends Phaser.GameObjects.Container {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y);

    scene.add.existing(this);

    this.maxWidth = options.width ?? 90;
    this.barHeight = options.height ?? 16;
    this.textOffsetY = options.textOffsetY ?? 0;
    this.barOffsetY = options.barOffsetY ?? 14;
    this.textColor = options.textColor ?? '#e2e8f0';
    this.textStroke = options.textStroke ?? '#0f172a';
    this.nickname = options.nickname ?? '';
    this.barBgColor = options.barBgColor ?? 0xef4444;
    this.barRadius = options.barRadius ?? 6;

    this.nicknameText = scene.add.text(0, this.textOffsetY - 20, this.nickname, {
      fontFamily: 'JungleAdventurer',
      fontSize: '18px',
      color: this.textColor,
      stroke: this.textStroke,
      strokeThickness: 4
    }).setOrigin(0.5, 1);

    this.hpText = scene.add.text(0, this.textOffsetY, '', {
      fontFamily: 'JungleAdventurer',
      fontSize: '18px',
      color: this.textColor,
      stroke: this.textStroke,
      strokeThickness: 4
    }).setOrigin(0.5, 1);

    this.barBg = scene.add.graphics();
    this.barFill = scene.add.graphics();

    this.add(this.nicknameText);
    this.add(this.hpText);
    this.add(this.barBg);
    this.add(this.barFill);
  }

  setNickname(nickname) {
    this.nickname = nickname ?? '';
    this.nicknameText.setText(this.nickname);
  }

  updateHp(currentHp, maxHp) {
    const safeMaxHp = Math.max(1, maxHp);
    const hpRatio = Phaser.Math.Clamp(currentHp / safeMaxHp, 0, 1);
    const left = -this.maxWidth * 0.5;
    const top = this.barOffsetY - this.barHeight * 0.5;
    const fillWidth = this.maxWidth * hpRatio;

    this.nicknameText.setText(this.nickname);
    this.hpText.setText(`HP ${currentHp}/${safeMaxHp}`);

    this.barBg.clear();
    this.barBg.fillStyle(this.barBgColor, 1);
    this.barBg.fillRoundedRect(left, top, this.maxWidth, this.barHeight, this.barRadius);

    this.barFill.clear();
    if (fillWidth > 0) {
      this.barFill.fillStyle(0x3eff00, 1);
      this.barFill.fillRoundedRect(left, top, fillWidth, this.barHeight, this.barRadius);
    }
  }
}
