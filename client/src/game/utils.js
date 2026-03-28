import {unit_manager} from "./unit_manager.js";

export const utils = {
    parsePlayersToArray(players) {
        let array = [];
        for (const [key, value] of Object.entries(players)) {
            array.push(value);
        }
        return array;
    }
}
