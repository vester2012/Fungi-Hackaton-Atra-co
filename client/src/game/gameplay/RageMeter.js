export class RageMeter {
  constructor(max = 100) {
    this.max = max;
    this.current = 0;
  }

  add(points) {
    this.current = Math.min(this.max, this.current + points);
  }

  reset() {
    this.current = 0;
  }

  getProgress() {
    return this.current / this.max;
  }

  isMaxed() {
    return this.current >= this.max;
  }

  getStage() {
    const ratio = this.getProgress();

    if (ratio >= 0.75) return 3;
    if (ratio >= 0.5) return 2;
    if (ratio >= 0.25) return 1;
    return 0;
  }
}
