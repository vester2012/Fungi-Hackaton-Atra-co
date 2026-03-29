const Phaser = window.Phaser;

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.load.spine('blackhole_spine_SPO', '/assets/anim/blackhole_anim_spine.json', '/assets/anim/blackhole_anim_spine.atlas');
        this.load.spine('fish_SPO', '/assets/anim/fish.json', '/assets/anim/fish.atlas');
        this.load.spine('enemy_bee_SPO', '/assets/anim/enemy_bee.json', '/assets/anim/enemy_bee.atlas');
        this.load.spine('skeleton_bomb_SPO', '/assets/anim/skeleton_bomb.json', '/assets/anim/skeleton_bomb.atlas');

        this.load.image('heart', '/assets/heart.png');

        this.load.audio('jump', ['/assets/audio/ma-jump.mp3', '/assets/audio/ma-jump.ogg']);
        this.load.audio('jump1', ['/assets/audio/ma-jump1.mp3', '/assets/audio/ma-jump1.ogg']);
        this.load.audio('jump2', ['/assets/audio/ma-jump2.mp3', '/assets/audio/ma-jump2.ogg']);
        this.load.audio('kick', ['/assets/audio/ma-kick.mp3', '/assets/audio/ma-kick.ogg']);
        this.load.audio('kick1', ['/assets/audio/ma-kick1.mp3', '/assets/audio/ma-kick1.ogg']);
        this.load.audio('damage', ['/assets/audio/ma-damage.mp3', '/assets/audio/ma-damage.ogg']);
        this.load.audio('damage1', ['/assets/audio/ma-damage1.mp3', '/assets/audio/ma-damage1.ogg']);
        this.load.audio('damage2', ['/assets/audio/ma-damage2.mp3', '/assets/audio/ma-damage2.ogg']);
        this.load.audio('damage3', ['/assets/audio/ma-damage3.mp3', '/assets/audio/ma-damage3.ogg']);
        this.load.audio('bg-music', ['/assets/audio/bg-music.mp3', '/assets/audio/bg-music.ogg']);

        for (let i = 1; i <= 7; i++) {
            this.load.image(`sky_layer_${i}`, `/assets/bg/bg_${i}.webp`);
        }
        // this.load.json('map_1', '/assets/level_map.json');
    }

    create() {
        this.scene.start('MainScene');
    }
}