export class ZoneManager {
    constructor(scene) {
        this.scene = scene;
        this.zones = scene.physics.add.staticGroup();
    }
    destroy() {
        // Очистка физической группы
        if (this.zones) {
            this.zones.clear(true, true);
        }
    }

    addZone(zoneInstance) {
        this.zones.add(zoneInstance);
        // Обновляем тело статического объекта под размеры прямоугольника
        zoneInstance.body.updateFromGameObject();
        return zoneInstance;
    }

    addInteractor(characterHitbox) {
        this.scene.physics.add.overlap(
            characterHitbox,
            this.zones,
            (h, zone) => {
                const char = h.parentCharacter || h.parentContainer;
                if (char && zone.onStay) zone.onStay(char);
            }
        );
    }
}