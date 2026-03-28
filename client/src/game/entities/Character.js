const Phaser = window.Phaser;

export class Character extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    Character.ensureTexture(scene);

    super(scene, x, y, Character.TEXTURE_KEY);

    this.scene = scene;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setCollideWorldBounds(true);
    this.setDrag(1200, 1200);
    this.setMaxVelocity(220, 220);
    this.setSize(28, 28);
    this.setDepth(5);

    this.moveSpeed = 180;

    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      meow: Phaser.Input.Keyboard.KeyCodes.Q,
      action1: Phaser.Input.Keyboard.KeyCodes.ONE,
      action2: Phaser.Input.Keyboard.KeyCodes.TWO,
      action3: Phaser.Input.Keyboard.KeyCodes.THREE
    });
  }

  static ensureTexture(scene) {
    if (scene.textures.exists(Character.TEXTURE_KEY)) {
      return;
    }

    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(0xff8a65, 1);
    g.fillRoundedRect(4, 6, 24, 22, 8);

    g.fillStyle(0xffab91, 1);
    g.fillTriangle(7, 8, 11, 0, 15, 8);
    g.fillTriangle(17, 8, 21, 0, 25, 8);

    g.fillStyle(0x263238, 1);
    g.fillCircle(11, 17, 2);
    g.fillCircle(21, 17, 2);

    g.generateTexture(Character.TEXTURE_KEY, 32, 32);
    g.destroy();
  }

  update() {
    let vx = 0;
    let vy = 0;

    if (!this.scene.catState.isBusy()) {
      if (this.keys.left.isDown) vx -= this.moveSpeed;
      if (this.keys.right.isDown) vx += this.moveSpeed;
      if (this.keys.up.isDown) vy -= this.moveSpeed;
      if (this.keys.down.isDown) vy += this.moveSpeed;
    }

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.setVelocity(vx, vy);

    if (vx < 0) this.setFlipX(true);
    if (vx > 0) this.setFlipX(false);

    if (Phaser.Input.Keyboard.JustDown(this.keys.meow)) {
      this.scene.onMeow(this.x, this.y);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
      this.scene.interactionSystem.startPrimaryAction();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.action1)) {
      this.scene.interactionSystem.startActionByIndex(0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.action2)) {
      this.scene.interactionSystem.startActionByIndex(1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.action3)) {
      this.scene.interactionSystem.startActionByIndex(2);
    }
  }
}

Character.TEXTURE_KEY = 'cat-topdown-prototype';
