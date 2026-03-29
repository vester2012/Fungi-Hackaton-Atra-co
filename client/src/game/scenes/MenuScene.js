import {unit_manager} from "../unit_manager";

const Phaser = window.Phaser;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.spine('blackhole_spine_SPO', '/assets/anim/blackhole_anim_spine.json', '/assets/anim/blackhole_anim_spine.atlas');
    this.load.spine('fish_SPO', '/assets/anim/fish.json', '/assets/anim/fish.atlas');
    this.load.spine('enemy_bee_SPO', '/assets/anim/enemy_bee.json', '/assets/anim/enemy_bee.atlas');
    this.load.spine('skeleton_bomb_SPO', '/assets/anim/skeleton_bomb.json', '/assets/anim/skeleton_bomb.atlas')

    this.load.image('heart', '/assets/heart.png');

    this.load.audio('jump', ['/assets/audio/ma-jump.mp3', '/assets/audio/ma-jump.ogg']);
    this.load.audio('jump1', ['/assets/audio/ma-jump1.mp3', '/assets/audio/ma-jump1.ogg']);
    this.load.audio('jump2', ['/assets/audio/ma-jump2.mp3', '/assets/audio/ma-jump2.ogg']);
    this.load.audio('jump3', ['/assets/audio/ma-jump3.mp3', '/assets/audio/ma-jump3.ogg']);
    this.load.audio('kick', ['/assets/audio/ma-kick.mp3', '/assets/audio/ma-kick.ogg']);
    this.load.audio('kick1', ['/assets/audio/ma-kick1.mp3', '/assets/audio/ma-kick1.ogg']);
    this.load.audio('bg-music', ['/assets/audio/bg-music.mp3', '/assets/audio/bg-music.ogg']);
    for (let i = 1; i <= 7; i++) {
      this.load.image(`sky_layer_${i}`, `/assets/bg/bg_${i}.png`);
    }
    this.load.json('map_1', '/assets/level_map.json');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#0f172a');
    this.colors = [
      { name: 'Default', value: 0xffffff },
      { name: 'Gold', value: 0xffd700 },
      { name: 'Red', value: 0xff4d4d },
      { name: 'Neon Green', value: 0x32ff7e },
      { name: 'Sky Blue', value: 0x18dcff },
      { name: 'Pink', value: 0xff9ff3 }
    ];
    this.currentColorIndex = parseInt(localStorage.getItem('player_color_index')) || 0;
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
      unit_manager.socket.emit("join_room", { sid: localStorage.getItem('game_session_id'), idRoom: 1, passRoom: ''});
      unit_manager.socket.once('joined_room_success', (data) => {
        this.scene.start('MainScene');
      });
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
      unit_manager.socket.once('joined_room_success', (data) => {
        this.scene.start('MainScene');
      });
    });

    this.colorButton = this.createMenuButton(width * 0.5, 630 * 1.35, 360, 64,
        `Color: ${this.colors[this.currentColorIndex].name}`, 0x5758bb, () => {
          this.changePlayerColor();
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
  changePlayerColor() {
    this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;
    const selected = this.colors[this.currentColorIndex];

    // Сохраняем выбор
    localStorage.setItem('player_color_index', this.currentColorIndex);
    localStorage.setItem('player_tint', selected.value);

    // Обновляем текст на кнопке
    // В createMenuButton текст доступен как часть объекта, если ты изменишь возврат функции
    // Или просто найди объект по координатам/ссылке.
    // Для простоты — перерисуем сцену или обновим текст:
    this.scene.restart();
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
