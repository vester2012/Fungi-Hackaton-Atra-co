import { BaseZoneObject } from "./BaseZoneObject.js";

export class TrashZone extends BaseZoneObject {
  constructor(zoneData) {
    super(zoneData);

    this.state = {
      dug: false,
    };
  }

  getAvailableActions() {
    const actions = [{ id: "trash_dig", label: "Раскопать", durationMs: 2000 }];

    if (this.state.dug) {
      actions.push({
        id: "trash_eat",
        label: "Съесть что-нибудь",
        durationMs: 1600,
      });
    }

    return actions;
  }

  getAutoVomitPoints() {
    return 18;
  }

  resetMess() {
    this.state.dug = false;
  }

  applyAction(actionId, catState, _ownerState, context) {
    if (actionId === "trash_dig") {
      this.state.dug = true;

      return {
        ok: true,
        points: 6,
        durationMs: 2000,
        noise: 10,
        message: "Кот раскопал мусорку.",
      };
    }

    if (actionId === "trash_eat") {
      if (!this.state.dug) {
        return {
          ok: false,
          points: 0,
          durationMs: 0,
          noise: 0,
          message: "Сначала надо раскопать мусорку.",
        };
      }

      catState.eatTrash(context.now);

      return {
        ok: true,
        points: 0,
        durationMs: 1600,
        noise: 8,
        message: "Кот сожрал что-то из мусорки. Через 10 секунд его стошнит.",
      };
    }

    return super.applyAction(actionId, catState, _ownerState, context);
  }
}
