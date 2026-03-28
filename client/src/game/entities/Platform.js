const Phaser = window.Phaser;

export class Platform {
  static TYPES = {
    SOLID: 'solid',
    DROP_THROUGH: 'drop-through'
  };

  constructor(scene, x, y, width, height, options = {}) {
    this.scene = scene;
    this.type = options.type || Platform.TYPES.SOLID;
    this.isDropThrough = this.type === Platform.TYPES.DROP_THROUGH;

    this.gameObject = scene.add.rectangle(x, y, width, height, 0x000000, 0);

    scene.physics.add.existing(this.gameObject, true);
    this.gameObject.body.updateFromGameObject();

    if (this.isDropThrough) {
      // Отключаем столкновения снизу, слева и справа
      this.gameObject.body.checkCollision.down = false;
      this.gameObject.body.checkCollision.left = false;
      this.gameObject.body.checkCollision.right = false;
      // up остается true по умолчанию (чтобы можно было стоять на ней)
    }

    this.gameObject.platformType = this.type;
    this.gameObject.isDropThrough = this.isDropThrough;
  }

  getPhysicsTarget() {
    return this.gameObject;
  }
}

