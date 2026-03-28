const Phaser = window.Phaser;

export class ParallaxBackground {
    /**
     * @param {Phaser.Scene} scene - Сцена, к которой привязан фон
     * @param {string} texturePrefix - Префикс имени текстур (например, 'bg_layer_')
     * @param {number} layerCount - Количество слоев (в твоем случае 9)
     */
    constructor(scene, texturePrefix, layerCount = 7) {
        this.scene = scene;
        this.layers = [];

        // Получаем размеры экрана
        const { width, height } = scene.scale;

        // Создаем слои
        // Мы идем от 0 до layerCount-1.
        // 0 — самый дальний (небо/горы), layerCount-1 — самый ближний.
        for (let i = 1; i < layerCount; i++) {
            const textureKey = `${texturePrefix}${i}`;

            // Создаем TileSprite на весь экран
            // setScrollFactor(0) привязывает объект к камере, чтобы он не улетал
            const layer = scene.add.tileSprite(width / 2, height / 2, width, height, textureKey)
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(-100 + i); // Отрицательный Depth, чтобы всегда было за игроком
            const texture = scene.textures.get(textureKey).getSourceImage();
            if (texture) {
                // Сначала вычисляем масштаб, чтобы картинка заполнила высоту экрана
                const fitHeightScale = height / texture.height;

                // Умножаем на наш zoom, чтобы сделать картинку еще крупнее
                // Например: fitHeightScale * 2.0 сделает фон огромным
                layer.setTileScale(fitHeightScale * 1.5);
            }
            // Рассчитываем коэффициент скорости для каждого слоя
            // Дальние слои движутся медленнее (например, 0.05), ближние быстрее (например, 0.9)
            // Формула: чем выше индекс, тем выше скорость
            const speedFactor = Math.pow(i , 2) / Math.pow(layerCount, 2) * 0.8;

            // Можно настроить базовые скорости вручную для каждого слоя, если нужно
            // Но эта экспоненциальная прогрессия обычно выглядит очень сочно
            this.layers.push({
                sprite: layer,
                factor: speedFactor
            });
        }
    }

    /**
     * Метод обновления, вызывается в update() сцены
     * @param {Phaser.Cameras.Scene2D.Camera} camera - Основная камера
     */
    update(camera) {
        this.layers.forEach((layer, index) => {
            // Двигаем tilePositionX в зависимости от scrollX камеры и фактора скорости
            // Мы используем умножение на factor.
            // 0.1 означает, что фон сдвинется на 10 пикселей, когда камера на 100.
            layer.sprite.tilePositionX = camera.scrollX * layer.factor;

            // Если у тебя есть вертикальный геймплей, можно добавить и это:
            layer.sprite.tilePositionY = camera.scrollY * (layer.factor * 0.5);
        });
    }

    // Метод для легкого изменения прозрачности (например, для смены времени суток)
    setAlpha(alpha) {
        this.layers.forEach(l => l.sprite.setAlpha(alpha));
    }
}