export class InteractionSystem {
    constructor(scene, catState, rageSystem) {
        this.scene = scene;
        this.catState = catState;
        this.rageSystem = rageSystem;

        this.nearestObject = null;
        this.currentActions = [];
        this.currentActionState = null;
    }

    update() {
        this.updateNearestObject();
        this.updateHints();
        this.updateProgress();
        this.checkCancelByOwner();
    }

    updateNearestObject() {
        const cat = this.scene.character;
        if (!cat) return;

        let nearest = null;
        let nearestDistance = Infinity;

        for (const obj of this.scene.interactables) {
            const dist = window.Phaser.Math.Distance.Between(cat.x, cat.y, obj.x, obj.y);

            if (dist < 82 && dist < nearestDistance) {
                nearest = obj;
                nearestDistance = dist;
            }
        }

        this.nearestObject = nearest;
        this.currentActions = nearest ? nearest.getAvailableActions(this.catState) : [];
    }

    updateHints() {
        const lines = [];

        if (this.currentActionState) {
            lines.push(`ДЕЛАЕТ: ${this.currentActionState.action.label}`);
        } else if (this.nearestObject && this.currentActions.length > 0) {
            lines.push(`ОБЪЕКТ: ${this.nearestObject.displayName}`);

            this.currentActions.slice(0, 3).forEach((action, index) => {
                lines.push(`[${index + 1}] ${action.label} (${(action.duration / 1000).toFixed(1)}с)`);
            });

            lines.push(`[E] ${this.currentActions[0].label}`);
        } else if (this.nearestObject) {
            lines.push(`ОБЪЕКТ: ${this.nearestObject.displayName}`);
            lines.push('НЕТ ДОСТУПНЫХ ДЕЙСТВИЙ');
        } else {
            lines.push('ПОДОЙДИ К ОБЪЕКТУ');
            lines.push('[Q] Мяукнуть');
        }

        this.scene.setHintLines(lines);
    }

    startPrimaryAction() {
        this.startActionByIndex(0);
    }

    startActionByIndex(index) {
        if (this.catState.isBusy()) return;
        if (!this.nearestObject) return;
        if (!this.currentActions[index]) return;

        const action = this.currentActions[index];

        if (action.duration <= 0) {
            this.finishAction(this.nearestObject, action);
            return;
        }

        this.catState.setBusy(true);

        this.currentActionState = {
            object: this.nearestObject,
            action,
            startedAt: this.scene.time.now,
            endsAt: this.scene.time.now + action.duration
        };

        this.scene.setActionProgress(0, action.label);
    }

    finishAction(object, action) {
        const result = object.applyAction(action.id, this.catState, this.rageSystem);

        if (!result.ok) {
            this.resetActionState();
            return;
        }

        if (result.toggleHide) {
            const hidden = !this.catState.isHidden();
            this.catState.setHidden(hidden);
            this.scene.character.setAlpha(hidden ? 0.35 : 1);
            this.scene.showFloatingText(this.scene.character.x, this.scene.character.y - 26, hidden ? 'СПРЯТАЛСЯ' : 'ВЫШЕЛ', '#bbf7d0');
        } else {
            this.scene.showFloatingText(object.x, object.y - 24, action.label, '#fde68a');
        }

        if (result.noise > 0 && this.scene.owner) {
            this.scene.owner.investigate(result.sourceX, result.sourceY);
        }

        if (result.effect === 'wake_owner') {
            this.scene.showFloatingText(object.x, object.y - 42, 'ХОЗЯИН ПРОСНУЛСЯ', '#93c5fd');
        }

        if (result.effect === 'meow_for_door') {
            this.scene.showFloatingText(object.x, object.y - 42, 'КТО-ТО ИДЕТ К ДВЕРИ', '#93c5fd');
            if (this.scene.owner) {
                this.scene.owner.investigate(result.sourceX, result.sourceY);
            }
        }

        this.resetActionState();
    }

    updateProgress() {
        if (!this.currentActionState) return;

        const { object, action, startedAt, endsAt } = this.currentActionState;
        const now = this.scene.time.now;
        const progress = Math.min(1, (now - startedAt) / (endsAt - startedAt));

        this.scene.setActionProgress(progress, action.label);

        if (now >= endsAt) {
            this.finishAction(object, action);
        }
    }

    cancelCurrentAction(reason = 'ПРЕРВАНО') {
        if (!this.currentActionState) return;

        this.scene.showFloatingText(this.scene.character.x, this.scene.character.y - 30, reason, '#f87171');
        this.resetActionState();
    }

    resetActionState() {
        this.currentActionState = null;
        this.catState.setBusy(false);
        this.scene.setActionProgress(0, '');
    }

    checkCancelByOwner() {
        if (!this.currentActionState) return;
        if (!this.scene.owner) return;
        if (this.catState.isHidden()) return;

        const owner = this.scene.owner;
        const cat = this.scene.character;

        const dist = window.Phaser.Math.Distance.Between(owner.x, owner.y, cat.x, cat.y);

        if (dist < 68) {
            this.cancelCurrentAction('ХОЗЯИН ПОМЕШАЛ');
        }
    }
}
