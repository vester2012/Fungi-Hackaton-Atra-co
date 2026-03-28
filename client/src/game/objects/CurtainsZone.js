import { BaseZoneObject } from './BaseZoneObject.js';

export class CurtainsZone extends BaseZoneObject {
  constructor(zoneData) {
    super(zoneData);

    this.state = {
      scratched: false
    };
  }

  isHideZone() {
    return !this.state.scratched;
  }

  getAvailableActions() {
    if (this.state.scratched) return [];

    return [
      { id: 'curtains_scratch', label: 'Подрать', durationMs: 2800 }
    ];
  }

  applyAction(actionId, catState, _ownerState, _context) {
    if (actionId === 'curtains_scratch' && !this.state.scratched) {
      this.state.scratched = true;
      catState.setHidden(false);

      return {
        ok: true,
        points: 16,
        durationMs: 2800,
        noise: 15,
        message: 'Кот подрал шторы. Теперь в них нельзя прятаться.'
      };
    }

    return super.applyAction(actionId, catState, _ownerState, _context);
  }
}
