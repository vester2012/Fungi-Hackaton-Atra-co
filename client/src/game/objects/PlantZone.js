import { BaseZoneObject } from "./BaseZoneObject.js";

export class PlantZone extends BaseZoneObject {
  constructor(zoneData) {
    super(zoneData);

    this.state = {
      dug: false,
    };
  }

  getAvailableActions() {
    return [
      { id: "plant_eat", label: "Съесть", durationMs: 1800 },
      { id: "plant_dig", label: "Раскопать", durationMs: 2200 },
    ];
  }

  resetMess() {
    this.dug = false;
  }

  applyAction(actionId, catState, _ownerState, context) {
    if (actionId === "plant_eat") {
      catState.eatPlant(context.now);

      return {
        ok: true,
        points: 0,
        durationMs: 1800,
        noise: 8,
        message: "Кот съел цветок. Через 10 секунд его стошнит.",
      };
    }

    if (actionId === "plant_dig") {
      this.state.dug = true;

      return {
        ok: true,
        points: 8,
        durationMs: 2200,
        noise: 10,
        message: "Кот раскопал цветок.",
      };
    }

    return super.applyAction(actionId, catState, _ownerState, context);
  }
}
