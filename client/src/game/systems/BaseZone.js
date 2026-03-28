const Phaser = window.Phaser;

export class BaseZone extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y, width, height, options = {}) {
        const debugColor = options.debugColor || 0x00ff00;
        const debugAlpha = options.debug ? 0.3 : 0;
        super(scene, x, y, width, height, debugColor, debugAlpha);

        scene.add.existing(this);
        // Физика добавится через ZoneManager.addZone()

        if (options.debug) {
            this.setStrokeStyle(2, debugColor, 0.8);
            this.setDepth(100);
        }
    }

    onStay(character) {
        // Метод для переопределения
    }
}