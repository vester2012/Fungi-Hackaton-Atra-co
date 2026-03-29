import { PlantZone } from "./PlantZone.js";
import { BedZone } from "./BedZone.js";
import { TrashZone } from "./TrashZone.js";
import { CurtainsZone } from "./CurtainsZone.js";
import { WaterZone } from "./WaterZone.js";
import { ComputerZone } from "./ComputerZone.js";
import { TableZone } from "./TableZone.js";
import { ShoesZone } from "./ShoesZone.js";
import { LitterBoxZone } from "./LitterBoxZone.js";

export function createZoneObject(zoneData) {
  if (zoneData.id === "plant") return new PlantZone(zoneData);
  if (zoneData.id === "bed") return new BedZone(zoneData);
  if (zoneData.id === "trash") return new TrashZone(zoneData);

  if (zoneData.id === "curtain_left" || zoneData.id === "curtain_right") {
    return new CurtainsZone(zoneData);
  }

  if (zoneData.id === "water") return new WaterZone(zoneData);
  if (zoneData.id === "computer") return new ComputerZone(zoneData);

  if (zoneData.id === "table_1" || zoneData.id === "table_2") {
    return new TableZone(zoneData);
  }

  if (zoneData.id === "shoes") return new ShoesZone(zoneData);
  if (zoneData.id === "litterbox") return new LitterBoxZone(zoneData);

  throw new Error(`Unknown zone id: ${zoneData.id}`);
}
