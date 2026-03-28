import { BaseZone } from './BaseZone.js';

export class WallSlideZone extends BaseZone {
    constructor(scene, x, y, width, height, options = {}) {
        super(scene, x, y, width, height, { ...options, debugColor: 0xec4899 });
        this.wallDirection = options.direction || 1;
    }

    onStay(character) {
        const controller = character.controller;
        // Проверяем: жмет ли игрок В СТОРОНУ стены
        const isPressingTowardsWall =
            (this.wallDirection === 1 && controller.right) ||
            (this.wallDirection === -1 && controller.left);

        if (isPressingTowardsWall) {
            character.setWallSliding(this.wallDirection);
        }
    }
}