import { MainScene } from './scenes/MainScene.js';
import { MenuScene } from './scenes/MenuScene.js';

export function bootGame(parent) {
  const Phaser = window.Phaser;
  const SpinePlugin = window.SpinePlugin;

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1920,
    height: 1080,
    backgroundColor: '#10151f',
    input:{
      gamepad: true
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 1800 },
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    plugins: {
      scene: SpinePlugin
        ? [
            {
              key: 'SpinePlugin',
              plugin: SpinePlugin,
              mapping: 'spine'
            }
          ]
        : []
    },
    scene: [MenuScene, MainScene]
  });
}
