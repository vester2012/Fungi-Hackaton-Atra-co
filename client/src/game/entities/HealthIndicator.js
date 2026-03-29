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

        // Создаем графику для ХП
        this.barBg = scene.add.graphics();
        this.barFill = scene.add.graphics();

        // СОЗДАЕМ ГРАФИКУ ДЛЯ ДЭША ЗДЕСЬ (Именно этого не хватало!)
        this.dashBarBg = scene.add.graphics();
        this.dashBarFill = scene.add.graphics();

        this.add(this.nicknameText);
        this.add(this.hpText);
        this.add(this.barBg);
        this.add(this.barFill);

        // Теперь добавление не вызовет ошибку
        this.add(this.dashBarBg);
        this.add(this.dashBarFill);
    }

    setNickname(nickname) {
        this.nickname = nickname ?? '';
        this.nicknameText.setText(this.nickname);
    }

    updateHp(currentHp, maxHp) {
        if (!this.active || !this.scene || !this.nicknameText || !this.nicknameText.scene) return;

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

    // Обновление полоски отката дэша (0.0 = кд, 1.0 = готово)
    updateDash(ratio) {
        if (!this.active || !this.scene) return;
        const left = -this.maxWidth * 0.5;
        const top = this.barOffsetY - this.barHeight * 0.5 + this.barHeight + 4; // Чуть ниже HP
        const dashBarHeight = 6;
        const fillWidth = this.maxWidth * ratio;

        this.dashBarBg.clear();
        this.dashBarBg.fillStyle(0x334155, 1);
        this.dashBarBg.fillRoundedRect(left, top, this.maxWidth, dashBarHeight, 3);

        this.dashBarFill.clear();
        if (fillWidth > 0) {
            const color = ratio >= 1 ? 0x0ea5e9 : 0x7dd3fc;
            this.dashBarFill.fillStyle(color, 1);
            this.dashBarFill.fillRoundedRect(left, top, fillWidth, dashBarHeight, 3);
        }
    }
}