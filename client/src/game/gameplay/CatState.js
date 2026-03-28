export class CatState {
  constructor() {
    this.reset();
  }

  reset() {
    this.hide = false;
    this.isBusy = false;

    this.hasWaterInMouth = false;

    this.vomitPending = false;
    this.vomitSource = null; // 'plant' | 'trash' | null
    this.vomitAt = 0;

    this.peePending = false;
    this.canPee = false;
    this.peeSource = null;   // 'water' | null
    this.peeUnlockAt = 0;
    this.peeDeadlineAt = 0;

    this.justUnlockedPee = false;
    this.justVomitTriggered = false;
    this.justPeeTriggered = false;
  }

  update(now) {
    this.justUnlockedPee = false;
    this.justVomitTriggered = false;
    this.justPeeTriggered = false;

    if (this.peePending && !this.canPee && now >= this.peeUnlockAt) {
      this.canPee = true;
      this.justUnlockedPee = true;
    }
  }

  setHidden(value) {
    this.hide = value;
  }

  setBusy(value) {
    this.isBusy = value;
  }

  eatPlant(now) {
    this.vomitPending = true;
    this.vomitSource = 'plant';
    this.vomitAt = now + 10000;
  }

  eatTrash(now) {
    this.vomitPending = true;
    this.vomitSource = 'trash';
    this.vomitAt = now + 10000;
  }

  drinkLots(now) {
    this.peePending = true;
    this.canPee = false;
    this.peeSource = 'water';
    this.peeUnlockAt = now + 20000;
    this.peeDeadlineAt = now + 40000;
  }

  fillMouthWithWater() {
    this.hasWaterInMouth = true;
  }

  consumeWaterInMouth() {
    this.hasWaterInMouth = false;
  }

  shouldAutoVomit(now) {
    return this.vomitPending && now >= this.vomitAt;
  }

  triggerAutoVomit() {
    this.vomitPending = false;
    this.vomitSource = null;
    this.vomitAt = 0;
    this.justVomitTriggered = true;
  }

  shouldAutoPee(now) {
    return this.peePending && now >= this.peeDeadlineAt;
  }

  triggerAutoPee() {
    this.peePending = false;
    this.canPee = false;
    this.peeSource = null;
    this.peeUnlockAt = 0;
    this.peeDeadlineAt = 0;
    this.justPeeTriggered = true;
  }

  consumePee() {
    this.peePending = false;
    this.canPee = false;
    this.peeSource = null;
    this.peeUnlockAt = 0;
    this.peeDeadlineAt = 0;
  }

  getVomitTimeLeft(now) {
    if (!this.vomitPending) return 0;
    return Math.max(0, this.vomitAt - now);
  }

  getPeeUnlockTimeLeft(now) {
    if (!this.peePending || this.canPee) return 0;
    return Math.max(0, this.peeUnlockAt - now);
  }

  getPeeDeadlineTimeLeft(now) {
    if (!this.peePending || !this.canPee) return 0;
    return Math.max(0, this.peeDeadlineAt - now);
  }

  getFloorVomitPoints() {
    return 12;
  }

  getFloorPeePoints() {
    return 15;
  }
}
