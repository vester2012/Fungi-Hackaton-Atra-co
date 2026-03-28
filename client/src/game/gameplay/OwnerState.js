export class OwnerState {
  constructor() {
    this.reset();
  }

  reset() {
    this.isSleeping = true;
    this.isWorking = false;
  }

  wakeUp() {
    this.isSleeping = false;
  }

  goToSleep() {
    this.isSleeping = true;
  }
}
