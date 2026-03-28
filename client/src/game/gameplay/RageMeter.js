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
}
