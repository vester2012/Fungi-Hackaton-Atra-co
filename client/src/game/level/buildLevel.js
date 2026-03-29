import { Platform } from '../entities/Platform.js';
import { WallSlideZone } from '../systems/WallSlideZone.js';

function drawPlatform(graphics, x, y, width, height, soilColor, grassColor) {
  graphics.fillStyle(soilColor, 1);
  graphics.fillRoundedRect(x, y, width, height, 18);
  graphics.fillStyle(grassColor, 1);
  graphics.fillRoundedRect(x, y - 10, width, 24, 12);
  graphics.fillStyle(0x000000, 0.08);
  graphics.fillRoundedRect(x + 14, y + 18, width - 28, height - 30, 14);
}

function buildLevelFromJson(scene, levelData) {
  const graphics = scene.add.graphics();
  const soil = 0x59412f;
  const grass = 0x7cb342;
  const dropThroughSoil = 0x334155;
  const dropThroughGrass = 0x475569;

  levelData.platforms.forEach((platformData) => {
    const x = platformData.centerX;
    const y = platformData.centerY;
    const w = platformData.width;
    const h = platformData.height;

    if (platformData.type === 'solid') {
      drawPlatform(graphics, x - w / 2, y - h / 2, w, h, soil, grass);
      scene.addPlatformBody(x, y, w, h, { type: Platform.TYPES.SOLID });
    } else if (platformData.type === 'drop-through') {
      drawPlatform(graphics, x - w / 2, y - h / 2, w, h, dropThroughSoil, dropThroughGrass);
      scene.addPlatformBody(x, y, w, h, { type: Platform.TYPES.DROP_THROUGH });
    } else if (platformData.type === 'wall-slide') {
      scene.zoneManager.addZone(new WallSlideZone(scene, x, y, w, h, {
        direction: platformData.direction,
        debug: true
      }));
    }
  });

  levelData.points.forEach((point) => {
    if (point.type === 'heart') {
      scene.positionsForHeart.push({ x: point.x, y: point.y, active: false });
    } else if (point.type === 'hole') {
      scene.createBlackHole({ x: point.x, y: point.y });
    }
  });

  if (scene.positionsForHeart.length === 0) {
    scene.positionsForHeart.push({ x: scene.worldWidth / 2, y: scene.worldHeight / 2, active: false });
  }
}

