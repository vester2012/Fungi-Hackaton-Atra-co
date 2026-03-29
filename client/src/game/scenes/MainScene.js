import { Cat } from "../entities/Cat.js";
import { OwnerNavigator } from "../entities/OwnerNavigator.js";

import { CatState } from "../gameplay/CatState.js";
import { OwnerState } from "../gameplay/OwnerState.js";
import { RageMeter } from "../gameplay/RageMeter.js";
import { EvidenceSystem } from "../gameplay/EvidenceSystem.js";

import { INTERACTION_ZONES } from "../data/zones.js";
import { OWNER_NAV_DATA } from "../data/ownerNavData.js";
import { createZoneObject } from "../objects/createZoneObjects.js";

import { VacuumNavigator } from "../entities/VacuumNavigator.js";
import { VACUUM_ROUTE } from "../data/vacuumRouteData.js";

const Phaser = window.Phaser;

const COLLIDERS = [
  {
    id: "col_1774711841209_67167",
    type: "rect",
    x: 50.330578512396755,
    y: 57.93991416309014,
    width: 48.16810123109627,
    height: 1020.9012875536482,
  },
  {
    id: "col_1774711857031_56993",
    type: "rect",
    x: 50.98755186721992,
    y: 57.93991416309014,
    width: 158.75669558657108,
    height: 64.89270386266095,
  },
  {
    id: "col_1774711866602_15149",
    type: "rect",
    x: 212.06186344775557,
    y: 59.09871244635194,
    width: 91.5458317615994,
    height: 42.87553648068669,
  },
  {
    id: "col_1774711874874_31696",
    type: "rect",
    x: 304.76650320633723,
    y: 56.781115879828334,
    width: 246.8261033572237,
    height: 69.52789699570816,
  },
  {
    id: "col_1774711880781_34871",
    type: "rect",
    x: 552.7514145605433,
    y: 57.93991416309014,
    width: 88.06940777065256,
    height: 40.557939914163086,
  },
  {
    id: "col_1774711895261_79134",
    type: "rect",
    x: 640.8208223311958,
    y: 56.781115879828334,
    width: 1228.8485991564075,
    height: 67.21030042918456,
  },
  {
    id: "col_1774711902311_83637",
    type: "rect",
    x: 774.083741984157,
    y: 57.93991416309014,
    width: 32.44662391550355,
    height: 179.6137339055794,
  },
  {
    id: "col_1774711916682_32039",
    type: "rect",
    x: 771.7661259901924,
    y: 433.3905579399142,
    width: 30.129007921539028,
    height: 257.2532188841202,
  },
  {
    id: "col_1774711923905_25595",
    type: "rect",
    x: 692.967182195398,
    y: 662.8326180257511,
    width: 194.67974349302153,
    height: 31.287553648068638,
  },
  {
    id: "col_1774711936687_42414",
    type: "rect",
    x: 50.330578512396755,
    y: 657.0386266094421,
    width: 518.6441480058983,
    height: 35.92274678111596,
  },
  {
    id: "col_1774711969922_80838",
    type: "rect",
    x: 1253.8302527348171,
    y: 644.2918454935623,
    width: 30.129007921538914,
    height: 158.75536480686696,
  },
  {
    id: "col_1774711976583_12138",
    type: "rect",
    x: 1251.5126367408525,
    y: 902.7038626609443,
    width: 34.76423990946819,
    height: 176.1373390557941,
  },
  {
    id: "col_1774711991071_26563",
    type: "rect",
    x: 1179.6665409279517,
    y: 1045.236051502146,
    width: 687.1731422104867,
    height: 33.60515021459241,
  },
  {
    id: "col_1774712002758_29584",
    type: "rect",
    x: 1823.9637872500944,
    y: 57.93991416309014,
    width: 41.71708789136187,
    height: 1020.9012875536482,
  },
  {
    id: "col_1774712018153_97446",
    type: "rect",
    x: 1147.2199170124481,
    y: 418.32618025751077,
    width: 10.429271972840525,
    height: 38.24034334763951,
  },
  {
    id: "col_1774712021070_70183",
    type: "rect",
    x: 1207.4779328555262,
    y: 444.97854077253226,
    width: 10.429271972840525,
    height: 48.6695278969957,
  },
  {
    id: "col_1774712050773_79436",
    type: "rect",
    x: 264.20822331195774,
    y: 409.05579399141635,
    width: 11.58807996982273,
    height: 28.969957081545033,
  },
  {
    id: "col_1774712054493_39904",
    type: "rect",
    x: 393.9947189739721,
    y: 412.53218884120173,
    width: 10.42927197284041,
    height: 25.493562231759654,
  },
  {
    id: "col_1774712079096_57500",
    type: "rect",
    x: 190.04451150509243,
    y: 203.94849785407726,
    width: 256.09656733308185,
    height: 105.45064377682408,
  },
  {
    id: "col_1774712082335_1397",
    type: "rect",
    x: 416.01207091663525,
    y: 311.71673819742495,
    width: 28.970199924556766,
    height: 16.223175965665234,
  },
  {
    id: "col_1774712085452_98976",
    type: "rect",
    x: 190.04451150509243,
    y: 312.8755364806867,
    width: 33.60543191248584,
    height: 18.54077253218884,
  },
  {
    id: "col_1774712090642_48624",
    type: "rect",
    x: 221.33232742361375,
    y: 171.5021459227468,
    width: 193.52093549603924,
    height: 37.08154506437768,
  },
  {
    id: "col_1774712123917_19653",
    type: "rect",
    x: 584.0392304790645,
    y: 303.6051502145923,
    width: 10.429271972840525,
    height: 48.6695278969957,
  },
  {
    id: "col_1774712126555_82290",
    type: "rect",
    x: 599.103734439834,
    y: 309.39914163090134,
    width: 8.111655978875888,
    height: 10.429184549356194,
  },
  {
    id: "col_1774712128910_15466",
    type: "rect",
    x: 614.1682384006035,
    y: 322.14592274678114,
    width: 10.429271972840525,
    height: 9.27038626609442,
  },
  {
    id: "col_1774712167903_52907",
    type: "rect",
    x: 1115.9321010939268,
    y: 123.99141630901289,
    width: 753.7373203936766,
    height: 110.08583690987126,
  },
  {
    id: "col_1774712172246_96684",
    type: "rect",
    x: 1639.7133157299133,
    y: 237.55364806866956,
    width: 191.2033195020747,
    height: 38.24034334763948,
  },
  {
    id: "col_1774712200880_81189",
    type: "rect",
    x: 549.2749905695964,
    y: 326.78111587982835,
    width: 8.111655978875888,
    height: 8.111587982832646,
  },
  {
    id: "col_1774712210977_20041",
    type: "rect",
    x: 570.1335345152772,
    y: 311.71673819742495,
    width: 13.905695963787252,
    height: 10.429184549356194,
  },
  {
    id: "col_1774712223517_55869",
    type: "rect",
    x: 1461.2568841946436,
    y: 653.5622317596567,
    width: 324.46623915503574,
    height: 132.10300429184554,
  },
  {
    id: "col_1774712227247_16329",
    type: "rect",
    x: 1307.1354205960015,
    y: 651.2446351931331,
    width: 112.40437570728022,
    height: 88.06866952789699,
  },
  {
    id: "col_1774712230212_20002",
    type: "rect",
    x: 1340.7408525084875,
    y: 733.5193133047211,
    width: 48.669935873255326,
    height: 35.92274678111585,
  },
  {
    id: "col_1774712234369_33817",
    type: "rect",
    x: 1332.6291965296116,
    y: 872.5751072961374,
    width: 91.5458317615994,
    height: 171.50214592274676,
  },
  {
    id: "col_1774712237476_16147",
    type: "rect",
    x: 1475.1625801584307,
    y: 950.2145922746782,
    width: 133.26291965296127,
    height: 89.22746781115882,
  },
  {
    id: "col_1774712240516_79027",
    type: "rect",
    x: 1646.666163711807,
    y: 819.2703862660945,
    width: 212.0618634477555,
    height: 258.41201716738203,
  },
  {
    id: "col_1774712283863_87993",
    type: "rect",
    x: 1242.2421727649944,
    y: 473.9484978540773,
    width: 12.746887966804934,
    height: 39.39914163090128,
  },
  {
    id: "col_1774712287196_21702",
    type: "rect",
    x: 1353.4877404752924,
    y: 439.1845493562232,
    width: 13.905695963787139,
    height: 54.463519313304744,
  },
  {
    id: "col_1774712298139_63014",
    type: "rect",
    x: 1407.9517163334592,
    y: 413.69098712446356,
    width: 16.223311957751775,
    height: 44.03433476394849,
  },
  {
    id: "col_1774712319773_7080",
    type: "rect",
    x: 119.3572236891739,
    y: 738.1545064377683,
    width: 86.9105997736703,
    height: 92.7038626609442,
  },
  {
    id: "col_1774712322116_59005",
    type: "rect",
    x: 134.42172764994342,
    y: 704.549356223176,
    width: 56.78159185213127,
    height: 77.63948497854085,
  },
  {
    id: "col_1774712353271_21432",
    type: "rect",
    x: 99.65748774047529,
    y: 692.961373390558,
    width: 302.4488872123727,
    height: 16.223175965665178,
  },
  {
    id: "col_1774712471635_80020",
    type: "rect",
    x: 53.30516786118446,
    y: 1042.9184549356223,
    width: 734.6842700867597,
    height: 34.763948497854244,
  },
  {
    id: "col_1774712519838_44396",
    type: "rect",
    x: 1312.929460580913,
    y: 464.67811158798287,
    width: 9.270463975858092,
    height: 48.6695278969957,
  },
  {
    id: "col_1774712533853_60014",
    type: "rect",
    x: 1721.9886835156544,
    y: 418.32618025751077,
    width: 78.79894379479447,
    height: 33.6051502145923,
  },
  {
    id: "col_1774712536867_73750",
    type: "rect",
    x: 1733.5767634854772,
    y: 454.2489270386267,
    width: 60.258015843078056,
    height: 18.54077253218884,
  },
  {
    id: "col_1774712539961_96653",
    type: "rect",
    x: 1744.0060354583177,
    y: 470.4721030042919,
    width: 40.55827989437944,
    height: 13.90557939914163,
  },
  {
    id: "col_1774712618339_69197",
    type: "rect",
    x: 1039.450773293097,
    y: 655.8798283261804,
    width: 828.5477178423237,
    height: 9.27038626609442,
  },
  {
    id: "col_1774712624472_12058",
    type: "rect",
    x: 1039.450773293097,
    y: 657.0386266094421,
    width: 214.37947944172015,
    height: 28.96995708154509,
  },
  {
    id: "col_1774712642204_18272",
    type: "rect",
    x: 1040.6095812900792,
    y: 586.3519313304721,
    width: 829.0598401975242,
    height: 75.32188841201719,
  },
  {
    id: "col_1774712646912_88402",
    type: "rect",
    x: 692.967182195398,
    y: 590.9871244635193,
    width: 193.52093549603921,
    height: 93.86266094420603,
  },
  {
    id: "col_1774712651092_81682",
    type: "rect",
    x: 74.16371180686534,
    y: 587.5107296137339,
    width: 493.6522067144474,
    height: 77.63948497854085,
  },
  {
    id: "col_1774712684280_42383",
    type: "rect",
    x: 655.8853262919653,
    y: 170.343347639485,
    width: 54.463975858166805,
    height: 126.3090128755365,
  },
  {
    id: "col_1774712690123_81457",
    type: "rect",
    x: 644.2972463221427,
    y: 169.1845493562232,
    width: 16.223311957751775,
    height: 126.30901287553647,
  },
  {
    id: "col_1774712715837_57417",
    type: "rect",
    x: 521.4635986420219,
    y: 165.70815450643778,
    width: 15.064503960769457,
    height: 127.46781115879827,
  },
  {
    id: "col_1774712739624_71084",
    type: "rect",
    x: 521.4635986420219,
    y: 199.31330472103005,
    width: 186.56808751414565,
    height: 8.111587982832617,
  },
  {
    id: "col_1774712792185_83745",
    type: "rect",
    x: 223.64994341757827,
    y: 746.2660944206009,
    width: 17.382119954734065,
    height: 50.98712446351931,
  },
  {
    id: "col_1774712806017_19633",
    type: "rect",
    x: 220.17351942663146,
    y: 975.7081545064378,
    width: 264.2082233119578,
    height: 19.69957081545067,
  },
];

