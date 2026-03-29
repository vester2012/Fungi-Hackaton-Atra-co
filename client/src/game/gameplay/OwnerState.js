export class OwnerState {
  constructor() {
    this.reset();
  }

  reset() {
    this.isSleeping = false;
    this.isWorking = false;

    this.aggressionScore = 0;
    this.lastSeenCatAt = 0;
    this.timesSawCat = 0;
    this.timesCaughtCat = 0;
  }

  wakeUp() {
    this.isSleeping = false;
  }

  goToSleep() {
    this.isSleeping = true;
  }

  addAggression(points = 1) {
    this.aggressionScore += points;
  }

  noteSawCat(now) {
    this.lastSeenCatAt = now;
    this.timesSawCat += 1;
    this.addAggression(1);
  }

  noteCaughtCat() {
    this.timesCaughtCat += 1;
    this.addAggression(2);
  }

  getAggressionLevel(rageMeter) {
    const rage = rageMeter?.current || 0;
    const rageMax = rageMeter?.max || 100;
    const rageRatio = rageMax > 0 ? rage / rageMax : 0;

    const total =
      this.aggressionScore +
      this.timesSawCat * 1.5 +
      this.timesCaughtCat * 2 +
      rageRatio * 6;

    if (total >= 9) return 3;
    if (total >= 6) return 2;
    if (total >= 3) return 1;
    return 0;
  }
}