function buildFallbackLevel(scene, worldScale) {
  const s = worldScale;
  const graphics = scene.add.graphics();
  const soil = 0x59412f;
  const grass = 0x7cb342;
  const rock = 0x7f8c8d;

  drawPlatform(graphics, 0, scene.worldHeight - 170 * s, scene.worldWidth, 170 * s, soil, grass);
  drawPlatform(graphics, 150 * s, 700 * s, 330 * s, 58 * s, soil, grass);
  drawPlatform(graphics, 430 * s, 610 * s, 220 * s, 48 * s, soil, grass);
  drawPlatform(graphics, 680 * s, 535 * s, 210 * s, 44 * s, soil, grass);
  drawPlatform(graphics, 935 * s, 462 * s, 230 * s, 46 * s, soil, grass);
  drawPlatform(graphics, 1220 * s, 392 * s, 210 * s, 44 * s, soil, grass);
  drawPlatform(graphics, 1490 * s, 334 * s, 200 * s, 42 * s, soil, grass);
  drawPlatform(graphics, 1725 * s, 270 * s, 170 * s, 40 * s, soil, grass);
  drawPlatform(graphics, 980 * s, 730 * s, 300 * s, 56 * s, soil, grass);
  drawPlatform(graphics, 1340 * s, 620 * s, 220 * s, 46 * s, soil, grass);
  drawPlatform(graphics, 1610 * s, 520 * s, 170 * s, 40 * s, soil, grass);
  drawPlatform(graphics, 330 * s, 455 * s, 150 * s, 40 * s, soil, grass);
  drawPlatform(graphics, 520 * s, 360 * s, 140 * s, 36 * s, soil, grass);
  drawPlatform(graphics, 720 * s, 280 * s, 130 * s, 34 * s, soil, grass);

  graphics.fillStyle(rock, 1);
  graphics.fillRoundedRect(122 * s, 804 * s, 126 * s, 106 * s, 14 * s);
  graphics.fillRoundedRect(724 * s, 822 * s, 154 * s, 88 * s, 16 * s);
  graphics.fillRoundedRect(1440 * s, 778 * s, 188 * s, 132 * s, 18 * s);
  graphics.fillRoundedRect(1742 * s, 610 * s, 94 * s, 82 * s, 14 * s);
  graphics.fillRoundedRect(576 * s, 272 * s, 62 * s, 68 * s, 12 * s);

  scene.addPlatformBody(scene.worldWidth * 0.5, scene.worldHeight - 85 * s, scene.worldWidth, 170 * s, { type: Platform.TYPES.SOLID });
  scene.addPlatformBody(315 * s, 729 * s, 330 * s, 58 * s, { type: Platform.TYPES.DROP_THROUGH });
  scene.addPlatformBody(540 * s, 634 * s, 220 * s, 48 * s, { type: Platform.TYPES.DROP_THROUGH });
  scene.addPlatformBody(785 * s, 557 * s, 210 * s, 44 * s, { type: Platform.TYPES.DROP_THROUGH });
  scene.addPlatformBody(1050 * s, 485 * s, 230 * s, 46 * s, { type: Platform.TYPES.DROP_THROUGH });
  scene.addPlatformBody(1325 * s, 414 * s, 210 * s, 44 * s, { type: Platform.TYPES.DROP_THROUGH });
  scene.addPlatformBody(1590 * s, 355 * s, 200 * s, 42 * s, { type: Platform.TYPES.DROP_THROUGH });
  scene.addPlatformBody(1810 * s, 290 * s, 170 * s, 40 * s, { type: Platform.TYPES.DROP_THROUGH });
  scene.addPlatformBody(1130 * s, 758 * s, 300 * s, 56 * s, { type: Platform.TYPES.DROP_THROUGH });
  scene.addPlatformBody(1450 * s, 643 * s, 220 * s, 46 * s, { type: Platform.TYPES.DROP_THROUGH });
  scene.addPlatformBody(1695 * s, 540 * s, 170 * s, 40 * s, { type: Platform.TYPES.DROP_THROUGH });
  scene.addPlatformBody(405 * s, 475 * s, 150 * s, 40 * s, { type: Platform.TYPES.DROP_THROUGH });
  scene.addPlatformBody(590 * s, 378 * s, 140 * s, 36 * s, { type: Platform.TYPES.DROP_THROUGH });
  scene.addPlatformBody(785 * s, 297 * s, 130 * s, 34 * s, { type: Platform.TYPES.DROP_THROUGH });
  scene.addPlatformBody(185 * s, 857 * s, 126 * s, 106 * s, { type: Platform.TYPES.SOLID });
  scene.addPlatformBody(801 * s, 866 * s, 154 * s, 88 * s, { type: Platform.TYPES.SOLID });
  scene.addPlatformBody(1534 * s, 844 * s, 188 * s, 132 * s, { type: Platform.TYPES.SOLID });
  scene.addPlatformBody(1789 * s, 651 * s, 94 * s, 82 * s, { type: Platform.TYPES.SOLID });
  scene.addPlatformBody(607 * s, 306 * s, 62 * s, 68 * s, { type: Platform.TYPES.SOLID });

  scene.zoneManager.addZone(new WallSlideZone(scene, 185 * s + 63 * s + 10, 857 * s, 20, 106 * s, { direction: -1, debug: true }));
  scene.zoneManager.addZone(new WallSlideZone(scene, 801 * s - 77 * s - 10, 866 * s, 20, 88 * s, { direction: 1, debug: true }));

  scene.positionsForHeart = [
    { x: 1400 * s, y: 580 * s, active: false },
    { x: 1660 * s, y: 470 * s, active: false },
    { x: 1800 * s, y: 230 * s, active: false },
    { x: 1100 * s, y: 420 * s, active: false },
    { x: 820 * s, y: 240 * s, active: false },
    { x: 760 * s, y: 490 * s, active: false },
    { x: 360 * s, y: 410 * s, active: false }
  ];

  scene.positionsForMines = [
    { x: 1100 * s, y: 890 * s, active: false },
    { x: 1740 * s, y: 500 * s, active: false },
    { x: 1200 * s, y: 710 * s, active: false },
    { x: 1500 * s, y: 600 * s, active: false },
    { x: 850 * s, y: 515 * s, active: false }
  ];

  scene.positionsForBombas = [
    { x: 450 * s, y: 435 * s, active: false }
  ];
}

export function buildSceneLevel(scene, levelData, worldScale) {
  if (levelData) {
    buildLevelFromJson(scene, levelData);
    return;
  }

  buildFallbackLevel(scene, worldScale);
}
