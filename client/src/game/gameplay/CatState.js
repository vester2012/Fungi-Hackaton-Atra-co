export class CatState {
  constructor() {
    this.reset();
  }

  reset() {
    this.hide = false;
    this.isBusy = false;

    this.hasWaterInMouth = false;

    this.vomitPending = false;
    this.vomitSource = null;
    this.vomitAt = 0;

    this.peePending = false;
    this.canPee = false;
    this.peeSource = null;
    this.peeUnlockAt = 0;
    this.peeDeadlineAt = 0;

    this.poopPending = false;
    this.canPoop = false;
    this.poopUnlockAt = 0;
    this.poopDeadlineAt = 0;
    this.hasPooped = false;

    this.justUnlockedPee = false;
    this.justVomitTriggered = false;
    this.justPeeTriggered = false;
    this.justUnlockedPoop = false;
    this.justPoopTriggered = false;
  }

  update(now) {
    this.justUnlockedPee = false;
    this.justVomitTriggered = false;
    this.justPeeTriggered = false;
    this.justUnlockedPoop = false;
    this.justPoopTriggered = false;

    if (this.peePending && !this.canPee && now >= this.peeUnlockAt) {
      this.canPee = true;
      this.justUnlockedPee = true;
    }

    if (this.poopPending && !this.canPoop && now >= this.poopUnlockAt) {
      this.canPoop = true;
      this.justUnlockedPoop = true;
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
    this.vomitSource = "plant";
    this.vomitAt = now + 10000;
  }

  eatTrash(now) {
    this.vomitPending = true;
    this.vomitSource = "trash";
    this.vomitAt = now + 10000;
  }

  drinkLots(now) {
    this.peePending = true;
    this.canPee = false;
    this.peeSource = "water";
    this.peeUnlockAt = now + 20000;
    this.peeDeadlineAt = now + 40000;
  }

  schedulePoop(now, delayMs = 0, activeWindowMs = 15000) {
    if (this.hasPooped || this.poopPending || this.canPoop) return false;

    this.poopPending = true;
    this.canPoop = false;
    this.poopUnlockAt = now + delayMs;
    this.poopDeadlineAt = now + delayMs + activeWindowMs;

    return true;
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

  shouldAutoPoop(now) {
    return this.poopPending && this.canPoop && now >= this.poopDeadlineAt;
  }

  consumePoop() {
    if (!this.poopPending || !this.canPoop || this.hasPooped) return false;

    this.poopPending = false;
    this.canPoop = false;
    this.poopUnlockAt = 0;
    this.poopDeadlineAt = 0;
    this.hasPooped = true;
    return true;
  }

  triggerAutoPoop() {
    if (this.hasPooped) return false;

    this.poopPending = false;
    this.canPoop = false;
    this.poopUnlockAt = 0;
    this.poopDeadlineAt = 0;
    this.hasPooped = true;
    this.justPoopTriggered = true;
    return true;
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

  getPoopUnlockTimeLeft(now) {
    if (!this.poopPending || this.canPoop) return 0;
    return Math.max(0, this.poopUnlockAt - now);
  }

  getPoopDeadlineTimeLeft(now) {
    if (!this.poopPending || !this.canPoop) return 0;
    return Math.max(0, this.poopDeadlineAt - now);
  }
  getFloorVomitPoints() {
    return 12;
  }

  getFloorPeePoints() {
    return 15;
  }

  getFloorPoopPoints() {
    return 18;
  }

  getSmearedPoopPoints() {
    return 40;
  }
}
