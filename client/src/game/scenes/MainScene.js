// File: client/src/game/scenes/MainScene.js

import { Character } from '../entities/Character.js';
import { Platform } from '../entities/Platform.js';
import { EnemyManager } from '../managers/EnemyManager.js';
import {unit_manager} from "../unit_manager";
import {MobileUI} from "../ui/MobileUI";
import {WallSlideZone} from "../systems/WallSlideZone";
import {ZoneManager} from "../systems/ZoneManager";
import {utils} from "../utils.js";
import {ParallaxBackground} from "../systems/ParallaxBackground";

const Phaser = window.Phaser;
const WORLD_SCALE = 2;

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.createdMinas = false;
    this.lastNetworkSync = 0;
  }

  create() {
    this.isReturningToMenu = false;

    const viewWidth = this.scale.width;
    const viewHeight = this.scale.height;

    this.hearts = 0;
    this.minas = 0;
    this.heartsConstNumber = 3;
    this.heartHealing = 25;
    this.persentOfMina = 0.5;
    this.bombaDemage = 0.5;
    this.bombasCount = 0;

    this.enemySpawns =[];
    this.positionsForHeart =[];
    this.spawnPoint = { x: 220 * WORLD_SCALE, y: 650 * WORLD_SCALE };

    const levelData = this.cache.json.get('map_1');

    if (levelData && levelData.world) {
      this.worldWidth = levelData.world.width;
      this.worldHeight = levelData.world.height;
    } else {
      this.worldWidth = viewWidth * WORLD_SCALE;
      this.worldHeight = viewHeight * WORLD_SCALE;
    }

    this.cameras.main.setBackgroundColor('#132238');
    this.cameras.main.roundPixels = true;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.platforms = this.physics.add.staticGroup();
    this.zoneManager = new ZoneManager(this);
    this.parallax = new ParallaxBackground(this, 'sky_layer_', 8);

    if (levelData) {
      this.buildLevelFromJson(levelData);
    } else {
      this.buildFallbackLevel();
    }

    this.createCharacter();

    this.zoneManager.addInteractor(this.character.getPhysicsTarget());
    this.enemyManager = new EnemyManager(this, {
      walkingSpawns: this.enemySpawns,
      targetWalkingCount: this.enemySpawns.length,
      targetFlyingCount: 2
    });
    this.createHud(viewWidth);
    this.containerForBust = this.add.container(0, 0);
    this.setRandomPosForBlackHoles();
    this.generateHearts();

    this.add.text(viewWidth * 0.5, 90, 'Main Game Scene', {
      fontFamily: 'JungleAdventurer',
      fontSize: '42px',
      color: '#f8fafc'
    }).setOrigin(0.5).setScrollFactor(0);

    const backButton = this.add.rectangle(viewWidth * 0.5, viewHeight - 90, 240, 58, 0xf59e0b, 1).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    const backLabel = this.add.text(viewWidth * 0.5, viewHeight - 90, 'Back To Menu', {
      fontFamily: 'JungleAdventurer',
      fontSize: '24px',
      color: '#111827'
    }).setOrigin(0.5).setScrollFactor(0);

    backButton.on('pointerover', () => backButton.setFillStyle(0xfbbf24, 1))
        .on('pointerout', () => backButton.setFillStyle(0xf59e0b, 1))
        .on('pointerdown', () => {
          // [FIX] Передаем true, чтобы выйти даже если персонаж жив
          this.handleCharacterDeath(true);
        });

    backLabel.setDepth(1);
    this.cameras.main.startFollow(this.character.getPhysicsTarget(), true, 0.12, 0.12);

    this.setupSocketListeners();
  }

  setupSocketListeners() {
    if (!unit_manager.socket) return;

    // [FIX] Убираем старые слушатели, чтобы не было дубликатов при перезаходах
    unit_manager.socket.off('playerDisconnected');
    unit_manager.socket.off('currentPlayers');
    unit_manager.socket.off('newPlayer');
    unit_manager.socket.off('newPlayer_queue');
    unit_manager.socket.off('playerMoved');
    unit_manager.socket.off('enemiesState');

    // Кто-то вышел
    unit_manager.socket.on('playerDisconnected', (id) => {
      const p = unit_manager.info.players[id];
      if (p && p.obj) {
        p.obj.destroy();
      }
      delete unit_manager.info.players[id];
    });

    // Массив всех игроков
    unit_manager.socket.on('currentPlayers', (players) => {
      for (const [id, data] of Object.entries(players)) {
        if (id === unit_manager.my_id) continue;
        if (!unit_manager.info.players[id]) {
          unit_manager.info.players[id] = data;
        }
      }
    });

    // Новый игрок (обычная комната)
    unit_manager.socket.on('newPlayer', (player) => {
      if (player.id !== unit_manager.my_id) {
        unit_manager.info.players[player.id] = player;
      }
    });

    // [FIX] Новый игрок (матчмейкинг)
    unit_manager.socket.on('newPlayer_queue', (player) => {
      if (player.id !== unit_manager.my_id) {
        unit_manager.info.players[player.id] = player;
      }
    });

    // Движение других
    unit_manager.socket.on('playerMoved', (player) => {
      if (player.id === unit_manager.my_id) return;

      // [FIX] Защита от потери пакета входа (currentPlayers/newPlayer).
      // Если мы получаем координаты игрока, которого у нас еще нет - сразу создаем его!
      if (!unit_manager.info.players[player.id]) {
        unit_manager.info.players[player.id] = player;
      } else {
        unit_manager.info.players[player.id].x = player.x;
        unit_manager.info.players[player.id].y = player.y;
        unit_manager.info.players[player.id].hp = player.hp;
      }
    });

    // Враги
    unit_manager.socket.on('enemiesState', (enemies) => {
      unit_manager.info.enemies = enemies;
    });
  }

  // --- ИНТЕГРАЦИЯ РЕДАКТОРА УРОВНЕЙ ---
  buildLevelFromJson(levelData) {
    const graphics = this.add.graphics();
    const soil = 0x59412f;
    const grass = 0x7cb342;
    const dropThroughSoil = 0x334155;
    const dropThroughGrass = 0x475569;

    levelData.platforms.forEach(p => {
      const x = p.centerX;
      const y = p.centerY;
      const w = p.width;
      const h = p.height;

      if (p.type === 'solid') {
        this.drawPlatform(graphics, x - w/2, y - h/2, w, h, soil, grass);
        this.addPlatformBody(x, y, w, h, { type: Platform.TYPES.SOLID });
      }
      else if (p.type === 'drop-through') {
        this.drawPlatform(graphics, x - w/2, y - h/2, w, h, dropThroughSoil, dropThroughGrass);
        this.addPlatformBody(x, y, w, h, { type: Platform.TYPES.DROP_THROUGH });
      }
      else if (p.type === 'wall-slide') {
        this.zoneManager.addZone(new WallSlideZone(this, x, y, w, h, { direction: p.direction, debug: true }));
      }
    });

    let enemyIdx = 1;
    levelData.points.forEach(pt => {
      if (pt.type === 'enemy') {
        this.enemySpawns.push({ id: `enemy-json-${enemyIdx++}`, x: pt.x, y: pt.y, type: 'ground' });
      }
      else if (pt.type === 'heart') {
        this.positionsForHeart.push({ x: pt.x, y: pt.y, active: false });
      }
      else if (pt.type === 'hole') {
        this.createBlackHole({ x: pt.x, y: pt.y });
      }
    });

    if (this.positionsForHeart.length === 0) {
      this.positionsForHeart.push({ x: this.worldWidth / 2, y: this.worldHeight / 2, active: false });
    }
  }

  buildFallbackLevel() {
    const s = WORLD_SCALE;
    const graphics = this.add.graphics();
    const soil = 0x59412f; const grass = 0x7cb342; const rock = 0x7f8c8d;

    this.drawPlatform(graphics, 0, this.worldHeight - 170 * s, this.worldWidth, 170 * s, soil, grass);
    this.drawPlatform(graphics, 150 * s, 700 * s, 330 * s, 58 * s, soil, grass);
    this.drawPlatform(graphics, 430 * s, 610 * s, 220 * s, 48 * s, soil, grass);
    this.drawPlatform(graphics, 680 * s, 535 * s, 210 * s, 44 * s, soil, grass);
    this.drawPlatform(graphics, 935 * s, 462 * s, 230 * s, 46 * s, soil, grass);
    this.drawPlatform(graphics, 1220 * s, 392 * s, 210 * s, 44 * s, soil, grass);
    this.drawPlatform(graphics, 1490 * s, 334 * s, 200 * s, 42 * s, soil, grass);
    this.drawPlatform(graphics, 1725 * s, 270 * s, 170 * s, 40 * s, soil, grass);
    this.drawPlatform(graphics, 980 * s, 730 * s, 300 * s, 56 * s, soil, grass);
    this.drawPlatform(graphics, 1340 * s, 620 * s, 220 * s, 46 * s, soil, grass);
    this.drawPlatform(graphics, 1610 * s, 520 * s, 170 * s, 40 * s, soil, grass);
    this.drawPlatform(graphics, 330 * s, 455 * s, 150 * s, 40 * s, soil, grass);
    this.drawPlatform(graphics, 520 * s, 360 * s, 140 * s, 36 * s, soil, grass);
    this.drawPlatform(graphics, 720 * s, 280 * s, 130 * s, 34 * s, soil, grass);

    graphics.fillStyle(rock, 1);
    graphics.fillRoundedRect(122 * s, 804 * s, 126 * s, 106 * s, 14 * s);
    graphics.fillRoundedRect(724 * s, 822 * s, 154 * s, 88 * s, 16 * s);
    graphics.fillRoundedRect(1440 * s, 778 * s, 188 * s, 132 * s, 18 * s);
    graphics.fillRoundedRect(1742 * s, 610 * s, 94 * s, 82 * s, 14 * s);
    graphics.fillRoundedRect(576 * s, 272 * s, 62 * s, 68 * s, 12 * s);

    this.addPlatformBody(this.worldWidth * 0.5, this.worldHeight - 85 * s, this.worldWidth, 170 * s, { type: Platform.TYPES.SOLID });
    this.addPlatformBody(315 * s, 729 * s, 330 * s, 58 * s, { type: Platform.TYPES.DROP_THROUGH });
    this.addPlatformBody(540 * s, 634 * s, 220 * s, 48 * s, { type: Platform.TYPES.DROP_THROUGH });
    this.addPlatformBody(785 * s, 557 * s, 210 * s, 44 * s, { type: Platform.TYPES.DROP_THROUGH });
    this.addPlatformBody(1050 * s, 485 * s, 230 * s, 46 * s, { type: Platform.TYPES.DROP_THROUGH });
    this.addPlatformBody(1325 * s, 414 * s, 210 * s, 44 * s, { type: Platform.TYPES.DROP_THROUGH });
    this.addPlatformBody(1590 * s, 355 * s, 200 * s, 42 * s, { type: Platform.TYPES.DROP_THROUGH });
    this.addPlatformBody(1810 * s, 290 * s, 170 * s, 40 * s, { type: Platform.TYPES.DROP_THROUGH });
    this.addPlatformBody(1130 * s, 758 * s, 300 * s, 56 * s, { type: Platform.TYPES.DROP_THROUGH });
    this.addPlatformBody(1450 * s, 643 * s, 220 * s, 46 * s, { type: Platform.TYPES.DROP_THROUGH });
    this.addPlatformBody(1695 * s, 540 * s, 170 * s, 40 * s, { type: Platform.TYPES.DROP_THROUGH });
    this.addPlatformBody(405 * s, 475 * s, 150 * s, 40 * s, { type: Platform.TYPES.DROP_THROUGH });
    this.addPlatformBody(590 * s, 378 * s, 140 * s, 36 * s, { type: Platform.TYPES.DROP_THROUGH });
    this.addPlatformBody(785 * s, 297 * s, 130 * s, 34 * s, { type: Platform.TYPES.DROP_THROUGH });
    this.addPlatformBody(185 * s, 857 * s, 126 * s, 106 * s, { type: Platform.TYPES.SOLID });
    this.addPlatformBody(801 * s, 866 * s, 154 * s, 88 * s, { type: Platform.TYPES.SOLID });
    this.addPlatformBody(1534 * s, 844 * s, 188 * s, 132 * s, { type: Platform.TYPES.SOLID });
    this.addPlatformBody(1789 * s, 651 * s, 94 * s, 82 * s, { type: Platform.TYPES.SOLID });
    this.addPlatformBody(607 * s, 306 * s, 62 * s, 68 * s, { type: Platform.TYPES.SOLID });

    this.zoneManager.addZone(new WallSlideZone(this, 185 * s + 63 * s + 10, 857 * s, 20, 106 * s, { direction: -1, debug: true }));
    this.zoneManager.addZone(new WallSlideZone(this, 801 * s - 77 * s - 10, 866 * s, 20, 88 * s, { direction: 1, debug: true }));

    this.enemySpawns =[
      { id: 'enemy-1', x: 360 * s, y: 650 * s, type: 'ground' },
      { id: 'enemy-2', x: 1120 * s, y: 580 * s, type: 'ground' },
      { id: 'enemy-3', x: 1540 * s, y: 250 * s, type: 'ground' }
    ];

    this.positionsForHeart =[
      {x: 1400 * s, y: 580 * s, active: false},
      {x: 1660 * s, y: 470 * s, active: false},
      {x: 1800 * s, y: 230 * s, active: false},
      {x: 1100 * s, y: 420 * s, active: false},
      {x: 820 * s, y: 240 * s, active: false},
      {x: 760 * s, y: 490 * s, active: false},
      {x: 360 * s, y: 410 * s, active: false}
    ];

    this.positionsForMines =[
      {x: 1100 * s, y: 890 * s, active: false},
      {x: 1740 * s, y: 500 * s, active: false},
      {x: 1200 * s, y: 710 * s, active: false},
      {x: 1500 * s, y: 600 * s, active: false},
      {x: 850 * s, y: 515 * s, active: false}
    ];

    this.positionsForBombas =[
      {x: 600 * s, y: 890 * s, active: false},
      {x: 300 * s, y: 890 * s, active: false},
      {x: 1000 * s, y: 890 * s, active: false},
      {x: 1900 * s, y: 890 * s, active: false},
      {x: 450 * s, y: 435 * s, active: false},
      {x: 850 * s, y: 515 * s, active: false}
    ];
  }

  update(time, delta) {
    if (this.character) {
      this.character.update(time, delta);
      const {x, y} = this.character;
      const playerState = unit_manager.info.players[unit_manager.my_id] || { id: unit_manager.my_id };

      playerState.obj = this.character;
      playerState.x = x;
      playerState.y = y;
      playerState.hp = this.character.getHp();
      unit_manager.info.players[unit_manager.my_id] = playerState;

      if (time - this.lastNetworkSync > 50) {
        this.lastNetworkSync = time;
        if (unit_manager.socket) {
          unit_manager.socket.emit('playerMovement', {
            x: this.character.x,
            y: this.character.y,
            hp: this.character.getHp()
          });
        }
      }
      this.parallax.update(this.cameras.main);
    }

    this.handleCharacterDeath(); // Вызов без параметров (смерть)
    this.updateEnemiesBot(time, delta);
    this.enemyManager?.update(time, delta, this.character);
    this.updateEnemysPlayers(time, delta);
    this.updateHud(time, delta);
  }

  updateEnemysPlayers(time, delta) {
    let players = unit_manager.info.players;
    for (const [id, data] of Object.entries(players)) {
      if (id !== unit_manager.my_id) {

        if (data.hp <= 0 && data.obj) {
          data.obj.destroy();
          data.obj = null;
          continue;
        }
        if (data.hp <= 0) continue;

        if (!data.obj || !data.obj.scene) {
          data.obj = this.createEnemy();
          if (data.username) data.obj.healthIndicator.setNickname(data.username);
        }

        if (data.tint !== undefined && data.obj.currentTint !== data.tint) {
          data.obj.setSlotColor('body', data.tint);
        }

        data.obj.applyRemoteState(data.x, data.y, time);
        if (typeof data.hp === 'number') data.obj.setHp(data.hp);

        if (data.pendingAttackId && data.pendingAttackId !== data.lastPlayedAttackId) {
          data.lastPlayedAttackId = data.pendingAttackId;
          data.obj.playRemoteAttack(time);
        }

        if (data.pendingAction === 'dash') {
          data.obj.playRemoteDash(data.actionDirX, data.actionDirY);
          data.pendingAction = null;
        }
      }
    }
  }

  checkCollision(rect1, rect2) {
    const rect1Width = rect1.w ?? rect1.width;
    const rect1Height = rect1.h ?? rect1.height;
    const rect2Width = rect2.w ?? rect2.width;
    const rect2Height = rect2.h ?? rect2.height;

    return rect1.x < rect2.x + rect2Width &&
        rect1.x + rect1Width > rect2.x &&
        rect1.y < rect2.y + rect2Height &&
        rect1.y + rect1Height > rect2.y;
  }

  getCollisionAttack() {
    const otherPlayers = utils.parsePlayersToArray(unit_manager.info.players)
        .filter((player) => player.id !== unit_manager.my_id && player.obj?.hitbox);

    const attackRect = this.character.getAttackHitbox().getBounds();

    otherPlayers.forEach((player) => {
      const enemyHitbox = player.obj.hitbox.getBounds();

      if (this.checkCollision(attackRect, enemyHitbox)) {
        unit_manager.socket.emit('playerHit', {
          targetId: player.id
        });
      }
    });
  }

  addPlatformBody(x, y, width, height, options = {}) {
    const platform = new Platform(this, x, y, width, height, options);
    this.platforms.add(platform.getPhysicsTarget());
    return platform;
  }

  createCharacter() {
    const playerState = unit_manager.info.players[unit_manager.my_id] || { id: unit_manager.my_id };

    this.character = new Character(this, playerState.x ?? this.spawnPoint.x, playerState.y ?? this.spawnPoint.y, {
      showStats: true,
      nickname: playerState.username || 'Player'
    });

    const myTint = parseInt(localStorage.getItem('player_tint')) || 0xffffff;
    this.character.setSlotColor('body', myTint);

    playerState.tint = myTint;
    playerState.obj = this.character;
    playerState.hp = this.character.getHp();
    unit_manager.info.players[unit_manager.my_id] = playerState;

    this.mobileUI = new MobileUI(this, this.character.controller);
    this.character.setDepth(2);

    this.physics.add.collider(this.character.getPhysicsTarget(), this.platforms, undefined, (_characterBody, platform) => this.character.shouldCollideWithPlatform(platform));

    this.character.events.on('attack', () => {
      this.getCollisionAttack();
    });
  }

  updateEnemiesBot(time, delta) {
    if (!this.character) return;
    const attackId = this.character.getAttackId();
    const isPlayerAttacking = this.character.isAttacking();
    const playerAttackBounds = isPlayerAttacking ? this.character.getAttackHitbox().getBounds() : null;
    this.enemyManager?.handlePlayerAttack(playerAttackBounds, attackId, this.character.getAttackDamage());
  }

  // [FIX] Добавлен флаг `force`, который заставляет выйти в меню даже если ХП не на нуле
  handleCharacterDeath(force = false) {
    if (!this.character || this.isReturningToMenu) return;

    // Если игрок жив и мы не нажимали кнопку принудительного выхода - ничего не делаем
    if (!force && !this.character.isDead()) return;

    this.isReturningToMenu = true;
    if (unit_manager.socket) {
      unit_manager.socket.off('playerDisconnected');
      unit_manager.socket.off('currentPlayers');
      unit_manager.socket.off('newPlayer');
      unit_manager.socket.off('newPlayer_queue');
      unit_manager.socket.off('playerMoved');
      unit_manager.socket.off('enemiesState');
      unit_manager.socket.emit('playerDied');
    }

    this.cameras.main.stopFollow();

    this.character.destroy();
    this.character = null;

    // Уничтожаем все чужие спрайты перед выходом
    for (const [id, data] of Object.entries(unit_manager.info.players)) {
      if (data.obj) {
        data.obj.destroy();
      }
    }

    // ЖЕСТКАЯ ОЧИСТКА КЭША
    unit_manager.info.players = {};
    unit_manager.info.enemies = {};

    this.scene.start('MenuScene');
  }

  createEnemy() {
    let enemy = new Character(this, 220 * WORLD_SCALE, 650 * WORLD_SCALE, { showStats: true, nickname: 'Player' });
    enemy.setDepth(1);
    this.physics.add.collider(
        enemy.getPhysicsTarget(), this.platforms, undefined,
        (_characterBody, platform) => enemy.shouldCollideWithPlatform(platform)
    );
    return enemy;
  }

  createHud(viewWidth) {
    this.controlsText = this.add.text(viewWidth - 42, 34, 'WASD move | Space jump | Enter attack', {
      fontFamily: 'JungleAdventurer',
      fontSize: '18px',
      color: '#cbd5e1',
      align: 'right'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);
  }

  updateHud() {
    if (this.character) {
      this.character.syncHpText();
    }
  }

  createDebugButton(x, y, label, onClick) {
    const button = this.add.rectangle(x, y, 88, 52, 0x334155, 0.95).setStrokeStyle(2, 0x94a3b8, 0.7).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    const text = this.add.text(x, y, label, { fontFamily: 'JungleAdventurer', fontSize: '28px', color: '#f8fafc' }).setOrigin(0.5).setScrollFactor(0);
    button.on('pointerover', () => button.setFillStyle(0x475569, 0.98))
        .on('pointerout', () => button.setFillStyle(0x334155, 0.95))
        .on('pointerdown', onClick);
    return { button, label: text };
  }

  drawPlatform(graphics, x, y, width, height, soilColor, grassColor) {
    graphics.fillStyle(soilColor, 1);
    graphics.fillRoundedRect(x, y, width, height, 18);
    graphics.fillStyle(grassColor, 1);
    graphics.fillRoundedRect(x, y - 10, width, 24, 12);
    graphics.fillStyle(0x000000, 0.08);
    graphics.fillRoundedRect(x + 14, y + 18, width - 28, height - 30, 14);
  }

  createBlackHole(position) {
    this.animHole = this.add.spine(position.x, position.y, 'blackhole_spine_SPO', 'idle', true);
    this.animHole.setScale(0.5);

    this.blackHoleZone = this.add.zone(this.animHole.x - 15 * WORLD_SCALE, this.animHole.y - 15 * WORLD_SCALE, 80 * WORLD_SCALE, 50 * WORLD_SCALE);
    this.physics.add.existing(this.blackHoleZone);

    this.blackHoleZone.body.setAllowGravity(false);
    this.blackHoleZone.body.setImmovable(true);

    if (this.character) {
      this.physics.add.overlap(this.character.getPhysicsTarget(), this.blackHoleZone, this.onBlackHoleTouch, null, this);
    }
  }

  onBlackHoleTouch(characterBody, holeZone) {
    if (this.isBlackHoleTriggered) return;
    this.isBlackHoleTriggered = true;

    const target = this.character.getPhysicsTarget();
    const x = Phaser.Math.Between(100, this.worldWidth - 100);
    const y = Phaser.Math.Between(100, this.worldHeight - 600);

    this.tweens.add({ targets: this.character, alpha: 0, scaleX: 0.1, scaleY: 0.1, duration: 300 });
    this.tweens.add({
      targets: target,
      alpha: 0,
      duration: 700,
      onComplete: () => {
        target.setPosition(x, y);
        this.character.setAlpha(1);
        this.character.setScale(1);
        this.isBlackHoleTriggered = false;
      }
    });
  }

  setRandomPosForBlackHoles(){
    const freePositionsBottom =[{x: 1750 * WORLD_SCALE, y: 850 * WORLD_SCALE}, {x: 500 * WORLD_SCALE, y: 850 * WORLD_SCALE}, {x: 1300 * WORLD_SCALE, y: 850 * WORLD_SCALE}];
    const freePositionsTop =[{x: 1200 * WORLD_SCALE, y: 600 * WORLD_SCALE}, {x: 1700 * WORLD_SCALE, y: 600 * WORLD_SCALE}, {x: 1400 * WORLD_SCALE, y: 490 * WORLD_SCALE}, {x: 1000 * WORLD_SCALE, y: 560 * WORLD_SCALE}, {x: 1800 * WORLD_SCALE, y: 100 * WORLD_SCALE}, {x: 1300 * WORLD_SCALE, y: 190 * WORLD_SCALE}, {x: 850 * WORLD_SCALE, y: 350 * WORLD_SCALE}, {x: 580 * WORLD_SCALE, y: 450 * WORLD_SCALE}];

    const posBottom = Phaser.Utils.Array.GetRandom(freePositionsBottom);
    this.createBlackHole({x: posBottom.x, y: posBottom.y});

    const shuffled = Phaser.Utils.Array.Shuffle([...freePositionsTop]);
    this.createBlackHole({x: shuffled[0].x, y: shuffled[0].y});
    this.createBlackHole({x: shuffled[1].x, y: shuffled[1].y});
    this.createBlackHole({x: shuffled[2].x, y: shuffled[2].y});
  }

  generateHearts(delayedTime = 0) {
    this.time.delayedCall(delayedTime, () => {
      if (this.hearts >= this.heartsConstNumber) {
        this.generateHearts(5000);
        return;
      } else {
        const heartsLength = this.hearts;
        for (let i = 1; i <= (this.heartsConstNumber - heartsLength); i++) {
          this.addHeartToRandomPos();
        }
        this.generateHearts(5000);
      }
    });
  }

  addHeartToRandomPos() {
    let heart;
    const freePositions = this.positionsForHeart.filter(p => !p.active);
    if (freePositions.length > 0) {
      const pos = Phaser.Utils.Array.GetRandom(freePositions);
      pos.active = true;
      heart = this.add.image(pos.x, pos.y, 'heart').setScale(0.25);
      this.hearts += 1;
      heart.posRef = pos;

      this.addPhysicForNewHeart(heart);

      heart.pulseTween = this.tweens.add({
        targets: heart, scaleX: 0.28, scaleY: 0.28, duration: 300,
        ease: 'Sine.inOut', yoyo: true, repeat: -1
      });
    }
  }

  addPhysicForNewHeart(heart){
    const heartZone = this.add.zone(heart.x, heart.y, 10 * WORLD_SCALE, 10 * WORLD_SCALE);
    this.physics.add.existing(heartZone);
    heartZone.body.setAllowGravity(false);
    heartZone.body.setImmovable(true);
    if (this.character) {
      heartZone.overlapRef = this.physics.add.overlap(this.character.getPhysicsTarget(), heartZone, this.onHeartTouch.bind(this, heart, heartZone), null, this);
    }
  }

  onHeartTouch(heart, heartZone){
    if (heart.heartTouched) return;
    heart.heartTouched = true;

    if (heartZone.body) heartZone.body.enable = false;

    const curHp = this.character.getHp();
    const maxHp = this.character.getMaxHp();
    ((maxHp - curHp) >= this.heartHealing) ? this.character.setHp(curHp + this.heartHealing) : this.character.setHp(maxHp);

    this.tweens.add({ targets: this.character, scaleX: 1.5, scaleY: 1.7, duration: 150, ease: 'Cubic.in', yoyo: true });

    if (heartZone.overlapRef) heartZone.overlapRef.destroy();
    if (heartZone.body) heartZone.body.destroy();
    heartZone.destroy();

    this.tweens.add({
      targets: heart, alpha: 0, duration: 300,
      onComplete: () => {
        this.hearts--;
        if (heart) {
          heart.posRef.active = false;
          if (heart.pulseTween) heart.pulseTween.stop();
          heart.destroy();
        }
      }
    });
  }
}