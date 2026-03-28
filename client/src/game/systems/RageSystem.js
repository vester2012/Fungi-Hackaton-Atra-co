const Phaser = window.Phaser;

export class RageSystem {
    constructor(scene, maxRage = 100) {
        this.scene = scene;
        this.maxRage = maxRage;
        this.currentRage = 0;
    }

    add(value, reason = '', sourceX = null, sourceY = null) {
        this.currentRage = Phaser.Math.Clamp(this.currentRage + value, 0, this.maxRage);

        if (this.scene.updateRageUI) {
            this.scene.updateRageUI(this.currentRage, this.maxRage);
        }

        if (this.scene.showFloatingText && reason) {
            this.scene.showFloatingText(sourceX ?? 100, sourceY ?? 100, `+${value} ${reason}`, '#fca5a5');
        }

        if (this.scene.owner && sourceX !== null && sourceY !== null && this.scene.owner.investigate) {
            this.scene.owner.investigate(sourceX, sourceY);
        }
    }

    remove(value, reason = '', sourceX = null, sourceY = null) {
        this.currentRage = Phaser.Math.Clamp(this.currentRage - value, 0, this.maxRage);

        if (this.scene.updateRageUI) {
            this.scene.updateRageUI(this.currentRage, this.maxRage);
        }

        if (this.scene.showFloatingText && reason) {
            this.scene.showFloatingText(sourceX ?? 100, sourceY ?? 100, `-${value} ${reason}`, '#93c5fd');
        }
    }

    getProgress() {
        return this.currentRage / this.maxRage;
    }

    isMaxed() {
        return this.currentRage >= this.maxRage;
    }
}
