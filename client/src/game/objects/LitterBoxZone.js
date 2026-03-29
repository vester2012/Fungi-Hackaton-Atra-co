import { BaseZoneObject } from "./BaseZoneObject.js";

export class LitterBoxZone extends BaseZoneObject {
  constructor(config) {
    super(config);
    this.dug = false;
  }

  getAvailableActions(catState) {
    const actions = [];

    if (!this.dug) {
      actions.push({
        id: "litter_dig",
        label: "Выкопать наполнитель",
        durationMs: 1800,
      });

      if (catState.peePending && catState.canPee) {
        actions.push({
          id: "litter_pee",
          label: "Написать в лоток",
          durationMs: 1200,
        });
      }

      if (catState.vomitPending) {
        actions.push({
          id: "litter_vomit",
          label: "Наблевать в лоток",
          durationMs: 1200,
        });
      }

      if (catState.poopPending && catState.canPoop && !catState.hasPooped) {
        actions.push({
          id: "litter_poop",
          label: "Покакать в лоток",
          durationMs: 1200,
        });
      }
    }

    return actions;
  }

  applyAction(actionId, catState) {
    if (actionId === "litter_dig") {
      if (this.dug) {
        return { ok: false, points: 0, message: "Лоток уже разбурен." };
      }

      this.dug = true;
      return {
        ok: true,
        points: 10,
        message: "Кот разбурил лоток и разбросал наполнитель.",
      };
    }

    if (actionId === "litter_pee") {
      if (this.dug) {
        return {
          ok: false,
          points: 0,
          message: "В разбуренный лоток уже не пописать.",
        };
      }

      catState.consumePee();
      return {
        ok: true,
        points: 0,
        message: "Кот пописал в лоток.",
      };
    }

    if (actionId === "litter_vomit") {
      if (this.dug) {
        return {
          ok: false,
          points: 0,
          message: "В разбуренный лоток уже не наблевать.",
        };
      }

      catState.triggerAutoVomit();
      return {
        ok: true,
        points: 0,
        message: "Кот наблевал в лоток.",
      };
    }

    if (actionId === "litter_poop") {
      if (this.dug) {
        return {
          ok: false,
          points: 0,
          message: "В разбуренный лоток уже не покакать.",
        };
      }

      const used = catState.consumePoop();
      if (!used) {
        return { ok: false, points: 0, message: "Уже поздно какать." };
      }

      return {
        ok: true,
        points: 0,
        message: "Кот покакал в лоток.",
      };
    }

    return {
      ok: false,
      points: 0,
      message: "Неизвестное действие.",
    };
  }
}
