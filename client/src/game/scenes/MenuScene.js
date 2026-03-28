import {unit_manager} from "../unit_manager";

const Phaser = window.Phaser;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.spine('blackhole_spine_SPO', '../../assets/anim/blackhole_anim_spine.json', '../../assets/anim/blackhole_anim_spine.atlas');
    this.load.spine('fish_SPO', '../../assets/anim/fish.json', '../../assets/anim/fish.atlas');
    this.load.spine('enemy_bee_SPO', '../../assets/anim/enemy_bee.json', '../../assets/anim/enemy_bee.atlas');

    this.load.image('heart', '../../assets/heart.png');

    this.load.audio('jump', ['assets/audio/ma-jump.mp3', 'assets/audio/ma-jump.ogg']);
    this.load.audio('jump1', ['assets/audio/ma-jump1.mp3', 'assets/audio/ma-jump1.ogg']);
    this.load.audio('jump2', ['assets/audio/ma-jump2.mp3', 'assets/audio/ma-jump2.ogg']);
    this.load.audio('jump3', ['assets/audio/ma-jump3.mp3', 'assets/audio/ma-jump3.ogg']);
    this.load.audio('kick', ['assets/audio/ma-kick.mp3', 'assets/audio/ma-kick.ogg']);
    this.load.audio('kick1', ['assets/audio/ma-kick1.mp3', 'assets/audio/ma-kick1.ogg']);
    this.load.audio('bg-music', ['assets/audio/bg-music.mp3', 'assets/audio/bg-music.ogg']);

  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#0f172a');

    this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x0b1020, 1);
    this.add.rectangle(width * 0.5, height * 0.5, 900, 560, 0x111827, 0.92);

    this.add.text(width * 0.5 - 140, 100, 'MAD', {
      fontFamily: 'JungleAdventurer',
      fontSize: '78px',
      color: '#ff6300'
    }).setOrigin(0.5);

    this.add.text(width * 0.5 + 80, 100, 'ANIMALS', {
      fontFamily: 'JungleAdventurer',
      fontSize: '78px',
      color: '#56a23e'
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

    this.createMenuButton(width * 0.5, 360 * 1.35, 360, 64, 'Create room', 0x334155, () => {
      let roomName = prompt("enter room name");
      let roomPass = prompt("enter room pass");
      unit_manager.socket.emit("create_room", { sid: localStorage.getItem('game_session_id'), roomName, roomPass});

    });

    this.createMenuButton(width * 0.5, 450 * 1.35, 360, 64, 'join room by id', 0x334155, () => {
      let idRoom = prompt("enter id room");
      let passRoom = prompt("enter room pass");
      unit_manager.socket.emit("join_room", { sid: localStorage.getItem('game_session_id'), idRoom, passRoom});

    });

    this.createMenuButton(width * 0.5, 540 * 1.35, 360, 64, '🥇 MATCHMAKING 🥇', 0x334155, () => {

    });

    this.input.once('pointerdown', () => {
      if (!this.bgMusic) {
        this.bgMusic = this.sound.add('bg-music', {
          loop: true,
          volume: 0.3
        });

        this.bgMusic.play();
      }
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
