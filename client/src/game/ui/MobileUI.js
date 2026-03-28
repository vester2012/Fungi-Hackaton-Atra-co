const Phaser = window.Phaser;

export class MobileUI {
    constructor(scene, inputManager) {
        this.scene = scene;
        this.inputManager = inputManager;
        this.elements =[];

        this.isVisible = scene.sys.game.device.input.touch;
        const width = scene.scale.width;
        const height = scene.scale.height;

        const locateX = 50
        const locateY = -50
        this.createButton(80  + locateX, height - 80  + locateY, '←', 'left');
        this.createButton(290 + locateX, height - 80 + locateY, '↓', 'down');
        this.createButton(500 + locateX, height - 80  + locateY, '→', 'right');

        this.createButton(width - 110 , height - 300 , 'J', 'jump');
        this.createButton(width - 240, height - 120, 'АТК', 'attack');

        if (!this.isVisible) {
            this.hide();
        }


        this.setupAutoSwitching();
    }

    createButton(x, y, label, actionKey) {

        const btn = this.scene.add.circle(x, y, 100, 0xffffff, 0.2)
            .setScrollFactor(0)
            .setInteractive()
            .setDepth(1000);

        const text = this.scene.add.text(x, y, label, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        btn.on('pointerdown', () => {
            this.inputManager.virtualInput[actionKey] = true;
            btn.setFillStyle(0x38bdf8, 0.6);
            this.show();
        });

        const release = () => {
            this.inputManager.virtualInput[actionKey] = false;
            btn.setFillStyle(0xffffff, 0.2);
        };

        btn.on('pointerup', release);
        btn.on('pointerout', release);

        this.elements.push(btn, text);
    }

    setupAutoSwitching() {
        this.scene.input.on('pointerdown', () => {
            this.show();
        });

        this.scene.input.keyboard.on('keydown', () => {
            this.hide();
        });

        if (this.scene.input.gamepad) {
            this.scene.input.gamepad.on('down', () => {
                this.hide();
            });

            this.scene.input.gamepad.on('pad', () => {
                this.hide();
            });
        }
    }

    show() {
        if (this.isVisible) return;
        this.isVisible = true;
        this.elements.forEach(el => el.setVisible(true));
    }

    hide() {
        if (!this.isVisible) return;
        this.isVisible = false;
        this.elements.forEach(el => el.setVisible(false));

        for (const key in this.inputManager.virtualInput) {
            this.inputManager.virtualInput[key] = false;
        }
    }
}