// File: client/src/game/managers/InputManager.js

const Phaser = window.Phaser;

export class InputManager {
    constructor(scene) {
        this.scene = scene;

        // Настройка клавиш
        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        // Ввод с мобильного UI или других источников
        this.virtualInput = {
            up: false,
            left: false,
            down: false,
            right: false,
            jump: false,
            attack: false
        };

        this.prevState = {};
        this.currentState = {};

        this.deadzone = 0.25;
    }

    update() {
        // Сохраняем предыдущее состояние для определения "свежих" нажатий (JustPressed)
        this.prevState = { ...this.currentState };

        let padLeft = false;
        let padRight = false;
        let padUp = false;
        let padDown = false;
        let padJump = false;
        let padAttack = false;

        // Работа с геймпадом
        const pad = this.scene.input.gamepad?.pad1;
        if (pad) {
            if (pad.axes.length > 0) {
                const axisH = pad.axes[0].getValue();
                const axisV = pad.axes[1].getValue();

                if (axisH < -this.deadzone) padLeft = true;
                if (axisH > this.deadzone) padRight = true;
                if (axisV < -this.deadzone) padUp = true;
                if (axisV > this.deadzone) padDown = true;
            }

            padJump = pad.A || pad.B || pad.up;
            padAttack = pad.X || pad.Y;
        }

        // Собираем текущее состояние из всех источников
        this.currentState = {
            left: this.keys.left.isDown || this.virtualInput.left || padLeft,
            right: this.keys.right.isDown || this.virtualInput.right || padRight,
            up: this.keys.up.isDown || this.virtualInput.up || padUp,
            down: this.keys.down.isDown || this.virtualInput.down || padDown,

            jump: this.keys.space.isDown || this.keys.up.isDown || this.virtualInput.jump || padJump,
            attack: this.keys.enter.isDown || this.virtualInput.attack || padAttack
        };
    }

    // Геттеры для постоянного удержания (true, пока кнопка нажата)
    get left()  { return this.currentState.left; }
    get right() { return this.currentState.right; }
    get up()    { return this.currentState.up; }
    get down()  { return this.currentState.down; }
    get attack(){ return this.currentState.attack; }

    // Геттеры для одиночного срабатывания (true только в первый кадр нажатия)
    get leftJustPressed() {
        return this.currentState.left && !this.prevState.left;
    }
    get rightJustPressed() {
        return this.currentState.right && !this.prevState.right;
    }
    get upJustPressed() {
        return this.currentState.up && !this.prevState.up;
    }
    get downJustPressed() {
        return this.currentState.down && !this.prevState.down;
    }
    get jumpJustPressed() {
        return this.currentState.jump && !this.prevState.jump;
    }
    get attackJustPressed() {
        return this.currentState.attack && !this.prevState.attack;
    }
}