import { BaseZoneObject } from './BaseZoneObject.js';

export class BedZone extends BaseZoneObject {
  isHideZone() {
    return true;
  }

  getAvailableActions(_catState, ownerState) {
    const actions = [];

    if (ownerState.isSleeping) {
      actions.push({
        id: 'bed_meow',
        label: 'Помяукать',
        durationMs: 1000
      });
    }

    return actions;
  }

  getAutoVomitPoints() {
    return 35;
  }

  applyAction(actionId, _catState, ownerState, _context) {
    if (actionId === 'bed_meow' && ownerState.isSleeping) {
      ownerState.wakeUp();

      return {
        ok: true,
        points: 12,
        durationMs: 1000,
        noise: 22,
        message: 'Кот разбудил хозяина мяуканьем.'
      };
    }

    return super.applyAction(actionId, _catState, ownerState, _context);
  }
}
