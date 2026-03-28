const Phaser = window.Phaser;

export class InputManager {
    constructor(scene) {
        this.scene = scene;

        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.virtualInput = {
            up: false, left: false, down: false, right: false, jump: false, attack: false
        };

        this.prevState = {};
        this.currentState = {};

        this.deadzone = 0.25;
    }

    update() {
        this.prevState = { ...this.currentState };

        let padLeft = false;
        let padRight = false;
        let padDown = false;
        let padJump = false;
        let padAttack = false;

        const pad = this.scene.input.gamepad?.pad1;

        if (pad) {
            padLeft = pad.left;
            padRight = pad.right;
            padDown = pad.down;

            if (pad.axes.length > 0) {
                const axisH = pad.axes[0].getValue();
                const axisV = pad.axes[1].getValue();

                if (axisH < -this.deadzone) padLeft = true;
                if (axisH > this.deadzone) padRight = true;
                if (axisV > this.deadzone) padDown = true;
            }
            padJump = pad.A || pad.up;
            padAttack = pad.X;
        }

        this.currentState = {
            left: this.keys.left.isDown || this.virtualInput.left || padLeft,
            right: this.keys.right.isDown || this.virtualInput.right || padRight,
            down: this.keys.down.isDown || this.virtualInput.down || padDown,

            jump: this.keys.up.isDown || this.keys.space.isDown || this.virtualInput.jump || this.virtualInput.up || padJump,

            attack: this.keys.enter.isDown || this.virtualInput.attack || padAttack
        };
    }

    get left() { return this.currentState.left; }
    get right() { return this.currentState.right; }
    get down() { return this.currentState.down; }

    get jumpJustPressed() { return this.currentState.jump && !this.prevState.jump; }
    get attackJustPressed() { return this.currentState.attack && !this.prevState.attack; }
    get downJustPressed() { return this.currentState.down && !this.prevState.down; }
}