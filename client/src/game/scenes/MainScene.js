import { Character } from '../entities/Character.js';
import { Enemy } from '../entities/Enemy.js';
import { Platform } from '../entities/Platform.js';
import {unit_manager} from "../unit_manager";
import {MobileUI} from "../ui/MobileUI";
import {WallSlideZone} from "../systems/WallSlideZone";
import {ZoneManager} from "../systems/ZoneManager";
import {utils} from "../utils.js";

const Phaser = window.Phaser;
const WORLD_SCALE = 2;
const ENEMY_SPAWNS = [
  { id: 'enemy-1', x: 360 * WORLD_SCALE, y: 650 * WORLD_SCALE },
  { id: 'enemy-2', x: 1120 * WORLD_SCALE, y: 580 * WORLD_SCALE },
  { id: 'enemy-3', x: 1540 * WORLD_SCALE, y: 250 * WORLD_SCALE }
];

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    this.isReturningToMenu = false;

    const viewWidth = this.scale.width;
    const viewHeight = this.scale.height;
    this.worldWidth = viewWidth * WORLD_SCALE;
    this.worldHeight = viewHeight * WORLD_SCALE;

    this.cameras.main.setBackgroundColor('#132238');
    this.cameras.main.roundPixels = true;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.drawBackground(this.worldWidth, this.worldHeight);
    this.drawMap(this.worldWidth, this.worldHeight);
    this.createCollisionMap(this.worldWidth, this.worldHeight);
    this.zoneManager = new ZoneManager(this);
    this.createZones(this.worldWidth, this.worldHeight);
    this.createCharacter();
    this.zoneManager.addInteractor(this.character.getPhysicsTarget());
    this.createEnemiesBot();
    this.enemiesBot.forEach(enemy => this.zoneManager.addInteractor(enemy.getPhysicsTarget()));
    this.createHud(viewWidth);
    this.createBlackHole({x: 500 * WORLD_SCALE, y: 850 * WORLD_SCALE});
    this.createBlackHole({x: 550 * WORLD_SCALE, y: 450 * WORLD_SCALE});
    this.createBlackHole({x: 1300 * WORLD_SCALE, y: 850 * WORLD_SCALE});

    this.add.text(viewWidth * 0.5, 90, 'Main Game Scene', {
      fontFamily: 'JungleAdventurer',
      fontSize: '42px',
      color: '#f8fafc'
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(viewWidth * 0.5, 138, 'Greybox map prototype', {
      fontFamily: 'JungleAdventurer',
      fontSize: '20px',
      color: '#cbd5e1'
    }).setOrigin(0.5).setScrollFactor(0);

    const backButton = this.add.rectangle(viewWidth * 0.5, viewHeight - 90, 240, 58, 0xf59e0b, 1)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);

    const backLabel = this.add.text(viewWidth * 0.5, viewHeight - 90, 'Back To Menu', {
      fontFamily: 'JungleAdventurer',
      fontSize: '24px',
      color: '#111827'
    }).setOrigin(0.5).setScrollFactor(0);

    backButton.on('pointerover', () => backButton.setFillStyle(0xfbbf24, 1))
      .on('pointerout', () => backButton.setFillStyle(0xf59e0b, 1))
      .on('pointerdown', () => {
        this.scene.start('MenuScene');
      });

    backLabel.setDepth(1);
    this.cameras.main.startFollow(this.character.getPhysicsTarget(), true, 0.12, 0.12);
    this.createDebugZoomControls(viewWidth);
  }


  createZones(width, height) {
    const s = WORLD_SCALE;
    const isDebug = true; // Включи для предпросмотра (зоны будут розовыми)

    // Пример: добавляем зону скольжения на правую стену прямоугольника (185x 857y)
    // Параметры Rectangle: x (центр), y (центр), width, height
    // Указываем direction: -1 (персонаж прилипнет, если нажмет влево)
    this.zoneManager.addZone(
        new WallSlideZone(this, 185 * s + 63 * s + 10, 857 * s, 20, 106 * s, {
          direction: -1,
          debug: isDebug
        })
    );

    // Добавляем зону скольжения на левую стену (direction: 1)
    this.zoneManager.addZone(
        new WallSlideZone(this, 801 * s - 77 * s - 10, 866 * s, 20, 88 * s, {
          direction: 1,
          debug: isDebug
        })
    );

    // И так далее. Теперь ты можешь навешивать WallSlideZone поверх любых стен!
  }
  update(time, delta) {
    if (this.character) {
      this.character.update(time, delta);
      const {x, y} = this.character;
      const playerState = unit_manager.info.players[unit_manager.my_id] || {
        id: unit_manager.my_id
      };
      playerState.obj = this.character;
      playerState.x = x;
      playerState.y = y;
      playerState.hp = this.character.getHp();
      unit_manager.info.players[unit_manager.my_id] = playerState;

      unit_manager.socket.emit('playerMovement', {
        x: this.character.x,
        y: this.character.y,
        hp: this.character.getHp()
      });
    }

    this.handleCharacterDeath();
    this.updateEnemiesBot(time, delta);
    this.updateEnemysPlayers(time, delta);
    this.updateHud(time, delta);
    this.updateSocketInfo(time, delta);
  }

  updateEnemysPlayers(time, delta) {
    let players = unit_manager.info.players;
    for (const [id, data] of Object.entries(players)) {
      if(id !== unit_manager.my_id) {
        if (!data.obj) data.obj = this.createEnemy();

        // Передаем time в applyRemoteState если там есть логика анимаций
        data.obj.applyRemoteState(data.x, data.y, time);

        if (typeof data.hp === 'number') data.obj.setHp(data.hp);

        if (data.pendingAttackId && data.pendingAttackId !== data.lastPlayedAttackId) {
          data.lastPlayedAttackId = data.pendingAttackId;
          data.obj.playRemoteAttack(time);
        }
      }
    }
  }

  updateSocketInfo() {
    let players = unit_manager.info.players;
    let str = '';

    // Перебор entries
    for (const [key, value] of Object.entries(players)) {
      str += `id:${players[key].id}   hp:${players[key].hp} (${players[key].x}:${players[key].y})` + '\n'
    }

    if (this.textInfo) {
      this.textInfo.setText("info socket:" + "\n" + str)

    } else {
      this.textInfo = this.add.text(500, 500, "info socket:" + "\n" + str, { fontFamily: 'JungleAdventurer', fontSize: 64, color: '#ffffff' }).setOrigin(0.5);
    }
  }

  checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.y + rect1.h > rect2.y;
  }

  getCollisionAttack() {
    // 1. Собираем массив врагов (все кроме себя)
    let otherPlayers = utils.parsePlayersToArray(unit_manager.info.players)
        .filter(el => el.id !== unit_manager.my_id);

    // 2. Определяем хитбокс атаки в мировых координатах
    let attackRect = {
      x: //this.character.x +
          this.character.attackHitbox.x,
      y: //this.character.y +
          this.character.attackHitbox.y,
      w: this.character.attackHitbox.width, // ширина зоны удара
      h: this.character.attackHitbox.height  // высота зоны удара
    };

    otherPlayers.forEach(player => {
      // Предположим, что у каждого игрока в объекте есть хитбокс с x, y, w, h
      // Важно: x и y врага тоже должны быть мировыми координатами!
      let enemyHitbox = {
        x: player.obj.hitbox.x,
        y: player.obj.hitbox.y,
        w: player.obj.hitbox.width,
        h: player.obj.hitbox.height
      };

      if (this.checkCollision(attackRect, enemyHitbox)) {
        console.log("Попал по игроку:", player.id);

        if (typeof player.hp !== 'number') {
          player.hp = 100;
        }

        player.hp = Math.max(0, player.hp - 10);
        if (player.obj?.setHp) {
          player.obj.setHp(player.hp);
        }

        // 3. Сообщаем серверу, что мы нанесли урон
        unit_manager.socket.emit('playerHit', {
          targetId: player.id,
          damage: 10
        });
      }
    });
  }

  drawBackground(width, height) {
    const s = WORLD_SCALE;

    this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x132238, 1);
    this.add.ellipse(260 * s, 180 * s, 260 * s, 260 * s, 0xf3d17a, 0.16);
    this.add.ellipse(width - 220 * s, 160 * s, 320 * s, 220 * s, 0x8ec5ff, 0.09);

    const graphics = this.add.graphics();

    graphics.fillStyle(0x1a2d46, 1);
    graphics.beginPath();
    graphics.moveTo(0, height * 0.62);
    graphics.lineTo(220 * s, height * 0.48);
    graphics.lineTo(520 * s, height * 0.58);
    graphics.lineTo(760 * s, height * 0.43);
    graphics.lineTo(1030 * s, height * 0.56);
    graphics.lineTo(1340 * s, height * 0.39);
    graphics.lineTo(1660 * s, height * 0.53);
    graphics.lineTo(width, height * 0.45);
    graphics.lineTo(width, height);
    graphics.lineTo(0, height);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(0x203753, 0.95);
    graphics.beginPath();
    graphics.moveTo(0, height * 0.72);
    graphics.lineTo(340 * s, height * 0.61);
    graphics.lineTo(670 * s, height * 0.68);
    graphics.lineTo(990 * s, height * 0.58);
    graphics.lineTo(1320 * s, height * 0.71);
    graphics.lineTo(1650 * s, height * 0.63);
    graphics.lineTo(width, height * 0.7);
    graphics.lineTo(width, height);
    graphics.lineTo(0, height);
    graphics.closePath();
    graphics.fillPath();
  }

  drawMap(width, height) {
    const s = WORLD_SCALE;
    const graphics = this.add.graphics();

    const soil = 0x59412f;
    const grass = 0x7cb342;
    const rock = 0x7f8c8d;

    this.drawPlatform(graphics, 0, height - 170 * s, width, 170 * s, soil, grass);
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

    const playerSpawn = this.add.circle(220 * s, 650 * s, 22 * s, 0xff7043, 0.4)
      .setStrokeStyle(5 * s, 0xffcc80, 0.9);

    this.add.text(playerSpawn.x + 40 * s, playerSpawn.y - 6 * s, 'Spawn', {
      fontFamily: 'JungleAdventurer',
      fontSize: `${20 * s}px`,
      color: '#fff3e0'
    });
  }

  createCollisionMap(width, height) {
    const s = WORLD_SCALE;

    this.platforms = this.physics.add.staticGroup();

    this.addPlatformBody(width * 0.5, height - 85 * s, width, 170 * s, { type: Platform.TYPES.SOLID });
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
  }

  addPlatformBody(x, y, width, height, options = {}) {
    const platform = new Platform(this, x, y, width, height, options);
    this.platforms.add(platform.getPhysicsTarget());
    return platform;
  }

  createCharacter() {
    const playerState = unit_manager.info.players[unit_manager.my_id] || {
      id: unit_manager.my_id
    };
    this.character = new Character(this, playerState.x, playerState.y, {
      showStats: true,
      nickname: playerState.username || 'Player'
    });
    playerState.obj = this.character;
    playerState.hp = this.character.getHp();
    unit_manager.info.players[unit_manager.my_id] = playerState;

    this.mobileUI = new MobileUI(this, this.character.controller);
    this.character.setDepth(2);
    this.physics.add.collider(
      this.character.getPhysicsTarget(),
      this.platforms,
      undefined,
      (_characterBody, platform) => this.character.shouldCollideWithPlatform(platform)
    );

    this.character.events.on('attack', () => {
      this.getCollisionAttack();
    })
  }

  createEnemiesBot() {
    this.enemiesBot = ENEMY_SPAWNS.map((spawn) => {
      const enemyState = unit_manager.info.enemies[spawn.id];
      const enemy = new Enemy(this, spawn.x, spawn.y, { id: spawn.id });

      if (typeof enemyState?.hp === 'number') {
        enemy.setHp(enemyState.hp);
      }

      unit_manager.info.enemies[spawn.id] = {
        id: spawn.id,
        hp: typeof enemyState?.hp === 'number' ? enemyState.hp : enemy.getHp(),
        obj: enemy
      };

      return enemy;
    });

    this.enemiesBot.forEach((enemy) => {
      enemy.setDepth(2);
      this.physics.add.collider(enemy.getPhysicsTarget(), this.platforms);
    });
  }

  updateEnemiesBot(time, delta) {
    if (!this.enemiesBot?.length) {
      return;
    }

    const attackId = this.character.getAttackId();
    const isPlayerAttacking = this.character.isAttacking();
    const playerAttackBounds = isPlayerAttacking ? this.character.getAttackHitbox().getBounds() : null;

    this.enemiesBot.forEach((enemy) => {
      const enemyState = unit_manager.info.enemies[enemy.id];
      if (typeof enemyState?.hp === 'number' && enemyState.hp !== enemy.getHp()) {
        enemy.setHp(enemyState.hp);
      }

      enemy.update(time, delta, this.character);

      if (enemy.isDead()) {
        return;
      }

      if (!isPlayerAttacking || attackId === 0) {
        return;
      }

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerAttackBounds, enemy.getPhysicsTarget().getBounds())) {
        const applied = enemy.takeDamage(this.character.getAttackDamage(), attackId);
        if (applied) {
          unit_manager.info.enemies[enemy.id] = {
            id: enemy.id,
            hp: enemy.getHp()
          };
          unit_manager.socket.emit('enemyHit', {
            enemyId: enemy.id,
            damage: this.character.getAttackDamage()
          });
        }
      }
    });

    // Фильтрация и очистка
    for (let i = this.enemiesBot.length - 1; i >= 0; i--) {
        if (this.enemiesBot[i].isDead()) {
            const enemy = this.enemiesBot[i];
            delete unit_manager.info.enemies[enemy.id]; // Очищаем ссылку в менеджере!
            enemy.destroy();
            this.enemiesBot.splice(i, 1);
        }
    }
  }

  handleCharacterDeath() {
    if (!this.character || this.isReturningToMenu || !this.character.isDead()) {
      return;
    }

    this.isReturningToMenu = true;
    if (unit_manager.socket) {
      unit_manager.socket.emit('playerDied');
    }
    this.cameras.main.stopFollow();

    // Удаляем из глобального менеджера
    if (unit_manager.info.players[unit_manager.my_id]) {
        unit_manager.info.players[unit_manager.my_id].obj = null;
    }

    this.character.destroy();
    this.character = null;
    this.scene.start('MenuScene');
  }

  createEnemy() {
    let enemy = new Character(this, 220 * WORLD_SCALE, 650 * WORLD_SCALE, {
      showStats: true,
      nickname: 'Player'
    });
    enemy.setDepth(1);
    this.physics.add.collider(
        enemy.getPhysicsTarget(),
        this.platforms,
        undefined,
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

  createDebugZoomControls(viewWidth) {
    const zoomLabel = this.add.text(viewWidth - 210, 42, 'Zoom', {
      fontFamily: 'JungleAdventurer',
      fontSize: '20px',
      color: '#e2e8f0'
    }).setScrollFactor(0);

    const zoomOutButton = this.createDebugButton(viewWidth - 240, 86, '-', () => {
      const nextZoom = Phaser.Math.Clamp(this.cameras.main.zoom - 0.1, 0.4, 2.5);
      this.cameras.main.setZoom(nextZoom);
    });

    const zoomInButton = this.createDebugButton(viewWidth - 120, 86, '+', () => {
      const nextZoom = Phaser.Math.Clamp(this.cameras.main.zoom + 0.1, 0.4, 2.5);
      this.cameras.main.setZoom(nextZoom);
    });

    zoomLabel.setDepth(10);
    zoomOutButton.label.setDepth(11);
    zoomInButton.label.setDepth(11);
  }

  createDebugButton(x, y, label, onClick) {
    const button = this.add.rectangle(x, y, 88, 52, 0x334155, 0.95)
      .setStrokeStyle(2, 0x94a3b8, 0.7)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);

    const text = this.add.text(x, y, label, {
      fontFamily: 'JungleAdventurer',
      fontSize: '28px',
      color: '#f8fafc'
    }).setOrigin(0.5).setScrollFactor(0);

    button
      .on('pointerover', () => button.setFillStyle(0x475569, 0.98))
      .on('pointerout', () => button.setFillStyle(0x334155, 0.95))
      .on('pointerdown', onClick);

    return { button, label: text };
  }

  drawPlatform(graphics, x, y, width, height, soilColor, grassColor) {
    const s = WORLD_SCALE;

    graphics.fillStyle(soilColor, 1);
    graphics.fillRoundedRect(x, y, width, height, 18 * s);

    graphics.fillStyle(grassColor, 1);
    graphics.fillRoundedRect(x, y - 10 * s, width, 24 * s, 12 * s);

    graphics.fillStyle(0x000000, 0.08);
    graphics.fillRoundedRect(x + 14 * s, y + 18 * s, width - 28 * s, height - 30 * s, 14 * s);
  }

  createBlackHole(position = {x: 550 * WORLD_SCALE, y: 450 * WORLD_SCALE}){
    this.animHole = this.add.spine(position.x, position.y, 'blackhole_spine_SPO', 'idle', true);
    this.animHole.setScale(0.5);

    this.blackHoleZone = this.add.zone(
      this.animHole.x - 35 * WORLD_SCALE,
      this.animHole.y - 15 * WORLD_SCALE,
      80 * WORLD_SCALE,
      50 * WORLD_SCALE
    );

    this.physics.add.existing(this.blackHoleZone);

    this.blackHoleZone.body.setAllowGravity(false);
    this.blackHoleZone.body.setImmovable(true);

    this.physics.add.collider(
      this.character.getPhysicsTarget(),
      this.platforms
    );

    this.physics.add.overlap(
      this.character.getPhysicsTarget(),
      this.blackHoleZone,
      this.onBlackHoleTouch,
      null,
      this
    );
  }

  onBlackHoleTouch(characterBody, holeZone) {
    if (this.isBlackHoleTriggered) return;
    this.isBlackHoleTriggered = true;
    console.log('Персонаж коснулся черной дыры');

    const target = this.character.getPhysicsTarget();

    const x = Phaser.Math.Between(100, this.worldWidth - 100);
    const y = Phaser.Math.Between(100, this.worldHeight - 600);

    // телепорт
    this.tweens.add({
      targets: this.character,
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      duration: 300
    });
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
}
