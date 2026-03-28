const Phaser = window.Phaser;

export class DamagePopup extends Phaser.GameObjects.Text {
  constructor(scene, x, y, amount, options = {}) {
    super(scene, x, y, `-${amount}`, {
      fontFamily: 'JungleAdventurer',
      fontSize: options.fontSize ?? '26px',
      color: options.color ?? '#fca5a5',
      stroke: options.stroke ?? '#450a0a',
      strokeThickness: options.strokeThickness ?? 5
    });

    scene.add.existing(this);

    this.setOrigin(0.5, 1);

    scene.tweens.add({
      targets: this,
      y: y - 100,
      alpha: 0,
      duration: options.duration ?? 1000,
      ease: 'Cubic.Out',
      onComplete: () => this.destroy()
    });
  }
}
