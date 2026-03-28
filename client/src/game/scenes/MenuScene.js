const Phaser = window.Phaser;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.spine('blackhole_spine_SPO', '../../assets/anim/blackhole_anim_spine.json', '../../assets/anim/blackhole_anim_spine.atlas');
    this.load.spine('fish_SPO', '../../assets/anim/fish.json', '../../assets/anim/fish.atlas');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#0f172a');

    this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x0b1020, 1);
    this.add.rectangle(width * 0.5, height * 0.5, 900, 560, 0x111827, 0.92);

    this.add.text(width * 0.5, 100, 'Mad Animals', {
      fontFamily: 'JungleAdventurer',
      fontSize: '78px',
      color: '#f8fafc'
    }).setOrigin(0.5);
    this.add.text(width * 0.5, 150, 'Fungi Hackaton', {
      fontFamily: 'JungleAdventurer',
      fontSize: '20px',
      color: '#f8fafc'
    }).setOrigin(0.5);

    this.add.text(width * 0.5, 190, 'Main menu', {
      fontFamily: 'JungleAdventurer',
      fontSize: '22px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    const statusText = this.add.text(width * 0.5, height - 110, 'Choose an action', {
      fontFamily: 'JungleAdventurer',
      fontSize: '20px',
      color: '#cbd5e1'
    }).setOrigin(0.5);

    this.createMenuButton(width * 0.5, 270 * 1.35, 360, 64, 'Start Game', 0x22c55e, () => {
      this.scene.start('MainScene');
    });

    this.createMenuButton(width * 0.5, 360 * 1.35, 360, 64, 'Button 1', 0x334155, () => {
      statusText.setText('click button 1');
    });

    this.createMenuButton(width * 0.5, 450 * 1.35, 360, 64, 'Button 2', 0x334155, () => {
      statusText.setText('click button 2');
    });

    this.createMenuButton(width * 0.5, 540 * 1.35, 360, 64, 'Button 3', 0x334155, () => {
      statusText.setText('click button 3');
    });
  }

  createMenuButton(x, y, width, height, label, color, onClick) {
    const button = this.add.rectangle(x, y, width, height, color, 1).setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      fontFamily: 'JungleAdventurer',
      fontSize: '26px',
      color: '#f8fafc'
    }).setOrigin(0.5);

    button.on('pointerover', () => {
        button.setScale(1.03);
      }).on('pointerout', () => {
        button.setScale(1);
      }).on('pointerdown', onClick);

    text.setDepth(1);
  }
}
