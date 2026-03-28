import { BaseZoneObject } from './BaseZoneObject.js';

export class ShoesZone extends BaseZoneObject {
  getAvailableActions(catState) {
    const actions = [];

    if (catState.canPee) {
      actions.push({
        id: 'shoes_pee',
        label: 'Написать',
        durationMs: 2000
      });
    }

    return actions;
  }

  applyAction(actionId, catState, _ownerState, _context) {
    if (actionId === 'shoes_pee' && catState.canPee) {
      catState.consumePee();

      return {
        ok: true,
        points: 28,
        durationMs: 2000,
        noise: 8,
        message: 'Кот написал в обувь.'
      };
    }

    return super.applyAction(actionId, catState, _ownerState, _context);
  }
}
