import { MainScene } from './scenes/MainScene.js';
import { MenuScene } from './scenes/MenuScene.js';

export function bootGame(parent) {
  const Phaser = window.Phaser;
  const SpinePlugin = window.SpinePlugin;

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: '#10151f',
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