const EVIDENCE_ACTION_REGISTRY = {
  computer_bite: {
    type: "damage",
    label: "Надкусанный монитор",
  },
  computer_type: {
    type: "mess",
    label: "Хаос на клавиатуре",
  },
  computer_water: {
    type: "damage",
    label: "Залитый водой компьютер",
  },
  plant_dig: {
    type: "mess",
    label: "Разрытый цветок",
  },
  trash_dig: {
    type: "mess",
    label: "Разбуренная мусорка",
  },
  curtains_scratch: {
    type: "damage",
    label: "Подранные шторы",
  },
  shoes_pee: {
    type: "pee",
    label: "Моча в обуви",
  },
  litter_dig: {
    type: "mess",
    label: "Разбуренный лоток",
  },
};

export class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    this.load.image("apartment", "assets/apartment.png");
  }

  create() {
    const { width, height } = this.scale;

    this.debugMode = false;

    this.cameras.main.setBackgroundColor("#1e1e1e");

    this.bg = this.add.image(width / 2, height / 2, "apartment");

    const texture = this.textures.get("apartment").getSourceImage();
    const scale = Math.min(width / texture.width, height / texture.height);
    this.bg.setScale(scale);

    this.mapBounds = {
      x: this.bg.x - (texture.width * scale) / 2,
      y: this.bg.y - (texture.height * scale) / 2,
      width: texture.width * scale,
      height: texture.height * scale,
    };

    this.colliders = COLLIDERS;
    this.zoneObjects = INTERACTION_ZONES.map(createZoneObject);

    this.catState = new CatState();
    this.ownerState = new OwnerState();
    this.rageMeter = new RageMeter(100);
    this.evidenceSystem = new EvidenceSystem(this);

    this.score = 0;
    this.currentZone = null;
    this.currentActions = [];
    this.actionInProgress = null;
    this.lastStatusMessage = "";

    this.roundDurationMs = 60000;
    this.roundStartedAt = this.time.now;
    this.roundEndsAt = this.roundStartedAt + this.roundDurationMs;

    this.maxCatCaught = 3;
    this.catCaughtCount = 0;
    this.roundState = "playing";

    this.catCaughtUntil = 0;
    this.catHomeSpawn = {
      x: this.mapBounds.x + 260,
      y: this.mapBounds.y + 360,
    };

    this.poopPromptStarted = false;
    this.poopPromptAt = this.roundStartedAt + 25000;

    this.collisionGraphics = this.add.graphics();
    this.zoneGraphics = this.add.graphics();
    this.progressGraphics = this.add.graphics();

    this.redrawColliders();
    this.redrawZones();
    this.createZoneLabels();

    this.cat = new Cat(this, this.catHomeSpawn.x, this.catHomeSpawn.y);

    const ownerStart = OWNER_NAV_DATA.actionPoints?.[0] ||
      OWNER_NAV_DATA.navPoints?.[0] || {
        x: this.mapBounds.x + 300,
        y: this.mapBounds.y + 300,
      };

    this.owner = new OwnerNavigator(
      this,
      ownerStart.x,
      ownerStart.y,
      OWNER_NAV_DATA,
    );

    const vacuumStart = VACUUM_ROUTE?.[0] || {
      x: this.mapBounds.x + 500,
      y: this.mapBounds.y + 500,
    };

    this.vacuum = new VacuumNavigator(
      this,
      vacuumStart.x,
      vacuumStart.y,
      VACUUM_ROUTE || [],
    );

    this.keys = this.input.keyboard.addKeys({
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      action1: Phaser.Input.Keyboard.KeyCodes.ONE,
      action2: Phaser.Input.Keyboard.KeyCodes.TWO,
      action3: Phaser.Input.Keyboard.KeyCodes.THREE,
      action4: Phaser.Input.Keyboard.KeyCodes.FOUR,
      debug: Phaser.Input.Keyboard.KeyCodes.F3,
    });

    this.createPlayerHud();
    this.createDebugHud();

    this.updateHud();
  }

  update(_time, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.debug)) {
      this.debugMode = !this.debugMode;
      this.refreshDebugVisibility();
    }

    if (this.roundState !== "playing") {
      this.updateHud();
      return;
    }

    this.cat.update(delta);
    this.owner.update(this.time.now, delta);

    if (this.vacuum) {
      this.vacuum.update(delta);
    }

    this.updateVacuumDirtyTrailNotice();

    this.catState.update(this.time.now);
    this.evidenceSystem.update(this.time.now);

    if (this.catCaughtUntil > 0 && this.time.now >= this.catCaughtUntil) {
      this.catCaughtUntil = 0;
      this.catState.setBusy(false);
    }

    this.updatePoopPrompt();
    this.refreshHideState();
    this.resolveAutoNeeds();
    this.updateVacuumPoopInteraction();

    this.currentZone = this.getCurrentZone();
    this.currentActions = this.currentZone
      ? [
          ...this.currentZone.getAvailableActions(
            this.catState,
            this.ownerState,
          ),
        ]
      : [];

    const isInLitterBox = this.currentZone?.id === "litterbox";

    if (
      this.catState.poopPending &&
      this.catState.canPoop &&
      !this.catState.hasPooped &&
      !isInLitterBox
    ) {
      this.currentActions.push({
        id: "cat_poop",
        label: "Покакать",
        durationMs: 1200,
      });
    }

    this.handleActionInput();
    this.updateActionProgress();
    this.updateRoundState();
    this.updateHud();
  }

  updateVacuumDirtyTrailNotice() {
    if (!this.vacuum || !this.owner) return;
    if (!this.vacuum.isDirtyTrailActive) return;
    if (!this.vacuum.dirtyTrailPoints.length) return;

    const noticeRadius = this.owner.visionRadius || 140;

    for (const point of this.vacuum.dirtyTrailPoints) {
      const dist = Phaser.Math.Distance.Between(
        this.owner.x,
        this.owner.y,
        point.x,
        point.y,
      );

      if (dist > noticeRadius) continue;

      this.vacuum.clearDirtyTrail();

      this.rageMeter.add(35);
      this.ownerState.addAggression(1);
      this.setStatusMessage(
        "Хозяин заметил коричневый след от пылесоса!",
        true,
      );
      return;
    }
  }

  createPlayerHud() {
    const { width, height } = this.scale;

    this.uiLayer = this.add.layer().setDepth(1000);

    this.topShadow = this.add
      .rectangle(width / 2, 0, width, 120, 0x000000, 0.14)
      .setOrigin(0.5, 0);
    this.uiLayer.add(this.topShadow);

    this.rageTitle = this.add
      .text(width / 2, 14, "Выбешивание", {
        fontFamily: "Arial",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#fff4df",
        stroke: "#533b2b",
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0);
    this.uiLayer.add(this.rageTitle);

    this.rageBarShadow = this.add
      .rectangle(width / 2 + 4, 58 + 6, 340, 24, 0x000000, 0.18)
      .setOrigin(0.5);
    this.uiLayer.add(this.rageBarShadow);

    this.rageBarBg = this.add
      .rectangle(width / 2, 58, 340, 24, 0xf1dfbf, 1)
      .setStrokeStyle(4, 0x6f553f, 1)
      .setOrigin(0.5);
    this.uiLayer.add(this.rageBarBg);

    this.rageBarFill = this.add
      .rectangle(width / 2 - 170, 58, 0, 24, 0xd86b5f, 1)
      .setOrigin(0, 0.5);
    this.uiLayer.add(this.rageBarFill);

    this.rageBarGloss = this.add
      .rectangle(width / 2 - 170, 54, 0, 8, 0xffffff, 0.28)
      .setOrigin(0, 0.5);
    this.uiLayer.add(this.rageBarGloss);

    this.timerPanelShadow = this.add
      .rectangle(width / 2 + 2, 96 + 4, 180, 46, 0x000000, 0.18)
      .setOrigin(0.5);
    this.uiLayer.add(this.timerPanelShadow);

    this.timerPanel = this.add
      .rectangle(width / 2, 96, 180, 46, 0xe9d0a2, 1)
      .setStrokeStyle(4, 0x6f553f, 1)
      .setOrigin(0.5);
    this.uiLayer.add(this.timerPanel);

    this.timerText = this.add
      .text(width / 2, 96, "60", {
        fontFamily: "Arial",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#3a2b20",
      })
      .setOrigin(0.5);
    this.uiLayer.add(this.timerText);

    this.heartsContainer = this.add.container(width - 200, 38);
    this.hearts = [];

    for (let i = 0; i < 3; i++) {
      const heart = this.add
        .text(i * 54, 0, "❤️", {
          fontSize: "48px",
          color: "#ff6b6b", // яркий тёплый розово-красный
          shadow: {
            offsetX: 2,
            offsetY: 3,
            color: "#6b3f35",
            blur: 4,
            fill: true,
          },
        })
        .setOrigin(0.5);

      this.heartsContainer.add(heart);
      this.hearts.push(heart);
    }

    // === Состояние кота - нижняя панель ===
    this.bottomPanelShadow = this.add
      .rectangle(width / 2 + 8, height - 66, width - 140, 92, 0x000000, 0.18)
      .setOrigin(0.5);
    this.uiLayer.add(this.bottomPanelShadow);

    this.bottomPanel = this.add
      .rectangle(width / 2, height - 42, width - 140, 68, 0xf9f0d9, 0.97)
      .setStrokeStyle(6, 0x6b4a35, 1)
      .setOrigin(0.5);
    this.uiLayer.add(this.bottomPanel);

    // Ровное расположение виджетов в одну строку
    const startX = width * 0.5 - 490;
    const spacing = 245; // расстояние между карточками

    this.needWidgets = {
      vomit: this.createNeedWidget(
        startX,
        height - 42,
        "Тошнота",
        "🤢",
        0xffa36b,
      ),
      pee: this.createNeedWidget(
        startX + spacing,
        height - 42,
        "Пописать",
        "💧",
        0xffe36b,
      ),
      poop: this.createNeedWidget(
        startX + spacing * 2,
        height - 42,
        "Какать",
        "💩",
        0xc78f5e,
      ),
      water: this.createNeedWidget(
        startX + spacing * 3,
        height - 42,
        "Вода",
        "💦",
        0x7ed6ff,
      ),
    };

    Object.values(this.needWidgets).forEach((w) => {
      this.uiLayer.add(w.container);
    });

    this.statusBubbleShadow = this.add
      .rectangle(width / 2 + 4, height - 160 + 6, 420, 44, 0x000000, 0.18)
      .setOrigin(0.5);
    this.uiLayer.add(this.statusBubbleShadow);

    this.statusBubble = this.add
      .rectangle(width / 2, height - 160, 420, 44, 0xe9d0a2, 0.98)
      .setStrokeStyle(4, 0x6f553f, 1)
      .setOrigin(0.5);
    this.uiLayer.add(this.statusBubble);

    this.statusText = this.add
      .text(width / 2, height - 160, "Игра началась", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#3f2f22",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.uiLayer.add(this.statusText);

    this.actionMenuShadow = this.add
      .rectangle(0, 0, 340, 120, 0x000000, 0.18)
      .setOrigin(0, 0)
      .setVisible(false);
    this.uiLayer.add(this.actionMenuShadow);

    this.actionMenuBg = this.add
      .rectangle(0, 0, 340, 120, 0xf1dfbf, 0.98)
      .setOrigin(0, 0)
      .setStrokeStyle(4, 0x6f553f, 1)
      .setVisible(false);
    this.uiLayer.add(this.actionMenuBg);

    this.actionMenuText = this.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#3d2d22",
        lineSpacing: 8,
        fontStyle: "bold",
      })
      .setVisible(false);
    this.uiLayer.add(this.actionMenuText);

    this.endOverlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
      .setDepth(1500)
      .setVisible(false);

    this.endTitle = this.add
      .text(width / 2, height / 2 - 120, "", {
        fontFamily: "Arial",
        fontSize: "56px",
        fontStyle: "bold",
        color: "#fff6e8",
        stroke: "#4a3426",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(1501)
      .setVisible(false);

    this.endStatsBg = this.add
      .rectangle(width / 2, height / 2 + 30, 520, 230, 0xf1dfbf, 0.98)
      .setStrokeStyle(5, 0x6f553f, 1)
      .setDepth(1501)
      .setVisible(false);

    this.endStats = this.add
      .text(width / 2, height / 2 + 30, "", {
        fontFamily: "Arial",
        fontSize: "26px",
        color: "#3e2d21",
        align: "center",
        lineSpacing: 12,
      })
      .setOrigin(0.5)
      .setDepth(1502)
      .setVisible(false);
  }

  createDebugHud() {
    this.debugLayer = this.add.layer().setDepth(1600);

    this.scoreText = this.add.text(16, 16, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#111827",
      backgroundColor: "#ffffffdd",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    });

    this.stateText = this.add.text(16, 92, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#111827",
      backgroundColor: "#ffffffcc",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    });

    this.debugLayer.add([this.scoreText, this.stateText]);
    this.refreshDebugVisibility();
  }

  refreshDebugVisibility() {
    this.debugLayer.setVisible(this.debugMode);
    this.collisionGraphics.setVisible(this.debugMode);
    this.zoneGraphics.setVisible(this.debugMode);

    if (this.zoneLabels) {
      this.zoneLabels.forEach((label) => label.setVisible(this.debugMode));
    }
  }

  createClawMark(x, y) {
    const container = this.add.container(x, y);

    const slots = [];
    for (let i = 0; i < 4; i++) {
      const bg = this.add
        .ellipse(i * 8, 0, 10, 34, 0x5d4637, 0.28)
        .setAngle(-18);
      const fill = this.add
        .ellipse(i * 8, 10, 10, 0, 0xd86b5f, 1)
        .setAngle(-18);
      fill.setOrigin(0.5, 1);

      container.add(bg);
      container.add(fill);

      slots.push({ bg, fill });
    }

    return { container, slots };
  }

  createNeedWidget(x, y, label, emoji, accentColor) {
    const container = this.add.container(x, y);

    // Основная карточка (шире и ниже по высоте)
    const bgShadow = this.add
      .rectangle(4, 4, 228, 48, 0x000000, 0.18)
      .setOrigin(0.5);

    const bg = this.add
      .rectangle(0, 0, 224, 44, 0xf9f0d9, 1)
      .setOrigin(0.5)
      .setStrokeStyle(4, 0x6b4a35, 1);

    // Иконка
    const icon = this.add
      .text(-92, 0, emoji, {
        fontFamily: "Arial",
        fontSize: "32px",
      })
      .setOrigin(0.5);

    // Название (в одну строку)
    const title = this.add
      .text(-64, -10, label, {
        fontFamily: "Arial",
        fontSize: "17px",
        fontStyle: "bold",
        color: "#3f2a1f",
      })
      .setOrigin(0, 0.5);

    const barBg = this.add
      .rectangle(-64, 8, 148, 13, 0x5d4637, 0.25)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0x6b4a35, 0.5);

    const barFill = this.add
      .rectangle(-64, 8, 0, 13, accentColor, 1)
      .setOrigin(0, 0.5);

    const barGloss = this.add
      .rectangle(-64, 10, 0, 5, 0xffffff, 0.4)
      .setOrigin(0, 0.5);

    const infoText = this.add
      .text(68, -10, "", {
        fontFamily: "Arial",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#5d4637",
      })
      .setOrigin(0.5);

    container.add([
      bgShadow,
      bg,
      icon,
      title,
      barBg,
      barFill,
      barGloss,
      infoText,
    ]);

    return {
      container,
      barFill,
      barGloss,
      infoText,
      accentColor,
    };
  }

  updatePoopPrompt() {
    if (this.poopPromptStarted) return;
    if (this.roundState !== "playing") return;
    if (this.time.now < this.poopPromptAt) return;

    this.poopPromptStarted = true;
    this.catState.schedulePoop(this.time.now, 0, 15000);
    this.setStatusMessage("Кот захотел какать! Есть 15 секунд.", true);
  }

  setStatusMessage(text, punch = false) {
    this.lastStatusMessage = text;
    this.statusText.setText(text);

    if (punch) {
      this.tweens.killTweensOf([
        this.statusBubble,
        this.statusBubbleShadow,
        this.statusText,
      ]);

      this.tweens.add({
        targets: [this.statusBubble, this.statusBubbleShadow, this.statusText],
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 90,
        yoyo: true,
        ease: "Quad.easeOut",
      });
    }
  }

  refreshHideState() {
    const hidden = this.zoneObjects.some((zone) => {
      return zone.isHideZone() && zone.containsPoint(this.cat.x, this.cat.y);
    });

    this.catState.setHidden(hidden);
    this.cat.hide = hidden;
  }

  resolveAutoNeeds() {
    if (this.catState.shouldAutoVomit(this.time.now)) {
      const zone = this.getCurrentZoneForAuto();

      let points = this.catState.getFloorVomitPoints();
      let label = "Блевота на полу";
      let x = this.cat.x;
      let y = this.cat.y;
      let zoneId = "floor";

      if (zone && typeof zone.getAutoVomitPoints === "function") {
        const zonePoints = zone.getAutoVomitPoints();
        if (zonePoints !== null) {
          points = zonePoints;
          label = `Блевота: ${zone.label}`;
          x = zone.x;
          y = zone.y;
          zoneId = zone.id;
        }
      }

      this.catState.triggerAutoVomit();

      this.evidenceSystem.spawn({
        type: "vomit",
        zoneId,
        x,
        y,
        points,
        label,
      });

      this.setStatusMessage(`Кота вырвало: ${label}`, true);
    }

    if (this.catState.shouldAutoPee(this.time.now)) {
      this.catState.triggerAutoPee();

      this.evidenceSystem.spawn({
        type: "pee",
        zoneId: "floor",
        x: this.cat.x,
        y: this.cat.y,
        points: this.catState.getFloorPeePoints(),
        label: "Лужа на полу",
      });

      this.setStatusMessage("Кот не выдержал и написал на пол.", true);
    }

    if (this.catState.shouldAutoPoop(this.time.now)) {
      const ok = this.catState.triggerAutoPoop();

      if (ok) {
        this.evidenceSystem.spawn({
          type: "poop",
          zoneId: "floor",
          x: this.cat.x,
          y: this.cat.y,
          points: this.catState.getFloorPoopPoints(),
          label: "Какашка на полу",
          radius: 26,
        });

        this.setStatusMessage("Кот не выдержал и нагадил на пол.", true);
      }
    }
  }

  updateVacuumPoopInteraction() {
    if (!this.vacuum) return;

    const vacuumRect = this.vacuum.getBodyRect();
    const poopItems = this.evidenceSystem.findByType("poop");

    for (const poop of poopItems) {
      const poopRect = {
        x: poop.x - poop.radius,
        y: poop.y - poop.radius,
        width: poop.radius * 2,
        height: poop.radius * 2,
      };

      if (!this.rectVsRect(vacuumRect, poopRect)) continue;

      this.evidenceSystem.remove(poop.id);
      this.vacuum.activateDirtyTrail();
      this.setStatusMessage("Пылесос наехал на какашку!", true);
      return;
    }
  }

  handleActionInput() {
    if (this.roundState !== "playing") return;
    if (this.actionInProgress) return;
    if (this.catCaughtUntil > this.time.now) return;

    const hasGlobalPoopAction =
      this.catState.poopPending &&
      this.catState.canPoop &&
      !this.catState.hasPooped;

    if (!this.currentZone && !hasGlobalPoopAction) return;

    if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
      this.startActionByIndex(0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.action1))
      this.startActionByIndex(0);
    if (Phaser.Input.Keyboard.JustDown(this.keys.action2))
      this.startActionByIndex(1);
    if (Phaser.Input.Keyboard.JustDown(this.keys.action3))
      this.startActionByIndex(2);
    if (Phaser.Input.Keyboard.JustDown(this.keys.action4))
      this.startActionByIndex(3);
  }

  startActionByIndex(index) {
    const action = this.currentActions[index];
    if (!action) return;

    this.catState.setBusy(true);

    this.actionInProgress = {
      zone: this.currentZone,
      action,
      startedAt: this.time.now,
      endsAt: this.time.now + action.durationMs,
    };

    this.setStatusMessage(`Делает: ${action.label}`);
  }

  updateActionProgress() {
    this.progressGraphics.clear();

    if (!this.actionInProgress) return;

    const { zone, startedAt, endsAt } = this.actionInProgress;

    const progress = Phaser.Math.Clamp(
      (this.time.now - startedAt) / (endsAt - startedAt),
      0,
      1,
    );

    const anchorX = zone ? zone.x : this.cat.x;
    const anchorY = zone ? zone.y : this.cat.y;

    const x = Math.min(anchorX + 38, this.scale.width - 220);
    const y = Math.max(anchorY - 48, 54);

    this.progressGraphics.fillStyle(0x4d3a2d, 0.24);
    this.progressGraphics.fillRoundedRect(x + 4, y + 6, 180, 18, 8);

    this.progressGraphics.fillStyle(0xf1dfbf, 0.98);
    this.progressGraphics.fillRoundedRect(x, y, 180, 18, 8);

    this.progressGraphics.fillStyle(0x74c476, 1);
    this.progressGraphics.fillRoundedRect(x, y, 180 * progress, 18, 8);

    this.progressGraphics.lineStyle(3, 0x6f553f, 1);
    this.progressGraphics.strokeRoundedRect(x, y, 180, 18, 8);

    if (this.time.now >= endsAt) {
      this.completeAction();
    }
  }

  completeAction() {
    if (!this.actionInProgress) return;

    const { zone, action } = this.actionInProgress;

    if (action.id === "cat_poop") {
      const used = this.catState.consumePoop();

      if (used) {
        this.evidenceSystem.spawn({
          type: "poop",
          zoneId: "floor",
          x: this.cat.x,
          y: this.cat.y,
          points: this.catState.getFloorPoopPoints(),
          label: "Какашка на полу",
          radius: 26,
        });

        this.setStatusMessage("Кот нагадил на пол.", true);
      } else {
        this.setStatusMessage("Уже поздно какать.");
      }

      this.actionInProgress = null;
      this.catState.setBusy(false);
      return;
    }

    if (!zone) {
      this.setStatusMessage("Нет подходящей зоны для действия.");
      this.actionInProgress = null;
      this.catState.setBusy(false);
      return;
    }

    const result = zone.applyAction(action.id, this.catState, this.ownerState, {
      now: this.time.now,
    });

    if (result.ok) {
      const evidenceMeta = EVIDENCE_ACTION_REGISTRY[action.id];

      if (evidenceMeta) {
        this.evidenceSystem.spawn({
          type: evidenceMeta.type,
          zoneId: zone.id,
          x: zone.x,
          y: zone.y,
          points: result.points,
          label: evidenceMeta.label,
        });

        this.setStatusMessage(result.message, true);
      } else {
        this.score += result.points;
        this.setStatusMessage(
          result.points > 0
            ? `${result.message} (+${result.points})`
            : result.message,
          result.points > 0,
        );
      }
    } else {
      this.setStatusMessage(result.message || "Не получилось");
    }

    this.actionInProgress = null;
    this.catState.setBusy(false);
  }

  getCurrentZone() {
    let nearest = null;
    let nearestDist = Infinity;

    for (const zone of this.zoneObjects) {
      if (!zone.containsPoint(this.cat.x, this.cat.y)) continue;

      const dist = Phaser.Math.Distance.Between(
        this.cat.x,
        this.cat.y,
        zone.x,
        zone.y,
      );

      if (dist < nearestDist) {
        nearest = zone;
        nearestDist = dist;
      }
    }

    return nearest;
  }

  getCurrentZoneForAuto() {
    return this.getCurrentZone();
  }

  updateRoundState() {
    if (this.roundState !== "playing") return;

    if (this.rageMeter.isMaxed()) {
      this.roundState = "win";
      this.showEndScreen(true);
      return;
    }

    if (this.catCaughtCount >= this.maxCatCaught) {
      this.roundState = "lose";
      this.showEndScreen(false, "Хозяин слишком часто ловил кота");
      return;
    }

    if (this.time.now >= this.roundEndsAt) {
      this.roundState = "lose";
      this.showEndScreen(false, "Время вышло");
    }
  }

  showEndScreen(isWin, loseReason = "") {
    this.endOverlay.setVisible(true);
    this.endTitle.setVisible(true);
    this.endStatsBg.setVisible(true);
    this.endStats.setVisible(true);

    this.endTitle.setText(isWin ? "ПОБЕДА" : "ПОРАЖЕНИЕ");

    const timeSpentSec = Math.floor(
      (this.time.now - this.roundStartedAt) / 1000,
    );

    this.endStats.setText(
      [
        isWin ? "Хозяин доведен до пика." : loseReason,
        `Выбешивание: ${this.rageMeter.current}/${this.rageMeter.max}`,
        `Очки: ${this.score}`,
        `Поимки кота: ${this.catCaughtCount}/${this.maxCatCaught}`,
        `Время: ${timeSpentSec} сек`,
      ].join("\n"),
    );
  }

  onCatCaught() {
    if (this.catCaughtUntil > this.time.now) return;
    if (this.roundState !== "playing") return;

    this.catCaughtUntil = this.time.now + 1400;
    this.catCaughtCount += 1;
    this.catState.setBusy(true);

    if (this.actionInProgress) {
      this.actionInProgress = null;
      this.progressGraphics.clear();
    }

    this.cat.x = this.catHomeSpawn.x;
    this.cat.y = this.catHomeSpawn.y;

    this.setStatusMessage(
      `Хозяин поймал кота! (${this.catCaughtCount}/${this.maxCatCaught})`,
      true,
    );
  }

  onCatMeow(x, y, now) {
    this.owner?.hearMeow(x, y, now);
  }

  updateHud() {
    this.updatePlayerHud();
    if (this.debugMode) {
      this.updateDebugHud();
    }
  }

  updatePlayerHud() {
    const now = this.time.now;

    const rageProgress = this.rageMeter.getProgress();
    this.updateRageBar(rageProgress);

    const timeLeftMs = Math.max(0, this.roundEndsAt - now);
    const timeLeftSec = Math.ceil(timeLeftMs / 1000);
    this.timerText.setText(`${timeLeftSec}с`);

    if (timeLeftSec <= 10 && this.roundState === "playing") {
      if (!this.timerPulseTween || !this.timerPulseTween.isPlaying()) {
        this.timerPulseTween = this.tweens.add({
          targets: [this.timerPanel, this.timerText],
          scaleX: 1.08,
          scaleY: 1.08,
          duration: 120,
          yoyo: true,
          repeat: 1,
          ease: "Quad.easeOut",
        });
      }
    }

    this.updateHearts();

    const vomitState = this.getVomitUiState(now);
    const peeState = this.getPeeUiState(now);
    const poopState = this.getPoopUiState(now);
    const waterState = this.getWaterUiState();

    this.updateNeedWidget(this.needWidgets.vomit, vomitState);
    this.updateNeedWidget(this.needWidgets.pee, peeState);
    this.updateNeedWidget(this.needWidgets.poop, poopState);
    this.updateNeedWidget(this.needWidgets.water, waterState);

    this.updateActionMenu();
  }

  updateDebugHud() {
    const now = this.time.now;

    const vomitText = this.catState.vomitPending
      ? `авто-рвота через ${(this.catState.getVomitTimeLeft(now) / 1000).toFixed(1)}с`
      : "нет рвоты";

    let peeText = "не хочет писать";
    if (this.catState.peePending && !this.catState.canPee) {
      peeText = `попис через ${(this.catState.getPeeUnlockTimeLeft(now) / 1000).toFixed(1)}с`;
    } else if (this.catState.peePending && this.catState.canPee) {
      peeText = `может писать еще ${(this.catState.getPeeDeadlineTimeLeft(now) / 1000).toFixed(1)}с`;
    }

    let poopText = "used";
    if (!this.poopPromptStarted) {
      poopText = "нет";
    } else if (this.catState.poopPending && !this.catState.canPoop) {
      poopText = `через ${(this.catState.getPoopUnlockTimeLeft(now) / 1000).toFixed(1)}с`;
    } else if (this.catState.poopPending && this.catState.canPoop) {
      poopText = `${(this.catState.getPoopDeadlineTimeLeft(now) / 1000).toFixed(1)}с`;
    }

    this.scoreText.setText(
      `Очки: ${this.score}\nВыбешивание: ${this.rageMeter.current}/${this.rageMeter.max}`,
    );

    this.stateText.setText(
      [
        `hide: ${this.catState.hide ? "true" : "false"}`,
        `waterInMouth: ${this.catState.hasWaterInMouth ? "true" : "false"}`,
        `vomit: ${vomitText}`,
        `pee: ${peeText}`,
        `poop: ${poopText}`,
        `owner: ${this.owner.state}`,
        `ownerAction: ${this.owner.currentActionType || "none"}`,
        `ownerAggro: ${this.ownerState.getAggressionLevel(this.rageMeter)}`,
        `ownerSleeping: ${this.ownerState.isSleeping ? "true" : "false"}`,
        `ownerWorking: ${this.ownerState.isWorking ? "true" : "false"}`,
        `meowChain: ${this.owner.meowChainCount}/${this.owner.meowChainThreshold}`,
        `caught: ${this.catCaughtCount}/${this.maxCatCaught}`,
      ].join("\n"),
    );
  }

  updateRageBar(progress) {
    const clamped = Phaser.Math.Clamp(progress, 0, 1);
    const maxWidth = 340;

    this.rageBarFill.width = maxWidth * clamped;
    this.rageBarGloss.width = maxWidth * clamped * 0.72;

    if (clamped >= 0.85 && this.roundState === "playing") {
      if (!this.rageBarPulseTween || !this.rageBarPulseTween.isPlaying()) {
        this.rageBarPulseTween = this.tweens.add({
          targets: [this.rageBarBg, this.rageBarFill],
          scaleY: 1.08,
          duration: 180,
          yoyo: true,
          repeat: 1,
          ease: "Sine.easeInOut",
        });
      }
    }
  }

  updateHearts() {
    const remainingLives = Math.max(0, 3 - this.catCaughtCount);

    this.hearts.forEach((heart, index) => {
      if (index < remainingLives) {
        heart.setText("❤️");
        heart.setColor("#ff6b6b"); // яркий цвет когда живое
        heart.setScale(1);
      } else {
        heart.setText("♡"); // пустое сердце (outline)
        heart.setColor("#8c6f5a"); // приглушённый бежевый
        heart.setScale(0.95);
      }
    });
  }

  getVomitUiState(now) {
    if (!this.catState.vomitPending) {
      return { progress: 0, text: "спокойно", active: false };
    }

    const left = this.catState.getVomitTimeLeft(now);
    const total = 10000;
    const progress = Phaser.Math.Clamp(1 - left / total, 0, 1);

    return {
      progress,
      text: `${(left / 1000).toFixed(1)}с`,
      active: true,
    };
  }

  getPeeUiState(now) {
    if (!this.catState.peePending) {
      return { progress: 0, text: "нет", active: false };
    }

    if (!this.catState.canPee) {
      const left = this.catState.getPeeUnlockTimeLeft(now);
      const total = 20000;
      const progress = Phaser.Math.Clamp(1 - left / total, 0, 1);

      return {
        progress,
        text: `через ${(left / 1000).toFixed(1)}с`,
        active: true,
      };
    }

    const left = this.catState.getPeeDeadlineTimeLeft(now);
    const total = 20000;
    const progress = Phaser.Math.Clamp(left / total, 0, 1);

    return {
      progress,
      text: `${(left / 1000).toFixed(1)}с`,
      active: true,
    };
  }

  getPoopUiState(now) {
    if (!this.poopPromptStarted) {
      return { progress: 0, text: "нет", active: false };
    }

    if (this.catState.hasPooped) {
      return { progress: 1, text: "done", active: false };
    }

    if (this.catState.poopPending && !this.catState.canPoop) {
      const left = this.catState.getPoopUnlockTimeLeft(now);
      return {
        progress: 0.15,
        text: `через ${(left / 1000).toFixed(1)}с`,
        active: true,
      };
    }

    if (this.catState.poopPending && this.catState.canPoop) {
      const left = this.catState.getPoopDeadlineTimeLeft(now);
      const total = 15000;
      const progress = Phaser.Math.Clamp(left / total, 0, 1);

      return {
        progress,
        text: `${(left / 1000).toFixed(1)}с`,
        active: true,
      };
    }

    return { progress: 0, text: "used", active: false };
  }

  getWaterUiState() {
    if (!this.catState.hasWaterInMouth) {
      return { progress: 0, text: "пусто", active: false };
    }

    return { progress: 1, text: "во рту", active: true };
  }

  updateNeedWidget(widget, state) {
    const maxBarWidth = 148;

    widget.barFill.width =
      maxBarWidth * Phaser.Math.Clamp(state.progress, 0, 1);

    widget.barGloss.width =
      maxBarWidth * Phaser.Math.Clamp(state.progress * 0.72, 0, 1);

    widget.infoText.setText(state.text);

    widget.container.alpha = state.active ? 1.0 : 0.72;

    if (state.active && state.progress > 0.82) {
      if (!widget.pulseTween || !widget.pulseTween.isPlaying()) {
        widget.pulseTween = this.tweens.add({
          targets: widget.icon,
          scaleX: 1.25,
          scaleY: 1.25,
          duration: 260,
          yoyo: true,
          repeat: 1,
          ease: "Sine.easeInOut",
        });
      }
    } else if (widget.pulseTween && widget.pulseTween.isPlaying()) {
      widget.pulseTween.stop();
      widget.icon.setScale(1);
    }
  }

  updateActionMenu() {
    if (this.currentActions.length === 0) {
      this.actionMenuBg.setVisible(false);
      this.actionMenuShadow.setVisible(false);
      this.actionMenuText.setVisible(false);
      return;
    }

    const anchorX = this.currentZone ? this.currentZone.x : this.cat.x;
    const anchorY = this.currentZone ? this.currentZone.y : this.cat.y;

    const lines = this.currentActions.map(
      (action, i) =>
        `[${i + 1}] ${action.label}  ${(action.durationMs / 1000).toFixed(1)}с`,
    );

    const title = this.currentZone ? this.currentZone.label : "Кот";
    const text = `${title}\n\n${lines.join("\n")}`;

    const menuX = Math.min(anchorX + 54, this.scale.width - 360);
    const menuY = Math.max(anchorY - 30, 90);

    const menuHeight = 68 + lines.length * 28;

    this.actionMenuShadow.setPosition(menuX + 4, menuY + 6);
    this.actionMenuShadow.setSize(340, menuHeight);
    this.actionMenuShadow.setVisible(true);

    this.actionMenuBg.setPosition(menuX, menuY);
    this.actionMenuBg.setSize(340, menuHeight);
    this.actionMenuBg.setVisible(true);

    this.actionMenuText.setPosition(menuX + 14, menuY + 12);
    this.actionMenuText.setText(text);
    this.actionMenuText.setVisible(true);
  }

  redrawColliders() {
    this.collisionGraphics.clear();

    for (const c of this.colliders) {
      if (c.type === "rect") {
        this.collisionGraphics.fillStyle(0xef4444, 0.18);
        this.collisionGraphics.fillRect(c.x, c.y, c.width, c.height);
        this.collisionGraphics.lineStyle(1, 0xf87171, 0.8);
        this.collisionGraphics.strokeRect(c.x, c.y, c.width, c.height);
      }

      if (c.type === "circle") {
        this.collisionGraphics.fillStyle(0x3b82f6, 0.18);
        this.collisionGraphics.fillCircle(c.x, c.y, c.radius);
        this.collisionGraphics.lineStyle(1, 0x60a5fa, 0.8);
        this.collisionGraphics.strokeCircle(c.x, c.y, c.radius);
      }
    }

    this.collisionGraphics.setVisible(this.debugMode);
  }

  redrawZones() {
    this.zoneGraphics.clear();

    for (const zone of this.zoneObjects) {
      this.zoneGraphics.lineStyle(2, 0x22c55e, 0.8);
      this.zoneGraphics.fillStyle(0x22c55e, 0.12);

      if (zone.type === "circle") {
        this.zoneGraphics.fillCircle(zone.x, zone.y, zone.radius);
        this.zoneGraphics.strokeCircle(zone.x, zone.y, zone.radius);
      }

      if (zone.type === "ellipse") {
        this.zoneGraphics.fillEllipse(zone.x, zone.y, zone.width, zone.height);
        this.zoneGraphics.strokeEllipse(
          zone.x,
          zone.y,
          zone.width,
          zone.height,
        );
      }
    }

    this.zoneGraphics.setVisible(this.debugMode);
  }

  createZoneLabels() {
    this.zoneLabels = this.zoneObjects.map((zone) => {
      return this.add
        .text(zone.x, zone.y, zone.label, {
          fontFamily: "Arial",
          fontSize: "16px",
          color: "#166534",
          backgroundColor: "#dcfce7cc",
          padding: { left: 6, right: 6, top: 3, bottom: 3 },
        })
        .setOrigin(0.5)
        .setDepth(150);
    });

    this.zoneLabels.forEach((label) => label.setVisible(this.debugMode));
  }

  willCollideWithStatic(nextX, nextY, width, height) {
    const rect = {
      x: nextX - width / 2,
      y: nextY - height / 2,
      width,
      height,
    };

    for (const c of this.colliders) {
      if (c.type === "rect" && this.rectVsRect(rect, c)) return true;
      if (c.type === "circle" && this.rectVsCircle(rect, c)) return true;
    }

    return false;
  }

  willCollide(nextX, nextY, size) {
    const rect = {
      x: nextX - size / 2,
      y: nextY - size / 2,
      width: size,
      height: size,
    };

    for (const c of this.colliders) {
      if (c.type === "rect" && this.rectVsRect(rect, c)) return true;
      if (c.type === "circle" && this.rectVsCircle(rect, c)) return true;
    }

    if (this.vacuum) {
      const vacuumRect = this.vacuum.getBodyRect();
      if (this.rectVsRect(rect, vacuumRect)) return true;
    }

    return false;
  }

  rectVsRect(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  rectVsCircle(rect, circle) {
    const closestX = Phaser.Math.Clamp(circle.x, rect.x, rect.x + rect.width);
    const closestY = Phaser.Math.Clamp(circle.y, rect.y, rect.y + rect.height);

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    return dx * dx + dy * dy < circle.radius * circle.radius;
  }
}
