import { BaseZoneObject } from './BaseZoneObject.js';

export class TableZone extends BaseZoneObject {
  isHideZone() {
    return true;
  }

  getAvailableActions() {
    return [];
  }
}
