export const INTERACTIONS = {
    plant_eat: {
        id: 'plant_eat',
        label: 'Съесть растение',
        duration: 2000,
        rage: 0,
        noise: 8,
        oneShot: false,
        requires: [],
        blocks: [],
        effect: 'eat_plant'
    },

    plant_dig: {
        id: 'plant_dig',
        label: 'Раскопать землю',
        duration: 1800,
        rage: 10,
        noise: 10,
        oneShot: false,
        requires: [],
        blocks: [],
        effect: 'dirty_plant'
    },

    curtains_hide: {
        id: 'curtains_hide',
        label: 'Спрятаться в шторах',
        duration: 0,
        rage: 0,
        noise: 0,
        oneShot: false,
        requires: ['hide_enabled'],
        blocks: [],
        effect: 'toggle_hide'
    },

    curtains_scratch: {
        id: 'curtains_scratch',
        label: 'Подрать шторы',
        duration: 2500,
        rage: 18,
        noise: 15,
        oneShot: true,
        requires: [],
        blocks: [],
        effect: 'break_curtains'
    },

    vacuum_turn_on: {
        id: 'vacuum_turn_on',
        label: 'Включить пылесос',
        duration: 1200,
        rage: 12,
        noise: 22,
        oneShot: false,
        requires: [],
        blocks: [],
        effect: 'vacuum_on'
    },

    vacuum_smear_vomit: {
        id: 'vacuum_smear_vomit',
        label: 'Наблевать под пылесос и включить',
        duration: 2200,
        rage: 40,
        noise: 24,
        oneShot: false,
        requires: ['can_vomit'],
        blocks: [],
        effect: 'vacuum_smear_vomit'
    },

    vacuum_smear_poop: {
        id: 'vacuum_smear_poop',
        label: 'Насрать под пылесос и включить',
        duration: 2600,
        rage: 38,
        noise: 24,
        oneShot: false,
        requires: ['can_poop'],
        blocks: [],
        effect: 'vacuum_smear_poop'
    },

    computer_bite: {
        id: 'computer_bite',
        label: 'Укусить монитор',
        duration: 1200,
        rage: 14,
        noise: 8,
        oneShot: false,
        requires: [],
        blocks: [],
        effect: 'computer_bite'
    },

    computer_keyboard: {
        id: 'computer_keyboard',
        label: 'Напечатать на клаве',
        duration: 1700,
        rage: 20,
        noise: 12,
        oneShot: false,
        requires: [],
        blocks: [],
        effect: 'computer_keyboard'
    },

    computer_vomit: {
        id: 'computer_vomit',
        label: 'Наблевать на комп',
        duration: 1500,
        rage: 45,
        noise: 16,
        oneShot: false,
        requires: ['can_vomit'],
        blocks: [],
        effect: 'computer_vomit'
    },

    computer_water: {
        id: 'computer_water',
        label: 'Вылить воду на комп',
        duration: 1400,
        rage: 32,
        noise: 10,
        oneShot: false,
        requires: ['has_water_in_mouth'],
        blocks: [],
        effect: 'computer_water'
    },

    box_hide: {
        id: 'box_hide',
        label: 'Спрятаться в коробке',
        duration: 0,
        rage: 0,
        noise: 0,
        oneShot: false,
        requires: ['hide_enabled'],
        blocks: [],
        effect: 'toggle_hide'
    },

    box_pee: {
        id: 'box_pee',
        label: 'Нассать в коробку',
        duration: 2200,
        rage: 24,
        noise: 10,
        oneShot: true,
        requires: ['can_pee'],
        blocks: [],
        effect: 'box_pee'
    },

    box_poop: {
        id: 'box_poop',
        label: 'Насрать в коробку',
        duration: 2600,
        rage: 28,
        noise: 10,
        oneShot: true,
        requires: ['can_poop'],
        blocks: [],
        effect: 'box_poop'
    },

    water_fill_mouth: {
        id: 'water_fill_mouth',
        label: 'Набрать воды в рот',
        duration: 1300,
        rage: 0,
        noise: 4,
        oneShot: false,
        requires: [],
        blocks: ['has_water_in_mouth'],
        effect: 'fill_mouth_with_water'
    },

    water_drink_lots: {
        id: 'water_drink_lots',
        label: 'Много попить',
        duration: 2000,
        rage: 0,
        noise: 4,
        oneShot: false,
        requires: [],
        blocks: [],
        effect: 'drink_lots'
    },

    bed_vomit_sleeping_owner: {
        id: 'bed_vomit_sleeping_owner',
        label: 'Наблевать на кровать',
        duration: 1800,
        rage: 35,
        noise: 14,
        oneShot: false,
        requires: ['can_vomit'],
        blocks: [],
        effect: 'bed_vomit'
    },

    bed_meow_wake_owner: {
        id: 'bed_meow_wake_owner',
        label: 'Разбудить хозяина мяуканьем',
        duration: 1000,
        rage: 12,
        noise: 22,
        oneShot: false,
        requires: ['owner_sleeping'],
        blocks: [],
        effect: 'wake_owner'
    },

    sofa_hide: {
        id: 'sofa_hide',
        label: 'Спрятаться за диваном',
        duration: 0,
        rage: 0,
        noise: 0,
        oneShot: false,
        requires: ['hide_enabled'],
        blocks: [],
        effect: 'toggle_hide'
    },

    wardrobe_hide: {
        id: 'wardrobe_hide',
        label: 'Спрятаться в шкафу',
        duration: 0,
        rage: 0,
        noise: 0,
        oneShot: false,
        requires: ['hide_enabled'],
        blocks: [],
        effect: 'toggle_hide'
    },

    door_meow_open: {
        id: 'door_meow_open',
        label: 'Намяукать у двери',
        duration: 1200,
        rage: 6,
        noise: 18,
        oneShot: false,
        requires: ['door_closed'],
        blocks: [],
        effect: 'meow_for_door'
    }
};
