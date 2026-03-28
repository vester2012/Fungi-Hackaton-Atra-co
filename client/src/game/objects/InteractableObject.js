import { INTERACTIONS } from '../data/interactions.js';

const Phaser = window.Phaser;

export class InteractableObject extends Phaser.GameObjects.Rectangle {
    constructor(scene, config) {
        super(
            scene,
            config.x,
            config.y,
            config.width || 48,
            config.height || 48,
            config.color || 0x64748b,
            1
        );

        this.scene = scene;
        this.id = config.id;
        this.type = config.type;
        this.room = config.room || 'unknown';
        this.actionIds = config.actionIds || [];
        this.displayName = config.displayName || config.type || 'Object';
        this.labelColor = config.labelColor || '#ffffff';
        this.solid = config.solid !== false;

        this.state = {
            broken: false,
            dirty: false,
            hideDisabled: false,
            usedActions: new Set(),
            active: true,
            custom: {
                doorClosed: !!config.doorClosed
            }
        };

        this.setStrokeStyle(2, 0x111827, 0.65);
        this.setDepth(config.depth || 2);

        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        if (this.solid) {
            scene.solids.add(this);
        }
    }

    getActionConfigs() {
        return this.actionIds.map((id) => INTERACTIONS[id]).filter(Boolean);
    }

    buildContext() {
        return {
            room: this.room,
            hideEnabled: !this.state.hideDisabled,
            doorClosed: this.state.custom.doorClosed === true,
            isDirty: this.state.dirty,
            isBroken: this.state.broken
        };
    }

    isActionDisabledByObjectState(actionId) {
        if ((this.type === 'curtains' || this.type === 'box' || this.type === 'sofa' || this.type === 'wardrobe') && actionId.endsWith('_hide')) {
            return this.state.hideDisabled;
        }

        if (this.type === 'box' && (actionId === 'box_pee' || actionId === 'box_poop')) {
            return this.state.usedActions.has('box_pee') || this.state.usedActions.has('box_poop');
        }

        if (this.type === 'curtains' && actionId === 'curtains_scratch') {
            return this.state.broken;
        }

        return false;
    }

    getAvailableActions(catState) {
        const context = this.buildContext();

        return this.getActionConfigs().filter((action) => {
            if (!action || !this.state.active) return false;

            if (action.oneShot && this.state.usedActions.has(action.id)) {
                return false;
            }

            if (this.isActionDisabledByObjectState(action.id)) {
                return false;
            }

            if (action.requires && action.requires.length > 0) {
                for (const requirement of action.requires) {
                    if (!catState.hasRequirement(requirement, context)) {
                        return false;
                    }
                }
            }

            if (action.blocks && action.blocks.length > 0) {
                for (const block of action.blocks) {
                    if (catState.hasBlock(block, context)) {
                        return false;
                    }
                }
            }

            return true;
        });
    }

    markUsed(actionId) {
        this.state.usedActions.add(actionId);
    }

    markDirty() {
        this.state.dirty = true;
        this.setFillStyle(0x8b5e3c, 1);
    }

    markBroken() {
        this.state.broken = true;
        this.setAlpha(0.82);
    }

    disableHide() {
        this.state.hideDisabled = true;
    }

    setDoorClosed(value) {
        this.state.custom.doorClosed = value;
    }

    isDoorClosed() {
        return this.state.custom.doorClosed === true;
    }

    applyAction(actionId, catState, rageSystem) {
        const action = INTERACTIONS[actionId];
        if (!action) return { ok: false, reason: 'unknown_action' };

        const available = this.getAvailableActions(catState).some((a) => a.id === actionId);
        if (!available) return { ok: false, reason: 'not_available' };

        this.markUsed(actionId);

        const result = {
            ok: true,
            action,
            rage: action.rage || 0,
            noise: action.noise || 0,
            label: action.label,
            effect: action.effect,
            sourceX: this.x,
            sourceY: this.y,
            toggleHide: false
        };

        switch (action.effect) {
            case 'eat_plant':
                catState.eatPlant(15000);
                break;

            case 'dirty_plant':
                this.markDirty();
                catState.addDirt(this.room, 1);
                break;

            case 'break_curtains':
                this.markBroken();
                this.disableHide();
                catState.markCurtainsBroken();
                break;

            case 'vacuum_on':
                this.state.custom.vacuumOn = true;
                break;

            case 'vacuum_smear_vomit':
                catState.consumeVomit();
                this.state.custom.vacuumOn = true;
                this.markDirty();
                catState.addDirt(this.room, 3);
                break;

            case 'vacuum_smear_poop':
                catState.consumePoop();
                this.state.custom.vacuumOn = true;
                this.markDirty();
                catState.addDirt(this.room, 3);
                break;

            case 'computer_bite':
                this.state.custom.computerDamaged = true;
                break;

            case 'computer_keyboard':
                this.state.custom.keyboardMess = true;
                break;

            case 'computer_vomit':
                catState.consumeVomit();
                this.markDirty();
                catState.addDirt(this.room, 3);
                break;

            case 'computer_water':
                catState.consumeWaterInMouth();
                this.markDirty();
                break;

            case 'box_pee':
                catState.consumePee();
                this.markDirty();
                this.disableHide();
                catState.addDirt(this.room, 2);
                break;

            case 'box_poop':
                catState.consumePoop();
                this.markDirty();
                this.disableHide();
                catState.addDirt(this.room, 2);
                break;

            case 'fill_mouth_with_water':
                catState.fillMouthWithWater();
                break;

            case 'drink_lots':
                catState.drinkLots();
                break;

            case 'bed_vomit':
                catState.consumeVomit();
                this.markDirty();
                catState.addDirt(this.room, 3);
                break;

            case 'wake_owner':
                catState.setOwnerSleeping(false);
                break;

            case 'toggle_hide':
                result.toggleHide = true;
                break;

            case 'meow_for_door':
                result.openDoorRequest = true;
                break;
        }

        if (rageSystem && action.rage) {
            rageSystem.add(action.rage, action.label, this.x, this.y);
        }

        return result;
    }
}
