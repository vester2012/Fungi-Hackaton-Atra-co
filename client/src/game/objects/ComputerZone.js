import { BaseZoneObject } from "./BaseZoneObject.js";

export class ComputerZone extends BaseZoneObject {
  constructor(config) {
    super(config);

    this.state = {
      biteCount: 0,
      maxBites: 3,
      typed: false,
      watered: false,
    };
  }

  getAvailableActions(catState) {
    const actions = [];

    if (this.state.biteCount < this.state.maxBites) {
      actions.push({
        id: "computer_bite",
        label: `Укусить монитор (${this.state.biteCount}/${this.state.maxBites})`,
        durationMs: 1200,
      });
    }

    actions.push({
      id: "computer_type",
      label: "Печатать",
      durationMs: 1800,
    });

    if (catState.hasWaterInMouth && !this.state.watered) {
      actions.push({
        id: "computer_water",
        label: "Облить водой",
        durationMs: 1600,
      });
    }

    return actions;
  }

  getAutoVomitPoints() {
    return 45;
  }

  applyAction(actionId, catState, _ownerState, _context) {
    if (actionId === "computer_bite") {
      if (this.state.biteCount >= this.state.maxBites) {
        return {
          ok: false,
          points: 0,
          durationMs: 0,
          noise: 0,
          message: "Монитор уже достаточно искусан.",
        };
      }

      this.state.biteCount += 1;

      return {
        ok: true,
        points: 10,
        durationMs: 1200,
        noise: 8,
        message:
          this.state.biteCount >= this.state.maxBites
            ? "Кот окончательно изгрыз монитор."
            : "Кот укусил монитор.",
      };
    }

    if (actionId === "computer_type") {
      this.state.typed = true;

      return {
        ok: true,
        points: 14,
        durationMs: 1800,
        noise: 12,
        message: "Кот напечатал на клавиатуре.",
      };
    }

    if (actionId === "computer_water") {
      if (!catState.hasWaterInMouth) {
        return {
          ok: false,
          points: 0,
          durationMs: 0,
          noise: 0,
          message: "Во рту нет воды.",
        };
      }

      if (this.state.watered) {
        return {
          ok: false,
          points: 0,
          durationMs: 0,
          noise: 0,
          message: "Комп уже залит водой.",
        };
      }

      this.state.watered = true;
      catState.consumeWaterInMouth();

      return {
        ok: true,
        points: 30,
        durationMs: 1600,
        noise: 8,
        message: "Кот вылил воду на компьютер.",
      };
    }

    return super.applyAction(actionId, catState, _ownerState, _context);
  }
}
