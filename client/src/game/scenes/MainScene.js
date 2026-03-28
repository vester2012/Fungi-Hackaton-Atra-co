import { Character } from '../entities/Character.js';
import { Owner } from '../entities/Owner.js';
import { CatStateSystem } from '../systems/CatStateSystem.js';
import { RageSystem } from '../systems/RageSystem.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { InteractableObject } from '../objects/InteractableObject.js';

const Phaser = window.Phaser;

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    const { width, height } = this.scale;

    this.room = {
      x: 80,
      y: 80,
      width: width - 160,
      height: height - 160
    };

    this.cameras.main.setBackgroundColor('#1b1f2a');
    this.physics.world.setBounds(0, 0, width, height);

    this.solids = this.physics.add.staticGroup();
    this.interactables = [];

    this.catState = new CatStateSystem(this);
    this.rageSystem = new RageSystem(this, 100);

    this.drawLayout();
    this.createWalls();
    this.createObjects();
    this.createCharacter();
    this.createOwner();
    this.createUI();

    this.interactionSystem = new InteractionSystem(this, this.catState, this.rageSystem);

    this.physics.add.collider(this.character, this.solids);
    this.physics.add.collider(this.owner, this.solids);

    this.physics.add.overlap(this.owner, this.character, () => {
      if (this.catchCooldown) return;
      if (this.catState.isHidden()) return;
      this.onCatCaught();
    });
  }

  update() {
    this.character.update();
    this.owner.update(this.time.now, this.game.loop.delta);
    this.catState.update();
    this.interactionSystem.update();

    if (this.rageSystem.isMaxed()) {
      this.showFloatingText(this.scale.width / 2, 100, 'ХОЗЯИН ДОВЕДЕН ДО ПИКА', '#fca5a5');
      this.scene.pause();
    }
  }

  drawLayout() {
    const g = this.add.graphics();

    g.fillStyle(0x1b1f2a, 1);
    g.fillRect(0, 0, this.scale.width, this.scale.height);

    g.fillStyle(0xd7c4a6, 1);
    g.fillRoundedRect(this.room.x, this.room.y, this.room.width, this.room.height, 10);

    g.fillStyle(0xcbb08a, 1);
    g.fillRoundedRect(this.room.x + 10, this.room.y + 10, this.room.width - 20, this.room.height - 20, 6);

    g.lineStyle(8, 0x6b4f3a, 1);
    g.strokeRoundedRect(this.room.x, this.room.y, this.room.width, this.room.height, 10);

    // перегородки
    g.lineStyle(6, 0x7a614b, 1);
    g.beginPath();
    g.moveTo(460, 80);
    g.lineTo(460, 640);
    g.moveTo(820, 80);
    g.lineTo(820, 640);
    g.moveTo(80, 360);
    g.lineTo(820, 360);
    g.strokePath();

    this.add.text(120, 110, 'ЗАЛ', { fontFamily: 'Arial', fontSize: '20px', color: '#374151' });
    this.add.text(520, 110, 'СПАЛЬНЯ', { fontFamily: 'Arial', fontSize: '20px', color: '#374151' });
    this.add.text(900, 110, 'КУХНЯ', { fontFamily: 'Arial', fontSize: '20px', color: '#374151' });
    this.add.text(120, 390, 'ТУАЛЕТ', { fontFamily: 'Arial', fontSize: '20px', color: '#374151' });
    this.add.text(520, 390, 'КАБИНЕТ', { fontFamily: 'Arial', fontSize: '20px', color: '#374151' });
  }

  createWalls() {
    const thickness = 24;
    const { x, y, width, height } = this.room;

    this.addWall(x + width / 2, y - thickness / 2, width, thickness);
    this.addWall(x + width / 2, y + height + thickness / 2, width, thickness);
    this.addWall(x - thickness / 2, y + height / 2, thickness, height);
    this.addWall(x + width + thickness / 2, y + height / 2, thickness, height);

    // внутренние стены кусками, чтобы были проходы
    this.addWall(460, 180, 24, 200);
    this.addWall(460, 520, 24, 200);

    this.addWall(820, 180, 24, 200);
    this.addWall(820, 520, 24, 200);

    this.addWall(240, 360, 320, 24);
    this.addWall(700, 360, 240, 24);
  }

  addWall(x, y, width, height) {
    const wall = this.add.rectangle(x, y, width, height, 0x000000, 0);
    this.physics.add.existing(wall, true);
    this.solids.add(wall);
  }

  createObjects() {
    // ЗАЛ
    this.addInteractable({
      id: 'sofa_1',
      type: 'sofa',
      displayName: 'Диван',
      room: 'living',
      x: 220,
      y: 220,
      width: 180,
      height: 80,
      color: 0x4b5563,
      actionIds: ['sofa_hide']
    });

    this.addInteractable({
      id: 'curtains_1',
      type: 'curtains',
      displayName: 'Шторы',
      room: 'living',
      x: 390,
      y: 150,
      width: 40,
      height: 120,
      color: 0x9ca3af,
      actionIds: ['curtains_hide', 'curtains_scratch']
    });

    this.addInteractable({
      id: 'vacuum_1',
      type: 'vacuum',
      displayName: 'Пылесос',
      room: 'living',
      x: 330,
      y: 290,
      width: 58,
      height: 58,
      color: 0x64748b,
      actionIds: ['vacuum_turn_on', 'vacuum_smear_vomit', 'vacuum_smear_poop']
    });

    // СПАЛЬНЯ
    this.addInteractable({
      id: 'bed_1',
      type: 'bed',
      displayName: 'Кровать',
      room: 'bedroom',
      x: 620,
      y: 210,
      width: 180,
      height: 100,
      color: 0x94a3b8,
      actionIds: ['bed_vomit_sleeping_owner', 'bed_meow_wake_owner']
    });

    this.addInteractable({
      id: 'wardrobe_1',
      type: 'wardrobe',
      displayName: 'Шкаф',
      room: 'bedroom',
      x: 750,
      y: 260,
      width: 90,
      height: 130,
      color: 0x8b5e3c,
      actionIds: ['wardrobe_hide']
    });

    // КУХНЯ
    this.addInteractable({
      id: 'plant_1',
      type: 'plant',
      displayName: 'Растение',
      room: 'kitchen',
      x: 960,
      y: 210,
      width: 52,
      height: 52,
      color: 0x22c55e,
      actionIds: ['plant_eat', 'plant_dig']
    });

    this.addInteractable({
      id: 'water_1',
      type: 'water',
      displayName: 'Вода',
      room: 'kitchen',
      x: 1090,
      y: 210,
      width: 70,
      height: 42,
      color: 0x38bdf8,
      actionIds: ['water_fill_mouth', 'water_drink_lots']
    });

    this.addInteractable({
      id: 'door_1',
      type: 'door',
      displayName: 'Дверь',
      room: 'kitchen',
      x: 840,
      y: 310,
      width: 24,
      height: 70,
      color: 0xf59e0b,
      actionIds: ['door_meow_open'],
      doorClosed: true,
      solid: false
    });

    // ТУАЛЕТ
    this.addInteractable({
      id: 'box_1',
      type: 'box',
      displayName: 'Коробка с вещами',
      room: 'bathroom',
      x: 220,
      y: 500,
      width: 90,
      height: 70,
      color: 0xb08968,
      actionIds: ['box_hide', 'box_pee', 'box_poop']
    });

    // КАБИНЕТ
    this.addInteractable({
      id: 'computer_1',
      type: 'computer',
      displayName: 'Комп',
      room: 'office',
      x: 610,
      y: 520,
      width: 130,
      height: 80,
      color: 0x1f2937,
      actionIds: ['computer_bite', 'computer_keyboard', 'computer_vomit', 'computer_water']
    });
  }

  addInteractable(config) {
    const obj = new InteractableObject(this, config);
    this.interactables.push(obj);

    this.add.text(obj.x, obj.y, obj.displayName, {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: config.labelColor || '#ffffff'
    }).setOrigin(0.5).setDepth(10);

    return obj;
  }

  createCharacter() {
    this.character = new Character(this, 180, 260);
  }

  createOwner() {
    this.owner = new Owner(this, 620, 210);
  }

  createUI() {
    this.add.rectangle(this.scale.width / 2, 28, this.scale.width, 56, 0x0f172a, 0.95);

    this.add.text(24, 14, 'ПРОГРЕСС ВЫБЕШИВАНИЯ', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#f8fafc'
    });

    this.barBg = this.add.rectangle(320, 28, 320, 22, 0x334155, 1).setOrigin(0, 0.5);
    this.barFill = this.add.rectangle(320, 28, 0, 22, 0xef4444, 1).setOrigin(0, 0.5);

    this.rageText = this.add.text(660, 14, '0 / 100', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#f8fafc'
    });

    this.hintText = this.add.text(24, this.scale.height - 120, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#e5e7eb',
      lineSpacing: 6
    });

    this.actionLabel = this.add.text(24, this.scale.height - 48, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#fde68a'
    });

    this.actionBarBg = this.add.rectangle(280, this.scale.height - 36, 260, 16, 0x334155, 1).setOrigin(0, 0.5);
    this.actionBarFill = this.add.rectangle(280, this.scale.height - 36, 0, 16, 0x22c55e, 1).setOrigin(0, 0.5);
  }

  setHintLines(lines) {
    this.hintText.setText(lines.join('\n'));
  }

  setActionProgress(progress, label) {
    this.actionBarFill.width = 260 * progress;
    this.actionLabel.setText(label || '');
  }

  updateRageUI(current, max) {
    this.barFill.width = 320 * (current / max);
    this.rageText.setText(`${current} / ${max}`);
  }

  showFloatingText(x, y, text, color = '#ffffff') {
    const label = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: label,
      y: y - 20,
      alpha: 0,
      duration: 700,
      ease: 'Power2',
      onComplete: () => label.destroy()
    });
  }

  onMeow(x, y) {
    this.showFloatingText(x, y - 28, 'МЯУ!', '#93c5fd');

    if (this.catState.isOwnerSleeping()) {
      this.catState.setOwnerSleeping(false);
      this.showFloatingText(this.owner.x, this.owner.y - 28, 'ПРОСНУЛСЯ', '#93c5fd');
    }

    this.owner.investigate(x, y);
  }

  onCatCaught() {
    this.catchCooldown = true;

    this.rageSystem.remove(10, 'ПОЙМАЛ', this.character.x, this.character.y);

    this.catState.setHidden(false);
    this.character.setAlpha(1);
    this.character.setPosition(180, 260);
    this.character.setVelocity(0, 0);

    this.showFloatingText(this.character.x, this.character.y - 30, 'ПОЙМАЛ!', '#f87171');

    this.time.delayedCall(1200, () => {
      this.catchCooldown = false;
    });
  }
}
