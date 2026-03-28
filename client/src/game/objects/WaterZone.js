import { BaseZoneObject } from './BaseZoneObject.js';

export class WaterZone extends BaseZoneObject {
  getAvailableActions(catState) {
    const actions = [];

    if (!catState.hasWaterInMouth) {
      actions.push({
        id: 'water_fill_mouth',
        label: 'Набрать в рот',
        durationMs: 1000
      });
    }

    actions.push({
      id: 'water_drink_lots',
      label: 'Много попить',
      durationMs: 2000
    });

    return actions;
  }

  applyAction(actionId, catState, _ownerState, context) {
    if (actionId === 'water_fill_mouth') {
      catState.fillMouthWithWater();

      return {
        ok: true,
        points: 0,
        durationMs: 1000,
        noise: 4,
        message: 'Кот набрал воды в рот.'
      };
    }

    if (actionId === 'water_drink_lots') {
      catState.drinkLots(context.now);

      return {
        ok: true,
        points: 0,
        durationMs: 2000,
        noise: 4,
        message: 'Кот много попил. Через 20 секунд он захочет писать.'
      };
    }

    return super.applyAction(actionId, catState, _ownerState, context);
  }
}
