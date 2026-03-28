const Phaser = window.Phaser;

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    //this.load.spine('person', '../../assets/anim/person.json', '../../assets/anim/person_desktop.atlas')
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#14213d');
    //this.mainCharacter = this.add.spine(100, 100, 'person', 'idle', true);


    this.add.text(width * 0.5, 90, 'Main Game Scene', {
      fontFamily: 'Arial',
      fontSize: '42px',
      color: '#f8fafc'
    }).setOrigin(0.5);

    const backButton = this.add.rectangle(width * 0.5, height - 90, 240, 58, 0xf59e0b, 1).setInteractive({ useHandCursor: true });

    const backLabel = this.add.text(width * 0.5, height - 90, 'Back To Menu', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#111827'
    }).setOrigin(0.5);

    backButton.on('pointerover', () => backButton.setFillStyle(0xfbbf24, 1))
      .on('pointerout', () => backButton.setFillStyle(0xf59e0b, 1))
      .on('pointerdown', () => {
        this.scene.start('MenuScene');
      });

    backLabel.setDepth(1);
  }
}
