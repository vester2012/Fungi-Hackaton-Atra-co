const Phaser = window.Phaser;

export class BaseZone extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y, width, height, options = {}) {
        const debugColor = options.debugColor || 0x00ff00;
        super(scene, x, y, width, height, debugColor, 0);

        scene.add.existing(this);
        // Физика добавится через ZoneManager.addZone()
        this.setVisible(false);
    }

    onStay(character) {
        // Метод для переопределения
    }
}
