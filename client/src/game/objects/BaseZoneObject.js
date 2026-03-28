export class BaseZoneObject {
  constructor(zoneData) {
    this.id = zoneData.id;
    this.label = zoneData.label;
    this.type = zoneData.type;
    this.x = zoneData.x;
    this.y = zoneData.y;
    this.width = zoneData.width || 0;
    this.height = zoneData.height || 0;
    this.radius = zoneData.radius || 0;

    this.state = {};
  }

  containsPoint(px, py) {
    if (this.type === 'circle') {
      const dx = px - this.x;
      const dy = py - this.y;
      return dx * dx + dy * dy <= this.radius * this.radius;
    }

    if (this.type === 'ellipse') {
      const rx = this.width / 2;
      const ry = this.height / 2;
      const dx = px - this.x;
      const dy = py - this.y;
      return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
    }

    return false;
  }

  isHideZone() {
    return false;
  }

  getAvailableActions(_catState, _ownerState) {
    return [];
  }

  getAutoVomitPoints() {
    return null;
  }

  applyAction(_actionId, _catState, _ownerState, _context) {
    return {
      ok: false,
      points: 0,
      durationMs: 0,
      noise: 0,
      message: 'Нет действия'
    };
  }
}
