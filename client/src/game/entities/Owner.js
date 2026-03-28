const Phaser = window.Phaser;

export class Owner extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        Owner.ensureTexture(scene);

        super(scene, x, y, Owner.TEXTURE_KEY);

        this.scene = scene;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 0.5);
        this.setCollideWorldBounds(true);
        this.setDrag(1000, 1000);
        this.setMaxVelocity(150, 150);
        this.setSize(30, 30);
        this.setDepth(6);

        this.speed = 80;
        this.chaseSpeed = 125;

        this.state = 'idle'; // idle | wander | investigate | chase | sleep
        this.stateTimer = 0;
        this.targetPoint = null;
        this.investigatePoint = null;

        this.pickNextState();
    }

    static ensureTexture(scene) {
        if (scene.textures.exists(Owner.TEXTURE_KEY)) return;

        const g = scene.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0x60a5fa, 1);
        g.fillRoundedRect(4, 10, 24, 18, 8);

        g.fillStyle(0xf5d0a9, 1);
        g.fillCircle(16, 8, 8);

        g.fillStyle(0x1f2937, 1);
        g.fillCircle(13, 7, 1.5);
        g.fillCircle(19, 7, 1.5);

        g.generateTexture(Owner.TEXTURE_KEY, 32, 32);
        g.destroy();
    }

    update(time, delta) {
        const dt = delta / 1000;

        if (this.scene.catState.isOwnerSleeping()) {
            this.state = 'sleep';
        } else if (this.state === 'sleep') {
            this.pickNextState();
        }

        if (this.canSeeCat()) {
            this.state = 'chase';
        }

        switch (this.state) {
            case 'sleep':
                this.setVelocity(0, 0);
                break;

            case 'idle':
                this.setVelocity(0, 0);
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) this.pickNextState();
                break;

            case 'wander':
                this.moveToTarget(this.speed);
                break;

            case 'investigate':
                this.moveToInvestigate(this.speed + 10);
                break;

            case 'chase':
                this.chaseCat();
                break;
        }
    }

    pickNextState() {
        if (this.scene.catState.isOwnerSleeping()) {
            this.state = 'sleep';
            return;
        }

        const roll = Math.random();

        if (roll < 0.35) {
            this.state = 'idle';
            this.stateTimer = Phaser.Math.FloatBetween(0.8, 2.2);
            return;
        }

        this.state = 'wander';
        this.targetPoint = this.getRandomRoomPoint();
    }

    getRandomRoomPoint() {
        const room = this.scene.room;
        return {
            x: Phaser.Math.Between(room.x + 40, room.x + room.width - 40),
            y: Phaser.Math.Between(room.y + 40, room.y + room.height - 40)
        };
    }

    moveToTarget(speed) {
        if (!this.targetPoint) {
            this.pickNextState();
            return;
        }

        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.targetPoint.x, this.targetPoint.y);

        if (dist < 14) {
            this.setVelocity(0, 0);
            this.pickNextState();
            return;
        }

        this.scene.physics.moveTo(this, this.targetPoint.x, this.targetPoint.y, speed);
    }

    moveToInvestigate(speed) {
        if (!this.investigatePoint) {
            this.pickNextState();
            return;
        }

        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.investigatePoint.x, this.investigatePoint.y);

        if (dist < 14) {
            this.setVelocity(0, 0);
            this.investigatePoint = null;
            this.pickNextState();
            return;
        }

        this.scene.physics.moveTo(this, this.investigatePoint.x, this.investigatePoint.y, speed);
    }

    chaseCat() {
        const cat = this.scene.character;
        if (!cat) return;

        if (this.scene.catState.isHidden()) {
            this.pickNextState();
            return;
        }

        const dist = Phaser.Math.Distance.Between(this.x, this.y, cat.x, cat.y);

        if (dist > 240) {
            this.pickNextState();
            return;
        }

        this.scene.physics.moveTo(this, cat.x, cat.y, this.chaseSpeed);
    }

    canSeeCat() {
        const cat = this.scene.character;
        if (!cat || this.scene.catState.isHidden()) return false;

        const dist = Phaser.Math.Distance.Between(this.x, this.y, cat.x, cat.y);
        return dist < 170;
    }

    investigate(x, y) {
        this.investigatePoint = { x, y };
        this.state = 'investigate';
    }
}

Owner.TEXTURE_KEY = 'owner-topdown-prototype';
