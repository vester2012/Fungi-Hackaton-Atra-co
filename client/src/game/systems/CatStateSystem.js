export class CatStateSystem {
    constructor(scene) {
        this.scene = scene;
        this.reset();
    }

    reset() {
        this.state = {
            hasEatenPlant: false,
            canVomit: false,
            vomitTimerEvent: null,
            vomitDeadlineAt: null,

            hasWaterInMouth: false,
            canPee: false,
            canPoop: true,

            isBusy: false,
            isHidden: false,

            ownerSleeping: true,

            boxUsedForToilet: false,
            curtainsBroken: false,

            roomDirtiness: {},
            oneTimeToiletUsed: false
        };
    }

    update() {}

    isBusy() {
        return this.state.isBusy;
    }

    setBusy(value) {
        this.state.isBusy = value;
    }

    setHidden(value) {
        this.state.isHidden = value;
    }

    isHidden() {
        return this.state.isHidden;
    }

    setOwnerSleeping(value) {
        this.state.ownerSleeping = value;
    }

    isOwnerSleeping() {
        return this.state.ownerSleeping;
    }

    eatPlant(vomitDelayMs = 15000) {
        this.state.hasEatenPlant = true;
        this.state.canVomit = false;

        if (this.state.vomitTimerEvent) {
            this.state.vomitTimerEvent.remove(false);
        }

        this.state.vomitDeadlineAt = this.scene.time.now + vomitDelayMs;

        this.state.vomitTimerEvent = this.scene.time.delayedCall(vomitDelayMs, () => {
            this.state.canVomit = true;
            this.state.vomitTimerEvent = null;

            if (this.scene.showFloatingText && this.scene.character) {
                this.scene.showFloatingText(
                    this.scene.character.x,
                    this.scene.character.y - 30,
                    'СЕЙЧАС СТОШНИТ',
                    '#fca5a5'
                );
            }
        });
    }

    canVomitNow() {
        return this.state.canVomit;
    }

    consumeVomit() {
        this.state.hasEatenPlant = false;
        this.state.canVomit = false;
        this.state.vomitDeadlineAt = null;

        if (this.state.vomitTimerEvent) {
            this.state.vomitTimerEvent.remove(false);
            this.state.vomitTimerEvent = null;
        }
    }

    getVomitTimeLeftMs() {
        if (!this.state.vomitDeadlineAt) return 0;
        return Math.max(0, this.state.vomitDeadlineAt - this.scene.time.now);
    }

    fillMouthWithWater() {
        this.state.hasWaterInMouth = true;
    }

    hasWaterInMouth() {
        return this.state.hasWaterInMouth;
    }

    consumeWaterInMouth() {
        this.state.hasWaterInMouth = false;
    }

    drinkLots() {
        this.state.canPee = true;
    }

    canPeeNow() {
        return this.state.canPee;
    }

    consumePee() {
        this.state.canPee = false;
        this.state.oneTimeToiletUsed = true;
    }

    canPoopNow() {
        return this.state.canPoop;
    }

    consumePoop() {
        this.state.canPoop = false;
        this.state.oneTimeToiletUsed = true;
    }

    isOneTimeToiletUsed() {
        return this.state.oneTimeToiletUsed;
    }

    markCurtainsBroken() {
        this.state.curtainsBroken = true;
    }

    areCurtainsBroken() {
        return this.state.curtainsBroken;
    }

    addDirt(roomKey, amount = 1) {
        if (!this.state.roomDirtiness[roomKey]) {
            this.state.roomDirtiness[roomKey] = 0;
        }
        this.state.roomDirtiness[roomKey] += amount;
    }

    getDirt(roomKey) {
        return this.state.roomDirtiness[roomKey] || 0;
    }

    hasRequirement(requirementKey, context = {}) {
        switch (requirementKey) {
            case 'can_vomit':
                return this.canVomitNow();

            case 'has_water_in_mouth':
                return this.hasWaterInMouth();

            case 'can_pee':
                return this.canPeeNow();

            case 'can_poop':
                return this.canPoopNow();

            case 'owner_sleeping':
                return this.isOwnerSleeping();

            case 'hide_enabled':
                return context.hideEnabled !== false;

            case 'door_closed':
                return context.doorClosed === true;

            default:
                return false;
        }
    }

    hasBlock(blockKey, context = {}) {
        switch (blockKey) {
            case 'has_water_in_mouth':
                return this.hasWaterInMouth();

            default:
                return false;
        }
    }
}
