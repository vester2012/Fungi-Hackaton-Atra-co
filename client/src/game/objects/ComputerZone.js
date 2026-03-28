import { BaseZoneObject } from './BaseZoneObject.js';

export class ComputerZone extends BaseZoneObject {
  getAvailableActions(catState) {
    const actions = [
      { id: 'computer_bite', label: 'Укусить монитор', durationMs: 1200 },
      { id: 'computer_type', label: 'Печатать', durationMs: 1800 }
    ];

    if (catState.hasWaterInMouth) {
      actions.push({
        id: 'computer_water',
        label: 'Облить водой',
        durationMs: 1600
      });
    }

    return actions;
  }

  getAutoVomitPoints() {
    return 45;
  }

  applyAction(actionId, catState, _ownerState, _context) {
    if (actionId === 'computer_bite') {
      return {
        ok: true,
        points: 10,
        durationMs: 1200,
        noise: 8,
        message: 'Кот укусил монитор.'
      };
    }

    if (actionId === 'computer_type') {
      return {
        ok: true,
        points: 14,
        durationMs: 1800,
        noise: 12,
        message: 'Кот напечатал на клавиатуре.'
      };
    }

    if (actionId === 'computer_water' && catState.hasWaterInMouth) {
      catState.consumeWaterInMouth();

      return {
        ok: true,
        points: 30,
        durationMs: 1600,
        noise: 8,
        message: 'Кот вылил воду на компьютер.'
      };
    }

    return super.applyAction(actionId, catState, _ownerState, _context);
  }
}
