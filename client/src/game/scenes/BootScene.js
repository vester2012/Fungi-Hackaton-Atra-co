const Phaser = window.Phaser;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    const spineRuntimeReady = Boolean(window.SpinePlugin);

    this.add.text(40, 40, 'Fungi Hackaton', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#f9fafb'
    });

    this.add.text(40, 92, `Spine runtime: ${spineRuntimeReady ? 'ready' : 'missing'}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#9ca3af'
    });
  }
}
