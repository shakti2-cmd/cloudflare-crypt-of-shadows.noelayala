(() => {
  'use strict';

  // =========================================================================
  // CONSTANTS & CONFIG
  // =========================================================================
  const VERSION = '0.4.0';
  const SAVE_SLOTS_KEY = 'crypt_arpg_v030_slots';
  const ACCOUNT_KEY = 'crypt_arpg_v030_account';
  const LEGACY_SAVE_KEY_V020 = 'crypt_arpg_v020_save';
  const LEGACY_SAVE_KEY_V010 = 'crypt_arpg_v010_save';
  const LEGACY_STASH_KEY = 'crypt_arpg_stash_v020';
  const PREFS_KEY = 'crypt_arpg_prefs_v020';
  let MAP_W = 44;
  let MAP_H = 44;
  const TILE_W = 64;
  const TILE_H = 32;
  const WALL_H = 52;
  const MAX_BAG_SLOTS = 12;
  const MAX_STASH_SLOTS = 30;
  const MAX_SAVE_SLOTS = 3;

  const TILE = {
    VOID: 0,
    FLOOR: 1,
    WALL: 2,
    SANCTUM: 3,
    BOSS_FLOOR: 4
  };

  const RARITY = {
    common:    { label: 'Common',    color: '#cbd5e1', beam: 'rgba(203, 213, 225, 0.25)', bg: 'rgba(15, 23, 42, 0.88)', rank: 1 },
    magic:     { label: 'Magic',     color: '#60a5fa', beam: 'rgba(96, 165, 250, 0.52)',  bg: 'rgba(15, 28, 56, 0.90)', rank: 2 },
    rare:      { label: 'Rare',      color: '#facc15', beam: 'rgba(250, 204, 21, 0.62)',  bg: 'rgba(42, 30, 8, 0.92)',  rank: 3 },
    set:       { label: 'Set',       color: '#10b981', beam: 'rgba(16, 185, 129, 0.72)',  bg: 'rgba(6, 48, 36, 0.94)',  rank: 4 },
    legendary: { label: 'Legendary', color: '#fb923c', beam: 'rgba(251, 146, 60, 0.78)',  bg: 'rgba(54, 21, 8, 0.94)',  rank: 5 }
  };

  const SLOTS = ['weapon', 'offhand', 'helm', 'armor', 'boots', 'ring'];
  const SLOT_LABELS = {
    weapon: 'Weapon', offhand: 'Off-Hand', helm: 'Helm',
    armor: 'Armor', boots: 'Boots', ring: 'Ring'
  };
  const LOOT_FILTER_MODES = ['all', 'magic', 'rare'];
  const LOOT_FILTER_LABELS = { all: 'Loot: All', magic: 'Loot: Magic+', rare: 'Loot: Rare+' };

  const MAP_SIZES = {
    compact:   { id: 'compact',   label: 'Compact',   dim: 34, rooms: [6, 7] },
    standard:  { id: 'standard',  label: 'Standard',  dim: 44, rooms: [8, 10] },
    labyrinth: { id: 'labyrinth', label: 'Labyrinth', dim: 56, rooms: [11, 14] }
  };

  const BIOMES = {
    crypt:   { id: 'crypt',   name: 'Sunken Stone Crypt',   floorTint: null,                     wallTint: null,                     fog: '#07080c' },
    cinder:  { id: 'cinder',  name: 'Molten Cinder Cavern', floorTint: 'rgba(234, 88, 12, 0.22)', wallTint: 'rgba(154, 52, 18, 0.28)', fog: '#120705' },
    ossuary: { id: 'ossuary', name: 'Frozen Ossuary',       floorTint: 'rgba(56, 189, 248, 0.20)', wallTint: 'rgba(14, 116, 144, 0.25)',fog: '#050c14' },
    blight:  { id: 'blight',  name: 'Overgrown Blight Ruin',floorTint: 'rgba(34, 197, 94, 0.18)',  wallTint: 'rgba(21, 128, 61, 0.24)', fog: '#051008' }
  };

  const WEAPON_TYPES = {
    greatsword:  { id: 'greatsword',  label: 'Greatsword',  skillName: 'Whirlwind Slam', mana: 16, cd: 4.5, stagger: 22 },
    warhammer:   { id: 'warhammer',   label: 'Warhammer',   skillName: 'Ground Shatter', mana: 18, cd: 5.5, stagger: 38 },
    longbow:     { id: 'longbow',     label: 'Longbow',     skillName: 'Multishot Fan',  mana: 14, cd: 3.5, stagger: 12 },
    crossbow:    { id: 'crossbow',    label: 'Crossbow',    skillName: 'Explosive Bolt', mana: 18, cd: 4.2, stagger: 24 },
    necro_staff: { id: 'necro_staff', label: 'Necro Staff', skillName: 'Bone Prison',    mana: 20, cd: 6.0, stagger: 26 },
    arcane_tome: { id: 'arcane_tome', label: 'Arcane Tome', skillName: 'Phase Blink',    mana: 14, cd: 4.0, stagger: 10 }
  };

  const GEM_DEFS = {
    ruby:     { id: 'ruby',     name: 'Ruby',     color: '#ef4444', stat: 'atk',  val: 8,  desc: '+8 ATK' },
    sapphire: { id: 'sapphire', name: 'Sapphire', color: '#3b82f6', stat: 'mp',   val: 20, desc: '+20 Max MP' },
    topaz:    { id: 'topaz',    name: 'Topaz',    color: '#eab308', stat: 'crit', val: 3,  desc: '+3% Crit' },
    skull:    { id: 'skull',    name: 'Skull',    color: '#a855f7', stat: 'loh',  val: 5,  desc: '+5 Life on Hit' }
  };

  const SET_DEFS = {
    cryptguard: {
      id: 'cryptguard',
      name: 'Cryptguard Bulwark',
      twoPc: '+15% Armor & +45 Max HP',
      fourPc: '+20% Attack & +10% Crit',
      bonus2: { armPct: 0.15, hp: 45 },
      bonus4: { atkPct: 0.2, crit: 10 }
    },
    nightstalker: {
      id: 'nightstalker',
      name: 'Nightstalker Shroud',
      twoPc: '+12% Move Speed & +6% Crit',
      fourPc: '+28% Crit Dmg & +15% Attack',
      bonus2: { speedPct: 0.12, crit: 6 },
      bonus4: { critDmg: 0.28, atkPct: 0.15 }
    },
    soulbinder: {
      id: 'soulbinder',
      name: 'Soulbinder Regalia',
      twoPc: '+30 Max MP & +15% Spell/Minion',
      fourPc: '+25% Minion/Spell Power & +6 LOH',
      bonus2: { mp: 30, minionPct: 0.15 },
      bonus4: { minionPct: 0.25, atkPct: 0.15, loh: 6 }
    }
  };

  const PETS_CONFIG = {
    hound: {
      id: 'hound',
      name: 'Shadow Hound',
      skillName: 'Rending Bite',
      passiveDesc: '+10% Move Speed',
      color: '#f43f5e',
      cd: 4.5,
      passive: { speedPct: 0.1 }
    },
    wisp: {
      id: 'wisp',
      name: 'Ember Wisp',
      skillName: 'Fire Spit',
      passiveDesc: '+15% Gold Find',
      color: '#f97316',
      cd: 3.5,
      passive: { goldPct: 0.15 }
    },
    hatchling: {
      id: 'hatchling',
      name: 'Stone Hatchling',
      skillName: 'Taunt Pulse',
      passiveDesc: '+15% Defense',
      color: '#94a3b8',
      cd: 6.0,
      passive: { armPct: 0.15 }
    }
  };

  const MASTERY_NODES = [
    { id: 'off_1', branch: 'Offense',  name: 'Brutal Strikes', desc: '+10% Attack',         req: null,    bonus: { atkPct: 0.1 } },
    { id: 'off_2', branch: 'Offense',  name: 'Lethal Precision',desc: '+6% Crit Chance',   req: 'off_1', bonus: { crit: 6 } },
    { id: 'off_3', branch: 'Offense',  name: 'Executioner',    desc: '+25% Crit Damage',   req: 'off_2', bonus: { critDmg: 0.25 } },
    { id: 'off_4', branch: 'Offense',  name: 'Awakened Fury',  desc: '+25% Ult Charge Rate',req: 'off_3', bonus: { ultRate: 0.25 } },
    { id: 'def_1', branch: 'Defense',  name: 'Iron Skin',      desc: '+15% Armor',         req: null,    bonus: { armPct: 0.15 } },
    { id: 'def_2', branch: 'Defense',  name: 'Vitality Surge', desc: '+60 Max HP',         req: 'def_1', bonus: { hp: 60 } },
    { id: 'def_3', branch: 'Defense',  name: 'Vampiric Leech', desc: '+5 Life on Hit',     req: 'def_2', bonus: { loh: 5 } },
    { id: 'def_4', branch: 'Defense',  name: 'Bulwark',        desc: '-12% Damage Taken',  req: 'def_3', bonus: { dr: 0.12 } },
    { id: 'sum_1', branch: 'Utility',  name: 'Commander',      desc: '+20% Minion/Pet Dmg',req: null,    bonus: { minionPct: 0.2 } },
    { id: 'sum_2', branch: 'Utility',  name: 'Swift Step',     desc: '+12% Move Speed',    req: 'sum_1', bonus: { speedPct: 0.12 } },
    { id: 'sum_3', branch: 'Utility',  name: 'Mana Well',      desc: '+30 Max MP',         req: 'sum_2', bonus: { mp: 30 } },
    { id: 'sum_4', branch: 'Utility',  name: 'Treasure Hunter',desc: '+25% Gold Find',     req: 'sum_3', bonus: { goldPct: 0.25 } }
  ];

  const WARDROBE_ITEMS = {
    trails: [
      { id: 'default', name: 'Steel Spark',    color: '#fde047', reqBoss: null },
      { id: 'crimson', name: 'Crimson Ash',    color: '#ef4444', reqBoss: 'Malakor, Crypt Warden' },
      { id: 'frost',   name: 'Glacial Arc',    color: '#38bdf8', reqBoss: 'Vaelgor, Bone Prelate' },
      { id: 'abyssal', name: 'Abyssal Flame',  color: '#c084fc', reqBoss: 'Azrael, Ashen Sovereign' }
    ],
    capes: [
      { id: 'default', name: 'Class Mantle',   color: null,      reqBoss: null },
      { id: 'gold',    name: 'Sovereign Cloak',color: '#b45309', reqBoss: 'Malakor, Crypt Warden' },
      { id: 'shadow',  name: 'Void Shroud',    color: '#312e81', reqBoss: 'Nethys, Blood Matriarch' }
    ]
  };

  const BOUNTY_TEMPLATES = [
    { id: 'b_kill',   title: 'Crypt Purger',    desc: 'Slay 25 Crypt Monsters',     target: 25, type: 'kills',     marks: 3, gold: 140 },
    { id: 'b_elites', title: 'Champion Hunter', desc: 'Slay 4 Elite Champions',     target: 4,  type: 'elites',    marks: 4, gold: 180 },
    { id: 'b_boss',   title: 'Guardian Bane',   desc: 'Defeat 1 Floor Boss/Guardian',target: 1, type: 'bosses',    marks: 5, gold: 240 },
    { id: 'b_chests', title: 'Relic Seeker',    desc: 'Open 3 Events or Chests',    target: 3,  type: 'events',    marks: 3, gold: 150 }
  ];

  const HERO_CLASSES = {
    paladin: {
      id: 'paladin',
      name: 'Paladin',
      role: 'Crusader (+15% Armor)',
      passiveDesc: '+15% Block & Armor',
      stats: { str: 14, dex: 9, int: 8, vit: 15 },
      baseHp: 120, hpPerLvl: 26, baseMp: 75, mpPerLvl: 8,
      baseAtk: 11, baseArm: 5, baseCrit: 6, speed: 4.65,
      defaultWeapon: 'greatsword',
      cloak: '#7f1d1d', armorColor: '#94a3b8', trimColor: '#facc15',
      basicName: 'SLASH',
      ultName: 'Avatar of Light',
      skills: {
        1: { name: 'Whirlwind Cleave', mana: 15, cd: 4.5, elId: 'btnSkill1', stagger: 14 },
        2: { name: 'Shield Bash',      mana: 16, cd: 4.0, elId: 'btnSkill2', stagger: 42 },
        3: { name: 'Holy Nova',        mana: 28, cd: 7.0, elId: 'btnSkill3', stagger: 20 }
      }
    },
    rogue: {
      id: 'rogue',
      name: 'Shadow Rogue',
      role: 'Assassin (+15% Crit)',
      passiveDesc: '+15% Crit Chance',
      stats: { str: 9, dex: 16, int: 9, vit: 11 },
      baseHp: 95, hpPerLvl: 20, baseMp: 85, mpPerLvl: 9,
      baseAtk: 13, baseArm: 2, baseCrit: 20, speed: 5.25,
      defaultWeapon: 'crossbow',
      cloak: '#1e293b', armorColor: '#334155', trimColor: '#4ade80',
      basicName: 'TWIN',
      ultName: 'Shadow Clone Army',
      skills: {
        1: { name: 'Multishot',   mana: 14, cd: 3.2, elId: 'btnSkill1', stagger: 10 },
        2: { name: 'Poison Trap', mana: 18, cd: 5.5, elId: 'btnSkill2', stagger: 16 },
        3: { name: 'Shadow Dash', mana: 20, cd: 4.5, elId: 'btnSkill3', stagger: 22 }
      }
    },
    sorcerer: {
      id: 'sorcerer',
      name: 'Blood Sorcerer',
      role: 'Warlock (+20% Spell AoE)',
      passiveDesc: '+20% Spell AoE & Power',
      stats: { str: 7, dex: 10, int: 17, vit: 11 },
      baseHp: 90, hpPerLvl: 19, baseMp: 120, mpPerLvl: 13,
      baseAtk: 14, baseArm: 2, baseCrit: 8, speed: 4.75,
      defaultWeapon: 'arcane_tome',
      cloak: '#4c1d95', armorColor: '#312e81', trimColor: '#c084fc',
      basicName: 'BOLT',
      ultName: 'Meteor Apocalypse',
      skills: {
        1: { name: 'Bone Nova',  mana: 16, cd: 4.0, elId: 'btnSkill1', stagger: 16 },
        2: { name: 'Frost Orb',  mana: 22, cd: 3.8, elId: 'btnSkill2', stagger: 36 },
        3: { name: 'Soul Drain', mana: 26, cd: 6.5, elId: 'btnSkill3', stagger: 18 }
      }
    },
    archer: {
      id: 'archer',
      name: 'Ranger',
      role: 'Archer (+20% Range/Crit Dmg)',
      passiveDesc: '+20% Range & Crit Damage',
      stats: { str: 8, dex: 17, int: 9, vit: 11 },
      baseHp: 96, hpPerLvl: 20, baseMp: 90, mpPerLvl: 10,
      baseAtk: 13, baseArm: 2, baseCrit: 12, speed: 5.1,
      defaultWeapon: 'longbow',
      cloak: '#14532d', armorColor: '#3f6212', trimColor: '#a3e635',
      basicName: 'SHOT',
      ultName: 'Phoenix Volley',
      skills: {
        1: { name: 'Arrow Rain',      mana: 18, cd: 4.2, elId: 'btnSkill1', stagger: 14 },
        2: { name: 'Vault & Caltrops',mana: 16, cd: 4.8, elId: 'btnSkill2', stagger: 34 },
        3: { name: 'Charged Snipe',   mana: 24, cd: 5.0, elId: 'btnSkill3', stagger: 28 }
      }
    },
    summoner: {
      id: 'summoner',
      name: 'Necromancer',
      role: 'Summoner (+25% Minions)',
      passiveDesc: '+25% Minion HP & Dmg',
      stats: { str: 6, dex: 9, int: 17, vit: 13 },
      baseHp: 98, hpPerLvl: 21, baseMp: 115, mpPerLvl: 12,
      baseAtk: 11, baseArm: 3, baseCrit: 6, speed: 4.7,
      defaultWeapon: 'necro_staff',
      cloak: '#111827', armorColor: '#1f2937', trimColor: '#2dd4bf',
      basicName: 'SOUL',
      ultName: 'Summon Bone Colossus',
      skills: {
        1: { name: 'Raise Skeletons', mana: 20, cd: 5.0, elId: 'btnSkill1', stagger: 12 },
        2: { name: 'Summon Hell Imp', mana: 22, cd: 6.0, elId: 'btnSkill2', stagger: 14 },
        3: { name: 'Dark Pact',       mana: 24, cd: 6.5, elId: 'btnSkill3', stagger: 22 }
      }
    }
  };

  const GOTHIC_NAMES = [
    'Aldric', 'Vespera', 'Kaelen', 'Mordecai', 'Seraphina',
    'Draven', 'Isolde', 'Corvus', 'Valerius', 'Lilith', 'Theron', 'Nyx'
  ];

  const ELITE_AFFIXES = {
    vampiric: { id: 'vampiric', label: 'Vampiric', color: '#f43f5e' },
    molten:   { id: 'molten',   label: 'Molten',   color: '#f97316' },
    frozen:   { id: 'frozen',   label: 'Frozen',   color: '#38bdf8' },
    fast:     { id: 'fast',     label: 'Fast',     color: '#facc15' }
  };

  const FLOOR_GUARDIANS = [
    'Malakor, Crypt Warden',
    'Vaelgor, Bone Prelate',
    'Azrael, Ashen Sovereign',
    'Nethys, Blood Matriarch'
  ];

  function getActiveSkillConfig() {
    const cls = HERO_CLASSES[state.heroClass] || HERO_CLASSES.paladin;
    return cls.skills;
  }

  // =========================================================================
  // DOM REFERENCES
  // =========================================================================
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const minimapCanvas = document.getElementById('minimapCanvas');
  const mctx = minimapCanvas.getContext('2d');

  const dom = {
    mainMenuScreen: document.getElementById('mainMenuScreen'),
    saveSlotGrid: document.getElementById('saveSlotGrid'),
    btnContinueTown: document.getElementById('btnContinueTown'),
    btnOpenCharCreate: document.getElementById('btnOpenCharCreate'),
    btnOpenCoopMenu: document.getElementById('btnOpenCoopMenu'),
    btnOpenSaveTransfer: document.getElementById('btnOpenSaveTransfer'),
    btnAudioToggle: document.getElementById('btnAudioToggle'),
    charCreateScreen: document.getElementById('charCreateScreen'),
    heroNameInput: document.getElementById('heroNameInput'),
    btnRandomName: document.getElementById('btnRandomName'),
    classSelectGrid: document.getElementById('classSelectGrid'),
    classPreviewCanvas: document.getElementById('classPreviewCanvas'),
    classPreviewInfo: document.getElementById('classPreviewInfo'),
    petSelectGrid: document.getElementById('petSelectGrid'),
    btnCharCreateBack: document.getElementById('btnCharCreateBack'),
    btnForgeHero: document.getElementById('btnForgeHero'),
    levelUpDraftModal: document.getElementById('levelUpDraftModal'),
    draftPill: document.getElementById('draftPill'),
    draftTitle: document.getElementById('draftTitle'),
    draftSubtitle: document.getElementById('draftSubtitle'),
    draftCardsGrid: document.getElementById('draftCardsGrid'),
    hudTopLeft: document.getElementById('hudTopLeft'),
    hudTopRight: document.getElementById('hudTopRight'),
    streakBadge: document.getElementById('streakBadge'),
    partyPanel: document.getElementById('partyPanel'),
    touchControls: document.getElementById('touchControls'),
    combatCluster: document.getElementById('combatCluster'),
    townQuickBar: document.getElementById('townQuickBar'),
    btnTownForge: document.getElementById('btnTownForge'),
    btnTownStash: document.getElementById('btnTownStash'),
    btnTownApothecary: document.getElementById('btnTownApothecary'),
    btnTownBounties: document.getElementById('btnTownBounties'),
    btnTownPets: document.getElementById('btnTownPets'),
    btnTownCodex: document.getElementById('btnTownCodex'),
    btnTownWardrobe: document.getElementById('btnTownWardrobe'),
    btnTownCoop: document.getElementById('btnTownCoop'),
    btnTownWaypoint: document.getElementById('btnTownWaypoint'),
    btnTownMenu: document.getElementById('btnTownMenu'),
    townNpcDrawer: document.getElementById('townNpcDrawer'),
    townNpcTitle: document.getElementById('townNpcTitle'),
    townNpcSubtitle: document.getElementById('townNpcSubtitle'),
    townNpcGold: document.getElementById('townNpcGold'),
    btnCloseTownNpc: document.getElementById('btnCloseTownNpc'),
    townNpcBody: document.getElementById('townNpcBody'),
    saveTransferDrawer: document.getElementById('saveTransferDrawer'),
    saveCodeInput: document.getElementById('saveCodeInput'),
    btnCopySaveCode: document.getElementById('btnCopySaveCode'),
    btnImportSaveCode: document.getElementById('btnImportSaveCode'),
    btnCloseSaveTransfer: document.getElementById('btnCloseSaveTransfer'),
    dragGhost: document.getElementById('dragGhost'),
    hpOrbFill: document.getElementById('hpOrbFill'),
    hpText: document.getElementById('hpText'),
    mpOrbFill: document.getElementById('mpOrbFill'),
    mpText: document.getElementById('mpText'),
    heroLevelText: document.getElementById('heroLevelText'),
    goldValue: document.getElementById('goldValue'),
    xpBarFill: document.getElementById('xpBarFill'),
    floorBadge: document.getElementById('floorBadge'),
    seedBadge: document.getElementById('seedBadge'),
    buffBadge: document.getElementById('buffBadge'),
    conditionBadge: document.getElementById('conditionBadge'),
    bossBar: document.getElementById('bossBar'),
    bossName: document.getElementById('bossName'),
    bossPhaseBadge: document.getElementById('bossPhaseBadge'),
    bossHpText: document.getElementById('bossHpText'),
    bossHpFill: document.getElementById('bossHpFill'),
    bossStaggerFill: document.getElementById('bossStaggerFill'),
    toastBanner: document.getElementById('toastBanner'),
    btnInventory: document.getElementById('btnInventory'),
    lootCountBadge: document.getElementById('lootCountBadge'),
    btnOpenSkills: document.getElementById('btnOpenSkills'),
    btnAutoCombat: document.getElementById('btnAutoCombat'),
    autoCombatLabel: document.getElementById('autoCombatLabel'),
    btnNewFloor: document.getElementById('btnNewFloor'),
    newFloorBtnLabel: document.getElementById('newFloorBtnLabel'),
    btnTownPortal: document.getElementById('btnTownPortal'),
    btnLootFilter: document.getElementById('btnLootFilter'),
    lootFilterLabel: document.getElementById('lootFilterLabel'),
    btnManualSave: document.getElementById('btnManualSave'),
    btnHudAudio: document.getElementById('btnHudAudio'),
    hudAudioLabel: document.getElementById('hudAudioLabel'),
    joystickZone: document.getElementById('joystickZone'),
    joystickKnob: document.getElementById('joystickKnob'),
    btnAttack: document.getElementById('btnAttack'),
    attackUltGlow: document.getElementById('attackUltGlow'),
    attackLabel: document.getElementById('attackLabel'),
    btnSkill1: document.getElementById('btnSkill1'),
    btnSkill2: document.getElementById('btnSkill2'),
    btnSkill3: document.getElementById('btnSkill3'),
    btnSkill4: document.getElementById('btnSkill4'),
    skill1Cost: document.getElementById('skill1Cost'),
    skill2Cost: document.getElementById('skill2Cost'),
    skill3Cost: document.getElementById('skill3Cost'),
    skill4Label: document.getElementById('skill4Label'),
    skill4Cost: document.getElementById('skill4Cost'),
    btnUltimate: document.getElementById('btnUltimate'),
    ultPctText: document.getElementById('ultPctText'),
    btnDodge: document.getElementById('btnDodge'),
    btnSwapLoadout: document.getElementById('btnSwapLoadout'),
    swapLoadoutLabel: document.getElementById('swapLoadoutLabel'),
    btnMinionStance: document.getElementById('btnMinionStance'),
    minionStanceLabel: document.getElementById('minionStanceLabel'),
    btnPotion: document.getElementById('btnPotion'),
    potionCount: document.getElementById('potionCount'),
    btnManaElixir: document.getElementById('btnManaElixir'),
    manaElixirCount: document.getElementById('manaElixirCount'),
    deathOverlay: document.getElementById('deathOverlay'),
    deathSummary: document.getElementById('deathSummary'),
    btnRespawn: document.getElementById('btnRespawn'),
    btnRespawnNew: document.getElementById('btnRespawnNew'),
    inventoryDrawer: document.getElementById('inventoryDrawer'),
    invGold: document.getElementById('invGold'),
    invDust: document.getElementById('invDust'),
    invEssence: document.getElementById('invEssence'),
    invCapacity: document.getElementById('invCapacity'),
    btnCloseInventory: document.getElementById('btnCloseInventory'),
    invTabGear: document.getElementById('invTabGear'),
    invTabStats: document.getElementById('invTabStats'),
    invTabSkills: document.getElementById('invTabSkills'),
    invTabMastery: document.getElementById('invTabMastery'),
    spBadge: document.getElementById('spBadge'),
    mpBadge: document.getElementById('mpBadge'),
    invGearPanel: document.getElementById('invGearPanel'),
    invStatsPanel: document.getElementById('invStatsPanel'),
    invSkillsPanel: document.getElementById('invSkillsPanel'),
    invMasteryPanel: document.getElementById('invMasteryPanel'),
    heroStatsStrip: document.getElementById('heroStatsStrip'),
    paperDollGrid: document.getElementById('paperDollGrid'),
    swapSetStrip: document.getElementById('swapSetStrip'),
    setBonusSummary: document.getElementById('setBonusSummary'),
    btnSortBag: document.getElementById('btnSortBag'),
    btnInvSalvageAll: document.getElementById('btnInvSalvageAll'),
    itemComparePanel: document.getElementById('itemComparePanel'),
    backpackGrid: document.getElementById('backpackGrid'),
    skillTreeModal: document.getElementById('skillTreeModal'),
    stSpCount: document.getElementById('stSpCount'),
    stMpCount: document.getElementById('stMpCount'),
    btnCloseSkillTree: document.getElementById('btnCloseSkillTree'),
    skillTreeBody: document.getElementById('skillTreeBody')
  };

  // =========================================================================
  // SEEDED PRNG & UTILITIES
  // =========================================================================
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  const randInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;

  // 2:1 Isometric projection helpers
  function worldToIso(wx, wy) {
    return {
      x: (wx - wy) * (TILE_W * 0.5),
      y: (wx + wy) * (TILE_H * 0.5)
    };
  }

  function isoToWorld(ix, iy) {
    const hw = TILE_W * 0.5;
    const hh = TILE_H * 0.5;
    return {
      x: (ix / hw + iy / hh) * 0.5,
      y: (iy / hh - ix / hw) * 0.5
    };
  }

  // =========================================================================
  // ZERO-ASSET WEB AUDIO SYNTH
  // =========================================================================
  const sfx = {
    ctx: null,
    muted: false,
    unlock() {
      if (this.muted) return;
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    },
    tone(freq, endFreq, dur, type = 'triangle', gainVal = 0.08, delay = 0) {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + dur);
      g.gain.setValueAtTime(gainVal, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + dur);
    },
    slash()     { this.tone(360, 120, 0.11, 'sawtooth', 0.06); },
    crit()      { this.tone(620, 210, 0.16, 'square', 0.07); this.tone(920, 440, 0.14, 'triangle', 0.05); },
    fire()      { this.tone(240, 75, 0.24, 'sawtooth', 0.08); },
    arcane()    { this.tone(480, 190, 0.22, 'sine', 0.07); this.tone(720, 340, 0.18, 'triangle', 0.05); },
    holy()      { this.tone(520, 880, 0.26, 'sine', 0.07); this.tone(660, 1040, 0.28, 'triangle', 0.05); },
    potion()    { this.tone(280, 620, 0.12, 'sine', 0.07); this.tone(440, 820, 0.14, 'sine', 0.05, 0.07); },
    anvil()     { this.tone(980, 420, 0.22, 'square', 0.08); this.tone(1480, 680, 0.28, 'triangle', 0.06, 0.02); },
    legendary() {
      this.tone(523.25, 523.25, 0.16, 'triangle', 0.07, 0);
      this.tone(659.25, 659.25, 0.18, 'triangle', 0.07, 0.08);
      this.tone(783.99, 783.99, 0.22, 'sine', 0.08, 0.16);
      this.tone(1046.5, 1046.5, 0.35, 'sine', 0.08, 0.24);
    },
    portal()    { this.tone(180, 540, 0.36, 'sine', 0.08); this.tone(270, 720, 0.34, 'triangle', 0.04, 0.05); },
    loot()      { this.tone(720, 1180, 0.12, 'sine', 0.06); },
    lvl()       { this.tone(440, 880, 0.35, 'triangle', 0.09); }
  };

  // =========================================================================
  // PRE-RENDERED OFFSCREEN PROCEDURAL TEXTURE ATLAS
  // =========================================================================
  const atlas = {
    floors: [],
    sanctum: null,
    bossFloor: null,
    wall: null,
    urn: null,
    barrel: null,
    torchGlow: null,
    arcaneGlow: null
  };

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function drawIsoDiamondPath(c, cx, cy, w, h) {
    c.beginPath();
    c.moveTo(cx, cy - h * 0.5);
    c.lineTo(cx + w * 0.5, cy);
    c.lineTo(cx, cy + h * 0.5);
    c.lineTo(cx - w * 0.5, cy);
    c.closePath();
  }

  function buildFloorSprite(variant, mode) {
    const c = makeCanvas(TILE_W + 2, TILE_H + 2);
    const g = c.getContext('2d');
    const cx = TILE_W * 0.5 + 1;
    const cy = TILE_H * 0.5 + 1;
    const rng = mulberry32(9001 + variant * 131 + (mode === 'sanctum' ? 500 : mode === 'boss' ? 900 : 0));

    drawIsoDiamondPath(g, cx, cy, TILE_W, TILE_H);
    const grad = g.createLinearGradient(0, cy - 16, TILE_W, cy + 16);
    if (mode === 'sanctum') {
      grad.addColorStop(0, '#1c2436');
      grad.addColorStop(1, '#121826');
    } else if (mode === 'boss') {
      grad.addColorStop(0, '#2a171c');
      grad.addColorStop(1, '#180d11');
    } else {
      const shade = variant === 0 ? '#1b202b' : variant === 1 ? '#171c26' : '#1f2430';
      grad.addColorStop(0, shade);
      grad.addColorStop(1, '#11151d');
    }
    g.fillStyle = grad;
    g.fill();

    // Flagstone bevel border
    g.strokeStyle = mode === 'boss' ? 'rgba(185, 28, 28, 0.35)' : mode === 'sanctum' ? 'rgba(96, 165, 250, 0.32)' : 'rgba(15, 19, 27, 0.9)';
    g.lineWidth = 1.2;
    g.stroke();

    // Inner stone seams & speckles
    g.save();
    drawIsoDiamondPath(g, cx, cy, TILE_W - 2, TILE_H - 2);
    g.clip();
    g.strokeStyle = 'rgba(255, 255, 255, 0.045)';
    g.lineWidth = 1;
    g.beginPath();
    if (variant % 2 === 0) {
      g.moveTo(cx - 14, cy - 5);
      g.lineTo(cx + 14, cy + 9);
    } else {
      g.moveTo(cx + 12, cy - 7);
      g.lineTo(cx - 12, cy + 7);
    }
    g.stroke();

    // Subtle stone pits
    for (let i = 0; i < 9; i++) {
      const px = cx + (rng() - 0.5) * 34;
      const py = cy + (rng() - 0.5) * 14;
      g.fillStyle = rng() > 0.5 ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.04)';
      g.fillRect(px, py, 2, 1.5);
    }

    if (mode === 'sanctum') {
      g.strokeStyle = 'rgba(59, 130, 246, 0.25)';
      drawIsoDiamondPath(g, cx, cy, TILE_W * 0.52, TILE_H * 0.52);
      g.stroke();
    } else if (mode === 'boss') {
      g.strokeStyle = 'rgba(220, 38, 38, 0.32)';
      drawIsoDiamondPath(g, cx, cy, TILE_W * 0.55, TILE_H * 0.55);
      g.stroke();
    }
    g.restore();
    return c;
  }

  function buildWallSprite() {
    const w = TILE_W + 2;
    const h = TILE_H + WALL_H + 4;
    const c = makeCanvas(w, h);
    const g = c.getContext('2d');
    const cx = w * 0.5;
    const topY = TILE_H * 0.5 + 1;

    // Top diamond face
    drawIsoDiamondPath(g, cx, topY, TILE_W, TILE_H);
    const topGrad = g.createLinearGradient(0, 0, w, TILE_H);
    topGrad.addColorStop(0, '#2d3545');
    topGrad.addColorStop(1, '#1b202b');
    g.fillStyle = topGrad;
    g.fill();
    g.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    g.lineWidth = 1;
    g.stroke();

    // Left extruded face
    g.beginPath();
    g.moveTo(cx - TILE_W * 0.5, topY);
    g.lineTo(cx, topY + TILE_H * 0.5);
    g.lineTo(cx, topY + TILE_H * 0.5 + WALL_H);
    g.lineTo(cx - TILE_W * 0.5, topY + WALL_H);
    g.closePath();
    const leftGrad = g.createLinearGradient(0, topY, 0, topY + WALL_H + 16);
    leftGrad.addColorStop(0, '#202633');
    leftGrad.addColorStop(1, '#0d1017');
    g.fillStyle = leftGrad;
    g.fill();

    // Right extruded face (deeper shadow)
    g.beginPath();
    g.moveTo(cx + TILE_W * 0.5, topY);
    g.lineTo(cx, topY + TILE_H * 0.5);
    g.lineTo(cx, topY + TILE_H * 0.5 + WALL_H);
    g.lineTo(cx + TILE_W * 0.5, topY + WALL_H);
    g.closePath();
    const rightGrad = g.createLinearGradient(0, topY, 0, topY + WALL_H + 16);
    rightGrad.addColorStop(0, '#141822');
    rightGrad.addColorStop(1, '#080a0f');
    g.fillStyle = rightGrad;
    g.fill();

    // Stone masonry brick courses
    g.strokeStyle = 'rgba(0, 0, 0, 0.48)';
    g.lineWidth = 1;
    for (let row = 1; row <= 3; row++) {
      const dy = row * (WALL_H / 3.4);
      g.beginPath();
      g.moveTo(cx - TILE_W * 0.5, topY + dy);
      g.lineTo(cx, topY + TILE_H * 0.5 + dy);
      g.lineTo(cx + TILE_W * 0.5, topY + dy);
      g.stroke();
    }
    // Center ridge highlight
    g.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    g.beginPath();
    g.moveTo(cx, topY + TILE_H * 0.5);
    g.lineTo(cx, topY + TILE_H * 0.5 + WALL_H);
    g.stroke();

    return c;
  }

  function buildPropSprite(kind) {
    const c = makeCanvas(36, 42);
    const g = c.getContext('2d');
    const cx = 18;
    const baseY = 36;

    // Ground shadow
    g.fillStyle = 'rgba(0, 0, 0, 0.45)';
    g.beginPath();
    g.ellipse(cx, baseY, 11, 5.5, 0, 0, Math.PI * 2);
    g.fill();

    if (kind === 'urn') {
      const grad = g.createLinearGradient(cx - 8, 12, cx + 8, baseY);
      grad.addColorStop(0, '#9a6b4c');
      grad.addColorStop(1, '#432818');
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(cx, 25, 8, 10, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#5c3a25';
      g.fillRect(cx - 4, 13, 8, 4);
      g.strokeStyle = '#d4a373';
      g.lineWidth = 1.2;
      g.beginPath();
      g.ellipse(cx, 13, 5, 2.2, 0, 0, Math.PI * 2);
      g.stroke();
    } else {
      // Iron-banded barrel
      const grad = g.createLinearGradient(cx - 10, 12, cx + 10, baseY);
      grad.addColorStop(0, '#784e2c');
      grad.addColorStop(1, '#362111');
      g.fillStyle = grad;
      g.beginPath();
      g.roundRect(cx - 9, 13, 18, 22, 4);
      g.fill();
      // Iron hoops
      g.fillStyle = '#475569';
      g.fillRect(cx - 9, 17, 18, 2.5);
      g.fillRect(cx - 9, 28, 18, 2.5);
      // Barrel lid
      g.fillStyle = '#5c3a21';
      g.beginPath();
      g.ellipse(cx, 13.5, 8.5, 3.4, 0, 0, Math.PI * 2);
      g.fill();
    }
    return c;
  }

  function buildGlowSprite(innerColor, midColor, radius) {
    const c = makeCanvas(radius * 2, radius * 2);
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(radius, radius, 2, radius, radius, radius);
    grad.addColorStop(0, innerColor);
    grad.addColorStop(0.5, midColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, radius * 2, radius * 2);
    return c;
  }

  function tintSprite(srcCanvas, tintRgba) {
    if (!tintRgba) return srcCanvas;
    const c = makeCanvas(srcCanvas.width, srcCanvas.height);
    const g = c.getContext('2d');
    g.drawImage(srcCanvas, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = tintRgba;
    g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-over';
    return c;
  }

  function buildTextureAtlas() {
    const baseFloors = [
      buildFloorSprite(0, 'normal'),
      buildFloorSprite(1, 'normal'),
      buildFloorSprite(2, 'normal')
    ];
    const baseWall = buildWallSprite();
    atlas.floors = baseFloors;
    atlas.sanctum = buildFloorSprite(0, 'sanctum');
    atlas.bossFloor = buildFloorSprite(0, 'boss');
    atlas.wall = baseWall;
    atlas.urn = buildPropSprite('urn');
    atlas.barrel = buildPropSprite('barrel');
    atlas.torchGlow = buildGlowSprite('rgba(249, 115, 22, 0.26)', 'rgba(217, 119, 6, 0.10)', 74);
    atlas.arcaneGlow = buildGlowSprite('rgba(59, 130, 246, 0.28)', 'rgba(37, 99, 235, 0.09)', 74);
    atlas.biomes = {};
    for (const [bId, b] of Object.entries(BIOMES)) {
      atlas.biomes[bId] = {
        floors: baseFloors.map((sp) => tintSprite(sp, b.floorTint)),
        wall: tintSprite(baseWall, b.wallTint)
      };
    }
  }

  // =========================================================================
  // HERO, GEAR & 3-SLOT PERSISTENCE STATE
  // =========================================================================
  function createStarterGear(classId = 'paladin') {
    const cls = HERO_CLASSES[classId] || HERO_CLASSES.paladin;
    const wType = cls.defaultWeapon || 'greatsword';
    const wNames = {
      greatsword: 'Iron Broadsword', warhammer: 'Crusader Maul',
      longbow: 'Yew Recurve Bow', crossbow: 'Shadowfang Repeater',
      necro_staff: 'Bonechannel Staff', arcane_tome: 'Bloodbound Grimoire'
    };
    return {
      weapon:  { id: 'starter_wpn', name: wNames[wType] || 'Iron Broadsword', slot: 'weapon', weaponType: wType, rarity: 'common', stats: { atk: 12, crit: 4 }, sockets: 1, gems: [] },
      offhand: null,
      helm:    { id: 'starter_helm', name: 'Wayfarer Hood', slot: 'helm', rarity: 'common', stats: { hp: 18, arm: 3 }, sockets: 0, gems: [] },
      armor:   { id: 'starter_armor', name: 'Cryptguard Coat', slot: 'armor', rarity: 'common', stats: { hp: 28, arm: 5 }, sockets: 0, gems: [] },
      boots:   { id: 'starter_boots', name: 'Ironshod Greaves', slot: 'boots', rarity: 'common', stats: { arm: 2, spd: 4 }, sockets: 0, gems: [] },
      ring:    null
    };
  }

  function defaultAccountData() {
    return {
      stash: [],
      bestiary: {},
      wardrobeUnlocked: { trails: ['default'], capes: ['default'] },
      equippedTrail: 'default',
      equippedCape: 'default',
      bestRiftTier: 0,
      mercenaryMarks: 0,
      bounties: BOUNTY_TEMPLATES.slice(0, 3).map((b) => ({ id: b.id, title: b.title, desc: b.desc, type: b.type, target: b.target, prog: 0, marks: b.marks, gold: b.gold, claimed: false }))
    };
  }

  function createFreshHeroSlotData(heroName = 'Aldric', classId = 'paladin', petId = 'hound') {
    const cls = HERO_CLASSES[classId] ? classId : 'paladin';
    const equipped = createStarterGear(cls);
    return {
      v: VERSION,
      heroName,
      heroClass: cls,
      highestFloor: 1,
      floor: 1,
      seed: Math.floor(1000 + Math.random() * 8999),
      level: 1,
      xp: 0,
      nextXp: 100,
      gold: 120,
      dust: 10,
      essence: 0,
      potions: 3,
      manaElixirs: 2,
      repairKits: 1,
      durability: 100,
      kills: 0,
      skillPoints: 1,
      masteryPoints: 0,
      skillRanks: { 1: 1, 2: 1, 3: 1 },
      masteryUnlocked: [],
      petId: PETS_CONFIG[petId] ? petId : 'hound',
      petRanks: { hound: 1, wisp: 1, hatchling: 1 },
      petXp: 0,
      equipped,
      swapSet: { weapon: null, offhand: null },
      bag: [],
      activeBuff: null
    };
  }

  const state = {
    screen: 'MAIN_MENU',
    mode: 'TOWN',
    activeSlot: 0,
    saveSlots: [null, null, null],
    account: defaultAccountData(),
    selectedCreateClass: 'paladin',
    selectedCreatePet: 'hound',
    heroName: 'Aldric',
    heroClass: 'paladin',
    highestFloor: 1,
    floor: 1,
    seed: 1047,
    mapSize: 'standard',
    biome: 'crypt',
    riftTier: 0,
    riftTimer: 0,
    floorCondition: 'calm',
    torchFuel: 100,
    infamyStreak: 0,
    rng: null,
    grid: [],
    tileVariant: [],
    explored: [],
    rooms: [],
    waypoint: { x: 0, y: 0 },
    stairs: { x: 0, y: 0, unlocked: false },
    waypointArmed: false,
    torches: [],
    gates: [],
    levers: [],
    runePlates: [],
    runeBridges: [],
    mirrorPads: [],
    secretWalls: [],
    traps: [],
    events: [],
    crystals: [],
    bossTelegraphs: [],
    props: [],
    townNpcs: [],
    monsters: [],
    minions: [],
    petEntity: null,
    minionStance: 'aggressive', // 'aggressive' | 'guard'
    lootDrops: [],
    projectiles: [],
    enemyProjectiles: [],
    enemyPuddles: [],
    poisonClouds: [],
    particles: [],
    floatTexts: [],
    slashArcs: [],
    novaWaves: [],
    autoCombat: true,
    draftOpen: false,
    killStreak: 0,
    streakTimer: 0,
    moveTarget: null,
    runPassives: { atkPct: 0, speedPct: 0, critPct: 0, atkSpeedPct: 0, magnetPct: 0, hpBonus: 0 },
    autoWeapons: { boneBlades: 0, chainLightning: 0, emberAura: 0 },
    awakenedSkills: { 1: false, 2: false, 3: false },
    bladeAngle: 0,
    chainCd: 0,
    auraCd: 0,
    camera: { x: 0, y: 0, shake: 0 },
    player: {
      x: 5, y: 5, vx: 0, vy: 0, facingX: 1, facingY: 0,
      hp: 150, maxHp: 150, mp: 80, maxMp: 80,
      level: 1, xp: 0, nextXp: 100, gold: 120,
      dust: 10, essence: 0, potions: 3, manaElixirs: 2, repairKits: 1, durability: 100,
      bladeOil: null, // { type: 'burn'|'poison'|'chill'|'bleed', label, timer }
      walkPhase: 0, attackAnim: 0, castAnim: 0,
      attackCd: 0, potionCd: 0, dodgeCd: 0, invulnTimer: 0, chillTimer: 0,
      ultCharge: 0, ultTimer: 0,
      skillCds: { 1: 0, 2: 0, 3: 0, 4: 0 },
      skillPoints: 1, masteryPoints: 0,
      skillRanks: { 1: 1, 2: 1, 3: 1 },
      masteryUnlocked: [],
      petId: 'hound',
      petRanks: { hound: 1, wisp: 1, hatchling: 1 },
      petXp: 0,
      hitFlash: 0, dead: false, kills: 0,
      equipped: createStarterGear('paladin'),
      swapSet: { weapon: null, offhand: null },
      activeSwapIdx: 1,
      bag: []
    },
    activeBuff: null,
    blacksmithStock: [],
    lootFilter: 'all',
    invTab: 'gear',
    selectedInspect: null,
    pendingLootTarget: null,
    toastTimer: 0,
    lastSaveAt: 0,
    lastFogTileX: -999,
    lastFogTileY: -999,
    fogDirty: true,
    hudCache: {}
  };

  function getSetCounts() {
    const counts = {};
    for (const slot of SLOTS) {
      const it = state.player.equipped[slot];
      if (it && it.setId) counts[it.setId] = (counts[it.setId] || 0) + 1;
    }
    return counts;
  }

  function getHeroStats() {
    const p = state.player;
    const cls = HERO_CLASSES[state.heroClass] || HERO_CLASSES.paladin;
    const totals = {
      atk: cls.baseAtk + (p.level - 1) * 4,
      crit: cls.baseCrit + (p.level - 1) * 0.6,
      critDmg: state.heroClass === 'archer' ? 2.05 : 1.85,
      maxHp: cls.baseHp + (p.level - 1) * cls.hpPerLvl + (state.runPassives?.hpBonus || 0),
      maxMp: cls.baseMp + (p.level - 1) * cls.mpPerLvl,
      loh: 0,
      arm: cls.baseArm + (p.level - 1) * 1.5,
      speed: cls.speed,
      atkSpeedMult: 1 + (state.runPassives?.atkSpeedPct || 0),
      magnetMult: 1 + (state.runPassives?.magnetPct || 0),
      goldBonus: 1,
      minionMult: state.heroClass === 'summoner' ? 1.25 : 1.0,
      aoeMult: state.heroClass === 'sorcerer' ? 1.2 : 1.0,
      ultRate: 1.0,
      dr: 0
    };

    let atkPct = (state.runPassives?.atkPct || 0), armPct = state.heroClass === 'paladin' ? 0.15 : 0, speedPct = (state.runPassives?.speedPct || 0);
    totals.crit += (state.runPassives?.critPct || 0);

    for (const slot of SLOTS) {
      const item = p.equipped[slot];
      if (!item || !item.stats) continue;
      totals.atk += Math.round(item.stats.atk || 0);
      totals.crit += (item.stats.crit || 0);
      totals.maxHp += Math.round(item.stats.hp || 0);
      totals.loh += Math.round(item.stats.loh || 0);
      totals.arm += Math.round(item.stats.arm || 0);
      if (item.stats.spd) speedPct += item.stats.spd * 0.01;
      if (Array.isArray(item.gems)) {
        for (const gId of item.gems) {
          const g = GEM_DEFS[gId];
          if (!g) continue;
          if (g.stat === 'atk') totals.atk += g.val;
          else if (g.stat === 'mp') totals.maxMp += g.val;
          else if (g.stat === 'crit') totals.crit += g.val;
          else if (g.stat === 'loh') totals.loh += g.val;
        }
      }
    }

    // Set bonuses
    const setCounts = getSetCounts();
    for (const [sId, cnt] of Object.entries(setCounts)) {
      const def = SET_DEFS[sId];
      if (!def) continue;
      const applyB = (b) => {
        if (!b) return;
        if (b.armPct) armPct += b.armPct;
        if (b.hp) totals.maxHp += b.hp;
        if (b.mp) totals.maxMp += b.mp;
        if (b.atkPct) atkPct += b.atkPct;
        if (b.crit) totals.crit += b.crit;
        if (b.critDmg) totals.critDmg += b.critDmg;
        if (b.speedPct) speedPct += b.speedPct;
        if (b.minionPct) totals.minionMult += b.minionPct;
        if (b.loh) totals.loh += b.loh;
      };
      if (cnt >= 2) applyB(def.bonus2);
      if (cnt >= 4) applyB(def.bonus4);
    }

    // Mastery Constellation bonuses
    for (const mId of p.masteryUnlocked || []) {
      const node = MASTERY_NODES.find((n) => n.id === mId);
      if (!node || !node.bonus) continue;
      const b = node.bonus;
      if (b.atkPct) atkPct += b.atkPct;
      if (b.crit) totals.crit += b.crit;
      if (b.critDmg) totals.critDmg += b.critDmg;
      if (b.ultRate) totals.ultRate += b.ultRate;
      if (b.armPct) armPct += b.armPct;
      if (b.hp) totals.maxHp += b.hp;
      if (b.loh) totals.loh += b.loh;
      if (b.dr) totals.dr += b.dr;
      if (b.minionPct) totals.minionMult += b.minionPct;
      if (b.speedPct) speedPct += b.speedPct;
      if (b.mp) totals.maxMp += b.mp;
      if (b.goldPct) totals.goldBonus += b.goldPct;
    }

    // Active Pet passive
    const pet = PETS_CONFIG[p.petId];
    if (pet && pet.passive) {
      const rankScale = 1 + ((p.petRanks[p.petId] || 1) - 1) * 0.2;
      if (pet.passive.speedPct) speedPct += pet.passive.speedPct * rankScale;
      if (pet.passive.goldPct) totals.goldBonus += pet.passive.goldPct * rankScale;
      if (pet.passive.armPct) armPct += pet.passive.armPct * rankScale;
    }

    // Bestiary micro-bonuses (+1 ATK per 25 total kills, capped at +20)
    let totalBestiaryKills = 0;
    for (const k of Object.values(state.account.bestiary || {})) totalBestiaryKills += k;
    totals.atk += Math.min(20, Math.floor(totalBestiaryKills / 25));

    if (state.activeBuff) {
      if (state.activeBuff.crit) totals.crit += state.activeBuff.crit;
      if (state.activeBuff.speed) speedPct += state.activeBuff.speed;
      if (state.activeBuff.gold) totals.goldBonus += state.activeBuff.gold;
    }

    totals.atk = Math.round(totals.atk * (1 + atkPct));
    totals.arm = Math.round(totals.arm * (1 + armPct));
    totals.speed *= (1 + speedPct);
    if (p.chillTimer > 0) totals.speed *= 0.7;
    if (p.ultTimer > 0 && state.heroClass === 'paladin') {
      totals.atk = Math.round(totals.atk * 1.45);
      totals.speed *= 1.25;
    }
    totals.crit = Math.min(80, Math.round(totals.crit * 10) / 10);
    return totals;
  }

  function syncPlayerVitalsBounds() {
    const st = getHeroStats();
    state.player.maxHp = st.maxHp;
    state.player.maxMp = st.maxMp;
    state.player.hp = Math.min(state.player.hp, state.player.maxHp);
    state.player.mp = Math.min(state.player.mp, state.player.maxMp);
  }

  function snapshotActiveSlot() {
    const p = state.player;
    return {
      v: VERSION,
      heroName: state.heroName,
      heroClass: state.heroClass,
      highestFloor: state.highestFloor,
      floor: state.floor,
      seed: state.seed,
      level: p.level,
      xp: p.xp,
      nextXp: p.nextXp,
      gold: p.gold,
      dust: p.dust,
      essence: p.essence,
      potions: p.potions,
      manaElixirs: p.manaElixirs,
      repairKits: p.repairKits,
      durability: p.durability,
      kills: p.kills,
      skillPoints: p.skillPoints,
      masteryPoints: p.masteryPoints,
      skillRanks: p.skillRanks,
      masteryUnlocked: p.masteryUnlocked,
      petId: p.petId,
      petRanks: p.petRanks,
      petXp: p.petXp,
      equipped: p.equipped,
      swapSet: p.swapSet,
      bag: p.bag,
      activeBuff: state.activeBuff
    };
  }

  function saveAccount() {
    try {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(state.account));
    } catch (_) {}
  }

  function saveHeroProfile(toastConfirm = false) {
    try {
      state.saveSlots[state.activeSlot] = snapshotActiveSlot();
      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(state.saveSlots));
      saveAccount();
      if (toastConfirm) showToast(`Saved Slot ${state.activeSlot + 1} (${state.heroName})`);
    } catch (_) {}
  }
  const saveProgress = saveHeroProfile;
  const saveStash = saveAccount;

  function applySlotDataToRuntime(data) {
    const base = createFreshHeroSlotData(data.heroName || 'Aldric', data.heroClass || 'paladin', data.petId || 'hound');
    const merged = Object.assign(base, data);
    state.heroName = merged.heroName;
    state.heroClass = HERO_CLASSES[merged.heroClass] ? merged.heroClass : 'paladin';
    state.highestFloor = Math.max(1, merged.highestFloor || 1);
    state.floor = Math.max(1, merged.floor || 1);
    state.seed = merged.seed || 1047;
    state.activeBuff = merged.activeBuff || null;

    const p = state.player;
    p.level = merged.level || 1;
    p.xp = merged.xp || 0;
    p.nextXp = merged.nextXp || 100;
    p.gold = merged.gold ?? 120;
    p.dust = merged.dust ?? 10;
    p.essence = merged.essence ?? 0;
    p.potions = merged.potions ?? 3;
    p.manaElixirs = merged.manaElixirs ?? 2;
    p.repairKits = merged.repairKits ?? 1;
    p.durability = merged.durability ?? 100;
    p.kills = merged.kills || 0;
    p.skillPoints = merged.skillPoints ?? 1;
    p.masteryPoints = merged.masteryPoints ?? 0;
    p.skillRanks = Object.assign({ 1: 1, 2: 1, 3: 1 }, merged.skillRanks || {});
    p.masteryUnlocked = Array.isArray(merged.masteryUnlocked) ? merged.masteryUnlocked : [];
    p.petId = PETS_CONFIG[merged.petId] ? merged.petId : 'hound';
    p.petRanks = Object.assign({ hound: 1, wisp: 1, hatchling: 1 }, merged.petRanks || {});
    p.petXp = merged.petXp || 0;
    const normItem = (it) => {
      if (!it || typeof it !== 'object') return null;
      if (it.kind === 'gem') return it;
      return Object.assign({ sockets: 0, gems: [], stats: {} }, it, {
        gems: Array.isArray(it.gems) ? it.gems : [],
        stats: (it.stats && typeof it.stats === 'object') ? it.stats : {}
      });
    };
    const starter = createStarterGear(state.heroClass);
    const rawEq = (merged.equipped && typeof merged.equipped === 'object') ? merged.equipped : {};
    p.equipped = {};
    for (const sl of SLOTS) {
      p.equipped[sl] = normItem(rawEq[sl] !== undefined ? rawEq[sl] : starter[sl]);
    }
    const rawSwap = (merged.swapSet && typeof merged.swapSet === 'object') ? merged.swapSet : {};
    p.swapSet = { weapon: normItem(rawSwap.weapon), offhand: normItem(rawSwap.offhand) };
    p.bag = Array.isArray(merged.bag) ? merged.bag.map(normItem).filter(Boolean).slice(0, MAX_BAG_SLOTS) : [];
    syncPlayerVitalsBounds();
    p.hp = p.maxHp;
    p.mp = p.maxMp;
  }

  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ muted: sfx.muted, lootFilter: state.lootFilter, mapSize: state.mapSize }));
    } catch (_) {}
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const pr = JSON.parse(raw);
      if (typeof pr.muted === 'boolean') sfx.muted = pr.muted;
      if (LOOT_FILTER_MODES.includes(pr.lootFilter)) state.lootFilter = pr.lootFilter;
      if (MAP_SIZES[pr.mapSize]) state.mapSize = pr.mapSize;
    } catch (_) {}
  }

  function loadProgress() {
    try {
      const rawAcc = localStorage.getItem(ACCOUNT_KEY);
      if (rawAcc) {
        state.account = Object.assign(defaultAccountData(), JSON.parse(rawAcc));
      } else {
        const legacyStash = localStorage.getItem(LEGACY_STASH_KEY);
        if (legacyStash) {
          const arr = JSON.parse(legacyStash);
          if (Array.isArray(arr)) state.account.stash = arr.slice(0, MAX_STASH_SLOTS);
        }
      }
    } catch (_) {}

    let loaded = false;
    try {
      const rawSlots = localStorage.getItem(SAVE_SLOTS_KEY);
      if (rawSlots) {
        const arr = JSON.parse(rawSlots);
        if (Array.isArray(arr)) {
          state.saveSlots = [arr[0] || null, arr[1] || null, arr[2] || null];
          const firstIdx = state.saveSlots.findIndex(Boolean);
          if (firstIdx !== -1) {
            state.activeSlot = firstIdx;
            applySlotDataToRuntime(state.saveSlots[firstIdx]);
            loaded = true;
          }
        }
      } else {
        const legacyRaw = localStorage.getItem(LEGACY_SAVE_KEY_V020) || localStorage.getItem(LEGACY_SAVE_KEY_V010);
        if (legacyRaw) {
          const legacyData = JSON.parse(legacyRaw);
          if (legacyData && typeof legacyData === 'object') {
            state.activeSlot = 0;
            applySlotDataToRuntime(legacyData);
            state.saveSlots[0] = snapshotActiveSlot();
            loaded = true;
          }
        }
      }
    } catch (_) {}

    loadPrefs();
    syncPlayerVitalsBounds();
    state.player.hp = state.player.maxHp;
    state.player.mp = state.player.maxMp;
    return loaded;
  }

  function exportSaveCode() {
    saveHeroProfile();
    const bundle = { v: VERSION, slots: state.saveSlots, account: state.account };
    return btoa(unescape(encodeURIComponent(JSON.stringify(bundle))));
  }

  function importSaveCode(codeStr) {
    try {
      const json = decodeURIComponent(escape(atob(String(codeStr || '').trim())));
      const parsed = JSON.parse(json);
      if (!parsed || !Array.isArray(parsed.slots)) return false;
      state.saveSlots = [parsed.slots[0] || null, parsed.slots[1] || null, parsed.slots[2] || null];
      if (parsed.account) state.account = Object.assign(defaultAccountData(), parsed.account);
      const firstIdx = state.saveSlots.findIndex(Boolean);
      if (firstIdx !== -1) {
        state.activeSlot = firstIdx;
        applySlotDataToRuntime(state.saveSlots[firstIdx]);
      }
      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(state.saveSlots));
      saveAccount();
      renderMainMenuSummary();
      return true;
    } catch (_) {
      return false;
    }
  }

  // =========================================================================
  // PROCEDURAL DUNGEON GENERATOR
  // =========================================================================
  function ensureMapCanvases() {
    const targetW = MAP_W * 4;
    if (fogLightCanvas.width !== targetW) {
      fogLightCanvas.width = targetW;
      fogLightCanvas.height = MAP_H * 4;
    }
  }

  function generateDungeon(seed, floor, opts = {}) {
    state.seed = (seed >>> 0) || 1047;
    state.floor = Math.max(1, floor | 0);
    const sizeCfg = MAP_SIZES[opts.mapSize || state.mapSize] || MAP_SIZES.standard;
    MAP_W = sizeCfg.dim;
    MAP_H = sizeCfg.dim;
    ensureMapCanvases();

    const rng = mulberry32(state.seed ^ (state.floor * 7919));
    state.rng = rng;

    const biomeKeys = Object.keys(BIOMES);
    state.biome = opts.biome || biomeKeys[(state.floor - 1) % biomeKeys.length];
    state.riftTier = opts.riftTier || 0;
    state.riftTimer = state.riftTier > 0 ? 180 : 0;
    const condRoll = rng();
    state.floorCondition = state.riftTier > 0
      ? 'blood_moon'
      : condRoll < 0.25 ? 'cursed_fog' : condRoll < 0.45 ? 'blood_moon' : condRoll < 0.62 ? 'volatile_vents' : 'calm';
    state.torchFuel = 100;

    state.grid = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W));
    state.tileVariant = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W));
    state.explored = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W));
    state.rooms = [];
    state.torches = [];
    state.gates = [];
    state.levers = [];
    state.runePlates = [];
    state.runeBridges = [];
    state.mirrorPads = [];
    state.secretWalls = [];
    state.traps = [];
    state.events = [];
    state.crystals = [];
    state.bossTelegraphs = [];
    state.props = [];
    state.monsters = [];
    state.minions = [];
    state.lootDrops = [];
    state.projectiles = [];
    state.enemyProjectiles = [];
    state.enemyPuddles = [];
    state.poisonClouds = [];
    state.particles = [];
    state.floatTexts = [];
    state.slashArcs = [];
    state.novaWaves = [];
    state.pendingLootTarget = null;
    state.moveTarget = null;
    state.killStreak = 0;
    state.streakTimer = 0;
    state.draftOpen = false;
    state.streakTimer = 0;
    state.draftOpen = false;

    // 1. Place non-overlapping rectangular chambers based on map size preset
    const targetRooms = randInt(rng, sizeCfg.rooms[0], sizeCfg.rooms[1]);
    for (let attempt = 0; attempt < 240 && state.rooms.length < targetRooms; attempt++) {
      const rw = randInt(rng, 5, 8);
      const rh = randInt(rng, 5, 8);
      const rx = randInt(rng, 2, MAP_W - rw - 3);
      const ry = randInt(rng, 2, MAP_H - rh - 3);

      let overlaps = false;
      for (const r of state.rooms) {
        if (rx < r.x + r.w + 2 && rx + rw + 2 > r.x && ry < r.y + r.h + 2 && ry + rh + 2 > r.y) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        state.rooms.push({
          id: state.rooms.length,
          x: rx, y: ry, w: rw, h: rh,
          cx: Math.floor(rx + rw * 0.5),
          cy: Math.floor(ry + rh * 0.5)
        });
      }
    }

    if (state.rooms.length < 3) {
      state.rooms = [
        { id: 0, x: 4, y: 4, w: 6, h: 6, cx: 7, cy: 7 },
        { id: 1, x: 14, y: 12, w: 7, h: 7, cx: 17, cy: 15 },
        { id: 2, x: 24, y: 22, w: 7, h: 7, cx: 27, cy: 25 }
      ];
    }

    for (const r of state.rooms) {
      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
          state.grid[y][x] = TILE.FLOOR;
          state.tileVariant[y][x] = randInt(rng, 0, 2);
        }
      }
    }

    // 2. Connect rooms with Prim MST + confusing loop & dead-end corridors
    const connected = new Set([0]);
    const edges = [];
    while (connected.size < state.rooms.length) {
      let bestA = 0, bestB = 0, bestD = Infinity;
      for (const a of connected) {
        for (let b = 0; b < state.rooms.length; b++) {
          if (connected.has(b)) continue;
          const d = dist(state.rooms[a].cx, state.rooms[a].cy, state.rooms[b].cx, state.rooms[b].cy);
          if (d < bestD) { bestD = d; bestA = a; bestB = b; }
        }
      }
      connected.add(bestB);
      edges.push([bestA, bestB]);
    }
    if (state.rooms.length > 4) {
      edges.push([0, randInt(rng, 2, state.rooms.length - 1)]);
      edges.push([1, state.rooms.length - 1]);
    }

    const corridorTiles = [];
    const carveCorridor = (rA, rB) => {
      let x = rA.cx, y = rA.cy;
      const horizFirst = rng() > 0.5;
      const stepTile = (tx, ty) => {
        for (let oy = 0; oy <= 1; oy++) {
          for (let ox = 0; ox <= 1; ox++) {
            const nx = clamp(tx + ox, 1, MAP_W - 2);
            const ny = clamp(ty + oy, 1, MAP_H - 2);
            if (state.grid[ny][nx] === TILE.VOID) {
              state.grid[ny][nx] = TILE.FLOOR;
              state.tileVariant[ny][nx] = randInt(rng, 0, 2);
              corridorTiles.push({ x: nx, y: ny });
            }
          }
        }
      };
      if (horizFirst) {
        while (x !== rB.cx) { stepTile(x, y); x += Math.sign(rB.cx - x); }
        while (y !== rB.cy) { stepTile(x, y); y += Math.sign(rB.cy - y); }
      } else {
        while (y !== rB.cy) { stepTile(x, y); y += Math.sign(rB.cy - y); }
        while (x !== rB.cx) { stepTile(x, y); x += Math.sign(rB.cx - x); }
      }
      stepTile(rB.cx, rB.cy);
    };
    for (const [a, b] of edges) carveCorridor(state.rooms[a], state.rooms[b]);

    // 3. Wrap walkable tiles with STONE WALL borders
    for (let y = 1; y < MAP_H - 1; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        if (state.grid[y][x] !== TILE.VOID) continue;
        let touchesFloor = false;
        for (let dy = -1; dy <= 1 && !touchesFloor; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const t = state.grid[y + dy][x + dx];
            if (t === TILE.FLOOR || t === TILE.SANCTUM || t === TILE.BOSS_FLOOR) { touchesFloor = true; break; }
          }
        }
        if (touchesFloor) state.grid[y][x] = TILE.WALL;
      }
    }

    // 4. Spawn Sanctum & Boss Chamber
    const spawnRoom = state.rooms[0];
    let bossRoom = state.rooms[state.rooms.length - 1];
    let maxRoomDist = -1;
    for (let i = 1; i < state.rooms.length; i++) {
      const r = state.rooms[i];
      const d = dist(spawnRoom.cx, spawnRoom.cy, r.cx, r.cy);
      if (d > maxRoomDist) { maxRoomDist = d; bossRoom = r; }
    }
    for (let y = spawnRoom.y; y < spawnRoom.y + spawnRoom.h; y++) {
      for (let x = spawnRoom.x; x < spawnRoom.x + spawnRoom.w; x++) state.grid[y][x] = TILE.SANCTUM;
    }
    for (let y = bossRoom.y; y < bossRoom.y + bossRoom.h; y++) {
      for (let x = bossRoom.x; x < bossRoom.x + bossRoom.w; x++) state.grid[y][x] = TILE.BOSS_FLOOR;
    }

    state.waypoint = { x: spawnRoom.cx + 0.5, y: spawnRoom.cy + 0.5 };
    state.stairs = { x: bossRoom.cx + 0.5, y: bossRoom.cy + 0.5, unlocked: false };

    state.player.x = spawnRoom.cx - 0.8;
    state.player.y = spawnRoom.cy + 0.8;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.dead = false;
    state.player.hp = state.player.maxHp;
    state.player.mp = state.player.maxMp;
    const camIso = worldToIso(state.player.x, state.player.y);
    state.camera.x = camIso.x;
    state.camera.y = camIso.y;

    // 5. Iron Gates (some Lever-Locked!) & Color-Coded Rune Plates + Bridges
    for (let i = 0; i < corridorTiles.length && state.gates.length < 4; i += 7) {
      const ct = corridorTiles[i];
      if (dist(ct.x, ct.y, state.waypoint.x, state.waypoint.y) < 5) continue;
      const horizPinch = state.grid[ct.y - 1]?.[ct.x] === TILE.WALL && state.grid[ct.y + 1]?.[ct.x] === TILE.WALL;
      const vertPinch = state.grid[ct.y]?.[ct.x - 1] === TILE.WALL && state.grid[ct.y]?.[ct.x + 1] === TILE.WALL;
      if ((horizPinch || vertPinch) && state.gates.every((g) => dist(g.x, g.y, ct.x + 0.5, ct.y + 0.5) > 5)) {
        const isLocked = state.gates.length === 1;
        state.gates.push({ x: ct.x + 0.5, y: ct.y + 0.5, axis: horizPinch ? 'v' : 'h', open: 0, isOpen: false, locked: isLocked });
        if (isLocked && state.rooms.length > 2) {
          const lr = state.rooms[1];
          state.levers.push({ x: lr.cx + 0.8, y: lr.cy - 0.8, pulled: false, gateIdx: state.gates.length - 1 });
        }
      }
    }

    // Color-coded Rune Plates & Teleportation Mirror Pads
    const runeColors = [
      { id: 'crimson', color: '#ef4444', label: 'Crimson' },
      { id: 'azure',   color: '#3b82f6', label: 'Azure' },
      { id: 'emerald', color: '#10b981', label: 'Emerald' }
    ];
    if (state.rooms.length >= 4) {
      for (let i = 0; i < Math.min(2, state.rooms.length - 2); i++) {
        const rm = state.rooms[i + 1];
        const rc = runeColors[i % runeColors.length];
        state.runePlates.push({ x: rm.x + 1.4, y: rm.y + 1.4, colorId: rc.id, color: rc.color, active: false });
        state.runeBridges.push({ x: rm.cx + 0.5, y: rm.cy + 0.5, colorId: rc.id, color: rc.color, unlocked: false });
      }
      const mA = state.rooms[1];
      const mB = state.rooms[Math.max(2, state.rooms.length - 2)];
      state.mirrorPads.push({ id: 'm1', x: mA.x + mA.w - 1.2, y: mA.y + 1.2, tx: mB.x + 1.2, ty: mB.y + mB.h - 1.2, cd: 0 });
      state.mirrorPads.push({ id: 'm2', x: mB.x + 1.2, y: mB.y + mB.h - 1.2, tx: mA.x + mA.w - 1.2, ty: mA.y + 1.2, cd: 0 });
    }

    // Destructible Cracked Illusion Walls hiding secret treasure caches
    if (state.rooms.length >= 3) {
      const sr = state.rooms[Math.min(2, state.rooms.length - 2)];
      const wx = sr.x + sr.w;
      const wy = sr.cy;
      if (wx < MAP_W - 3 && state.grid[wy]?.[wx] === TILE.WALL) {
        state.secretWalls.push({ x: wx + 0.5, y: wy + 0.5, gx: wx, gy: wy, broken: false });
      }
    }

    // 6. Wall Torches / Relightable Braziers & Props / Explosive Oil Barrels
    for (const r of state.rooms) {
      const corners = [
        { x: r.x + 0.5, y: r.y + 0.5 },
        { x: r.x + r.w - 0.5, y: r.y + 0.5 },
        { x: r.x + 0.5, y: r.y + r.h - 0.5 },
        { x: r.x + r.w - 0.5, y: r.y + r.h - 0.5 }
      ];
      for (const c of corners) {
        if (rng() > 0.25) {
          state.torches.push({ x: c.x, y: c.y, phase: rng() * Math.PI * 2, isArcane: r === spawnRoom, lit: true });
        }
      }
      const propCount = randInt(rng, 2, 4);
      for (let i = 0; i < propCount; i++) {
        const px = r.x + 0.7 + rng() * Math.max(1, r.w - 1.4);
        const py = r.y + 0.7 + rng() * Math.max(1, r.h - 1.4);
        if (dist(px, py, state.waypoint.x, state.waypoint.y) < 1.8) continue;
        if (dist(px, py, state.stairs.x, state.stairs.y) < 1.8) continue;
        if (dist(px, py, state.player.x, state.player.y) < 1.5) continue;
        const kind = rng() > 0.68 ? 'oil_barrel' : rng() > 0.4 ? 'urn' : 'barrel';
        state.props.push({ x: px, y: py, kind, hp: 1, broken: false });
      }
    }

    // 7. Universal Traps (Floor Spike Plates & Poison Dart Walls) & Interactive Room Events
    for (let i = 1; i < state.rooms.length; i++) {
      const r = state.rooms[i];
      if (r === bossRoom) continue;
      if (rng() < 0.65) {
        state.traps.push({
          kind: rng() < 0.6 ? 'spikes' : 'darts',
          x: r.cx + (rng() - 0.5) * 2.0,
          y: r.cy + (rng() - 0.5) * 2.0,
          timer: rng() * 2.5,
          active: false
        });
      }
      if (i === 1 && state.rooms.length > 3) {
        state.events.push({ kind: 'shrine', x: r.cx, y: r.cy + 0.9, used: false, label: 'Dungeon Shrine' });
      } else if (i === 2 && state.rooms.length > 4) {
        state.events.push({ kind: 'cursed_chest', x: r.cx, y: r.cy, used: false, label: 'Cursed Chest' });
      } else if (i === 3 && state.rooms.length > 5) {
        state.events.push({ kind: 'obelisk', x: r.cx, y: r.cy, used: false, active: false, timer: 20, wave: 0, label: 'Blood Obelisk' });
      } else if (i === 4 && state.rooms.length > 6) {
        state.events.push({ kind: 'invasion', x: r.cx, y: r.cy, used: false, shards: 3, label: 'Invasion Altar' });
      } else if (i === 5 && state.rooms.length > 7) {
        state.events.push({ kind: 'peddler', x: r.cx, y: r.cy, used: false, label: 'Goblin Peddler' });
      }
    }

    // 8. Spawn Dungeon Monsters across 11-mob roster + Treasure Goblin & Boss / Guardian
    const riftScale = state.riftTier > 0 ? (1 + state.riftTier * 0.35) : 1;
    const floorMult = (1 + (state.floor - 1) * 0.28) * riftScale;
    const isMilestone = state.floor % 3 === 0 || state.riftTier > 0;
    const pool = ['skeleton', 'archer', 'ghoul', 'bat', 'spider'];
    if (state.floor >= 2) pool.push('acolyte', 'imp', 'wraith');
    if (state.floor >= 3) pool.push('gargoyle', 'golem');

    for (const r of state.rooms) {
      if (r === spawnRoom) continue;
      if (r === bossRoom) {
        const boss = createMonster('boss', bossRoom.cx + 0.2, bossRoom.cy - 0.9, floorMult, isMilestone, rng);
        state.monsters.push(boss);
        state.monsters.push(createMonster('archer', bossRoom.x + 1.2, bossRoom.y + 1.2, floorMult, false, rng));
        state.monsters.push(createMonster(state.floor >= 2 ? 'acolyte' : 'skeleton', bossRoom.x + bossRoom.w - 1.2, bossRoom.y + bossRoom.h - 1.2, floorMult, false, rng));
        continue;
      }
      const packCount = randInt(rng, 3, 5);
      for (let i = 0; i < packCount; i++) {
        const mx = r.x + 1 + rng() * Math.max(1, r.w - 2);
        const my = r.y + 1 + rng() * Math.max(1, r.h - 2);
        const mType = pool[Math.floor(rng() * pool.length)];
        state.monsters.push(createMonster(mType, mx, my, floorMult, false, rng));
      }
      if (rng() > 0.4 || r.id % 2 === 1) {
        const elitePool = state.floor >= 3 ? ['ghoul', 'gargoyle', 'golem', 'wraith'] : ['ghoul', 'acolyte'];
        const eType = elitePool[Math.floor(rng() * elitePool.length)];
        state.monsters.push(createMonster(eType, r.cx + (rng() - 0.5) * 1.4, r.cy + (rng() - 0.5) * 1.4, floorMult, false, rng));
      }
      if (r.id === 2 && rng() < 0.8) {
        state.monsters.push(createMonster('goblin', r.cx, r.cy + 0.6, floorMult, false, rng));
      }
    }

    state.mode = 'DUNGEON';
    state.townNpcs = [];
    state.waypointArmed = false;
    state.lastFogTileX = -999;
    state.lastFogTileY = -999;
    spawnCompanionPet();
    updateFogOfWar(true);
    updateHud(true);
    const biomeName = BIOMES[state.biome]?.name || 'Crypt';
    showToast(state.riftTier > 0 ? `Abyssal Rift T${state.riftTier} • ${biomeName}` : `Floor ${state.floor} • ${biomeName}`);
  }

  function generateTown() {
    state.mode = 'TOWN';
    MAP_W = 42;
    MAP_H = 42;
    ensureMapCanvases();
    state.biome = 'crypt';
    state.floorCondition = 'calm';
    state.riftTier = 0;
    state.riftTimer = 0;
    state.grid = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W));
    state.tileVariant = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W));
    state.explored = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W));
    state.rooms = [];
    state.torches = [];
    state.gates = [];
    state.levers = [];
    state.runePlates = [];
    state.runeBridges = [];
    state.mirrorPads = [];
    state.secretWalls = [];
    state.traps = [];
    state.events = [];
    state.crystals = [];
    state.bossTelegraphs = [];
    state.props = [];
    state.monsters = [];
    state.minions = [];
    state.lootDrops = [];
    state.projectiles = [];
    state.enemyProjectiles = [];
    state.enemyPuddles = [];
    state.poisonClouds = [];
    state.particles = [];
    state.floatTexts = [];
    state.slashArcs = [];
    state.novaWaves = [];
    state.pendingLootTarget = null;
    state.moveTarget = null;
    state.killStreak = 0;
    state.streakTimer = 0;
    state.draftOpen = false;
    state.streakTimer = 0;
    state.draftOpen = false;
    state.stairs = { x: 0, y: 0, unlocked: false };

    const minX = 11, maxX = 30, minY = 11, maxY = 30;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const isBorder = x === minX || x === maxX || y === minY || y === maxY;
        if (isBorder) state.grid[y][x] = TILE.WALL;
        else {
          const inPlaza = x >= 18 && x <= 23 && y >= 18 && y <= 23;
          state.grid[y][x] = inPlaza ? TILE.SANCTUM : TILE.FLOOR;
          state.tileVariant[y][x] = (x + y) % 3;
        }
        state.explored[y][x] = 2;
      }
    }

    state.waypoint = { x: 20.5, y: 20.5 };
    state.player.x = 20.5;
    state.player.y = 22.8;
    state.player.dead = false;
    state.player.chillTimer = 0;
    state.player.hp = state.player.maxHp;
    state.player.mp = state.player.maxMp;
    const camIso = worldToIso(state.player.x, state.player.y);
    state.camera.x = camIso.x;
    state.camera.y = camIso.y;

    const lanternCoords = [
      { x: 13.5, y: 13.5 }, { x: 27.5, y: 13.5 },
      { x: 13.5, y: 27.5 }, { x: 27.5, y: 27.5 },
      { x: 18.2, y: 18.2 }, { x: 22.8, y: 18.2 },
      { x: 18.2, y: 22.8 }, { x: 22.8, y: 22.8 }
    ];
    for (let i = 0; i < lanternCoords.length; i++) {
      state.torches.push({ x: lanternCoords[i].x, y: lanternCoords[i].y, phase: i * 0.9, isArcane: false, lit: true });
    }
    state.torches.push({ x: 20.5, y: 20.5, phase: 0.4, isArcane: true, lit: true });

    state.townNpcs = [
      { id: 'blacksmith', label: 'Blacksmith Forge', short: 'FORGE',   x: 15.5, y: 16.5, color: '#f97316' },
      { id: 'stash',      label: 'Hero Stash',       short: 'STASH',   x: 25.5, y: 16.5, color: '#facc15' },
      { id: 'apothecary', label: 'Alchemist',        short: 'ALCHEMY', x: 15.5, y: 25.5, color: '#4ade80' },
      { id: 'bounties',   label: 'Bounty Board',     short: 'BOUNTY',  x: 25.5, y: 25.5, color: '#fbbf24' },
      { id: 'pets',       label: 'Pet Sanctuary',    short: 'PETS',    x: 20.5, y: 14.5, color: '#f43f5e' },
      { id: 'waypoint',   label: 'Waypoint Portal',  short: 'PORTAL',  x: 20.5, y: 20.5, color: '#60a5fa' }
    ];

    state.fogDirty = true;
    state.lastFogTileX = Math.floor(state.player.x);
    state.lastFogTileY = Math.floor(state.player.y);
    spawnCompanionPet();
    refreshBlacksmithStock();
    updateHud(true);
    showToast('Shadowhaven Sanctuary — Vitals Restored');
  }

  function createMonster(type, x, y, floorMult, isGuardian = false, rng = Math.random) {
    const specs = {
      skeleton: { name: 'Crypt Skeleton',   maxHp: Math.round(44 * floorMult),  atk: Math.round(8 * floorMult),  speed: 2.35, range: 1.05, aggro: 8.5, cd: 1.15, xp: Math.round(24 * floorMult),  radius: 0.34, tier: 'normal' },
      archer:   { name: 'Skeleton Archer',  maxHp: Math.round(36 * floorMult),  atk: Math.round(9 * floorMult),  speed: 2.1,  range: 6.4,  aggro: 9.5, cd: 1.65, xp: Math.round(28 * floorMult),  radius: 0.32, tier: 'normal', ranged: true, projKind: 'arrow', projCol: '#cbd5e1' },
      ghoul:    { name: 'Plague Ghoul',     maxHp: Math.round(92 * floorMult),  atk: Math.round(14 * floorMult), speed: 3.15, range: 1.15, aggro: 9.0, cd: 0.95, xp: Math.round(58 * floorMult),  radius: 0.38, tier: 'elite' },
      bat:      { name: 'Blood Bat Swarm',  maxHp: Math.round(28 * floorMult),  atk: Math.round(7 * floorMult),  speed: 3.85, range: 0.95, aggro: 9.5, cd: 0.8,  xp: Math.round(20 * floorMult),  radius: 0.28, tier: 'normal' },
      spider:   { name: 'Blight Spider',    maxHp: Math.round(48 * floorMult),  atk: Math.round(10 * floorMult), speed: 3.0,  range: 4.5,  aggro: 9.0, cd: 1.8,  xp: Math.round(30 * floorMult),  radius: 0.34, tier: 'normal', ranged: true, projKind: 'web', projCol: '#a3e635' },
      acolyte:  { name: 'Cultist Acolyte',  maxHp: Math.round(56 * floorMult),  atk: Math.round(12 * floorMult), speed: 2.0,  range: 6.8,  aggro: 9.5, cd: 1.75, xp: Math.round(42 * floorMult),  radius: 0.34, tier: 'normal', ranged: true, projKind: 'dark', projCol: '#c084fc' },
      imp:      { name: 'Cinder Imp',       maxHp: Math.round(42 * floorMult),  atk: Math.round(11 * floorMult), speed: 2.8,  range: 5.5,  aggro: 9.0, cd: 1.55, xp: Math.round(36 * floorMult),  radius: 0.3,  tier: 'normal', ranged: true, projKind: 'ember', projCol: '#f97316' },
      wraith:   { name: 'Gloom Wraith',     maxHp: Math.round(72 * floorMult),  atk: Math.round(14 * floorMult), speed: 2.6,  range: 1.2,  aggro: 10,  cd: 1.0,  xp: Math.round(52 * floorMult),  radius: 0.35, tier: 'elite' },
      gargoyle: { name: 'Obsidian Gargoyle',maxHp: Math.round(135 * floorMult), atk: Math.round(17 * floorMult), speed: 1.85, range: 1.35, aggro: 9.0, cd: 1.35, xp: Math.round(78 * floorMult),  radius: 0.42, tier: 'elite' },
      golem:    { name: 'Flesh Golem',      maxHp: Math.round(175 * floorMult), atk: Math.round(20 * floorMult), speed: 1.55, range: 1.45, aggro: 8.5, cd: 1.6,  xp: Math.round(92 * floorMult),  radius: 0.46, tier: 'elite' },
      goblin:   { name: 'Treasure Goblin',  maxHp: Math.round(78 * floorMult),  atk: 0,                          speed: 4.35, range: 0.8,  aggro: 7.5, cd: 2.0,  xp: Math.round(90 * floorMult),  radius: 0.32, tier: 'goblin' },
      rival:    { name: 'Shadow Rival',     maxHp: Math.round(190 * floorMult), atk: Math.round(19 * floorMult), speed: 3.4,  range: 1.25, aggro: 11,  cd: 0.85, xp: Math.round(140 * floorMult), radius: 0.4,  tier: 'elite' },
      boss:     { name: 'Horned Demon Brute',maxHp: Math.round(340 * floorMult),atk: Math.round(24 * floorMult), speed: 2.1,  range: 1.45, aggro: 9.5, cd: 1.45, xp: Math.round(240 * floorMult), radius: 0.52, tier: 'boss' }
    };
    const s = specs[type] || specs.skeleton;
    const affixKeys = Object.keys(ELITE_AFFIXES);
    const affixes = [];
    if (s.tier === 'elite') {
      affixes.push(affixKeys[Math.floor(rng() * affixKeys.length)]);
    } else if (type === 'boss') {
      const count = isGuardian ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const pick = affixKeys[Math.floor(rng() * affixKeys.length)];
        if (!affixes.includes(pick)) affixes.push(pick);
      }
    }

    let name = s.name, maxHp = s.maxHp, speed = s.speed, cd = s.cd, xp = s.xp;
    if (isGuardian && type === 'boss') {
      const gIdx = Math.floor((Math.max(1, state.floor) / 3) % FLOOR_GUARDIANS.length);
      name = FLOOR_GUARDIANS[gIdx];
      maxHp = Math.round(maxHp * 1.45);
      xp = Math.round(xp * 1.6);
    }
    if (affixes.includes('fast')) { speed *= 1.35; cd *= 0.78; }

    return {
      id: Math.random().toString(36).slice(2, 9),
      type, name, affixes, ranged: Boolean(s.ranged), projKind: s.projKind || null, projCol: s.projCol || '#ef4444',
      isGuardian: Boolean(isGuardian && type === 'boss'),
      x, y, hp: maxHp, maxHp, atk: s.atk, speed, range: s.range, aggro: s.aggro,
      atkCdMax: cd, atkCd: 0.35 + rng() * 0.4, xp, radius: s.radius, tier: s.tier,
      facingX: 0, facingY: 1, walkPhase: rng() * Math.PI * 2,
      hitFlash: 0, stunTimer: 0, windupTimer: 0, slamTelegraph: 0,
      specialCd: 2.2 + rng() * 1.5, bladeHitCd: 0,
      stagger: 0, maxStagger: type === 'boss' ? 100 : 0, staggeredTimer: 0,
      phase: 1, bossComboStep: 0, bossCastCd: 2.2,
      statuses: { burn: 0, chill: 0, chillStacks: 0, bleed: 0, poison: 0 },
      vx: 0, vy: 0, engaged: false
    };
  }

  // =========================================================================
  // COLLISION & FOG OF WAR
  // =========================================================================
  function isTileWalkable(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
    const t = state.grid[ty][tx];
    return t === TILE.FLOOR || t === TILE.SANCTUM || t === TILE.BOSS_FLOOR;
  }

  function isPositionClear(wx, wy, radius) {
    const minX = Math.floor(wx - radius);
    const maxX = Math.floor(wx + radius);
    const minY = Math.floor(wy - radius);
    const maxY = Math.floor(wy + radius);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (!isTileWalkable(x, y)) return false;
      }
    }
    return true;
  }

  function moveWithSlide(entity, dx, dy, radius) {
    if (dx !== 0 && isPositionClear(entity.x + dx, entity.y, radius)) {
      entity.x += dx;
    }
    if (dy !== 0 && isPositionClear(entity.x, entity.y + dy, radius)) {
      entity.y += dy;
    }
  }

  const fogLightCanvas = makeCanvas(MAP_W * 4, MAP_H * 4);
  const fogLightCtx = fogLightCanvas.getContext('2d');
  const minimapStaticCanvas = makeCanvas(144, 144);
  const minimapStaticCtx = minimapStaticCanvas.getContext('2d');

  function rebuildFogAndMinimapCache() {
    const fw = fogLightCanvas.width;
    const fh = fogLightCanvas.height;
    fogLightCtx.clearRect(0, 0, fw, fh);
    fogLightCtx.fillStyle = 'rgba(4, 5, 9, 0.72)';
    fogLightCtx.fillRect(0, 0, fw, fh);
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const exp = state.explored[y][x];
        if (exp === 2) {
          fogLightCtx.clearRect(x * 4, y * 4, 4, 4);
        } else if (exp === 1) {
          fogLightCtx.clearRect(x * 4, y * 4, 4, 4);
          fogLightCtx.fillStyle = 'rgba(4, 5, 9, 0.45)';
          fogLightCtx.fillRect(x * 4, y * 4, 4, 4);
        }
      }
    }

    const mw = minimapStaticCanvas.width;
    const mh = minimapStaticCanvas.height;
    const cellW = mw / MAP_W;
    const cellH = mh / MAP_H;
    minimapStaticCtx.clearRect(0, 0, mw, mh);
    minimapStaticCtx.fillStyle = 'rgba(7, 8, 12, 0.92)';
    minimapStaticCtx.fillRect(0, 0, mw, mh);

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const exp = state.explored[y][x];
        if (!exp) continue;
        const t = state.grid[y][x];
        if (t === TILE.WALL) {
          minimapStaticCtx.fillStyle = exp === 2 ? '#475569' : '#262d3d';
        } else if (t !== TILE.VOID) {
          minimapStaticCtx.fillStyle = exp === 2 ? '#1e293b' : '#111622';
        } else {
          continue;
        }
        minimapStaticCtx.fillRect(x * cellW, y * cellH, Math.ceil(cellW), Math.ceil(cellH));
      }
    }
    state.fogDirty = false;
  }

  function updateFogOfWar(force = false) {
    if (state.mode === 'TOWN') {
      if (force || state.fogDirty) rebuildFogAndMinimapCache();
      return;
    }
    const px = Math.floor(state.player.x);
    const py = Math.floor(state.player.y);
    if (!force && px === state.lastFogTileX && py === state.lastFogTileY) return;
    state.lastFogTileX = px;
    state.lastFogTileY = py;

    const visR = 8;
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (state.explored[y][x] === 2) state.explored[y][x] = 1;
      }
    }

    const minY = Math.max(0, py - visR);
    const maxY = Math.min(MAP_H - 1, py + visR);
    const minX = Math.max(0, px - visR);
    const maxX = Math.min(MAP_W - 1, px + visR);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if ((px - x) * (px - x) + (py - y) * (py - y) <= visR * visR) {
          state.explored[y][x] = 2;
        }
      }
    }
    state.fogDirty = true;
    rebuildFogAndMinimapCache();
  }

  // =========================================================================
  // LOOT GENERATION & PICKUP
  // =========================================================================
  const ITEM_NAMES = {
    weapon:  { magic: ['Rune-Etched Gladius', 'Yew Longbow', 'Bonechannel Wand'], rare: ['Sunfire Claymore', 'Hawkeye Repeater', 'Soulreaver Staff'], legendary: ['Dawnbreaker Executioner', 'Ashen Verdict'], set: ['Cryptguard Cleaver', 'Nightstalker Bow', 'Soulbinder Scythe'] },
    offhand: { magic: ['Iron Buckler', 'Leather Quiver', 'Runed Skull'], rare: ['Aegis Shield', 'Serrated Quiver', 'Abyssal Focus'], legendary: ['Bulwark of St. Valen', 'Tome of Eternal Night'], set: ['Cryptguard Tower', 'Nightstalker Quiver', 'Soulbinder Grimoire'] },
    helm:    { magic: ['Ironwarden Visor', 'Ranger Hood', 'Bone Circlet'], rare: ['Seraphic Sallet', 'Shadow Cowl', 'Cryptlord Casque'], legendary: ['Crown of the Undying Sun', 'Obsidian Halo'], set: ['Cryptguard Helm', 'Nightstalker Mask', 'Soulbinder Crown'] },
    armor:   { magic: ['Tempered Brigandine', 'Scout Jerkin', 'Warded Vestment'], rare: ['Cathedral Aegis', 'Bloodforged Cuirass', 'Sentinel Plate'], legendary: ['Archangel Bastion', 'Shroud of St. Valen'], set: ['Cryptguard Plate', 'Nightstalker Coat', 'Soulbinder Robes'] },
    boots:   { magic: ['Ironshod Treads', 'Swift Striders', 'Ash Walkers'], rare: ['Gale Sabatons', 'Shadowstep Boots', 'Gravewarden Greaves'], legendary: ['Phantom Stride', 'Hellfire Treads'], set: ['Cryptguard Sabatons', 'Nightstalker Boots', 'Soulbinder Slippers'] },
    ring:    { magic: ['Silver Signet', 'Sapphire Band', 'Oath Ring'], rare: ['Crimson Seal', 'Wraithbone Loop', 'Sunstone Band'], legendary: ['Sovereign Signet of Light', 'Hellfire Coil'], set: ['Cryptguard Signet', 'Nightstalker Loop', 'Soulbinder Band'] },
    amulet:  { magic: ['Bone Pendant', 'Amber Talisman', 'Iron Locket'], rare: ['Bloodstone Choker', 'Moonlight Charm', 'Dread Amulet'], legendary: ['Heart of Shadowhaven', 'Tear of the Abyss'], set: ['Cryptguard Gorget', 'Nightstalker Charm', 'Soulbinder Relic'] }
  };

  function generateItem(rarity, forcedSlot = null) {
    const slot = forcedSlot || SLOTS[Math.floor(Math.random() * SLOTS.length)];
    const names = ITEM_NAMES[slot]?.[rarity] || ITEM_NAMES[slot].magic;
    const nameIdx = Math.floor(Math.random() * names.length);
    const name = names[nameIdx];
    const scale = 1 + (state.floor - 1) * 0.26 + (state.riftTier || 0) * 0.22;
    const mult = rarity === 'legendary' ? 2.2 : rarity === 'set' ? 1.85 : rarity === 'rare' ? 1.55 : rarity === 'magic' ? 1.12 : 0.85;

    const stats = {};
    let weaponType = null;
    if (slot === 'weapon') {
      const wKeys = Object.keys(WEAPON_TYPES);
      weaponType = wKeys[Math.floor(Math.random() * wKeys.length)];
      stats.atk = Math.round((8 + Math.random() * 8) * scale * mult);
      stats.crit = Math.round((2 + Math.random() * 4) * mult * 10) / 10;
      if (rarity !== 'magic' && rarity !== 'common') stats.loh = Math.round((2 + Math.random() * 4) * scale * mult);
    } else if (slot === 'offhand') {
      stats.atk = Math.round((4 + Math.random() * 5) * scale * mult);
      stats.arm = Math.round((3 + Math.random() * 4) * scale * mult);
      stats.hp = Math.round((14 + Math.random() * 14) * scale * mult);
    } else if (slot === 'helm' || slot === 'armor') {
      stats.hp = Math.round((24 + Math.random() * 20) * scale * mult);
      stats.arm = Math.round((4 + Math.random() * 5) * scale * mult);
      if (rarity === 'legendary' || rarity === 'set') stats.loh = Math.round((3 + Math.random() * 4) * scale);
    } else if (slot === 'boots') {
      stats.arm = Math.round((2 + Math.random() * 4) * scale * mult);
      stats.spd = Math.round((4 + Math.random() * 5) * mult);
      stats.hp = Math.round((12 + Math.random() * 12) * scale * mult);
    } else {
      stats.atk = Math.round((4 + Math.random() * 6) * scale * mult);
      stats.crit = Math.round((2.5 + Math.random() * 4.5) * mult * 10) / 10;
      if (rarity !== 'magic') stats.loh = Math.round((3 + Math.random() * 4) * scale * mult);
    }

    const setIds = Object.keys(SET_DEFS);
    const setId = rarity === 'set' ? setIds[nameIdx % setIds.length] : null;

    return {
      id: 'itm_' + Math.random().toString(36).slice(2, 10),
      name, slot, weaponType, rarity, setId, stats,
      sockets: 0, gems: []
    };
  }

  function generateGem(gemId = null) {
    const keys = Object.keys(GEM_DEFS);
    const k = gemId || keys[Math.floor(Math.random() * keys.length)];
    const def = GEM_DEFS[k];
    return { id: 'gem_' + Math.random().toString(36).slice(2, 9), kind: 'gem', gemId: k, name: `${def.name} Gem`, rarity: 'rare', desc: def.desc };
  }

  function spawnLootDrop(wx, wy, sourceTier = 'normal') {
    const roll = Math.random();
    const angle = Math.random() * Math.PI * 2;
    const spread = 0.35 + Math.random() * 0.55;
    const tx = clamp(wx + Math.cos(angle) * spread, 1.5, MAP_W - 2.5);
    const ty = clamp(wy + Math.sin(angle) * spread, 1.5, MAP_H - 2.5);
    const destX = isPositionClear(tx, ty, 0.25) ? tx : wx;
    const destY = isPositionClear(tx, ty, 0.25) ? ty : wy;

    const pushDrop = (drop) => {
      state.lootDrops.push(Object.assign({ x: wx, y: wy, destX, destY, z: 18, vz: 95, age: 0, screenRect: null }, drop));
    };

    const goldMult = getHeroStats().goldBonus;
    if (sourceTier === 'guardian') {
      pushDrop({ kind: 'xp_gem', amount: Math.round(45 * state.floor), label: 'Boss Soul Shard' });
      pushDrop({ kind: 'gold', amount: Math.round((95 + Math.random() * 50) * state.floor * goldMult), label: 'Guardian Chest' });
      pushDrop({ kind: 'potion', amount: 2, label: 'Crimson Vials' });
      pushDrop({ kind: 'essence', amount: 3, label: '3 Monster Essence' });
      const leg = generateItem(Math.random() < 0.35 ? 'set' : 'legendary');
      pushDrop({ kind: 'gear', item: leg, rarity: leg.rarity, label: leg.name });
      sfx.legendary();
      return;
    }

    if (sourceTier === 'boss' || sourceTier === 'goblin') {
      pushDrop({ kind: 'xp_gem', amount: Math.round(32 * state.floor), label: 'Soul Shard' });
      pushDrop({ kind: 'gold', amount: Math.round((55 + Math.random() * 40) * state.floor * goldMult), label: sourceTier === 'goblin' ? 'Goblin Hoard' : 'Boss Hoard' });
      pushDrop({ kind: 'essence', amount: 2, label: '2 Monster Essence' });
      const rRoll = Math.random();
      const gearRarity = rRoll < 0.32 ? 'legendary' : rRoll < 0.55 ? 'set' : 'rare';
      const item = generateItem(gearRarity);
      pushDrop({ kind: 'gear', item, rarity: gearRarity, label: item.name });
      if (gearRarity === 'legendary' || gearRarity === 'set') sfx.legendary();
      return;
    }

    if (sourceTier === 'elite') {
      pushDrop({ kind: 'xp_gem', amount: Math.round(18 * (1 + state.floor * 0.25)), label: 'Soul Shard' });
      pushDrop({ kind: 'gold', amount: Math.round((20 + Math.random() * 20) * state.floor * goldMult), label: 'Gold Coins' });
      if (Math.random() < 0.4) pushDrop({ kind: 'essence', amount: 1, label: 'Monster Essence' });
      const rarity = roll < 0.14 ? 'legendary' : roll < 0.28 ? 'set' : roll < 0.62 ? 'rare' : 'magic';
      const item = generateItem(rarity);
      pushDrop({ kind: 'gear', item, rarity, label: item.name });
      if (rarity === 'legendary' || rarity === 'set') sfx.legendary();
      return;
    }

    if (sourceTier === 'prop') {
      if (roll < 0.55) {
        const amt = Math.round((6 + Math.random() * 10) * state.floor * goldMult);
        pushDrop({ kind: 'gold', amount: amt, label: `${amt} Gold` });
      } else if (roll < 0.78) {
        pushDrop({ kind: 'potion', amount: 1, label: 'Health Potion' });
      } else {
        const rarity = Math.random() < 0.25 ? 'rare' : 'magic';
        const item = generateItem(rarity);
        pushDrop({ kind: 'gear', item, rarity, label: item.name });
      }
      return;
    }

    pushDrop({ kind: 'xp_gem', amount: Math.round(10 * (1 + state.floor * 0.22)), label: 'Soul Shard' });
    if (roll < 0.42) {
      const amt = Math.round((8 + Math.random() * 14) * state.floor * goldMult);
      pushDrop({ kind: 'gold', amount: amt, label: `${amt} Gold` });
    } else if (roll < 0.52) {
      pushDrop({ kind: 'potion', amount: 1, label: 'Health Potion' });
    } else if (roll < 0.84) {
      const rarity = roll > 0.81 ? 'legendary' : roll > 0.77 ? 'set' : roll > 0.68 ? 'rare' : 'magic';
      const item = generateItem(rarity);
      pushDrop({ kind: 'gear', item, rarity, label: item.name });
      if (rarity === 'legendary' || rarity === 'set') sfx.legendary();
    }
  }

  function passesLootFilter(drop) {
    if (!drop || drop.kind !== 'gear') return true;
    if (drop.rarity === 'legendary' || drop.rarity === 'set') return true;
    if (state.lootFilter === 'rare') return drop.rarity === 'rare';
    if (state.lootFilter === 'magic') return drop.rarity === 'magic' || drop.rarity === 'rare';
    return true;
  }

  function collectLootDrop(dropIdx) {
    const drop = state.lootDrops[dropIdx];
    if (!drop) return false;
    const p = state.player;

    if (drop.kind === 'xp_gem') {
      const mult = getStreakMultiplier();
      const gained = Math.round(drop.amount * mult);
      addFloatText(drop.x, drop.y, `+${gained} XP`, '#4ade80', false);
      sfx.loot();
      state.lootDrops.splice(dropIdx, 1);
      grantXp(gained);
      updateHud();
      return true;
    }

    if (drop.kind === 'gold') {
      p.gold += drop.amount;
      addFloatText(drop.x, drop.y, `+${drop.amount} Gold`, '#facc15', false);
      sfx.loot();
      state.lootDrops.splice(dropIdx, 1);
      updateHud();
      saveProgress();
      return true;
    }

    if (drop.kind === 'potion') {
      p.potions += drop.amount;
      addFloatText(drop.x, drop.y, `+${drop.amount} Potion`, '#fca5a5', false);
      sfx.potion();
      state.lootDrops.splice(dropIdx, 1);
      updateHud();
      saveProgress();
      return true;
    }

    if (drop.kind === 'essence') {
      p.essence += drop.amount;
      addFloatText(drop.x, drop.y, `+${drop.amount} Essence`, '#c084fc', false);
      sfx.loot();
      state.lootDrops.splice(dropIdx, 1);
      updateHud();
      saveProgress();
      return true;
    }

    if (drop.kind === 'gear' || drop.kind === 'gem') {
      if (p.bag.length >= MAX_BAG_SLOTS) {
        showToast('Satchel full! Salvage gear in Bag or Forge.');
        return false;
      }
      p.bag.push(drop.item);
      const rColor = RARITY[drop.rarity]?.color || '#60a5fa';
      addFloatText(drop.x, drop.y, drop.item.name, rColor, drop.rarity === 'legendary' || drop.rarity === 'set');
      if (drop.rarity === 'legendary' || drop.rarity === 'set') {
        showToast(`${RARITY[drop.rarity].label} Found: ${drop.item.name}!`);
        sfx.legendary();
      } else {
        sfx.loot();
      }
      state.lootDrops.splice(dropIdx, 1);
      updateHud();
      saveProgress();
      return true;
    }
    return false;
  }

  // =========================================================================
  // COMBAT, SKILLS, ULTIMATES, PETS, MINIONS & ELEMENTAL COMBOS
  // =========================================================================
  function addFloatText(wx, wy, text, color, isCrit = false) {
    state.floatTexts.push({ x: wx, y: wy, z: 36, vy: 38, text, color, isCrit, life: isCrit ? 1.05 : 0.78, maxLife: isCrit ? 1.05 : 0.78 });
  }

  function spawnParticles(wx, wy, color, count = 8, speed = 2.4, zStart = 18) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (0.4 + Math.random() * 0.8) * speed;
      state.particles.push({ x: wx, y: wy, z: zStart, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, vz: 30 + Math.random() * 55, color, size: 2.2 + Math.random() * 2.5, life: 0.35 + Math.random() * 0.3, maxLife: 0.65 });
    }
  }

  function getStreakMultiplier() {
    if (state.killStreak >= 20) return 2.5;
    if (state.killStreak >= 10) return 1.8;
    if (state.killStreak >= 5) return 1.35;
    return 1.0;
  }

  function grantXp(amount) {
    const p = state.player;
    p.xp += Math.round(amount * getStreakMultiplier());
    let leveledUp = false;
    while (p.xp >= p.nextXp) {
      p.xp -= p.nextXp;
      p.level += 1;
      p.nextXp = Math.round(p.nextXp * 1.38);
      p.skillPoints += 1;
      if (p.level % 2 === 0) p.masteryPoints += 1;
      syncPlayerVitalsBounds();
      p.hp = p.maxHp;
      p.mp = p.maxMp;
      p.potions += 1;
      leveledUp = true;
      sfx.lvl();
      spawnParticles(p.x, p.y, '#facc15', 22, 3.6, 20);
      addFloatText(p.x, p.y, `LEVEL ${p.level}!`, '#fde047', true);
    }
    if (leveledUp && state.mode === 'DUNGEON' && !state.draftOpen) {
      openLevelUpDraft(false);
    }
    saveProgress();
  }

  function openLevelUpDraft(isBossEvolution = false) {
    if (!dom.levelUpDraftModal || !dom.draftCardsGrid) return;
    const p = state.player;
    const cls = HERO_CLASSES[state.heroClass] || HERO_CLASSES.paladin;
    state.draftOpen = true;

    const pool = [];
    if (isBossEvolution) {
      for (const sid of [1, 2, 3]) {
        const sk = cls.skills[sid];
        if (!state.awakenedSkills[sid]) {
          pool.push({
            tag: 'AWAKENED EVOLUTION',
            title: `Awakened ${sk.name}`,
            desc: `${sk.name} gains +45% power, wider AoE & bonus fury strikes!`,
            apply: () => { state.awakenedSkills[sid] = true; p.skillRanks[sid] = Math.min(5, (p.skillRanks[sid] || 1) + 1); }
          });
        }
      }
      pool.push(
        { tag: 'AUTO-WEAPON', title: 'Overclocked Bone Blades', desc: '+1 Bone Blade Lv & +15% Attack Speed.', apply: () => { state.autoWeapons.boneBlades = Math.min(3, (state.autoWeapons.boneBlades || 0) + 1); state.runPassives.atkSpeedPct += 0.15; } },
        { tag: 'AUTO-WEAPON', title: 'Stormcore Awakening', desc: '+1 Chain Lightning Lv & +14% Attack Power.', apply: () => { state.autoWeapons.chainLightning = Math.min(3, (state.autoWeapons.chainLightning || 0) + 1); state.runPassives.atkPct += 0.14; } },
        { tag: 'RELIC BLESSING', title: 'Infernal Ember Mantle', desc: '+1 Ember Aura Lv & +50 Max HP.', apply: () => { state.autoWeapons.emberAura = Math.min(3, (state.autoWeapons.emberAura || 0) + 1); state.runPassives.hpBonus += 50; } }
      );
    } else {
      for (const sid of [1, 2, 3]) {
        const sk = cls.skills[sid];
        const rk = p.skillRanks[sid] || 1;
        if (rk < 5) {
          pool.push({
            tag: 'SKILL UPGRADE',
            title: `${sk.name} +1`,
            desc: `Rank ${rk} → ${rk + 1}: +18% skill damage & impact.`,
            apply: () => { p.skillRanks[sid] = rk + 1; }
          });
        }
      }
      pool.push(
        { tag: 'AUTO-WEAPON', title: `Orbiting Bone Blades (Lv ${(state.autoWeapons.boneBlades || 0) + 1})`, desc: 'Spinning skeletal blades slice enemies around you automatically.', apply: () => { state.autoWeapons.boneBlades = Math.min(3, (state.autoWeapons.boneBlades || 0) + 1); } },
        { tag: 'AUTO-WEAPON', title: `Chain Lightning (Lv ${(state.autoWeapons.chainLightning || 0) + 1})`, desc: 'Periodic storm arcs zap 3+ nearby foes.', apply: () => { state.autoWeapons.chainLightning = Math.min(3, (state.autoWeapons.chainLightning || 0) + 1); } },
        { tag: 'AUTO-WEAPON', title: `Ember Aura (Lv ${(state.autoWeapons.emberAura || 0) + 1})`, desc: 'Continuous fire ring scorches & burns nearby enemies.', apply: () => { state.autoWeapons.emberAura = Math.min(3, (state.autoWeapons.emberAura || 0) + 1); } },
        { tag: 'PASSIVE', title: 'Crimson Might', desc: '+14% Attack Damage & +6% Crit Chance.', apply: () => { state.runPassives.atkPct += 0.14; state.runPassives.critPct += 6; } },
        { tag: 'PASSIVE', title: 'Frenzy Zeal', desc: '+14% Attack Speed & +10% Move Speed.', apply: () => { state.runPassives.atkSpeedPct += 0.14; state.runPassives.speedPct += 0.1; } },
        { tag: 'PASSIVE', title: 'Soul Magnet & Vigor', desc: '+40% Pickup Magnet Radius & +40 Max HP.', apply: () => { state.runPassives.magnetPct += 0.4; state.runPassives.hpBonus += 40; } }
      );
    }

    // Shuffle and pick 3 distinct options
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    const choices = pool.slice(0, 3);

    if (dom.draftPill) dom.draftPill.textContent = isBossEvolution ? 'BOSS CHEST EVOLUTION' : `LEVEL ${p.level} REACHED`;
    if (dom.draftTitle) dom.draftTitle.textContent = isBossEvolution ? 'Awaken a Super-Skill' : 'Choose Your Upgrade';
    if (dom.draftSubtitle) dom.draftSubtitle.textContent = isBossEvolution ? 'Boss Slayer Relic — Select 1 Awakened Blessing' : 'Tap 1 card to power up & resume combat';

    dom.draftCardsGrid.innerHTML = '';
    for (const card of choices) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'draft-option-card' + (isBossEvolution ? ' evolved' : '');
      btn.innerHTML = `<span class="draft-card-tag">${card.tag}</span><span class="draft-card-title">${card.title}</span><span class="draft-card-desc">${card.desc}</span>`;
      btn.addEventListener('click', () => {
        card.apply();
        syncPlayerVitalsBounds();
        p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.25));
        sfx.lvl();
        state.draftOpen = false;
        if (dom.levelUpDraftModal.open) dom.levelUpDraftModal.close();
        updateHud(true);
        saveHeroProfile();
        showToast(`Unlocked: ${card.title}!`);
      });
      dom.draftCardsGrid.appendChild(btn);
    }
    if (!dom.levelUpDraftModal.open) dom.levelUpDraftModal.showModal();
  }

  function advanceBounty(type, amt = 1) {
    for (const b of state.account.bounties || []) {
      if (!b.claimed && b.type === type && b.prog < b.target) {
        b.prog = Math.min(b.target, b.prog + amt);
        if (b.prog >= b.target) showToast(`Bounty Ready: ${b.title}!`);
      }
    }
  }

  function applyStatus(m, type, dur = 3.5) {
    if (!m || !m.statuses) return;
    if (type === 'chill') {
      m.statuses.chill = Math.max(m.statuses.chill, dur);
      m.statuses.chillStacks = Math.min(2, (m.statuses.chillStacks || 0) + 1);
      if (m.statuses.chillStacks >= 2 && m.tier !== 'boss') {
        m.stunTimer = Math.max(m.stunTimer, 1.4);
        m.statuses.chillStacks = 0;
        addFloatText(m.x, m.y, 'FROZEN!', '#38bdf8', false);
      }
    } else {
      m.statuses[type] = Math.max(m.statuses[type] || 0, dur);
    }

    // Elemental Status Combos!
    if (m.statuses.burn > 0 && m.statuses.poison > 0) {
      m.statuses.burn = 0;
      m.statuses.poison = 0;
      addFloatText(m.x, m.y, 'VENOM BLAST!', '#a3e635', true);
      state.novaWaves.push({ x: m.x, y: m.y, r: 0.3, maxR: 2.0, color: '#a3e635', life: 0.25, maxLife: 0.25 });
      damageMonster(m, getHeroStats().atk * 1.9, 0, 0, true, 12);
    } else if ((m.statuses.chill > 0 || m.stunTimer > 0) && m.statuses.bleed > 0) {
      m.statuses.chill = 0;
      m.statuses.bleed = 0;
      addFloatText(m.x, m.y, 'SHATTER!', '#60a5fa', true);
      spawnParticles(m.x, m.y, '#93c5fd', 14, 3.2);
      damageMonster(m, getHeroStats().atk * 2.1, 0, 0, true, 18);
    }
  }

  function damageMonster(m, rawDmg, knockDirX, knockDirY, canCrit = true, staggerGain = 6) {
    if (!m || m.hp <= 0) return;
    const stats = getHeroStats();
    const isCrit = canCrit && Math.random() * 100 < stats.crit;
    let dmg = Math.max(1, Math.round(rawDmg * (isCrit ? stats.critDmg : 0.92 + Math.random() * 0.16)));

    // Phase 2 Invulnerability Ritual Crystals give Boss 90% damage reduction
    if (m.type === 'boss' && state.crystals.length > 0) {
      dmg = Math.max(1, Math.round(dmg * 0.1));
    } else if (m.type === 'boss' && m.staggeredTimer > 0) {
      dmg = Math.round(dmg * 1.3);
    }

    m.hp -= dmg;
    m.hitFlash = 0.14;
    m.engaged = true;
    if (m.tier !== 'boss') {
      m.vx += knockDirX * 3.4;
      m.vy += knockDirY * 3.4;
    } else {
      if (window.CryptCoop && window.CryptCoop.active && !window.CryptCoop.isHost) {
        window.CryptCoop.sendBossHit(dmg);
      }
      if (m.staggeredTimer <= 0 && m.maxStagger > 0) {
        m.stagger = Math.min(m.maxStagger, m.stagger + staggerGain);
        if (m.stagger >= m.maxStagger) {
          m.stagger = 0;
          m.staggeredTimer = 2.5;
          m.slamTelegraph = 0;
          state.bossTelegraphs = [];
          sfx.crit();
          addFloatText(m.x, m.y, 'STAGGERED!', '#fde047', true);
          showToast(`${m.name} Staggered for 2.5s (+30% DMG)!`);
        }
      }
      // Phase 2 at 50% HP: AoE knockback + spawn 2-3 Ritual Crystals
      if (m.phase === 1 && m.hp > 0 && m.hp <= m.maxHp * 0.5) {
        m.phase = 2;
        state.camera.shake = 8;
        state.novaWaves.push({ x: m.x, y: m.y, r: 0.4, maxR: 3.4, color: '#ef4444', life: 0.35, maxLife: 0.35 });
        const count = m.isGuardian ? 3 : 2;
        for (let c = 0; c < count; c++) {
          const ang = (Math.PI * 2 * c) / count;
          const cx = clamp(m.x + Math.cos(ang) * 3.2, 2, MAP_W - 3);
          const cy = clamp(m.y + Math.sin(ang) * 3.2, 2, MAP_H - 3);
          state.crystals.push({ x: isPositionClear(cx, cy, 0.3) ? cx : m.x, y: isPositionClear(cx, cy, 0.3) ? cy : m.y, hp: Math.round(m.maxHp * 0.16), maxHp: Math.round(m.maxHp * 0.16) });
        }
        showToast('PHASE 2: Destroy the Ritual Crystals to break Boss Immunity!');
      }
    }

    // Charge Awakening Ultimate
    state.player.ultCharge = Math.min(100, state.player.ultCharge + (isCrit ? 6 : 4) * stats.ultRate);

    if (stats.loh > 0 && state.player.hp > 0) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + stats.loh);
    }
    if (state.player.bladeOil && state.player.bladeOil.timer > 0) {
      applyStatus(m, state.player.bladeOil.type, 3.0);
    }

    addFloatText(m.x, m.y, isCrit ? `Critical! ${dmg}` : `${dmg}`, isCrit ? '#facc15' : '#f8fafc', isCrit);
    spawnParticles(m.x, m.y, isCrit ? '#facc15' : '#dc2626', isCrit ? 10 : 5, 2.2);
    if (isCrit) {
      sfx.crit();
      state.camera.shake = Math.max(state.camera.shake, 4.5);
    }

    if (m.hp <= 0) handleMonsterDeath(m);
  }

  function handleMonsterDeath(m) {
    const idx = state.monsters.indexOf(m);
    if (idx !== -1) state.monsters.splice(idx, 1);

    state.player.kills += 1;
    state.killStreak += 1;
    state.streakTimer = 4.2;
    state.account.bestiary[m.name] = (state.account.bestiary[m.name] || 0) + 1;
    advanceBounty('kills', 1);
    if (m.tier === 'elite') advanceBounty('elites', 1);
    if (m.tier === 'boss') advanceBounty('bosses', 1);

    spawnParticles(m.x, m.y, m.type === 'ghoul' ? '#60a5fa' : '#94a3b8', 16, 3.0);

    if (m.type === 'ghoul') {
      state.enemyPuddles.push({ x: m.x, y: m.y, r: 1.35, life: 4.5, tick: 0.45, dmg: Math.max(4, Math.round(m.atk * 0.42)) });
    } else if (m.type === 'imp') {
      sfx.fire();
      state.novaWaves.push({ x: m.x, y: m.y, r: 0.2, maxR: 1.8, color: '#f97316', life: 0.25, maxLife: 0.25 });
      if (dist(m.x, m.y, state.player.x, state.player.y) <= 1.8) damagePlayer(Math.round(m.atk * 1.1));
    }

    if (m.affixes && m.affixes.includes('molten')) {
      sfx.fire();
      state.novaWaves.push({ x: m.x, y: m.y, r: 0.3, maxR: 2.1, color: '#f97316', life: 0.28, maxLife: 0.28 });
      spawnParticles(m.x, m.y, '#fb923c', 16, 3.6);
      if (dist(m.x, m.y, state.player.x, state.player.y) <= 2.1) damagePlayer(Math.round(m.atk * 1.1));
    }

    grantXp(m.xp);
    spawnLootDrop(m.x, m.y, m.isGuardian ? 'guardian' : m.tier);

    if (m.type === 'boss') {
      state.crystals = [];
      state.bossTelegraphs = [];
      state.stairs.unlocked = true;
      state.highestFloor = Math.max(state.highestFloor, state.floor + 1);
      if (state.riftTier > 0) {
        state.account.bestRiftTier = Math.max(state.account.bestRiftTier || 0, state.riftTier);
        showToast(`Abyssal Rift Tier ${state.riftTier} Cleared!`);
      } else {
        showToast(`${m.name} Slain! Descent Stairs Unsealed!`);
      }
      if (m.isGuardian) {
        for (const tr of WARDROBE_ITEMS.trails) {
          if (tr.reqBoss === m.name && !state.account.wardrobeUnlocked.trails.includes(tr.id)) {
            state.account.wardrobeUnlocked.trails.push(tr.id);
            showToast(`Wardrobe Unlocked: ${tr.name} Trail!`);
          }
        }
        for (const cp of WARDROBE_ITEMS.capes) {
          if (cp.reqBoss === m.name && !state.account.wardrobeUnlocked.capes.includes(cp.id)) {
            state.account.wardrobeUnlocked.capes.push(cp.id);
          }
        }
      }
      state.camera.shake = 9;
      saveHeroProfile();
      updateHud();
      if (!state.draftOpen && !state.player.dead) openLevelUpDraft(true);
    }
  }

  function breakNearbyProps(wx, wy, radius) {
    for (const prop of state.props) {
      if (prop.broken) continue;
      if (dist(wx, wy, prop.x, prop.y) <= radius) {
        prop.broken = true;
        spawnParticles(prop.x, prop.y, prop.kind === 'urn' ? '#b45309' : '#78350f', 10, 2.6);
        spawnLootDrop(prop.x, prop.y, 'prop');
      }
    }
  }

  function findNearestEnemy(maxRange) {
    const p = state.player;
    let best = null;
    let bestD = maxRange;
    for (const m of state.monsters) {
      const d = dist(p.x, p.y, m.x, m.y);
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    }
    return best;
  }

  function autoFaceTarget(maxRange = 6.5) {
    const p = state.player;
    const target = findNearestEnemy(maxRange);
    if (target) {
      const d = dist(p.x, p.y, target.x, target.y) || 1;
      p.facingX = (target.x - p.x) / d;
      p.facingY = (target.y - p.y) / d;
    }
  }

  function performBasicAttack() {
    const p = state.player;
    if (p.dead || p.attackCd > 0 || state.mode === 'TOWN') return;
    const cls = state.heroClass;
    const stats = getHeroStats();
    const baseCd = cls === 'rogue' ? 0.25 : cls === 'archer' ? 0.30 : cls === 'sorcerer' ? 0.36 : 0.34;
    p.attackCd = baseCd / Math.max(0.5, stats.atkSpeedMult);
    p.attackAnim = 0.22;

    if (input.aimX !== null && input.aimY !== null) {
      p.facingX = input.aimX;
      p.facingY = input.aimY;
    } else {
      autoFaceTarget(cls === 'sorcerer' || cls === 'archer' || cls === 'summoner' ? 9.5 : 3.4);
    }

    // Attack Ritual Crystals & Secret Walls & Oil Barrels in melee/projectile path
    for (let c = state.crystals.length - 1; c >= 0; c--) {
      const cr = state.crystals[c];
      if (dist(p.x, p.y, cr.x, cr.y) <= (cls === 'archer' || cls === 'sorcerer' ? 8.5 : 2.3)) {
        cr.hp -= stats.atk;
        spawnParticles(cr.x, cr.y, '#c084fc', 6, 2.0);
        if (cr.hp <= 0) {
          state.crystals.splice(c, 1);
          showToast(state.crystals.length === 0 ? 'Ritual Shield Broken!' : `${state.crystals.length} Crystals Remaining`);
        }
      }
    }

    if (cls === 'sorcerer' || cls === 'summoner') {
      sfx.arcane();
      state.projectiles.push({
        kind: cls === 'summoner' ? 'soul' : 'shadow',
        x: p.x + p.facingX * 0.45, y: p.y + p.facingY * 0.45,
        vx: p.facingX * 11.4, vy: p.facingY * 11.4,
        dmg: stats.atk * 1.15, aoe: 0.9 * stats.aoeMult, life: 1.15, restoreMana: cls === 'summoner' ? 5 : 0
      });
      return;
    }

    if (cls === 'archer') {
      sfx.slash();
      state.projectiles.push({
        kind: 'pierce',
        x: p.x + p.facingX * 0.45, y: p.y + p.facingY * 0.45,
        vx: p.facingX * 14.0, vy: p.facingY * 14.0,
        dmg: stats.atk * 1.2, aoe: 0.7, life: 1.2, pierce: true
      });
      return;
    }

    sfx.slash();
    const reach = cls === 'rogue' ? 1.85 : 2.05;
    const trail = WARDROBE_ITEMS.trails.find((t) => t.id === state.account.equippedTrail);
    state.slashArcs.push({
      x: p.x, y: p.y, angle: Math.atan2(p.facingY, p.facingX),
      life: 0.18, maxLife: 0.18, radius: cls === 'rogue' ? 38 : 44,
      color: trail ? trail.color : (cls === 'rogue' ? '#4ade80' : '#fde047')
    });

    const mult = cls === 'rogue' ? 0.9 : 1.0;
    for (let i = state.monsters.length - 1; i >= 0; i--) {
      const m = state.monsters[i];
      const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy);
      if (d <= reach + m.radius) {
        const dot = (dx / (d || 1)) * p.facingX + (dy / (d || 1)) * p.facingY;
        if (dot >= -0.25 || d < 1.05) damageMonster(m, stats.atk * mult, dx / (d || 1), dy / (d || 1), true, 8);
      }
    }
    breakNearbyProps(p.x + p.facingX * 0.9, p.y + p.facingY * 0.9, 1.55);
  }
  const performSwordSlash = performBasicAttack;

  function castSkill(slotId) {
    const p = state.player;
    if (state.mode === 'TOWN') return;
    if (slotId === 4) { castWeaponSkill(); return; }
    const cfg = getActiveSkillConfig()[slotId];
    if (!cfg || p.dead || p.skillCds[slotId] > 0) return;
    if (p.mp < cfg.mana) { showToast('Not enough Mana!'); return; }

    p.mp -= cfg.mana;
    p.skillCds[slotId] = cfg.cd;
    p.castAnim = 0.28;
    const stats = getHeroStats();
    const awakeBoost = state.awakenedSkills[slotId] ? 1.45 : 1.0;
    const rankMult = (1 + ((p.skillRanks[slotId] || 1) - 1) * 0.18) * awakeBoost;
    const cls = state.heroClass;
    const stag = cfg.stagger || 14;

    if (cls === 'archer') {
      if (slotId === 1) {
        // Arrow Rain AoE volley
        autoFaceTarget(9.0);
        sfx.slash();
        const tx = p.x + p.facingX * 3.5, ty = p.y + p.facingY * 3.5;
        state.novaWaves.push({ x: tx, y: ty, r: 0.3, maxR: 2.8, color: '#a3e635', life: 0.35, maxLife: 0.35 });
        for (let i = state.monsters.length - 1; i >= 0; i--) {
          const m = state.monsters[i];
          if (dist(tx, ty, m.x, m.y) <= 2.9 + m.radius) damageMonster(m, stats.atk * 1.7 * rankMult, 0, 0, true, stag);
        }
      } else if (slotId === 2) {
        // Vault & Caltrops (backflip + slowing poison spikes)
        sfx.slash();
        state.poisonClouds.push({ x: p.x, y: p.y, r: 2.2, life: 4.0, tick: 0, dmg: stats.atk * 0.65 * rankMult, status: 'chill' });
        moveWithSlide(p, -p.facingX * 2.2, -p.facingY * 2.2, 0.31);
        updateFogOfWar();
      } else if (slotId === 3) {
        // Charged Snipe high-crit beam
        autoFaceTarget(10.0);
        sfx.crit();
        state.projectiles.push({ kind: 'pierce', x: p.x + p.facingX * 0.4, y: p.y + p.facingY * 0.4, vx: p.facingX * 16, vy: p.facingY * 16, dmg: stats.atk * 2.6 * rankMult, aoe: 1.0, life: 1.1, pierce: true, stagger: stag });
      }
      updateHud();
      return;
    }

    if (cls === 'summoner') {
      if (slotId === 1) {
        // Raise Skeletons (up to 4)
        sfx.holy();
        const currentSkels = state.minions.filter((mn) => mn.kind === 'skel');
        if (currentSkels.length >= 4) state.minions.splice(state.minions.indexOf(currentSkels[0]), 1);
        const addCount = Math.min(2, 4 - state.minions.filter((mn) => mn.kind === 'skel').length);
        for (let k = 0; k < addCount; k++) {
          state.minions.push({ kind: 'skel', x: p.x + (k ? 0.6 : -0.6), y: p.y + 0.5, hp: Math.round(90 * stats.minionMult), maxHp: Math.round(90 * stats.minionMult), dmg: Math.round(stats.atk * 0.85 * rankMult * stats.minionMult), cd: 0, life: 35 });
        }
        showToast('Skeletal Warriors Raised!');
      } else if (slotId === 2) {
        // Summon Hell Imp (ranged fireball turret)
        sfx.fire();
        state.minions.push({ kind: 'imp', x: p.x + p.facingX * 0.8, y: p.y + p.facingY * 0.8, hp: Math.round(70 * stats.minionMult), maxHp: Math.round(70 * stats.minionMult), dmg: Math.round(stats.atk * 1.1 * rankMult * stats.minionMult), cd: 0, life: 22 });
      } else if (slotId === 3) {
        // Dark Pact / Corpse Detonate
        sfx.arcane();
        for (let i = state.minions.length - 1; i >= 0; i--) {
          const mn = state.minions[i];
          if (mn.kind === 'skel' && mn.hp < mn.maxHp * 0.65) {
            state.novaWaves.push({ x: mn.x, y: mn.y, r: 0.3, maxR: 2.5, color: '#2dd4bf', life: 0.28, maxLife: 0.28 });
            for (let j = state.monsters.length - 1; j >= 0; j--) {
              const m = state.monsters[j];
              if (dist(mn.x, mn.y, m.x, m.y) <= 2.6 + m.radius) damageMonster(m, stats.atk * 2.1 * rankMult, 0, 0, true, stag);
            }
            state.minions.splice(i, 1);
          } else {
            mn.hp = mn.maxHp;
          }
        }
      }
      updateHud();
      return;
    }

    if (cls === 'rogue') {
      if (slotId === 1) {
        autoFaceTarget(9.0);
        sfx.slash();
        const baseAng = Math.atan2(p.facingY, p.facingX);
        for (const off of [-0.24, 0, 0.24]) {
          const a = baseAng + off;
          state.projectiles.push({ kind: 'bolt', x: p.x + Math.cos(a) * 0.4, y: p.y + Math.sin(a) * 0.4, vx: Math.cos(a) * 12.2, vy: Math.sin(a) * 12.2, dmg: stats.atk * 1.25 * rankMult, aoe: 0.8, life: 1.0, status: 'bleed' });
        }
      } else if (slotId === 2) {
        sfx.arcane();
        state.poisonClouds.push({ x: p.x, y: p.y, r: 2.3, life: 4.5, tick: 0, dmg: stats.atk * 0.72 * rankMult, status: 'poison' });
        spawnParticles(p.x, p.y, '#4ade80', 14, 2.5);
      } else if (slotId === 3) {
        sfx.slash();
        moveWithSlide(p, p.facingX * 2.8, p.facingY * 2.8, 0.31);
        updateFogOfWar();
        state.novaWaves.push({ x: p.x, y: p.y, r: 0.3, maxR: 2.1, color: '#4ade80', life: 0.24, maxLife: 0.24 });
        for (let i = state.monsters.length - 1; i >= 0; i--) {
          const m = state.monsters[i];
          const d = dist(p.x, p.y, m.x, m.y);
          if (d <= 2.2 + m.radius) damageMonster(m, stats.atk * 1.65 * rankMult, (m.x - p.x) / (d || 1), (m.y - p.y) / (d || 1), true, stag);
        }
      }
      updateHud();
      return;
    }

    if (cls === 'sorcerer') {
      if (slotId === 1) {
        sfx.arcane();
        state.novaWaves.push({ x: p.x, y: p.y, r: 0.4, maxR: 2.7 * stats.aoeMult, color: '#e2e8f0', life: 0.3, maxLife: 0.3 });
        for (let i = state.monsters.length - 1; i >= 0; i--) {
          const m = state.monsters[i];
          const d = dist(p.x, p.y, m.x, m.y);
          if (d <= 2.7 * stats.aoeMult + m.radius) {
            damageMonster(m, stats.atk * 1.6 * rankMult, (m.x - p.x) / (d || 1), (m.y - p.y) / (d || 1), true, stag);
            applyStatus(m, 'bleed', 3.0);
          }
        }
        breakNearbyProps(p.x, p.y, 2.5);
      } else if (slotId === 2) {
        autoFaceTarget(9.0);
        sfx.arcane();
        state.projectiles.push({ kind: 'frost', x: p.x + p.facingX * 0.45, y: p.y + p.facingY * 0.45, vx: p.facingX * 9.0, vy: p.facingY * 9.0, dmg: stats.atk * 2.0 * rankMult, aoe: 2.3 * stats.aoeMult, life: 1.5, status: 'chill', stagger: stag });
      } else if (slotId === 3) {
        sfx.holy();
        let totalHeal = 0;
        state.novaWaves.push({ x: p.x, y: p.y, r: 0.4, maxR: 3.1 * stats.aoeMult, color: '#c084fc', life: 0.36, maxLife: 0.36 });
        for (let i = state.monsters.length - 1; i >= 0; i--) {
          const m = state.monsters[i];
          const d = dist(p.x, p.y, m.x, m.y);
          if (d <= 3.1 * stats.aoeMult + m.radius) {
            damageMonster(m, stats.atk * 1.5 * rankMult, (m.x - p.x) / (d || 1), (m.y - p.y) / (d || 1), true, stag);
            totalHeal += Math.round(p.maxHp * 0.12);
          }
        }
        if (totalHeal > 0) {
          const capped = Math.min(totalHeal, Math.round(p.maxHp * 0.45));
          p.hp = Math.min(p.maxHp, p.hp + capped);
          addFloatText(p.x, p.y, `+${capped} HP`, '#4ade80', false);
        }
      }
      updateHud();
      return;
    }

    // Paladin kit (Whirlwind Cleave, Shield Bash, Holy Nova)
    if (slotId === 1) {
      sfx.slash();
      state.novaWaves.push({ x: p.x, y: p.y, r: 0.4, maxR: 2.35, color: '#facc15', life: 0.28, maxLife: 0.28 });
      state.camera.shake = Math.max(state.camera.shake, 4);
      for (let i = state.monsters.length - 1; i >= 0; i--) {
        const m = state.monsters[i];
        const d = dist(p.x, p.y, m.x, m.y);
        if (d <= 2.35 + m.radius) damageMonster(m, stats.atk * 1.65 * rankMult, (m.x - p.x) / (d || 1), (m.y - p.y) / (d || 1), true, stag);
      }
      breakNearbyProps(p.x, p.y, 2.35);
    } else if (slotId === 2) {
      // Shield Bash (high stagger + stun)
      autoFaceTarget(3.5);
      sfx.anvil();
      moveWithSlide(p, p.facingX * 1.1, p.facingY * 1.1, 0.31);
      state.novaWaves.push({ x: p.x + p.facingX * 0.8, y: p.y + p.facingY * 0.8, r: 0.2, maxR: 1.8, color: '#fde047', life: 0.22, maxLife: 0.22 });
      for (let i = state.monsters.length - 1; i >= 0; i--) {
        const m = state.monsters[i];
        if (dist(p.x + p.facingX * 0.7, p.y + p.facingY * 0.7, m.x, m.y) <= 1.9 + m.radius) {
          m.stunTimer = Math.max(m.stunTimer, 1.3);
          damageMonster(m, stats.atk * 1.55 * rankMult, p.facingX, p.facingY, true, stag);
        }
      }
    } else if (slotId === 3) {
      sfx.holy();
      const heal = Math.round(p.maxHp * 0.28);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      addFloatText(p.x, p.y, `+${heal} HP`, '#4ade80', false);
      state.novaWaves.push({ x: p.x, y: p.y, r: 0.4, maxR: 3.1, color: '#fef08a', life: 0.36, maxLife: 0.36 });
      spawnParticles(p.x, p.y, '#fde047', 16, 3.2);
      for (let i = state.monsters.length - 1; i >= 0; i--) {
        const m = state.monsters[i];
        const d = dist(p.x, p.y, m.x, m.y);
        if (d <= 3.1 + m.radius) {
          m.stunTimer = Math.max(m.stunTimer, 1.15);
          damageMonster(m, stats.atk * 1.45 * rankMult, (m.x - p.x) / (d || 1), (m.y - p.y) / (d || 1), true, stag);
        }
      }
      breakNearbyProps(p.x, p.y, 3.0);
    }
    updateHud();
  }

  function getEquippedWeaponSpec() {
    const w = state.player.equipped.weapon;
    const wType = (w && w.weaponType && WEAPON_TYPES[w.weaponType]) ? w.weaponType : (HERO_CLASSES[state.heroClass]?.defaultWeapon || 'greatsword');
    return WEAPON_TYPES[wType];
  }

  function castWeaponSkill() {
    const p = state.player;
    if (p.dead || state.mode === 'TOWN' || p.skillCds[4] > 0) return;
    const spec = getEquippedWeaponSpec();
    if (p.mp < spec.mana) { showToast('Not enough Mana!'); return; }
    p.mp -= spec.mana;
    p.skillCds[4] = spec.cd;
    p.castAnim = 0.25;
    const stats = getHeroStats();
    autoFaceTarget(7.5);

    if (spec.id === 'arcane_tome') {
      sfx.portal();
      moveWithSlide(p, p.facingX * 3.4, p.facingY * 3.4, 0.31);
      updateFogOfWar();
      state.novaWaves.push({ x: p.x, y: p.y, r: 0.2, maxR: 2.0, color: '#c084fc', life: 0.24, maxLife: 0.24 });
    } else if (spec.id === 'longbow' || spec.id === 'crossbow') {
      sfx.fire();
      const base = Math.atan2(p.facingY, p.facingX);
      const angles = spec.id === 'longbow' ? [-0.3, -0.15, 0, 0.15, 0.3] : [0];
      for (const off of angles) {
        const a = base + off;
        state.projectiles.push({ kind: spec.id === 'crossbow' ? 'fire' : 'bolt', x: p.x, y: p.y, vx: Math.cos(a) * 12, vy: Math.sin(a) * 12, dmg: stats.atk * (spec.id === 'crossbow' ? 2.2 : 1.15), aoe: spec.id === 'crossbow' ? 2.2 : 0.8, life: 1.1, stagger: spec.stagger });
      }
    } else {
      sfx.anvil();
      state.novaWaves.push({ x: p.x, y: p.y, r: 0.3, maxR: 2.6, color: '#fb923c', life: 0.3, maxLife: 0.3 });
      for (let i = state.monsters.length - 1; i >= 0; i--) {
        const m = state.monsters[i];
        const d = dist(p.x, p.y, m.x, m.y);
        if (d <= 2.6 + m.radius) {
          if (spec.id === 'necro_staff') m.stunTimer = Math.max(m.stunTimer, 1.5);
          damageMonster(m, stats.atk * 1.75, (m.x - p.x) / (d || 1), (m.y - p.y) / (d || 1), true, spec.stagger);
        }
      }
    }
    updateHud();
  }

  function castUltimate() {
    const p = state.player;
    if (p.dead || state.mode === 'TOWN') return;
    if (p.ultCharge < 100) {
      showToast(`Ultimate ${Math.floor(p.ultCharge)}% Charged`);
      return;
    }
    p.ultCharge = 0;
    const stats = getHeroStats();
    const cls = state.heroClass;
    sfx.legendary();
    state.camera.shake = 8;

    if (cls === 'paladin') {
      p.ultTimer = 8.0;
      p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.35));
      showToast('AWAKENING: Avatar of Light!');
    } else if (cls === 'rogue') {
      for (let i = 0; i < 3; i++) {
        state.minions.push({ kind: 'clone', x: p.x + Math.cos(i * 2.1), y: p.y + Math.sin(i * 2.1), hp: 120, maxHp: 120, dmg: Math.round(stats.atk * 1.2), cd: 0, life: 12 });
      }
      showToast('AWAKENING: Shadow Clone Army!');
    } else if (cls === 'sorcerer') {
      for (let k = 0; k < 5; k++) {
        const mx = p.x + (Math.random() - 0.5) * 6;
        const my = p.y + (Math.random() - 0.5) * 6;
        state.novaWaves.push({ x: mx, y: my, r: 0.4, maxR: 2.8, color: '#f97316', life: 0.4, maxLife: 0.4 });
        for (let i = state.monsters.length - 1; i >= 0; i--) {
          const m = state.monsters[i];
          if (dist(mx, my, m.x, m.y) <= 2.8 + m.radius) {
            damageMonster(m, stats.atk * 2.2, 0, 0, true, 16);
            applyStatus(m, 'burn', 4.0);
          }
        }
      }
      showToast('AWAKENING: Meteor Apocalypse!');
    } else if (cls === 'archer') {
      for (let i = 0; i < 12; i++) {
        const a = (Math.PI * 2 * i) / 12;
        state.projectiles.push({ kind: 'fire', x: p.x, y: p.y, vx: Math.cos(a) * 13, vy: Math.sin(a) * 13, dmg: stats.atk * 2.3, aoe: 1.8, life: 1.1, status: 'burn' });
      }
      showToast('AWAKENING: Phoenix Volley!');
    } else if (cls === 'summoner') {
      state.minions.push({ kind: 'colossus', x: p.x + 0.8, y: p.y + 0.8, hp: Math.round(420 * stats.minionMult), maxHp: Math.round(420 * stats.minionMult), dmg: Math.round(stats.atk * 2.2 * stats.minionMult), cd: 0, life: 25 });
      showToast('AWAKENING: Bone Colossus Summoned!');
    }
    updateHud();
  }

  function performDodge() {
    const p = state.player;
    if (p.dead || p.dodgeCd > 0) return;
    p.dodgeCd = 2.0;
    p.invulnTimer = 0.35;
    sfx.slash();
    moveWithSlide(p, p.facingX * 2.3, p.facingY * 2.3, 0.31);
    updateFogOfWar();
    spawnParticles(p.x, p.y, '#93c5fd', 8, 2.4);
    updateHud();
  }

  function swapWeaponLoadout() {
    const p = state.player;
    const oldW = p.equipped.weapon;
    const oldO = p.equipped.offhand;
    if (!p.swapSet.weapon && !p.swapSet.offhand) {
      showToast('Place a backup weapon in Swap Set (Bag) first!');
      return;
    }
    p.equipped.weapon = p.swapSet.weapon;
    p.equipped.offhand = p.swapSet.offhand;
    p.swapSet.weapon = oldW;
    p.swapSet.offhand = oldO;
    p.activeSwapIdx = p.activeSwapIdx === 1 ? 2 : 1;
    syncPlayerVitalsBounds();
    syncClassSkillLabels();
    sfx.loot();
    saveHeroProfile();
    updateHud(true);
    showToast(`Swapped to Weapon Set ${p.activeSwapIdx}`);
  }

  function toggleMinionStance() {
    state.minionStance = state.minionStance === 'aggressive' ? 'guard' : 'aggressive';
    sfx.loot();
    updateHud(true);
    showToast(`Minion & Pet Stance: ${state.minionStance.toUpperCase()}`);
  }

  function spawnCompanionPet() {
    const p = state.player;
    state.petEntity = {
      id: p.petId || 'hound',
      x: p.x - 0.8,
      y: p.y + 0.6,
      cd: 0,
      phase: 0
    };
  }

  function updatePets(dt) {
    const pet = state.petEntity;
    if (!pet) return;
    const p = state.player;
    const cfg = PETS_CONFIG[p.petId] || PETS_CONFIG.hound;
    const rank = p.petRanks[p.petId] || 1;
    const pickupR = 3.6 + (rank - 1) * 1.1;
    pet.cd = Math.max(0, pet.cd - dt);
    pet.phase += dt * 7;

    let tx = p.x - p.facingX * 0.9;
    let ty = p.y - p.facingY * 0.9;
    let targetDropIdx = -1;

    // Auto-loot Gold & filtered gear
    for (let i = 0; i < state.lootDrops.length; i++) {
      const d = state.lootDrops[i];
      if (d.z > 2) continue;
      if ((d.kind === 'gold' || passesLootFilter(d)) && dist(p.x, p.y, d.x, d.y) <= pickupR) {
        tx = d.x;
        ty = d.y;
        targetDropIdx = i;
        break;
      }
    }

    const dx = tx - pet.x, dy = ty - pet.y, d = Math.hypot(dx, dy);
    if (d > 0.25) {
      const sp = targetDropIdx !== -1 ? 7.2 : 5.2;
      pet.x += (dx / d) * Math.min(d, sp * dt);
      pet.y += (dy / d) * Math.min(d, sp * dt);
    }
    if (targetDropIdx !== -1 && dist(pet.x, pet.y, tx, ty) <= 0.65) {
      collectLootDrop(targetDropIdx);
    }

    // Active Pet Combat Skill
    if (state.mode === 'DUNGEON' && pet.cd <= 0 && state.monsters.length > 0) {
      const enemy = findNearestEnemy(state.minionStance === 'guard' ? 4.5 : 7.5);
      if (enemy) {
        pet.cd = Math.max(2.0, cfg.cd - (rank - 1) * 0.45);
        const pDmg = Math.round(getHeroStats().atk * (0.75 + rank * 0.18));
        if (cfg.id === 'hound') {
          damageMonster(enemy, pDmg, 0, 0, true, 8);
          applyStatus(enemy, 'bleed', 3.5);
        } else if (cfg.id === 'wisp') {
          state.projectiles.push({ kind: 'fire', x: pet.x, y: pet.y, vx: ((enemy.x - pet.x) / (dist(pet.x, pet.y, enemy.x, enemy.y) || 1)) * 10, vy: ((enemy.y - pet.y) / (dist(pet.x, pet.y, enemy.x, enemy.y) || 1)) * 10, dmg: pDmg, aoe: 1.2, life: 0.9, status: 'burn' });
        } else if (cfg.id === 'hatchling') {
          state.novaWaves.push({ x: pet.x, y: pet.y, r: 0.2, maxR: 2.5, color: '#94a3b8', life: 0.25, maxLife: 0.25 });
          damageMonster(enemy, pDmg, 0, 0, true, 26);
        }
      }
    }
  }

  function updateMinions(dt) {
    const p = state.player;
    for (let i = state.minions.length - 1; i >= 0; i--) {
      const mn = state.minions[i];
      mn.life -= dt;
      mn.cd = Math.max(0, mn.cd - dt);
      if (mn.life <= 0 || mn.hp <= 0) {
        state.minions.splice(i, 1);
        continue;
      }
      const searchR = state.minionStance === 'guard' ? 4.5 : 8.5;
      let target = null, bestD = searchR;
      for (const m of state.monsters) {
        const d = dist(p.x, p.y, m.x, m.y);
        if (d < bestD) { bestD = d; target = m; }
      }
      if (target) {
        const d = dist(mn.x, mn.y, target.x, target.y);
        if (mn.kind === 'imp') {
          if (mn.cd <= 0 && d <= 7.5) {
            mn.cd = 1.25;
            state.projectiles.push({ kind: 'fire', x: mn.x, y: mn.y, vx: ((target.x - mn.x) / (d || 1)) * 9.5, vy: ((target.y - mn.y) / (d || 1)) * 9.5, dmg: mn.dmg, aoe: 1.1, life: 0.9, status: 'burn' });
          }
        } else if (d > 1.1) {
          moveWithSlide(mn, ((target.x - mn.x) / (d || 1)) * 4.2 * dt, ((target.y - mn.y) / (d || 1)) * 4.2 * dt, 0.28);
        } else if (mn.cd <= 0) {
          mn.cd = 0.95;
          damageMonster(target, mn.dmg, 0, 0, true, mn.kind === 'colossus' ? 14 : 4);
        }
      } else {
        const dP = dist(mn.x, mn.y, p.x, p.y);
        if (dP > 2.2) moveWithSlide(mn, ((p.x - mn.x) / dP) * 4.4 * dt, ((p.y - mn.y) / dP) * 4.4 * dt, 0.28);
      }
    }
  }

  function drinkHealthPotion() {
    const p = state.player;
    if (p.dead || p.potionCd > 0) return;
    if (p.potions <= 0) {
      showToast('No Health Potions remaining!');
      return;
    }
    if (p.hp >= p.maxHp) {
      showToast('Health already full.');
      return;
    }
    p.potions -= 1;
    p.potionCd = 1.2;
    const heal = Math.round(p.maxHp * 0.45);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    sfx.potion();
    addFloatText(p.x, p.y, `+${heal} HP`, '#4ade80', false);
    spawnParticles(p.x, p.y, '#ef4444', 10, 2.2);
    updateHud();
    saveProgress();
  }

  function drinkManaElixir() {
    const p = state.player;
    if (p.dead || p.potionCd > 0) return;
    if (p.manaElixirs <= 0) {
      showToast('No Mana Elixirs remaining!');
      return;
    }
    if (p.mp >= p.maxMp) {
      showToast('Mana already full.');
      return;
    }
    p.manaElixirs -= 1;
    p.potionCd = 1.0;
    const gain = Math.round(p.maxMp * 0.55);
    p.mp = Math.min(p.maxMp, p.mp + gain);
    sfx.potion();
    addFloatText(p.x, p.y, `+${gain} MP`, '#60a5fa', false);
    spawnParticles(p.x, p.y, '#3b82f6', 10, 2.2);
    updateHud();
    saveProgress();
  }

  // =========================================================================
  // INPUT SYSTEM (MULTI-TOUCH JOYSTICK + MOUSE/KEYBOARD FALLBACKS)
  // =========================================================================
  const input = {
    keys: new Set(),
    joyPointerId: null,
    joyOriginX: 0,
    joyOriginY: 0,
    joyX: 0,
    joyY: 0,
    aimX: null,
    aimY: null
  };

  function setupInputs() {
    window.addEventListener('keydown', (e) => {
      sfx.unlock();
      if (state.screen === 'MAIN_MENU' || state.screen === 'CHAR_CREATE') return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        if (!dom.inventoryDrawer.open && !dom.townNpcDrawer.open) e.preventDefault();
      }
      if (k === 'i') {
        toggleInventory();
        return;
      }
      if (k === 'k') {
        openSkillTreeModal();
        return;
      }
      if (dom.inventoryDrawer.open || dom.townNpcDrawer.open || dom.skillTreeModal?.open || state.draftOpen || state.player.dead) return;

      input.keys.add(k);
      if (k === ' ') performBasicAttack();
      else if (k === '1') castSkill(1);
      else if (k === '2') castSkill(2);
      else if (k === '3') castSkill(3);
      else if (k === '4') castSkill(4);
      else if (k === 'f') castUltimate();
      else if (k === 'shift') performDodge();
      else if (k === 'x') swapWeaponLoadout();
      else if (k === 'g') toggleMinionStance();
      else if (k === 'q') drinkHealthPotion();
      else if (k === 'r') drinkManaElixir();
      else if (k === 'e') lootNearestGroundDrop();
    });

    window.addEventListener('keyup', (e) => {
      input.keys.delete(e.key.toLowerCase());
    });

    // Virtual Joystick Pointer Events (independent multi-touch ID)
    dom.joystickZone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sfx.unlock();
      if (input.joyPointerId !== null) return;
      input.joyPointerId = e.pointerId;
      dom.joystickZone.setPointerCapture(e.pointerId);
      const rect = dom.joystickZone.getBoundingClientRect();
      input.joyOriginX = rect.left + rect.width * 0.5;
      input.joyOriginY = rect.top + rect.height * 0.5;
      updateJoystickFromPointer(e.clientX, e.clientY);
    });

    dom.joystickZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== input.joyPointerId) return;
      updateJoystickFromPointer(e.clientX, e.clientY);
    });

    const releaseJoy = (e) => {
      if (e.pointerId !== input.joyPointerId) return;
      input.joyPointerId = null;
      input.joyX = 0;
      input.joyY = 0;
      dom.joystickKnob.style.transform = 'translate(0px, 0px)';
    };
    dom.joystickZone.addEventListener('pointerup', releaseJoy);
    dom.joystickZone.addEventListener('pointercancel', releaseJoy);

    // Combat buttons (null-guarded)
    const on = (el, ev, fn) => { if (el) el.addEventListener(ev, fn); };
    const bindBtn = (el, fn) => {
      if (!el) return;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sfx.unlock();
        fn();
      });
    };
    bindBtn(dom.btnAttack, performBasicAttack);
    bindBtn(dom.btnSkill1, () => castSkill(1));
    bindBtn(dom.btnSkill2, () => castSkill(2));
    bindBtn(dom.btnSkill3, () => castSkill(3));
    bindBtn(dom.btnSkill4, () => castSkill(4));
    bindBtn(dom.btnUltimate, castUltimate);
    bindBtn(dom.btnDodge, performDodge);
    bindBtn(dom.btnSwapLoadout, swapWeaponLoadout);
    bindBtn(dom.btnMinionStance, toggleMinionStance);
    bindBtn(dom.btnPotion, drinkHealthPotion);
    bindBtn(dom.btnManaElixir, drinkManaElixir);

    // Canvas Tap / Click: Town Station tap, Dungeon Crystal/Wall/Event tap, Loot Nameplate OR Attack
    canvas.addEventListener('pointerdown', (e) => {
      sfx.unlock();
      if (state.screen === 'MAIN_MENU' || state.screen === 'CHAR_CREATE') return;
      if (state.player.dead || dom.inventoryDrawer.open || dom.townNpcDrawer.open) return;

      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const worldX = sx - rect.width * 0.5 + state.camera.x;
      const worldY = sy - rect.height * 0.5 + state.camera.y;
      const wp = isoToWorld(worldX, worldY);

      if (state.mode === 'TOWN') {
        for (const npc of state.townNpcs) {
          if (dist(wp.x, wp.y, npc.x, npc.y) <= 1.65) {
            openTownNpcDrawer(npc.id);
            return;
          }
        }
        return;
      }

      // Check tappable ground item nameplates first
      for (let i = state.lootDrops.length - 1; i >= 0; i--) {
        const d = state.lootDrops[i];
        if (!d.screenRect || !passesLootFilter(d)) continue;
        if (sx >= d.screenRect.x && sx <= d.screenRect.x + d.screenRect.w &&
            sy >= d.screenRect.y && sy <= d.screenRect.y + d.screenRect.h) {
          if (dist(state.player.x, state.player.y, d.x, d.y) <= 4.5) collectLootDrop(i);
          else { state.pendingLootTarget = d; showToast(`Moving to pick up ${d.label}`); }
          return;
        }
      }

      // Check Cracked Illusion Wall tap
      for (let i = state.secretWalls.length - 1; i >= 0; i--) {
        const sw = state.secretWalls[i];
        if (!sw.broken && dist(wp.x, wp.y, sw.x, sw.y) <= 1.5 && dist(state.player.x, state.player.y, sw.x, sw.y) <= 3.5) {
          sw.broken = true;
          state.grid[sw.gy][sw.gx] = TILE.SANCTUM;
          state.fogDirty = true;
          sfx.anvil();
          spawnLootDrop(sw.x, sw.y, 'elite');
          showToast('Secret Treasure Room Discovered!');
          return;
        }
      }

      // Desktop & Mobile Click/Tap-to-Move when Auto-Combat is ON, or manual aim-fire when OFF
      const dx = wp.x - state.player.x;
      const dy = wp.y - state.player.y;
      const len = Math.hypot(dx, dy) || 1;
      if (state.autoCombat) {
        state.moveTarget = { x: wp.x, y: wp.y };
        state.player.facingX = dx / len;
        state.player.facingY = dy / len;
      } else {
        input.aimX = dx / len;
        input.aimY = dy / len;
        performBasicAttack();
        input.aimX = null;
        input.aimY = null;
      }
    });

    // Main Menu & Character Creation
    on(dom.btnContinueTown, 'click', () => {
      sfx.unlock();
      if (!state.saveSlots[state.activeSlot]) {
        const fresh = createFreshHeroSlotData('Aldric', 'paladin', 'hound');
        state.saveSlots[state.activeSlot] = fresh;
        applySlotDataToRuntime(fresh);
        saveHeroProfile();
      }
      enterTown();
    });
    on(dom.btnOpenCharCreate, 'click', () => { sfx.unlock(); setScreen('CHAR_CREATE'); });
    on(dom.btnOpenCoopMenu, 'click', () => { sfx.unlock(); openTownNpcDrawer('coop'); });
    on(dom.btnOpenSaveTransfer, 'click', () => {
      sfx.unlock();
      if (dom.saveCodeInput) dom.saveCodeInput.value = exportSaveCode();
      dom.saveTransferDrawer?.showModal();
    });
    on(dom.btnCloseSaveTransfer, 'click', () => dom.saveTransferDrawer?.close());
    on(dom.btnCopySaveCode, 'click', () => {
      const code = exportSaveCode();
      if (dom.saveCodeInput) dom.saveCodeInput.value = code;
      navigator.clipboard?.writeText(code).catch(() => {});
      showToast('Save Code Copied!');
    });
    on(dom.btnImportSaveCode, 'click', () => {
      if (importSaveCode(dom.saveCodeInput?.value)) {
        dom.saveTransferDrawer?.close();
        showToast('Save Imported!');
      } else {
        showToast('Invalid Save Code!');
      }
    });

    on(dom.btnCharCreateBack, 'click', () => setScreen('MAIN_MENU'));
    on(dom.btnRandomName, 'click', () => {
      sfx.unlock();
      if (dom.heroNameInput) dom.heroNameInput.value = GOTHIC_NAMES[Math.floor(Math.random() * GOTHIC_NAMES.length)];
    });
    on(dom.btnForgeHero, 'click', () => {
      sfx.unlock();
      createNewHero(dom.heroNameInput?.value, state.selectedCreateClass, state.selectedCreatePet);
    });

    const toggleMuteAll = () => {
      sfx.muted = !sfx.muted;
      if (!sfx.muted) sfx.unlock();
      savePrefs();
      syncAudioToggleLabels();
    };
    on(dom.btnAudioToggle, 'click', toggleMuteAll);
    on(dom.btnHudAudio, 'click', toggleMuteAll);
    on(dom.btnManualSave, 'click', () => { sfx.unlock(); saveHeroProfile(true); });

    // Town Quick Dock & NPC Drawer
    on(dom.btnTownForge, 'click', () => { sfx.unlock(); openTownNpcDrawer('blacksmith'); });
    on(dom.btnTownStash, 'click', () => { sfx.unlock(); openTownNpcDrawer('stash'); });
    on(dom.btnTownApothecary, 'click', () => { sfx.unlock(); openTownNpcDrawer('apothecary'); });
    on(dom.btnTownBounties, 'click', () => { sfx.unlock(); openTownNpcDrawer('bounties'); });
    on(dom.btnTownPets, 'click', () => { sfx.unlock(); openTownNpcDrawer('pets'); });
    on(dom.btnTownCodex, 'click', () => { sfx.unlock(); openTownNpcDrawer('codex'); });
    on(dom.btnTownWardrobe, 'click', () => { sfx.unlock(); openTownNpcDrawer('wardrobe'); });
    on(dom.btnTownCoop, 'click', () => { sfx.unlock(); openTownNpcDrawer('coop'); });
    on(dom.btnTownWaypoint, 'click', () => { sfx.unlock(); openTownNpcDrawer('waypoint'); });
    on(dom.btnTownMenu, 'click', () => { saveHeroProfile(); setScreen('MAIN_MENU'); });
    on(dom.btnCloseTownNpc, 'click', () => dom.townNpcDrawer?.close());
    on(dom.townNpcDrawer, 'click', (e) => {
      if (e.target === dom.townNpcDrawer) dom.townNpcDrawer.close();
    });

    // Inventory Tabs, Skill Tree Modal & Auto-Combat Toggle
    on(dom.btnInventory, 'click', () => { sfx.unlock(); toggleInventory(); });
    on(dom.btnCloseInventory, 'click', () => toggleInventory(false));
    on(dom.inventoryDrawer, 'click', (e) => {
      if (e.target === dom.inventoryDrawer) toggleInventory(false);
    });
    on(dom.invTabGear, 'click', () => { state.invTab = 'gear'; renderInventoryUI(); });
    on(dom.invTabStats, 'click', () => { state.invTab = 'stats'; renderInventoryUI(); });
    on(dom.invTabSkills, 'click', () => { state.invTab = 'skills'; renderInventoryUI(); });
    on(dom.invTabMastery, 'click', () => { state.invTab = 'mastery'; renderInventoryUI(); });
    on(dom.btnInvSalvageAll, 'click', salvageAllBagGear);
    on(dom.btnOpenSkills, 'click', () => { sfx.unlock(); openSkillTreeModal(true); });
    on(dom.btnCloseSkillTree, 'click', () => openSkillTreeModal(false));
    on(dom.skillTreeModal, 'click', (e) => {
      if (e.target === dom.skillTreeModal) openSkillTreeModal(false);
    });
    on(dom.btnAutoCombat, 'click', () => {
      sfx.unlock();
      state.autoCombat = !state.autoCombat;
      syncHudDom(true);
      showToast(state.autoCombat ? 'Auto-Combat: ON' : 'Auto-Combat: OFF (Manual)');
    });
    on(dom.btnSortBag, 'click', () => {
      state.player.bag.sort((a, b) => ((RARITY[b.rarity]?.rank || 0) - (RARITY[a.rarity]?.rank || 0)) || String(a.slot).localeCompare(String(b.slot)));
      sfx.loot();
      renderInventoryUI();
    });

    on(dom.btnTownPortal, 'click', () => { sfx.unlock(); sfx.portal(); enterTown(); });
    on(dom.btnLootFilter, 'click', () => {
      sfx.unlock();
      const idx = LOOT_FILTER_MODES.indexOf(state.lootFilter);
      state.lootFilter = LOOT_FILTER_MODES[(idx + 1) % LOOT_FILTER_MODES.length];
      if (dom.lootFilterLabel) dom.lootFilterLabel.textContent = LOOT_FILTER_LABELS[state.lootFilter];
      savePrefs();
      showToast(`Filter: ${LOOT_FILTER_LABELS[state.lootFilter]}`);
    });

    on(dom.btnNewFloor, 'click', () => {
      sfx.unlock();
      if (state.mode === 'TOWN') { openTownNpcDrawer('waypoint'); return; }
      const nextFloor = state.stairs.unlocked ? state.floor + 1 : state.floor;
      const nextSeed = Math.floor(1000 + Math.random() * 8999);
      enterDungeonFloor(nextSeed, nextFloor);
    });

    on(dom.btnRespawn, 'click', () => { sfx.unlock(); respawnAtWaypoint(false); });
    on(dom.btnRespawnNew, 'click', () => { sfx.unlock(); respawnAtWaypoint(true); });
  }

  function updateJoystickFromPointer(px, py) {
    const maxR = 40;
    const dx = px - input.joyOriginX;
    const dy = py - input.joyOriginY;
    const d = Math.hypot(dx, dy);
    const clamped = Math.min(maxR, d);
    const ang = Math.atan2(dy, dx);
    const kx = Math.cos(ang) * clamped;
    const ky = Math.sin(ang) * clamped;
    dom.joystickKnob.style.transform = `translate(${kx.toFixed(1)}px, ${ky.toFixed(1)}px)`;
    if (d < 6) {
      input.joyX = 0;
      input.joyY = 0;
    } else {
      input.joyX = kx / maxR;
      input.joyY = ky / maxR;
    }
  }

  function lootNearestGroundDrop() {
    let bestIdx = -1;
    let bestD = 3.2;
    for (let i = 0; i < state.lootDrops.length; i++) {
      if (!passesLootFilter(state.lootDrops[i])) continue;
      const d = dist(state.player.x, state.player.y, state.lootDrops[i].x, state.lootDrops[i].y);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }
    if (bestIdx !== -1) collectLootDrop(bestIdx);
  }

  function respawnAtWaypoint(reroll) {
    const p = state.player;
    p.dead = false;
    p.chillTimer = 0;
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    dom.deathOverlay.classList.add('hidden');
    if (reroll) {
      enterDungeonFloor(Math.floor(1000 + Math.random() * 8999), state.floor);
    } else {
      enterTown();
    }
    updateHud(true);
  }

  // =========================================================================
  // UPDATE LOOPS (PLAYER, MONSTERS, PROJECTILES, LOOT)
  // =========================================================================
  function updatePlayer(dt) {
    const p = state.player;
    if (p.dead) return;

    // Cooldowns & timers
    p.attackCd = Math.max(0, p.attackCd - dt);
    p.potionCd = Math.max(0, p.potionCd - dt);
    p.dodgeCd = Math.max(0, p.dodgeCd - dt);
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.ultTimer = Math.max(0, p.ultTimer - dt);
    p.attackAnim = Math.max(0, p.attackAnim - dt);
    p.castAnim = Math.max(0, p.castAnim - dt);
    p.hitFlash = Math.max(0, p.hitFlash - dt);
    p.chillTimer = Math.max(0, p.chillTimer - dt);
    if (p.bladeOil && p.bladeOil.timer > 0) {
      p.bladeOil.timer = Math.max(0, p.bladeOil.timer - dt);
      if (p.bladeOil.timer <= 0) p.bladeOil = null;
    }
    for (const s of [1, 2, 3, 4]) {
      p.skillCds[s] = Math.max(0, p.skillCds[s] - dt);
    }

    // Passive Mana & Waypoint Sanctum Regeneration
    p.mp = Math.min(p.maxMp, p.mp + (state.mode === 'TOWN' ? 28 : 4.5) * dt);
    if (state.mode === 'TOWN' || dist(p.x, p.y, state.waypoint.x, state.waypoint.y) <= 2.2) {
      p.hp = Math.min(p.maxHp, p.hp + 18 * dt);
      p.mp = Math.min(p.maxMp, p.mp + 16 * dt);
    }

    // Screen-space input vector (keyboard + virtual thumbstick)
    let sx = input.joyX;
    let sy = input.joyY;
    if (input.keys.has('w') || input.keys.has('arrowup')) sy -= 1;
    if (input.keys.has('s') || input.keys.has('arrowdown')) sy += 1;
    if (input.keys.has('a') || input.keys.has('arrowleft')) sx -= 1;
    if (input.keys.has('d') || input.keys.has('arrowright')) sx += 1;

    if (Math.hypot(sx, sy) > 0.08) {
      state.pendingLootTarget = null;
      state.moveTarget = null;
    } else if (state.pendingLootTarget) {
      const idx = state.lootDrops.indexOf(state.pendingLootTarget);
      if (idx === -1) state.pendingLootTarget = null;
      else {
        const d = dist(p.x, p.y, state.pendingLootTarget.x, state.pendingLootTarget.y);
        if (d <= 1.2) { collectLootDrop(idx); state.pendingLootTarget = null; }
        else {
          const isoDir = worldToIso(state.pendingLootTarget.x - p.x, state.pendingLootTarget.y - p.y);
          const il = Math.hypot(isoDir.x, isoDir.y) || 1;
          sx = isoDir.x / il;
          sy = isoDir.y / il;
        }
      }
    } else if (state.moveTarget) {
      const d = dist(p.x, p.y, state.moveTarget.x, state.moveTarget.y);
      if (d <= 0.3) state.moveTarget = null;
      else {
        const isoDir = worldToIso(state.moveTarget.x - p.x, state.moveTarget.y - p.y);
        const il = Math.hypot(isoDir.x, isoDir.y) || 1;
        sx = isoDir.x / il;
        sy = isoDir.y / il;
      }
    }

    const len = Math.hypot(sx, sy);
    if (len > 0.08) {
      const nsx = sx / Math.max(1, len);
      const nsy = sy / Math.max(1, len);
      let wx = nsx + nsy;
      let wy = nsy - nsx;
      const wLen = Math.hypot(wx, wy) || 1;
      wx /= wLen;
      wy /= wLen;

      const speed = getHeroStats().speed;
      p.vx = wx * speed;
      p.vy = wy * speed;
      p.facingX = wx;
      p.facingY = wy;
      p.walkPhase += dt * 11;

      moveWithSlide(p, p.vx * dt, p.vy * dt, 0.31);
      updateFogOfWar();
    } else {
      p.vx = 0;
      p.vy = 0;
    }

    if (state.mode === 'TOWN') return;

    // Kill Streak Timer
    if (state.killStreak > 0) {
      state.streakTimer -= dt;
      if (state.streakTimer <= 0) {
        state.killStreak = 0;
        state.streakTimer = 0;
      }
    }

    // Bullet-Heaven Smart Auto-Attack & Auto-Cast
    const stats = getHeroStats();
    if (state.autoCombat && state.monsters.length > 0) {
      const cls = state.heroClass;
      const atkRange = (cls === 'paladin' || cls === 'rogue') ? 2.45 : 9.2;
      const nearest = findNearestEnemy(9.5);
      if (nearest) {
        const nd = dist(p.x, p.y, nearest.x, nearest.y);
        if (nd <= atkRange && p.attackCd <= 0) {
          performBasicAttack();
        }
        if (nd <= 6.8) {
          const skCfg = getActiveSkillConfig();
          for (const sid of [1, 2, 3]) {
            if (p.skillCds[sid] <= 0 && p.mp >= skCfg[sid].mana) {
              castSkill(sid);
              break;
            }
          }
          if (p.skillCds[4] <= 0 && (nd <= 4.5 || nearest.tier === 'boss')) {
            const wSpec = getEquippedWeaponSpec();
            if (p.mp >= wSpec.mana) castWeaponSkill();
          }
          if (p.ultCharge >= 100 && (nearest.tier === 'boss' || state.monsters.filter((m) => dist(p.x, p.y, m.x, m.y) <= 5.5).length >= 3)) {
            castUltimate();
          }
        }
      }
    }

    // Passive Auto-Weapons (Bone Blades, Chain Lightning, Ember Aura)
    if (state.autoWeapons.boneBlades > 0) {
      const lv = state.autoWeapons.boneBlades;
      state.bladeAngle += dt * 4.2;
      const count = 2 + lv;
      for (let b = 0; b < count; b++) {
        const ang = state.bladeAngle + (Math.PI * 2 * b) / count;
        const bx = p.x + Math.cos(ang) * 2.05;
        const by = p.y + Math.sin(ang) * 2.05;
        for (let mi = state.monsters.length - 1; mi >= 0; mi--) {
          const m = state.monsters[mi];
          if ((m.bladeHitCd || 0) <= 0 && dist(bx, by, m.x, m.y) <= m.radius + 0.55) {
            m.bladeHitCd = 0.45;
            damageMonster(m, stats.atk * (0.65 + lv * 0.25), Math.cos(ang), Math.sin(ang), true, 4);
          }
        }
      }
    }
    if (state.autoWeapons.chainLightning > 0) {
      const lv = state.autoWeapons.chainLightning;
      state.chainCd -= dt;
      if (state.chainCd <= 0 && state.monsters.length > 0) {
        const nearby = state.monsters.filter((m) => dist(p.x, p.y, m.x, m.y) <= 7.5).slice(0, 2 + lv);
        if (nearby.length > 0) {
          state.chainCd = Math.max(1.2, 2.5 - lv * 0.35);
          sfx.arcane();
          for (const m of nearby) {
            spawnParticles(m.x, m.y, '#38bdf8', 6, 2.2, 18);
            damageMonster(m, stats.atk * (0.8 + lv * 0.3), 0, 0, true, 6);
          }
        }
      }
    }
    if (state.autoWeapons.emberAura > 0) {
      const lv = state.autoWeapons.emberAura;
      state.auraCd -= dt;
      if (state.auraCd <= 0) {
        state.auraCd = 0.72;
        const auraR = 2.4 + lv * 0.45;
        state.novaWaves.push({ x: p.x, y: p.y, r: 0.5, maxR: auraR, color: '#fb923c', life: 0.28, maxLife: 0.28 });
        for (let mi = state.monsters.length - 1; mi >= 0; mi--) {
          const m = state.monsters[mi];
          if (dist(p.x, p.y, m.x, m.y) <= auraR + m.radius) {
            applyStatus(m, 'burn', 2.5);
            damageMonster(m, stats.atk * (0.42 + lv * 0.2), 0, 0, false, 2);
          }
        }
      }
    }

    // Cursed Fog Torch Fuel & Wall Brazier relight
    if (state.floorCondition === 'cursed_fog') {
      state.torchFuel = Math.max(15, state.torchFuel - dt * 1.4);
      for (const tc of state.torches) {
        if (dist(p.x, p.y, tc.x, tc.y) <= 1.5 && state.torchFuel < 90) {
          state.torchFuel = 100;
          addFloatText(p.x, p.y, 'Torch Relit!', '#fde047', false);
        }
      }
    }

    // Abyssal Rift Timer
    if (state.riftTier > 0 && !state.stairs.unlocked) {
      state.riftTimer = Math.max(0, state.riftTimer - dt);
      if (state.riftTimer === 0) {
        showToast('Abyssal Rift Timer Expired — Boss Enraged!');
      }
    }

    // Levers & Iron Gates
    for (const lv of state.levers) {
      if (!lv.pulled && dist(p.x, p.y, lv.x, lv.y) <= 1.25) {
        lv.pulled = true;
        const g = state.gates[lv.gateIdx];
        if (g) { g.locked = false; g.isOpen = true; }
        sfx.anvil();
        showToast('Portcullis Lever Pulled — Gate Unlocked!');
      }
    }
    for (const g of state.gates) {
      if (!g.locked && dist(p.x, p.y, g.x, g.y) <= 2.7 && !g.isOpen) g.isOpen = true;
      if (g.isOpen && g.open < 1) g.open = Math.min(1, g.open + dt * 3.2);
    }

    // Color-Coded Rune Plates & Bridges
    for (const rp of state.runePlates) {
      if (!rp.active && dist(p.x, p.y, rp.x, rp.y) <= 1.0) {
        rp.active = true;
        for (const rb of state.runeBridges) {
          if (rb.colorId === rp.colorId) rb.unlocked = true;
        }
        sfx.holy();
        showToast(`${rp.colorId.toUpperCase()} Rune Bridge Activated!`);
      }
    }

    // Teleportation Mirror Pads
    for (const mp of state.mirrorPads) {
      mp.cd = Math.max(0, mp.cd - dt);
      if (mp.cd <= 0 && dist(p.x, p.y, mp.x, mp.y) <= 0.85) {
        p.x = mp.tx;
        p.y = mp.ty;
        for (const other of state.mirrorPads) other.cd = 3.0;
        sfx.portal();
        updateFogOfWar(true);
        showToast('Teleported via Mirror Pad!');
        break;
      }
    }

    // Traps (harm both player and monsters)
    for (const tr of state.traps) {
      tr.timer -= dt;
      if (tr.timer <= 0) {
        tr.timer = tr.active ? 2.4 : 0.7;
        tr.active = !tr.active;
        if (tr.active) {
          if (dist(p.x, p.y, tr.x, tr.y) <= 1.1) damagePlayer(Math.round(10 + state.floor * 3));
          for (let i = state.monsters.length - 1; i >= 0; i--) {
            const m = state.monsters[i];
            if (dist(m.x, m.y, tr.x, tr.y) <= 1.2) {
              damageMonster(m, 14 + state.floor * 4, 0, 0, false, 4);
              if (tr.kind === 'darts') applyStatus(m, 'poison', 3.0);
            }
          }
        }
      }
    }

    // Interactive Room Events (Shrine, Cursed Chest, Blood Obelisk, Invasion Altar, Goblin Peddler)
    for (const ev of state.events) {
      if (ev.kind === 'obelisk' && ev.active && !ev.used) {
        ev.timer -= dt;
        if (ev.wave < 3 && ev.timer < 20 - ev.wave * 6) {
          ev.wave += 1;
          state.monsters.push(createMonster('skeleton', ev.x + 1.5, ev.y, 1 + state.floor * 0.25));
          state.monsters.push(createMonster('ghoul', ev.x - 1.5, ev.y, 1 + state.floor * 0.25));
        }
        if (ev.timer <= 0) {
          ev.used = true;
          ev.active = false;
          spawnLootDrop(ev.x, ev.y, 'elite');
          advanceBounty('events', 1);
          showToast('Blood Obelisk Cleansed!');
        }
        continue;
      }
      if (ev.used || dist(p.x, p.y, ev.x, ev.y) > 1.3) continue;
      if (ev.kind === 'shrine') {
        ev.used = true;
        p.hp = p.maxHp;
        p.mp = p.maxMp;
        sfx.holy();
        advanceBounty('events', 1);
        showToast('Dungeon Shrine: Vitals Restored!');
      } else if (ev.kind === 'cursed_chest') {
        ev.used = true;
        sfx.loot();
        spawnLootDrop(ev.x, ev.y, 'elite');
        state.monsters.push(createMonster('ghoul', ev.x + 1.4, ev.y + 1.0, 1 + state.floor * 0.28));
        advanceBounty('events', 1);
        showToast('Cursed Chest Opened — Ambush!');
      } else if (ev.kind === 'obelisk') {
        ev.active = true;
        sfx.portal();
        showToast('Blood Obelisk Activated — Survive 20s!');
      } else if (ev.kind === 'invasion') {
        ev.used = true;
        state.infamyStreak += 1;
        state.monsters.push(createMonster('rival', ev.x + 1.6, ev.y - 1.2, 1 + state.floor * 0.3));
        sfx.fire();
        advanceBounty('events', 1);
        showToast(`Invasion Altar! Shadow Rival Appears (Streak ${state.infamyStreak})!`);
      } else if (ev.kind === 'peddler') {
        ev.used = true;
        if (p.gold >= 60) {
          p.gold -= 60;
          const item = generateItem(Math.random() < 0.25 ? 'legendary' : Math.random() < 0.5 ? 'set' : 'rare');
          p.bag.push(item);
          sfx.legendary();
          showToast(`Goblin Peddler Mystery Box: ${item.name}!`);
        } else {
          showToast('Goblin Peddler wants 60 Gold for a Mystery Box.');
        }
      }
    }

    // Waypoint return-to-town
    const wpDist = dist(p.x, p.y, state.waypoint.x, state.waypoint.y);
    if (!state.waypointArmed && wpDist > 2.6) state.waypointArmed = true;
    else if (state.waypointArmed && wpDist <= 0.95) {
      state.waypointArmed = false;
      sfx.portal();
      enterTown();
      return;
    }

    // Auto-pickup Gold & Potions
    for (let i = state.lootDrops.length - 1; i >= 0; i--) {
      const drop = state.lootDrops[i];
      if (drop.z > 2) continue;
      if ((drop.kind === 'gold' || drop.kind === 'potion' || drop.kind === 'essence') && dist(p.x, p.y, drop.x, drop.y) <= 1.15) {
        collectLootDrop(i);
      }
    }

    // Descent Stairs
    if (state.stairs.unlocked && dist(p.x, p.y, state.stairs.x, state.stairs.y) <= 1.05) {
      const nextFloor = state.floor + 1;
      state.highestFloor = Math.max(state.highestFloor, nextFloor);
      const nextSeed = Math.floor(1000 + Math.random() * 8999);
      enterDungeonFloor(nextSeed, nextFloor, { riftTier: state.riftTier > 0 ? state.riftTier + 1 : 0 });
    }
  }

  function updateMonsters(dt) {
    if (state.mode === 'TOWN') {
      dom.bossBar.classList.add('hidden');
      return;
    }
    const p = state.player;
    let activeBoss = null;

    // Tick Albion-style Boss Ground Telegraphs
    for (let i = state.bossTelegraphs.length - 1; i >= 0; i--) {
      const tg = state.bossTelegraphs[i];
      tg.elapsed += dt;
      if (tg.elapsed >= tg.dur) {
        // Detonate telegraph!
        sfx.fire();
        state.camera.shake = Math.max(state.camera.shake, 5);
        const dPlayer = dist(p.x, p.y, tg.x, tg.y);
        let hit = false;
        if (tg.kind === 'cone') {
          if (dPlayer <= tg.r) {
            const dot = ((p.x - tg.x) / (dPlayer || 1)) * Math.cos(tg.angle) + ((p.y - tg.y) / (dPlayer || 1)) * Math.sin(tg.angle);
            if (dot >= 0.45) hit = true;
          }
        } else if (tg.kind === 'donut') {
          if (dPlayer >= tg.innerR && dPlayer <= tg.r) hit = true;
        } else if (tg.kind === 'laser') {
          const along = Math.abs((p.x - tg.x) * Math.sin(tg.angle) - (p.y - tg.y) * Math.cos(tg.angle));
          if (dPlayer <= tg.r && along <= 0.9) hit = true;
        } else if (tg.kind === 'pool') {
          if (dPlayer <= tg.r) hit = true;
        }
        if (hit) damagePlayer(tg.dmg, tg.owner);
        state.bossTelegraphs.splice(i, 1);
      }
    }

    for (let i = state.monsters.length - 1; i >= 0; i--) {
      const m = state.monsters[i];
      m.hitFlash = Math.max(0, m.hitFlash - dt);
      m.stunTimer = Math.max(0, m.stunTimer - dt);
      m.staggeredTimer = Math.max(0, (m.staggeredTimer || 0) - dt);
      m.atkCd = Math.max(0, m.atkCd - dt);

      // Tick Burn / Poison / Bleed / Chill statuses
      if (m.statuses) {
        if (m.statuses.burn > 0) {
          m.statuses.burn -= dt;
          if (Math.random() < dt * 2.5) damageMonster(m, Math.max(2, getHeroStats().atk * 0.18), 0, 0, false, 0);
        }
        if (m.statuses.poison > 0) {
          m.statuses.poison -= dt;
          if (Math.random() < dt * 2.5) damageMonster(m, Math.max(2, getHeroStats().atk * 0.16), 0, 0, false, 0);
        }
        if (m.statuses.bleed > 0) {
          m.statuses.bleed -= dt;
          if (Math.random() < dt * 2.5) damageMonster(m, Math.max(2, getHeroStats().atk * 0.2), 0, 0, false, 0);
        }
        if (m.statuses.chill > 0) m.statuses.chill -= dt;
      }
      if (m.hp <= 0) continue;

      if (m.affixes && m.affixes.includes('molten') && Math.random() < dt * 4.5) {
        spawnParticles(m.x, m.y, '#f97316', 1, 0.9, 10);
      }

      if (Math.hypot(m.vx, m.vy) > 0.05) {
        moveWithSlide(m, m.vx * dt, m.vy * dt, m.radius);
        m.vx *= Math.pow(0.05, dt);
        m.vy *= Math.pow(0.05, dt);
      }

      const d = dist(m.x, m.y, p.x, p.y);
      if (d <= m.aggro) m.engaged = true;
      if (m.type === 'boss' && m.engaged) activeBoss = m;

      if (p.dead || !m.engaged || m.stunTimer > 0 || m.staggeredTimer > 0) continue;

      const nx = (p.x - m.x) / (d || 1);
      const ny = (p.y - m.y) / (d || 1);
      m.facingX = nx;
      m.facingY = ny;

      // Treasure Goblin flees instead of attacking!
      if (m.type === 'goblin') {
        moveWithSlide(m, -nx * m.speed * dt, -ny * m.speed * dt, m.radius);
        m.walkPhase += dt * 12;
        continue;
      }

      // Boss Albion-Style Chained Telegraph Rotation
      if (m.type === 'boss') {
        m.bossCastCd -= dt;
        if (m.bossCastCd <= 0) {
          const speedScale = m.phase === 2 ? 0.72 : 1.0;
          m.bossCastCd = 3.1 * speedScale;
          const step = m.bossComboStep % 4;
          m.bossComboStep += 1;
          const ang = Math.atan2(p.y - m.y, p.x - m.x);
          if (step === 0) {
            state.bossTelegraphs.push({ kind: 'cone', x: m.x, y: m.y, r: 3.8, angle: ang, elapsed: 0, dur: 1.05 * speedScale, dmg: Math.round(m.atk * 1.5), owner: m });
          } else if (step === 1) {
            state.bossTelegraphs.push({ kind: 'donut', x: m.x, y: m.y, innerR: 1.5, r: 4.2, angle: 0, elapsed: 0, dur: 1.2 * speedScale, dmg: Math.round(m.atk * 1.65), owner: m });
          } else if (step === 2) {
            state.bossTelegraphs.push({ kind: 'laser', x: m.x, y: m.y, r: 6.5, angle: ang, elapsed: 0, dur: 1.0 * speedScale, dmg: Math.round(m.atk * 1.55), owner: m });
            state.bossTelegraphs.push({ kind: 'laser', x: m.x, y: m.y, r: 6.5, angle: ang + Math.PI * 0.5, elapsed: 0, dur: 1.0 * speedScale, dmg: Math.round(m.atk * 1.55), owner: m });
          } else {
            state.bossTelegraphs.push({ kind: 'pool', x: p.x, y: p.y, r: 2.0, angle: 0, elapsed: 0, dur: 1.0 * speedScale, dmg: Math.round(m.atk * 1.6), owner: m });
          }
        }
      }

      const moveMult = m.statuses && m.statuses.chill > 0 ? 0.65 : 1.0;
      m.bladeHitCd = Math.max(0, (m.bladeHitCd || 0) - dt);
      m.specialCd = Math.max(0, (m.specialCd || 0) - dt);

      // Special AI: Wraith Phase-Blink & Gargoyle/Golem Slam Telegraph
      if (m.type === 'wraith' && m.specialCd <= 0 && d > 2.4 && d < 8.5) {
        m.specialCd = 4.2;
        const bx = clamp(p.x - nx * 1.35, 1.5, MAP_W - 2.5);
        const by = clamp(p.y - ny * 1.35, 1.5, MAP_H - 2.5);
        if (isPositionClear(bx, by, m.radius)) {
          spawnParticles(m.x, m.y, '#818cf8', 8, 2.2);
          m.x = bx; m.y = by;
          spawnParticles(m.x, m.y, '#818cf8', 8, 2.2);
        }
      } else if ((m.type === 'gargoyle' || m.type === 'golem') && m.specialCd <= 0 && d <= 2.9) {
        m.specialCd = 4.4;
        state.bossTelegraphs.push({ kind: 'pool', x: m.x, y: m.y, r: m.type === 'golem' ? 2.1 : 1.7, angle: 0, elapsed: 0, dur: 0.95, dmg: Math.round(m.atk * 1.45), owner: m });
      }

      if (m.ranged) {
        if (d > m.range) {
          moveWithSlide(m, nx * m.speed * moveMult * dt, ny * m.speed * moveMult * dt, m.radius);
          m.walkPhase += dt * 8;
        } else if (d < Math.max(2.2, m.range * 0.42)) {
          moveWithSlide(m, -nx * m.speed * 0.7 * moveMult * dt, -ny * m.speed * 0.7 * moveMult * dt, m.radius);
          m.walkPhase += dt * 6;
        }
        if (d <= m.range + 0.6 && m.atkCd <= 0) {
          m.atkCd = m.atkCdMax;
          const pSpd = m.projKind === 'arrow' ? 7.6 : m.projKind === 'web' ? 5.8 : 6.4;
          state.enemyProjectiles.push({
            kind: m.projKind, color: m.projCol,
            x: m.x + nx * 0.35, y: m.y + ny * 0.35,
            vx: nx * pSpd, vy: ny * pSpd,
            dmg: m.atk, life: 1.5, owner: m
          });
        }
        continue;
      }

      if (d > m.range) {
        let sepX = 0, sepY = 0;
        if (m.type === 'bat') {
          const perp = Math.sin(m.walkPhase * 1.7) * 1.8;
          sepX += -ny * perp; sepY += nx * perp;
        }
        for (let j = 0; j < state.monsters.length; j++) {
          if (i === j) continue;
          const o = state.monsters[j];
          const od = dist(m.x, m.y, o.x, o.y);
          const minD = m.radius + o.radius + 0.15;
          if (od > 0 && od < minD) {
            sepX += ((m.x - o.x) / od) * (minD - od) * 2.2;
            sepY += ((m.y - o.y) / od) * (minD - od) * 2.2;
          }
        }
        moveWithSlide(m, (nx * m.speed * moveMult + sepX) * dt, (ny * m.speed * moveMult + sepY) * dt, m.radius);
        m.walkPhase += dt * (m.type === 'bat' ? 14 : 8);
      } else if (m.atkCd <= 0) {
        m.atkCd = m.atkCdMax;
        damagePlayer(m.atk, m);
      }
    }

    // Update Enemy Projectiles
    for (let i = state.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = state.enemyProjectiles[i];
      ep.life -= dt;
      ep.x += ep.vx * dt;
      ep.y += ep.vy * dt;
      if (ep.life <= 0 || !isPositionClear(ep.x, ep.y, 0.14)) {
        state.enemyProjectiles.splice(i, 1);
        continue;
      }
      if (!p.dead && dist(ep.x, ep.y, p.x, p.y) <= 0.45) {
        if (ep.kind === 'web') p.chillTimer = Math.max(p.chillTimer, 1.8);
        damagePlayer(ep.dmg, ep.owner || null);
        state.enemyProjectiles.splice(i, 1);
      }
    }

    // Update Toxic/Cinder Enemy Puddles
    for (let i = state.enemyPuddles.length - 1; i >= 0; i--) {
      const pd = state.enemyPuddles[i];
      pd.life -= dt;
      pd.tick -= dt;
      if (pd.tick <= 0) {
        pd.tick = 0.65;
        if (!p.dead && dist(pd.x, pd.y, p.x, p.y) <= pd.r) {
          damagePlayer(pd.dmg, null);
        }
      }
      if (pd.life <= 0) state.enemyPuddles.splice(i, 1);
    }

    if (activeBoss) {
      dom.bossBar.classList.remove('hidden');
      const affStr = activeBoss.affixes?.length ? ` [${activeBoss.affixes.map((a) => ELITE_AFFIXES[a]?.label || a).join(' • ')}]` : '';
      dom.bossName.textContent = activeBoss.name + affStr;
      dom.bossHpText.textContent = `${Math.max(0, activeBoss.hp)} / ${activeBoss.maxHp}`;
      dom.bossHpFill.style.width = `${clamp((activeBoss.hp / activeBoss.maxHp) * 100, 0, 100)}%`;
      dom.bossStaggerFill.style.width = `${clamp((activeBoss.stagger / (activeBoss.maxStagger || 100)) * 100, 0, 100)}%`;
      const phaseTxt = activeBoss.staggeredTimer > 0 ? 'STAGGERED!' : state.crystals.length > 0 ? 'SHIELDED (DESTROY CRYSTALS)' : (activeBoss.phase === 2 ? 'PHASE 2' : '');
      dom.bossPhaseBadge.textContent = phaseTxt;
      dom.bossPhaseBadge.classList.toggle('hidden', !phaseTxt);
    } else {
      dom.bossBar.classList.add('hidden');
    }
  }

  function damagePlayer(rawDmg, attacker = null) {
    const p = state.player;
    if (p.dead || state.mode === 'TOWN' || p.invulnTimer > 0) return;
    const stats = getHeroStats();
    let mitigated = Math.max(2, Math.round((rawDmg - stats.arm * 0.45) * (1 - stats.dr)));
    p.hp = Math.max(0, p.hp - mitigated);
    p.hitFlash = 0.16;
    state.camera.shake = Math.max(state.camera.shake, 3.5);
    addFloatText(p.x, p.y, `-${mitigated}`, '#ef4444', false);
    spawnParticles(p.x, p.y, '#dc2626', 6, 2.0);

    if (attacker && attacker.affixes) {
      if (attacker.affixes.includes('vampiric')) {
        const leach = Math.max(2, Math.round(mitigated * 0.35));
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + leach);
        addFloatText(attacker.x, attacker.y, `+${leach}`, '#f43f5e', false);
      }
      if (attacker.affixes.includes('frozen')) p.chillTimer = 2.0;
    }

    if (p.hp <= 0) {
      p.dead = true;
      const clsName = HERO_CLASSES[state.heroClass]?.name || 'Hero';
      dom.deathSummary.textContent = `${state.heroName} slain on Floor ${state.floor} • Lv ${p.level} ${clsName}.`;
      dom.deathOverlay.classList.remove('hidden');
      saveHeroProfile();
    }
    updateHud();
  }

  function updateEffectsAndLoot(dt) {
    const p = state.player;

    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const pr = state.projectiles[i];
      pr.life -= dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      if (Math.random() < 0.5) {
        const pCol = pr.kind === 'frost' ? '#38bdf8' : pr.kind === 'shadow' || pr.kind === 'soul' ? '#c084fc' : pr.kind === 'bolt' || pr.kind === 'pierce' ? '#4ade80' : '#f97316';
        spawnParticles(pr.x, pr.y, pCol, 1, 0.7, 18);
      }

      let hit = !isPositionClear(pr.x, pr.y, 0.16) || pr.life <= 0;
      if (!hit) {
        for (let c = state.crystals.length - 1; c >= 0; c--) {
          const cr = state.crystals[c];
          if (dist(pr.x, pr.y, cr.x, cr.y) <= 0.6) {
            cr.hp -= pr.dmg;
            hit = true;
            if (cr.hp <= 0) state.crystals.splice(c, 1);
            break;
          }
        }
      }
      if (!hit) {
        for (const m of state.monsters) {
          if (dist(pr.x, pr.y, m.x, m.y) <= m.radius + 0.35) {
            if (pr.pierce) {
              if (!pr.hitIds) pr.hitIds = new Set();
              if (!pr.hitIds.has(m.id)) {
                pr.hitIds.add(m.id);
                damageMonster(m, pr.dmg, 0, 0, true, pr.stagger || 8);
              }
            } else {
              hit = true;
              break;
            }
          }
        }
      }

      if (hit) {
        const aoeR = pr.aoe || 2.0;
        const wCol = pr.kind === 'frost' ? '#38bdf8' : pr.kind === 'shadow' || pr.kind === 'soul' ? '#c084fc' : pr.kind === 'bolt' || pr.kind === 'pierce' ? '#4ade80' : '#f97316';
        state.novaWaves.push({ x: pr.x, y: pr.y, r: 0.25, maxR: aoeR, color: wCol, life: 0.22, maxLife: 0.22 });
        spawnParticles(pr.x, pr.y, wCol, 10, 3.0, 16);
        if (aoeR >= 1.5) state.camera.shake = Math.max(state.camera.shake, 3.5);
        for (let j = state.monsters.length - 1; j >= 0; j--) {
          const m = state.monsters[j];
          const d = dist(pr.x, pr.y, m.x, m.y);
          if (d <= aoeR + m.radius) {
            if (pr.kind === 'frost') m.stunTimer = Math.max(m.stunTimer, 0.95);
            if (pr.status) applyStatus(m, pr.status, 3.5);
            if (pr.restoreMana) p.mp = Math.min(p.maxMp, p.mp + pr.restoreMana);
            damageMonster(m, pr.dmg, (m.x - pr.x) / (d || 1), (m.y - pr.y) / (d || 1), true, pr.stagger || 8);
          }
        }
        breakNearbyProps(pr.x, pr.y, aoeR);
        state.projectiles.splice(i, 1);
      }
    }

    for (let i = state.poisonClouds.length - 1; i >= 0; i--) {
      const pc = state.poisonClouds[i];
      pc.life -= dt;
      pc.tick -= dt;
      if (pc.tick <= 0) {
        pc.tick = 0.5;
        for (let j = state.monsters.length - 1; j >= 0; j--) {
          const m = state.monsters[j];
          if (dist(pc.x, pc.y, m.x, m.y) <= pc.r + m.radius) {
            if (pc.status) applyStatus(m, pc.status, 3.0);
            damageMonster(m, pc.dmg, 0, 0, false, 4);
          }
        }
      }
      if (pc.life <= 0) state.poisonClouds.splice(i, 1);
    }

    // Loot Drop bounce + Auto-Loot Gold Magnet (90px)
    for (let i = state.lootDrops.length - 1; i >= 0; i--) {
      const d = state.lootDrops[i];
      d.age += dt;
      if (d.z > 0 || d.vz > 0) {
        d.x += (d.destX - d.x) * Math.min(1, dt * 6);
        d.y += (d.destY - d.y) * Math.min(1, dt * 6);
        d.z += d.vz * dt;
        d.vz -= 290 * dt;
        if (d.z <= 0) { d.z = 0; d.vz = 0; d.x = d.destX; d.y = d.destY; }
      } else if ((d.kind === 'gold' || d.kind === 'xp_gem') && !p.dead) {
        const dx = p.x - d.x, dy = p.y - d.y;
        const pxDist = Math.hypot((dx - dy) * (TILE_W * 0.5), (dx + dy) * (TILE_H * 0.5));
        const magR = (d.kind === 'xp_gem' ? 155 : 95) * getHeroStats().magnetMult;
        if (pxDist <= magR) {
          const wDist = Math.hypot(dx, dy) || 1;
          const pull = Math.min(wDist, 10.5 * dt);
          d.x += (dx / wDist) * pull;
          d.y += (dy / wDist) * pull;
          d.destX = d.x; d.destY = d.y;
          if (wDist <= 0.7) collectLootDrop(i);
        }
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const pt = state.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) { state.particles.splice(i, 1); continue; }
      pt.x += pt.vx * dt; pt.y += pt.vy * dt;
      pt.z = Math.max(0, pt.z + pt.vz * dt); pt.vz -= 160 * dt;
    }
    for (let i = state.slashArcs.length - 1; i >= 0; i--) {
      state.slashArcs[i].life -= dt;
      if (state.slashArcs[i].life <= 0) state.slashArcs.splice(i, 1);
    }
    for (let i = state.novaWaves.length - 1; i >= 0; i--) {
      const w = state.novaWaves[i];
      w.life -= dt; w.r = w.maxR * (1 - w.life / w.maxLife);
      if (w.life <= 0) state.novaWaves.splice(i, 1);
    }
    for (let i = state.floatTexts.length - 1; i >= 0; i--) {
      const f = state.floatTexts[i];
      f.life -= dt; f.z += f.vy * dt;
      if (f.life <= 0) state.floatTexts.splice(i, 1);
    }

    const targetIso = worldToIso(state.player.x, state.player.y);
    state.camera.x += (targetIso.x - state.camera.x) * Math.min(1, dt * 9);
    state.camera.y += (targetIso.y - state.camera.y) * Math.min(1, dt * 9);
    state.camera.shake = Math.max(0, state.camera.shake - dt * 22);

    if (state.toastTimer > 0) {
      state.toastTimer -= dt;
      if (state.toastTimer <= 0) dom.toastBanner.classList.add('hidden');
    }
  }

  // =========================================================================
  // ISOMETRIC RENDERER (CAMERA FRUSTUM CULLED + LOW-GC)
  // =========================================================================
  const drawPool = [];
  let vignetteCanvas = null;

  function rebuildVignetteCache(viewW, viewH) {
    if (!viewW || !viewH) return;
    vignetteCanvas = makeCanvas(viewW, viewH);
    const vc = vignetteCanvas.getContext('2d');
    const vig = vc.createRadialGradient(
      viewW * 0.5, viewH * 0.5, Math.min(viewW, viewH) * 0.26,
      viewW * 0.5, viewH * 0.5, Math.max(viewW, viewH) * 0.72
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(4, 5, 8, 0.65)');
    vc.fillStyle = vig;
    vc.fillRect(0, 0, viewW, viewH);
  }

  function renderIsometricWorld(now) {
    const viewW = canvas.clientWidth;
    const viewH = canvas.clientHeight;
    if (!viewW || !viewH) return;

    const biomeDef = BIOMES[state.biome] || BIOMES.crypt;
    const biomeSprites = atlas.biomes[state.biome] || { floors: atlas.floors, wall: atlas.wall };

    ctx.fillStyle = biomeDef.fog;
    ctx.fillRect(0, 0, viewW, viewH);

    const shakeX = state.camera.shake > 0.05 ? (Math.random() - 0.5) * state.camera.shake * 2 : 0;
    const shakeY = state.camera.shake > 0.05 ? (Math.random() - 0.5) * state.camera.shake * 2 : 0;
    const offX = viewW * 0.5 - state.camera.x + shakeX;
    const offY = viewH * 0.5 - state.camera.y + shakeY;

    // Camera Frustum Culling: convert 4 screen corners to world tile bounds (+2 margin)
    const c1 = isoToWorld(-offX, -offY);
    const c2 = isoToWorld(viewW - offX, -offY);
    const c3 = isoToWorld(-offX, viewH - offY);
    const c4 = isoToWorld(viewW - offX, viewH - offY);
    const minTileX = Math.max(0, Math.floor(Math.min(c1.x, c2.x, c3.x, c4.x)) - 2);
    const maxTileX = Math.min(MAP_W - 1, Math.ceil(Math.max(c1.x, c2.x, c3.x, c4.x)) + 2);
    const minTileY = Math.max(0, Math.floor(Math.min(c1.y, c2.y, c3.y, c4.y)) - 2);
    const maxTileY = Math.min(MAP_H - 1, Math.ceil(Math.max(c1.y, c2.y, c3.y, c4.y)) + 2);

    // Pass 1: Explored Ground Tiles (Culled + Biome Tinted)
    for (let y = minTileY; y <= maxTileY; y++) {
      const rowExp = state.explored[y];
      const rowGrid = state.grid[y];
      const rowVar = state.tileVariant[y];
      for (let x = minTileX; x <= maxTileX; x++) {
        const exp = rowExp[x];
        if (!exp) continue;
        const t = rowGrid[x];
        if (t !== TILE.FLOOR && t !== TILE.SANCTUM && t !== TILE.BOSS_FLOOR) continue;

        const iso = worldToIso(x + 0.5, y + 0.5);
        const sx = iso.x + offX;
        const sy = iso.y + offY;
        if (sx < -80 || sx > viewW + 80 || sy < -80 || sy > viewH + 80) continue;

        const sprite = t === TILE.SANCTUM
          ? atlas.sanctum
          : t === TILE.BOSS_FLOOR
            ? atlas.bossFloor
            : biomeSprites.floors[rowVar[x] % biomeSprites.floors.length];

        ctx.drawImage(sprite, sx - TILE_W * 0.5 - 1, sy - TILE_H * 0.5 - 1);
        if (exp === 1) {
          ctx.fillStyle = 'rgba(4, 5, 9, 0.5)';
          drawIsoDiamondPath(ctx, sx, sy, TILE_W, TILE_H);
          ctx.fill();
        }
      }
    }

    // Pass 1b: Pre-rendered Ground Light Pools
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < state.torches.length; i++) {
      const tc = state.torches[i];
      if (tc.x < minTileX || tc.x > maxTileX || tc.y < minTileY || tc.y > maxTileY) continue;
      if (!state.explored[Math.floor(tc.y)]?.[Math.floor(tc.x)]) continue;
      const iso = worldToIso(tc.x, tc.y);
      const sx = iso.x + offX;
      const sy = iso.y + offY;
      if (sx < -120 || sx > viewW + 120 || sy < -120 || sy > viewH + 120) continue;
      const sprite = tc.isArcane ? atlas.arcaneGlow : atlas.torchGlow;
      const flicker = 0.9 + Math.sin(now * 0.008 + tc.phase) * 0.1;
      const rw = 148 * flicker;
      const rh = 82 * flicker;
      ctx.drawImage(sprite, sx - rw * 0.5, sy - 6 - rh * 0.5, rw, rh);
    }
    ctx.restore();

    drawWaypointAndStairs(offX, offY, now);

    // Rune Plates, Bridges, Mirror Pads, Traps & Albion Boss Telegraphs
    for (const rp of state.runePlates) {
      if (!state.explored[Math.floor(rp.y)]?.[Math.floor(rp.x)]) continue;
      const iso = worldToIso(rp.x, rp.y);
      ctx.fillStyle = rp.active ? rp.color : 'rgba(30,41,59,0.85)';
      ctx.strokeStyle = rp.color;
      ctx.lineWidth = 2;
      drawIsoDiamondPath(ctx, iso.x + offX, iso.y + offY, 26, 13);
      ctx.fill(); ctx.stroke();
    }
    for (const mp of state.mirrorPads) {
      if (!state.explored[Math.floor(mp.y)]?.[Math.floor(mp.x)]) continue;
      const iso = worldToIso(mp.x, mp.y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(iso.x + offX, iso.y + offY, 18, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const tr of state.traps) {
      if (!state.explored[Math.floor(tr.y)]?.[Math.floor(tr.x)]) continue;
      const iso = worldToIso(tr.x, tr.y);
      ctx.fillStyle = tr.active ? 'rgba(239,68,68,0.6)' : 'rgba(71,85,105,0.45)';
      drawIsoDiamondPath(ctx, iso.x + offX, iso.y + offY, 28, 14);
      ctx.fill();
    }
    for (const tg of state.bossTelegraphs) {
      const iso = worldToIso(tg.x, tg.y);
      const sx = iso.x + offX, sy = iso.y + offY;
      const pct = clamp(tg.elapsed / tg.dur, 0, 1);
      ctx.save();
      ctx.fillStyle = `rgba(239, 68, 68, ${0.14 + pct * 0.25})`;
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 2;
      if (tg.kind === 'donut') {
        ctx.beginPath();
        ctx.ellipse(sx, sy, tg.r * 32, tg.r * 16, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(22, 163, 74, 0.25)';
        ctx.beginPath();
        ctx.ellipse(sx, sy, tg.innerR * 32, tg.innerR * 16, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (tg.kind === 'laser') {
        const endIso = worldToIso(tg.x + Math.cos(tg.angle) * tg.r, tg.y + Math.sin(tg.angle) * tg.r);
        ctx.lineWidth = 10 + pct * 8;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.beginPath(); ctx.moveTo(sx, sy - 8); ctx.lineTo(endIso.x + offX, endIso.y + offY - 8); ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(sx, sy, tg.r * 32, tg.r * 16, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(sx, sy, tg.r * 32 * pct, tg.r * 16 * pct, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Poison Trap Clouds (Rogue)
    for (let i = 0; i < state.poisonClouds.length; i++) {
      const pc = state.poisonClouds[i];
      const iso = worldToIso(pc.x, pc.y);
      ctx.save();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(iso.x + offX, iso.y + offY, pc.r * 32, pc.r * 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Nova rings on ground
    for (let i = 0; i < state.novaWaves.length; i++) {
      const w = state.novaWaves[i];
      const iso = worldToIso(w.x, w.y);
      const alpha = clamp(w.life / w.maxLife, 0, 1);
      ctx.save();
      ctx.strokeStyle = w.color;
      ctx.globalAlpha = alpha * 0.85;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(iso.x + offX, iso.y + offY, w.r * 32, w.r * 16, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Pass 2: Depth-Sorted Drawables using pooled objects (no closure allocations)
    let drawLen = 0;
    const pushDraw = (depth, kind, sx, sy, ref, extra) => {
      let item = drawPool[drawLen];
      if (!item) {
        item = { depth: 0, kind: 0, sx: 0, sy: 0, ref: null, extra: 0 };
        drawPool[drawLen] = item;
      }
      item.depth = depth;
      item.kind = kind;
      item.sx = sx;
      item.sy = sy;
      item.ref = ref;
      item.extra = extra;
      drawLen++;
    };

    for (let y = minTileY; y <= maxTileY; y++) {
      const rowExp = state.explored[y];
      const rowGrid = state.grid[y];
      for (let x = minTileX; x <= maxTileX; x++) {
        const exp = rowExp[x];
        if (!exp || rowGrid[x] !== TILE.WALL) continue;
        const iso = worldToIso(x + 0.5, y + 0.5);
        const sx = iso.x + offX;
        const sy = iso.y + offY;
        if (sx < -80 || sx > viewW + 80 || sy < -100 || sy > viewH + 100) continue;
        pushDraw(x + y + 0.5, 1, sx, sy, null, exp);
      }
    }

    for (let i = 0; i < state.torches.length; i++) {
      const tc = state.torches[i];
      if (tc.x < minTileX || tc.x > maxTileX || tc.y < minTileY || tc.y > maxTileY) continue;
      if (!state.explored[Math.floor(tc.y)]?.[Math.floor(tc.x)]) continue;
      const iso = worldToIso(tc.x, tc.y);
      pushDraw(tc.x + tc.y, 2, iso.x + offX, iso.y + offY, tc, 0);
    }

    for (let i = 0; i < state.gates.length; i++) {
      const g = state.gates[i];
      if (g.x < minTileX || g.x > maxTileX || g.y < minTileY || g.y > maxTileY) continue;
      if (!state.explored[Math.floor(g.y)]?.[Math.floor(g.x)]) continue;
      const iso = worldToIso(g.x, g.y);
      pushDraw(g.x + g.y, 3, iso.x + offX, iso.y + offY, g, 0);
    }

    for (let i = 0; i < state.props.length; i++) {
      const pr = state.props[i];
      if (pr.broken || pr.x < minTileX || pr.x > maxTileX || pr.y < minTileY || pr.y > maxTileY) continue;
      if (!state.explored[Math.floor(pr.y)]?.[Math.floor(pr.x)]) continue;
      const iso = worldToIso(pr.x, pr.y);
      pushDraw(pr.x + pr.y, 4, iso.x + offX, iso.y + offY, pr, 0);
    }

    for (let i = 0; i < state.townNpcs.length; i++) {
      const npc = state.townNpcs[i];
      const iso = worldToIso(npc.x, npc.y);
      pushDraw(npc.x + npc.y, 8, iso.x + offX, iso.y + offY, npc, 0);
    }

    for (let i = 0; i < state.lootDrops.length; i++) {
      const d = state.lootDrops[i];
      if (d.x < minTileX || d.x > maxTileX || d.y < minTileY || d.y > maxTileY) continue;
      const iso = worldToIso(d.x, d.y);
      pushDraw(d.x + d.y, 5, iso.x + offX, iso.y + offY - d.z, d, 0);
    }

    for (let i = 0; i < state.monsters.length; i++) {
      const m = state.monsters[i];
      if (m.x < minTileX || m.x > maxTileX || m.y < minTileY || m.y > maxTileY) continue;
      if (state.explored[Math.floor(m.y)]?.[Math.floor(m.x)] !== 2) continue;
      const iso = worldToIso(m.x, m.y);
      pushDraw(m.x + m.y, 6, iso.x + offX, iso.y + offY, m, 0);
    }

    for (let i = 0; i < state.levers.length; i++) {
      const lv = state.levers[i];
      if (lv.x < minTileX || lv.x > maxTileX || lv.y < minTileY || lv.y > maxTileY) continue;
      if (!state.explored[Math.floor(lv.y)]?.[Math.floor(lv.x)]) continue;
      const iso = worldToIso(lv.x, lv.y);
      pushDraw(lv.x + lv.y, 9, iso.x + offX, iso.y + offY, lv, 0);
    }

    for (let i = 0; i < state.events.length; i++) {
      const ev = state.events[i];
      if (ev.x < minTileX || ev.x > maxTileX || ev.y < minTileY || ev.y > maxTileY) continue;
      if (!state.explored[Math.floor(ev.y)]?.[Math.floor(ev.x)]) continue;
      const iso = worldToIso(ev.x, ev.y);
      pushDraw(ev.x + ev.y, 10, iso.x + offX, iso.y + offY, ev, 0);
    }

    for (let i = 0; i < state.crystals.length; i++) {
      const cr = state.crystals[i];
      const iso = worldToIso(cr.x, cr.y);
      pushDraw(cr.x + cr.y, 11, iso.x + offX, iso.y + offY, cr, 0);
    }

    for (let i = 0; i < state.minions.length; i++) {
      const mn = state.minions[i];
      const iso = worldToIso(mn.x, mn.y);
      pushDraw(mn.x + mn.y, 12, iso.x + offX, iso.y + offY, mn, 0);
    }

    if (state.petEntity) {
      const pe = state.petEntity;
      const iso = worldToIso(pe.x, pe.y);
      pushDraw(pe.x + pe.y, 13, iso.x + offX, iso.y + offY, pe, 0);
    }

    if (window.CryptCoop && window.CryptCoop.active) {
      for (const peer of window.CryptCoop.peers.values()) {
        const iso = worldToIso(peer.x, peer.y);
        pushDraw(peer.x + peer.y, 14, iso.x + offX, iso.y + offY, peer, 0);
      }
    }

    const pIso = worldToIso(state.player.x, state.player.y);
    pushDraw(state.player.x + state.player.y, 7, pIso.x + offX, pIso.y + offY, null, 0);

    drawPool.length = drawLen;
    drawPool.sort((a, b) => a.depth - b.depth);
    for (let i = 0; i < drawLen; i++) {
      const it = drawPool[i];
      switch (it.kind) {
        case 1:
          ctx.drawImage(biomeSprites.wall, it.sx - TILE_W * 0.5 - 1, it.sy - TILE_H * 0.5 - WALL_H - 1);
          if (it.extra === 1) {
            ctx.fillStyle = 'rgba(4, 5, 9, 0.45)';
            ctx.fillRect(it.sx - TILE_W * 0.5, it.sy - TILE_H * 0.5 - WALL_H, TILE_W, TILE_H + WALL_H);
          }
          break;
        case 2: drawTorch(it.sx, it.sy, now, it.ref.phase, it.ref.isArcane); break;
        case 3: drawIronGate(it.sx, it.sy, it.ref); break;
        case 4: ctx.drawImage(it.ref.kind === 'urn' ? atlas.urn : atlas.barrel, it.sx - 18, it.sy - 34); break;
        case 5: drawLootGroundVisual(it.sx, it.sy, it.ref, now); break;
        case 6: drawMonster(it.sx, it.sy, it.ref, now); break;
        case 7: drawPaladin(it.sx, it.sy, now); break;
        case 8: drawTownNpc(it.sx, it.sy, it.ref, now); break;
        case 9:
          ctx.fillStyle = it.ref.pulled ? '#4ade80' : '#facc15';
          ctx.fillRect(it.sx - 3, it.sy - 18, 6, 18);
          break;
        case 10:
          ctx.fillStyle = it.ref.used ? '#475569' : '#c084fc';
          ctx.beginPath(); ctx.arc(it.sx, it.sy - 16, 8, 0, Math.PI * 2); ctx.fill();
          ctx.font = '700 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#e2e8f0';
          ctx.fillText(it.ref.label, it.sx, it.sy - 28);
          break;
        case 11:
          ctx.fillStyle = '#a855f7';
          ctx.beginPath(); ctx.moveTo(it.sx, it.sy - 34); ctx.lineTo(it.sx + 9, it.sy - 14); ctx.lineTo(it.sx, it.sy); ctx.lineTo(it.sx - 9, it.sy - 14); ctx.closePath(); ctx.fill();
          break;
        case 12: {
          const mn = it.ref;
          ctx.fillStyle = mn.kind === 'colossus' ? '#e2e8f0' : mn.kind === 'imp' ? '#f97316' : mn.kind === 'clone' ? '#4ade80' : '#94a3b8';
          const sz = mn.kind === 'colossus' ? 14 : 7;
          ctx.beginPath(); ctx.arc(it.sx, it.sy - sz - 4, sz, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 13: {
          const pe = it.ref;
          const pCfg = PETS_CONFIG[pe.id] || PETS_CONFIG.hound;
          const bob = Math.sin(pe.phase) * 2;
          ctx.fillStyle = pCfg.color;
          ctx.beginPath(); ctx.arc(it.sx, it.sy - 10 + bob, 6, 0, Math.PI * 2); ctx.fill();
          if ((state.player.petRanks[pe.id] || 1) >= 3) {
            ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(it.sx, it.sy - 10 + bob, 9, 0, Math.PI * 2); ctx.stroke();
          }
          break;
        }
        case 14: {
          const pr = it.ref;
          drawPaladin(it.sx, it.sy, now, pr.cls || 'paladin');
          ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#93c5fd';
          ctx.fillText(pr.name || 'Ally', it.sx, it.sy - 46);
          break;
        }
      }
    }

    // Pass 3: Auto-Weapons, Slash Arcs, Projectiles & Particles
    if (state.mode === 'DUNGEON' && !state.player.dead) {
      if (state.autoWeapons.emberAura > 0) {
        const pIso = worldToIso(state.player.x, state.player.y);
        const auraR = (2.4 + state.autoWeapons.emberAura * 0.45);
        ctx.save();
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(pIso.x + offX, pIso.y + offY, auraR * TILE_W * 0.48, auraR * TILE_H * 0.48, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (state.autoWeapons.boneBlades > 0) {
        const count = 2 + state.autoWeapons.boneBlades;
        for (let b = 0; b < count; b++) {
          const ang = state.bladeAngle + (Math.PI * 2 * b) / count;
          const bIso = worldToIso(state.player.x + Math.cos(ang) * 2.05, state.player.y + Math.sin(ang) * 2.05);
          ctx.save();
          ctx.translate(bIso.x + offX, bIso.y + offY - 16);
          ctx.rotate(ang + now * 0.01);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(-2, -10, 4, 20);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-1, -8, 2, 16);
          ctx.restore();
        }
      }
    }

    for (let i = 0; i < state.slashArcs.length; i++) {
      const s = state.slashArcs[i];
      const iso = worldToIso(s.x, s.y);
      const sx = iso.x + offX;
      const sy = iso.y + offY - 20;
      const alpha = clamp(s.life / s.maxLife, 0, 1);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(1, 0.56);
      ctx.rotate(s.angle - Math.PI * 0.25);
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, s.radius, -0.85, 0.85);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, s.radius - 2, -0.7, 0.7);
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < state.enemyPuddles.length; i++) {
      const pd = state.enemyPuddles[i];
      const iso = worldToIso(pd.x, pd.y);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.34)';
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(iso.x + offX, iso.y + offY, pd.r * TILE_W * 0.45, pd.r * TILE_H * 0.45, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }

    for (let i = 0; i < state.projectiles.length; i++) {
      const pr = state.projectiles[i];
      const iso = worldToIso(pr.x, pr.y);
      const sx = iso.x + offX;
      const sy = iso.y + offY - 18;
      ctx.fillStyle = pr.kind === 'frost' ? '#38bdf8' : pr.kind === 'shadow' ? '#c084fc' : pr.kind === 'bolt' ? '#4ade80' : '#f97316';
      ctx.beginPath();
      ctx.arc(sx, sy, pr.kind === 'bolt' ? 5 : 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, pr.kind === 'bolt' ? 2.2 : 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < state.enemyProjectiles.length; i++) {
      const ep = state.enemyProjectiles[i];
      const iso = worldToIso(ep.x, ep.y);
      const sx = iso.x + offX;
      const sy = iso.y + offY - 16;
      ctx.fillStyle = ep.color || '#ef4444';
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef2f2';
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < state.particles.length; i++) {
      const pt = state.particles[i];
      const iso = worldToIso(pt.x, pt.y);
      ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(iso.x + offX, iso.y + offY - pt.z, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Pass 4: Cached Atmospheric Torchlit Vignette (zero per-frame gradient)
    if (vignetteCanvas) {
      ctx.drawImage(vignetteCanvas, 0, 0, viewW, viewH);
    }

    // Pass 5: Floating Damage Numbers & Tappable Ground Loot Nameplates
    drawFloatingDamageNumbers(offX, offY);
    if (state.mode === 'DUNGEON') drawLootNameplates(offX, offY);
  }

  function drawTownNpc(sx, sy, npc, now) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (npc.id === 'waypoint') {
      ctx.restore();
      return;
    }

    const pulse = Math.sin(now * 0.005) * 1.5;
    if (npc.id === 'blacksmith') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx - 10, sy - 16, 20, 12);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(sx - 14, sy - 20, 28, 6);
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(sx, sy - 28 + pulse * 0.5, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (npc.id === 'stash') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(sx - 12, sy - 18, 24, 16);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 12, sy - 18, 24, 16);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(sx - 3, sy - 13, 6, 6);
    } else if (npc.id === 'apothecary') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx - 11, sy - 18, 22, 16);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(sx - 4, sy - 24 + pulse * 0.4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(sx + 5, sy - 22, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = '800 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth = 3;
    ctx.strokeText(npc.short, sx, sy - 36);
    ctx.fillStyle = npc.color;
    ctx.fillText(npc.short, sx, sy - 36);
    ctx.restore();
  }

  function drawWaypointAndStairs(offX, offY, now) {
    // Glowing Blue Rune Waypoint Portal
    if (state.explored[Math.floor(state.waypoint.y)]?.[Math.floor(state.waypoint.x)]) {
      const wIso = worldToIso(state.waypoint.x, state.waypoint.y);
      const wx = wIso.x + offX;
      const wy = wIso.y + offY;
      const pulse = 0.8 + Math.sin(now * 0.005) * 0.2;

      ctx.save();
      ctx.strokeStyle = `rgba(96, 165, 250, ${0.85 * pulse})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(wx, wy, 22, 11, 0, 0, Math.PI * 2);
      ctx.stroke();

      const g = ctx.createRadialGradient(wx, wy, 2, wx, wy, 24);
      g.addColorStop(0, 'rgba(147, 197, 253, 0.7)');
      g.addColorStop(1, 'rgba(37, 99, 235, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(wx, wy, 24, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Descent Stairs in Boss Chamber (Dungeon only)
    if (state.mode === 'DUNGEON' && state.explored[Math.floor(state.stairs.y)]?.[Math.floor(state.stairs.x)]) {
      const sIso = worldToIso(state.stairs.x, state.stairs.y);
      const sx = sIso.x + offX;
      const sy = sIso.y + offY;
      ctx.save();
      for (let step = 0; step < 3; step++) {
        ctx.fillStyle = step === 0 ? '#27272a' : step === 1 ? '#18181b' : '#09090b';
        drawIsoDiamondPath(ctx, sx, sy + step * 3, 36 - step * 8, 18 - step * 4);
        ctx.fill();
      }
      ctx.strokeStyle = state.stairs.unlocked ? '#facc15' : '#9333ea';
      ctx.lineWidth = 2;
      drawIsoDiamondPath(ctx, sx, sy, 38, 19);
      ctx.stroke();

      ctx.font = '700 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = state.stairs.unlocked ? '#fde047' : '#d8b4fe';
      ctx.fillText(state.stairs.unlocked ? 'DESCEND ▼' : 'SEALED', sx, sy - 16);
      ctx.restore();
    }
  }

  function drawTorch(sx, sy, now, phase, isArcane) {
    const f = Math.sin(now * 0.015 + phase) * 2;
    ctx.fillStyle = '#334155';
    ctx.fillRect(sx - 2, sy - 24, 4, 24);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sx - 4, sy - 26, 8, 4);

    ctx.fillStyle = isArcane ? '#60a5fa' : '#f97316';
    ctx.beginPath();
    ctx.ellipse(sx, sy - 30 + f * 0.4, 4.5, 7 + f * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isArcane ? '#e0f2fe' : '#fef08a';
    ctx.beginPath();
    ctx.ellipse(sx, sy - 29 + f * 0.3, 2.2, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawIronGate(sx, sy, g) {
    const lift = g.open * 28;
    ctx.save();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    for (let i = -2; i <= 2; i++) {
      const bx = sx + i * 7;
      const by = sy + (g.axis === 'v' ? i * 2 : -i * 2);
      ctx.beginPath();
      ctx.moveTo(bx, by - lift);
      ctx.lineTo(bx, by - 32 - lift);
      ctx.stroke();
    }
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(sx - 16, sy - 18 - lift);
    ctx.lineTo(sx + 16, sy - 18 - lift);
    ctx.stroke();
    ctx.restore();
  }

  function drawPaladin(sx, sy, now, clsId = state.heroClass) {
    const p = state.player;
    const cls = HERO_CLASSES[clsId] || HERO_CLASSES.paladin;
    const moving = Math.hypot(p.vx, p.vy) > 0.2;
    const breath = Math.sin(now * 0.005) * 1.4;
    const stride = moving ? Math.sin(p.walkPhase) * 4.2 : 0;

    ctx.save();
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 13, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const flash = p.hitFlash > 0;
    // Class Cloak / Mantle
    ctx.fillStyle = flash ? '#ffffff' : (p.chillTimer > 0 ? '#0284c7' : cls.cloak);
    ctx.beginPath();
    ctx.moveTo(sx - 8, sy - 26 + breath);
    ctx.lineTo(sx + 8, sy - 26 + breath);
    ctx.lineTo(sx + 11 - stride * 0.3, sy - 4);
    ctx.lineTo(sx - 11 - stride * 0.3, sy - 4);
    ctx.closePath();
    ctx.fill();

    // Boots / 4-frame stride legs
    ctx.fillStyle = '#334155';
    ctx.fillRect(sx - 6, sy - 11 + stride * 0.45, 5, 10);
    ctx.fillRect(sx + 1, sy - 11 - stride * 0.45, 5, 10);

    // Armored Cuirass / Tunic
    ctx.fillStyle = flash ? '#ffffff' : cls.armorColor;
    ctx.beginPath();
    ctx.roundRect(sx - 8, sy - 28 + breath, 16, 17, 3);
    ctx.fill();
    ctx.fillStyle = cls.trimColor;
    ctx.fillRect(sx - 1.5, sy - 26 + breath, 3, 12);

    // Helm / Hood + glowing eyes
    ctx.fillStyle = flash ? '#ffffff' : (clsId === 'paladin' ? '#cbd5e1' : cls.cloak);
    ctx.beginPath();
    ctx.roundRect(sx - 6.5, sy - 40 + breath, 13, 12, 4);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sx - 4.5, sy - 35 + breath, 9, 2.5);
    ctx.fillStyle = cls.trimColor;
    ctx.fillRect(sx - 3, sy - 34.5 + breath, 6, 1.5);

    if (clsId === 'paladin') {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx - 13, sy - 26 + breath);
      ctx.lineTo(sx - 5, sy - 26 + breath);
      ctx.lineTo(sx - 6, sy - 14 + breath);
      ctx.lineTo(sx - 9, sy - 10 + breath);
      ctx.lineTo(sx - 12, sy - 14 + breath);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    const swingAngle = p.attackAnim > 0 ? -1.4 + (1 - p.attackAnim / 0.24) * 2.4 : (p.castAnim > 0 ? -1.2 : 0.35);
    ctx.save();
    ctx.translate(sx + 8, sy - 20 + breath);
    ctx.rotate(swingAngle);
    if (clsId === 'sorcerer') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-1.2, -22, 2.4, 22);
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(0, -23, 3.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (clsId === 'rogue') {
      ctx.fillStyle = p.attackAnim > 0 ? '#86efac' : '#cbd5e1';
      ctx.fillRect(-1, -15, 2, 13);
    } else {
      ctx.fillStyle = p.attackAnim > 0 ? '#fef08a' : '#e2e8f0';
      ctx.fillRect(-1.5, -20, 3, 18);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-5, -3, 10, 2.5);
    }
    ctx.restore();

    ctx.restore();
  }

  function drawMonster(sx, sy, m, now) {
    const stride = Math.sin(m.walkPhase) * 3;
    const flash = m.hitFlash > 0;
    const isBoss = m.type === 'boss';
    const isGhoul = m.type === 'ghoul';

    ctx.save();
    // Boss AoE slam telegraph circle
    if (isBoss && m.slamTelegraph > 0) {
      const pct = 1 - m.slamTelegraph / 0.65;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.fillStyle = 'rgba(220, 38, 38, 0.16)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 2.4 * 32, 2.4 * 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(sx, sy, 2.4 * 32 * pct, 2.4 * 16 * pct, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Elite / Affix aura
    if (isGhoul || (m.affixes && m.affixes.length)) {
      const affCol = m.affixes?.length ? (ELITE_AFFIXES[m.affixes[0]]?.color || '#60a5fa') : '#60a5fa';
      ctx.strokeStyle = affCol;
      ctx.globalAlpha = 0.55 + Math.sin(now * 0.008) * 0.25;
      ctx.lineWidth = isBoss ? 2.5 : 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 2, isBoss ? 24 : 16, isBoss ? 11 : 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, isBoss ? 22 : 12, isBoss ? 10 : 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isBoss) {
      // Horned Demon Brute
      ctx.fillStyle = flash ? '#ffffff' : '#7f1d1d';
      ctx.beginPath();
      ctx.roundRect(sx - 15, sy - 46, 30, 34, 6);
      ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : '#991b1b';
      ctx.beginPath();
      ctx.arc(sx, sy - 50, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - 7, sy - 56);
      ctx.quadraticCurveTo(sx - 17, sy - 68, sx - 12, sy - 74);
      ctx.moveTo(sx + 7, sy - 56);
      ctx.quadraticCurveTo(sx + 17, sy - 68, sx + 12, sy - 74);
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.fillRect(sx - 5, sy - 51, 3, 3);
      ctx.fillRect(sx + 2, sy - 51, 3, 3);
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(sx - 11, sy - 13 + stride * 0.4, 8, 13);
      ctx.fillRect(sx + 3, sy - 13 - stride * 0.4, 8, 13);
    } else if (m.type === 'golem') {
      // Flesh Golem (massive hulking silhouette)
      ctx.fillStyle = flash ? '#ffffff' : '#7f1d1d';
      ctx.beginPath(); ctx.roundRect(sx - 13, sy - 36, 26, 25, 6); ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : '#b91c1c';
      ctx.beginPath(); ctx.arc(sx, sy - 40, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fca5a5'; ctx.fillRect(sx - 4, sy - 41, 2.5, 2.5); ctx.fillRect(sx + 1.5, sy - 41, 2.5, 2.5);
      ctx.fillStyle = '#450a0a'; ctx.fillRect(sx - 9, sy - 11 + stride * 0.35, 6, 11); ctx.fillRect(sx + 3, sy - 11 - stride * 0.35, 6, 11);
    } else if (m.type === 'gargoyle') {
      // Obsidian Gargoyle (stone wings & horns)
      ctx.fillStyle = flash ? '#ffffff' : '#334155';
      ctx.beginPath(); ctx.moveTo(sx - 16, sy - 34); ctx.lineTo(sx, sy - 24); ctx.lineTo(sx + 16, sy - 34); ctx.lineTo(sx + 8, sy - 14); ctx.lineTo(sx - 8, sy - 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : '#475569';
      ctx.beginPath(); ctx.roundRect(sx - 8, sy - 30, 16, 20, 4); ctx.fill();
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(sx - 3, sy - 34, 2, 2); ctx.fillRect(sx + 1, sy - 34, 2, 2);
    } else if (m.type === 'wraith') {
      // Gloom Wraith (floating spectral cloak)
      const hover = Math.sin(now * 0.008 + m.walkPhase) * 3;
      ctx.fillStyle = flash ? '#ffffff' : 'rgba(99, 102, 241, 0.85)';
      ctx.beginPath(); ctx.moveTo(sx, sy - 38 + hover); ctx.lineTo(sx + 10, sy - 10 + hover); ctx.lineTo(sx, sy - 14 + hover); ctx.lineTo(sx - 10, sy - 10 + hover); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e0e7ff'; ctx.fillRect(sx - 3, sy - 29 + hover, 2, 2); ctx.fillRect(sx + 1, sy - 29 + hover, 2, 2);
    } else if (m.type === 'imp') {
      // Cinder Imp (small horned fire demon)
      ctx.fillStyle = flash ? '#ffffff' : '#ea580c';
      ctx.beginPath(); ctx.roundRect(sx - 6, sy - 20, 12, 13, 4); ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : '#f97316';
      ctx.beginPath(); ctx.arc(sx, sy - 24, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a'; ctx.fillRect(sx - 2.5, sy - 25, 2, 2); ctx.fillRect(sx + 1, sy - 25, 2, 2);
      ctx.fillStyle = '#7c2d12'; ctx.fillRect(sx - 4, sy - 8 + stride * 0.4, 3, 8); ctx.fillRect(sx + 1, sy - 8 - stride * 0.4, 3, 8);
    } else if (m.type === 'acolyte') {
      // Cultist Acolyte (purple hooded warlock)
      ctx.fillStyle = flash ? '#ffffff' : '#581c87';
      ctx.beginPath(); ctx.moveTo(sx - 8, sy - 6); ctx.lineTo(sx - 6, sy - 28); ctx.lineTo(sx + 6, sy - 28); ctx.lineTo(sx + 8, sy - 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : '#7e22ce';
      ctx.beginPath(); ctx.arc(sx, sy - 31, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e879f9'; ctx.fillRect(sx - 2.5, sy - 31, 2, 2); ctx.fillRect(sx + 0.5, sy - 31, 2, 2);
    } else if (m.type === 'spider') {
      // Blight Spider (8 legs + green venom sacs)
      ctx.strokeStyle = '#365314'; ctx.lineWidth = 1.8;
      for (let leg = -1; leg <= 1; leg += 2) {
        for (let k = -1; k <= 1; k++) {
          ctx.beginPath(); ctx.moveTo(sx, sy - 9); ctx.lineTo(sx + leg * 12, sy - 13 + k * 4 + stride * 0.3 * k); ctx.stroke();
        }
      }
      ctx.fillStyle = flash ? '#ffffff' : '#4d7c0f';
      ctx.beginPath(); ctx.ellipse(sx, sy - 10, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#bef264'; ctx.fillRect(sx - 3, sy - 10, 2, 2); ctx.fillRect(sx + 1, sy - 10, 2, 2);
    } else if (m.type === 'bat') {
      // Blood Bat Swarm (flapping wings)
      const flap = Math.sin(now * 0.02 + m.walkPhase) * 6;
      ctx.fillStyle = flash ? '#ffffff' : '#9f1239';
      ctx.beginPath(); ctx.moveTo(sx, sy - 22); ctx.lineTo(sx - 13, sy - 26 + flap); ctx.lineTo(sx - 6, sy - 16); ctx.lineTo(sx + 6, sy - 16); ctx.lineTo(sx + 13, sy - 26 + flap); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fda4af'; ctx.fillRect(sx - 2, sy - 21, 1.5, 1.5); ctx.fillRect(sx + 1, sy - 21, 1.5, 1.5);
    } else if (m.type === 'archer') {
      // Skeleton Archer (hood + bow)
      ctx.fillStyle = flash ? '#ffffff' : '#94a3b8';
      ctx.fillRect(sx - 5, sy - 24, 10, 13);
      ctx.fillStyle = flash ? '#ffffff' : '#e2e8f0';
      ctx.beginPath(); ctx.arc(sx, sy - 30, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx + 6, sy - 19, 8, -1.1, 1.1); ctx.stroke();
      ctx.fillStyle = '#4ade80'; ctx.fillRect(sx - 2.5, sy - 31, 2, 2); ctx.fillRect(sx + 1, sy - 31, 2, 2);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(sx - 4, sy - 11 + stride * 0.4, 3, 11); ctx.fillRect(sx + 1, sy - 11 - stride * 0.4, 3, 11);
    } else if (isGhoul) {
      // Plague Ghoul
      ctx.fillStyle = flash ? '#ffffff' : '#1e3a8a';
      ctx.beginPath(); ctx.roundRect(sx - 9, sy - 28, 18, 19, 5); ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : '#60a5fa';
      ctx.beginPath(); ctx.arc(sx, sy - 33, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0f2fe'; ctx.fillRect(sx - 3.5, sy - 34, 2, 2); ctx.fillRect(sx + 1.5, sy - 34, 2, 2);
      ctx.fillStyle = '#172554'; ctx.fillRect(sx - 6, sy - 10 + stride * 0.4, 4.5, 10); ctx.fillRect(sx + 1.5, sy - 10 - stride * 0.4, 4.5, 10);
    } else if (m.type === 'goblin') {
      // Treasure Goblin (gold sack!)
      ctx.fillStyle = flash ? '#ffffff' : '#15803d';
      ctx.beginPath(); ctx.roundRect(sx - 7, sy - 22, 14, 14, 5); ctx.fill();
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(sx - 5, sy - 20, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#86efac'; ctx.beginPath(); ctx.arc(sx + 2, sy - 26, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#14532d'; ctx.fillRect(sx - 4, sy - 8 + stride * 0.4, 3, 8); ctx.fillRect(sx + 1, sy - 8 - stride * 0.4, 3, 8);
    } else {
      // Crypt Skeleton / Shadow Rival
      ctx.fillStyle = flash ? '#ffffff' : (m.type === 'rival' ? '#4c1d95' : '#cbd5e1');
      ctx.fillRect(sx - 5, sy - 25, 10, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx - 3, sy - 22, 6, 2);
      ctx.fillRect(sx - 3, sy - 18, 6, 2);
      ctx.fillStyle = flash ? '#ffffff' : (m.type === 'rival' ? '#c084fc' : '#e2e8f0');
      ctx.beginPath(); ctx.arc(sx, sy - 31, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx - 3, sy - 32, 2, 2);
      ctx.fillRect(sx + 1, sy - 32, 2, 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(sx + 6, sy - 26, 2.5, 14);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(sx - 4.5, sy - 11 + stride * 0.4, 3, 11);
      ctx.fillRect(sx + 1.5, sy - 11 - stride * 0.4, 3, 11);
    }

    // Overhead affix tag on Elites & compact HP bar
    if (!isBoss && m.tier === 'elite' && m.affixes?.length) {
      const aff = ELITE_AFFIXES[m.affixes[0]];
      if (aff) {
        ctx.font = '700 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = aff.color;
        ctx.fillText(aff.label, sx, sy - 50);
      }
    }
    if (!isBoss && m.hp < m.maxHp) {
      const bw = 28;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(sx - bw * 0.5, sy - 46, bw, 4);
      ctx.fillStyle = isGhoul ? '#60a5fa' : '#ef4444';
      ctx.fillRect(sx - bw * 0.5, sy - 46, bw * clamp(m.hp / m.maxHp, 0, 1), 4);
    }
    ctx.restore();
  }

  function drawLootGroundVisual(sx, sy, drop, now) {
    ctx.save();
    if (drop.kind === 'gear') {
      const spec = RARITY[drop.rarity] || RARITY.magic;
      const beamH = drop.rarity === 'legendary' ? 92 : drop.rarity === 'rare' ? 68 : 48;
      const g = ctx.createLinearGradient(sx, sy, sx, sy - beamH);
      g.addColorStop(0, spec.beam);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(sx - 6, sy - beamH, 12, beamH);

      // Glowing chest/relic icon on floor
      ctx.fillStyle = spec.color;
      ctx.beginPath();
      ctx.arc(sx, sy - 4, 5 + Math.sin(now * 0.006) * 1, 0, Math.PI * 2);
      ctx.fill();
    } else if (drop.kind === 'xp_gem') {
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.moveTo(sx, sy - 9); ctx.lineTo(sx + 4, sy - 4); ctx.lineTo(sx, sy + 1); ctx.lineTo(sx - 4, sy - 4); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#dcfce7';
      ctx.fillRect(sx - 1, sy - 6, 2, 2);
    } else if (drop.kind === 'gold') {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(sx - 2, sy - 3, 3.5, 0, Math.PI * 2);
      ctx.arc(sx + 3, sy - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (drop.kind === 'potion') {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(sx, sy - 5, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fecaca';
      ctx.fillRect(sx - 1.5, sy - 11, 3, 3);
    }
    ctx.restore();
  }

  function drawLootNameplates(offX, offY) {
    const placed = [];
    ctx.save();
    ctx.font = '700 11px sans-serif';
    ctx.textBaseline = 'middle';

    for (const d of state.lootDrops) {
      if (d.z > 4 || d.kind === 'xp_gem' || !passesLootFilter(d)) {
        d.screenRect = null;
        continue;
      }
      const iso = worldToIso(d.x, d.y);
      const sx = iso.x + offX;
      let sy = iso.y + offY - 26;

      const textW = ctx.measureText(d.label).width;
      const boxW = textW + 16;
      const boxH = 22;
      let boxX = sx - boxW * 0.5;
      let boxY = sy - boxH * 0.5;

      // De-overlap stacked ground labels upward
      for (let tries = 0; tries < 6; tries++) {
        const hit = placed.some((r) =>
          boxX < r.x + r.w + 4 && boxX + boxW + 4 > r.x &&
          boxY < r.y + r.h + 3 && boxY + boxH + 3 > r.y
        );
        if (!hit) break;
        boxY -= boxH + 4;
      }

      const rect = { x: boxX, y: boxY, w: boxW, h: boxH };
      placed.push(rect);
      d.screenRect = rect;

      const spec = d.kind === 'gear'
        ? (RARITY[d.rarity] || RARITY.magic)
        : d.kind === 'gold'
          ? { color: '#fde047', bg: 'rgba(26, 20, 6, 0.88)' }
          : { color: '#fca5a5', bg: 'rgba(34, 10, 12, 0.88)' };

      ctx.fillStyle = spec.bg;
      ctx.strokeStyle = spec.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = spec.color;
      ctx.textAlign = 'center';
      ctx.fillText(d.label, boxX + boxW * 0.5, boxY + boxH * 0.5 + 0.5);
    }
    ctx.restore();
  }

  function drawFloatingDamageNumbers(offX, offY) {
    ctx.save();
    ctx.textAlign = 'center';
    for (const f of state.floatTexts) {
      const iso = worldToIso(f.x, f.y);
      const alpha = clamp(f.life / f.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.font = f.isCrit ? '800 15px sans-serif' : '700 12px sans-serif';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.lineWidth = 3;
      ctx.strokeText(f.text, iso.x + offX, iso.y + offY - f.z);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, iso.x + offX, iso.y + offY - f.z);
    }
    ctx.restore();
  }

  function renderMinimap() {
    const mw = minimapCanvas.width;
    const mh = minimapCanvas.height;
    const cellW = mw / MAP_W;
    const cellH = mh / MAP_H;

    if (state.fogDirty) rebuildFogAndMinimapCache();
    mctx.clearRect(0, 0, mw, mh);
    mctx.drawImage(minimapStaticCanvas, 0, 0);

    // Waypoint
    mctx.fillStyle = '#60a5fa';
    mctx.fillRect(state.waypoint.x * cellW - 2, state.waypoint.y * cellH - 2, 4, 4);

    if (state.mode === 'DUNGEON') {
      // Stairs (if explored)
      if (state.explored[Math.floor(state.stairs.y)]?.[Math.floor(state.stairs.x)]) {
        mctx.fillStyle = state.stairs.unlocked ? '#facc15' : '#a855f7';
        mctx.fillRect(state.stairs.x * cellW - 2.5, state.stairs.y * cellH - 2.5, 5, 5);
      }

      // Visible Monsters & Loot
      for (const m of state.monsters) {
        if (state.explored[Math.floor(m.y)]?.[Math.floor(m.x)] !== 2) continue;
        mctx.fillStyle = m.type === 'boss' ? '#f97316' : m.type === 'ghoul' ? '#38bdf8' : '#ef4444';
        mctx.fillRect(m.x * cellW - 1.5, m.y * cellH - 1.5, m.type === 'boss' ? 4 : 3, m.type === 'boss' ? 4 : 3);
      }
      for (const d of state.lootDrops) {
        if (d.kind === 'gear' && passesLootFilter(d)) {
          mctx.fillStyle = RARITY[d.rarity]?.color || '#facc15';
          mctx.fillRect(d.x * cellW - 1, d.y * cellH - 1, 2.5, 2.5);
        }
      }
    } else {
      for (const npc of state.townNpcs) {
        mctx.fillStyle = npc.color;
        mctx.fillRect(npc.x * cellW - 2, npc.y * cellH - 2, 4, 4);
      }
    }

    // Hero dot
    mctx.fillStyle = '#4ade80';
    mctx.beginPath();
    mctx.arc(state.player.x * cellW, state.player.y * cellH, 3, 0, Math.PI * 2);
    mctx.fill();
  }

  // =========================================================================
  // HUD, MAIN MENU, CHAR CREATION & TOWN HUB UI
  // =========================================================================
  function showToast(msg) {
    dom.toastBanner.textContent = msg;
    dom.toastBanner.classList.remove('hidden');
    state.toastTimer = 2.6;
  }

  function syncAudioToggleLabels() {
    const txt = sfx.muted ? 'SFX: OFF' : 'SFX: ON';
    if (dom.btnAudioToggle) dom.btnAudioToggle.textContent = txt;
    if (dom.hudAudioLabel) dom.hudAudioLabel.textContent = txt;
  }

  function syncHudDom(force = false) {
    const p = state.player;
    const c = state.hudCache;
    const hpPct = `${clamp((p.hp / p.maxHp) * 100, 0, 100).toFixed(1)}%`;
    const mpPct = `${clamp((p.mp / p.maxMp) * 100, 0, 100).toFixed(1)}%`;
    const hpStr = `${Math.ceil(p.hp)}`;
    const mpStr = `${Math.floor(p.mp)}`;
    const clsName = HERO_CLASSES[state.heroClass]?.name || 'Paladin';
    const lvlStr = `Lv ${p.level} ${clsName}`;
    const goldStr = p.gold.toLocaleString();
    const xpPct = `${clamp((p.xp / p.nextXp) * 100, 0, 100).toFixed(1)}%`;
    const bName = BIOMES[state.biome]?.name || 'Crypt';
    const floorStr = state.mode === 'TOWN' ? 'Shadowhaven • Town' : (state.riftTier > 0 ? `Rift T${state.riftTier} • ${bName}` : `Fl ${state.floor} • ${bName}`);
    const seedStr = `#${state.seed} • v${VERSION}`;
    const buffStr = state.activeBuff ? state.activeBuff.label : '';
    const condStr = state.mode === 'DUNGEON'
      ? (state.riftTier > 0 ? `⏱ ${Math.ceil(state.riftTimer)}s` : state.floorCondition === 'cursed_fog' ? `🔥 Torch ${Math.round(state.torchFuel)}%` : state.floorCondition !== 'calm' ? state.floorCondition.replace('_', ' ').toUpperCase() : '')
      : '';

    if (force || c.hpPct !== hpPct) { dom.hpOrbFill.style.height = hpPct; c.hpPct = hpPct; }
    if (force || c.mpPct !== mpPct) { dom.mpOrbFill.style.height = mpPct; c.mpPct = mpPct; }
    if (force || c.hpStr !== hpStr) { dom.hpText.textContent = hpStr; c.hpStr = hpStr; }
    if (force || c.mpStr !== mpStr) { dom.mpText.textContent = mpStr; c.mpStr = mpStr; }
    if (force || c.lvlStr !== lvlStr) { dom.heroLevelText.textContent = lvlStr; c.lvlStr = lvlStr; }
    if (force || c.goldStr !== goldStr) { dom.goldValue.textContent = goldStr; c.goldStr = goldStr; }
    if (force || c.xpPct !== xpPct) { dom.xpBarFill.style.width = xpPct; c.xpPct = xpPct; }
    if (force || c.floorStr !== floorStr) { dom.floorBadge.textContent = floorStr; c.floorStr = floorStr; }
    if (force || c.seedStr !== seedStr) { dom.seedBadge.textContent = seedStr; c.seedStr = seedStr; }
    if (force || c.buffStr !== buffStr) { dom.buffBadge.textContent = buffStr; dom.buffBadge.classList.toggle('hidden', !buffStr); c.buffStr = buffStr; }
    if (force || c.condStr !== condStr) { dom.conditionBadge.textContent = condStr; dom.conditionBadge.classList.toggle('hidden', !condStr); c.condStr = condStr; }

    const streakStr = (state.mode === 'DUNGEON' && state.killStreak >= 5)
      ? `🔥 ${state.killStreak} STREAK (${getStreakMultiplier()}x XP)`
      : '';
    if (dom.streakBadge && (force || c.streakStr !== streakStr)) {
      dom.streakBadge.textContent = streakStr;
      dom.streakBadge.classList.toggle('hidden', !streakStr);
      c.streakStr = streakStr;
    }
    const autoTxt = state.autoCombat ? 'Auto: ON' : 'Auto: OFF';
    if (dom.autoCombatLabel && (force || c.autoTxt !== autoTxt)) {
      dom.autoCombatLabel.textContent = autoTxt;
      dom.btnAutoCombat?.classList.toggle('active', state.autoCombat);
      c.autoTxt = autoTxt;
    }

    if (force || c.bagLen !== p.bag.length) { dom.lootCountBadge.textContent = p.bag.length; c.bagLen = p.bag.length; }
    if (force || c.potions !== p.potions) { dom.potionCount.textContent = p.potions; c.potions = p.potions; }
    if (force || c.elixirs !== p.manaElixirs) { dom.manaElixirCount.textContent = p.manaElixirs; c.elixirs = p.manaElixirs; }

    const nfLabel = state.mode === 'TOWN' ? 'Waypoint' : (state.stairs.unlocked ? 'Next Floor' : 'New Map');
    if (force || c.nfLabel !== nfLabel || c.unlocked !== state.stairs.unlocked) {
      dom.newFloorBtnLabel.textContent = nfLabel;
      dom.btnNewFloor.classList.toggle('ready-glow', state.mode === 'DUNGEON' && state.stairs.unlocked);
      c.nfLabel = nfLabel; c.unlocked = state.stairs.unlocked;
    }

    const ultFrac = clamp(p.ultCharge / 100, 0, 1);
    const ultKey = `${Math.floor(p.ultCharge)}`;
    if (force || c.ultKey !== ultKey) {
      dom.btnUltimate.style.setProperty('--ult', ultFrac.toFixed(3));
      dom.attackUltGlow.style.setProperty('--ult', ultFrac.toFixed(3));
      dom.btnUltimate.classList.toggle('ult-ready', p.ultCharge >= 100);
      dom.ultPctText.textContent = p.ultCharge >= 100 ? 'ULT!' : `${ultKey}%`;
      c.ultKey = ultKey;
    }

    const stanceTxt = state.minionStance === 'aggressive' ? 'AGGR' : 'GUARD';
    if (force || c.stanceTxt !== stanceTxt) { dom.minionStanceLabel.textContent = stanceTxt; c.stanceTxt = stanceTxt; }
    const swapTxt = `SET ${p.activeSwapIdx || 1}`;
    if (force || c.swapTxt !== swapTxt) { dom.swapLoadoutLabel.textContent = swapTxt; c.swapTxt = swapTxt; }

    const skillCfg = getActiveSkillConfig();
    for (const id of [1, 2, 3, 4]) {
      const cfg = id === 4 ? getEquippedWeaponSpec() : skillCfg[id];
      const btn = id === 4 ? dom.btnSkill4 : document.getElementById(cfg.elId);
      const rem = p.skillCds[id] || 0;
      const frac = rem > 0 ? clamp(rem / cfg.cd, 0, 1) : 0;
      const key = `${frac.toFixed(2)}_${rem > 0 ? rem.toFixed(1) : ''}`;
      if (force || c['cd' + id] !== key) {
        btn.style.setProperty('--cd', frac.toFixed(3));
        btn.classList.toggle('is-cooldown', rem > 0);
        btn.querySelector('.cd-text').textContent = rem > 0 ? rem.toFixed(1) : '';
        c['cd' + id] = key;
      }
    }
    const dFrac = p.dodgeCd > 0 ? clamp(p.dodgeCd / 2.0, 0, 1) : 0;
    const dKey = `${dFrac.toFixed(2)}_${p.dodgeCd > 0 ? p.dodgeCd.toFixed(1) : ''}`;
    if (force || c.dodgeCd !== dKey) {
      dom.btnDodge.style.setProperty('--cd', dFrac.toFixed(3));
      dom.btnDodge.classList.toggle('is-cooldown', p.dodgeCd > 0);
      dom.btnDodge.querySelector('.cd-text').textContent = p.dodgeCd > 0 ? p.dodgeCd.toFixed(1) : '';
      c.dodgeCd = dKey;
    }

    const pFrac = p.potionCd > 0 ? clamp(p.potionCd / 1.2, 0, 1) : 0;
    const pKey = `${pFrac.toFixed(2)}_${p.potionCd > 0 ? p.potionCd.toFixed(1) : ''}`;
    if (force || c.potCd !== pKey) {
      dom.btnPotion.style.setProperty('--cd', pFrac.toFixed(3));
      dom.btnPotion.classList.toggle('is-cooldown', p.potionCd > 0);
      dom.btnPotion.querySelector('.cd-text').textContent = p.potionCd > 0 ? p.potionCd.toFixed(1) : '';
      dom.btnManaElixir.style.setProperty('--cd', pFrac.toFixed(3));
      dom.btnManaElixir.classList.toggle('is-cooldown', p.potionCd > 0);
      c.potCd = pKey;
    }

    // Co-Op Party Panel
    if (window.CryptCoop && window.CryptCoop.active && window.CryptCoop.peers.size > 0) {
      dom.partyPanel.classList.remove('hidden');
      let pHtml = '';
      for (const peer of window.CryptCoop.peers.values()) {
        const pct = clamp(((peer.hp || 0) / (peer.maxHp || 100)) * 100, 0, 100);
        pHtml += `<div class="party-member-pill"><div>${peer.name} (Lv ${peer.level}) ${peer.downed ? '☠' : ''}</div><div class="party-hp-track"><div class="party-hp-fill" style="width:${pct}%"></div></div></div>`;
      }
      if (c.partyHtml !== pHtml) { dom.partyPanel.innerHTML = pHtml; c.partyHtml = pHtml; }
    } else if (!dom.partyPanel.classList.contains('hidden')) {
      dom.partyPanel.classList.add('hidden');
    }
  }
  const updateHud = syncHudDom;

  function syncClassSkillLabels() {
    const cls = HERO_CLASSES[state.heroClass] || HERO_CLASSES.paladin;
    const wSpec = getEquippedWeaponSpec();
    dom.attackLabel.textContent = cls.basicName;
    dom.skill1Cost.textContent = cls.skills[1].mana;
    dom.skill2Cost.textContent = cls.skills[2].mana;
    dom.skill3Cost.textContent = cls.skills[3].mana;
    dom.skill4Label.textContent = wSpec.skillName.split(' ')[0].slice(0, 5).toUpperCase();
    dom.skill4Cost.textContent = wSpec.mana;
    dom.btnSkill1.title = `${cls.skills[1].name} (1) — ${cls.skills[1].mana} MP`;
    dom.btnSkill2.title = `${cls.skills[2].name} (2) — ${cls.skills[2].mana} MP`;
    dom.btnSkill3.title = `${cls.skills[3].name} (3) — ${cls.skills[3].mana} MP`;
    dom.btnSkill4.title = `${wSpec.skillName} (4) — ${wSpec.mana} MP`;
  }

  function renderMainMenuSummary() {
    dom.saveSlotGrid.innerHTML = '';
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const slotData = state.saveSlots[i];
      const card = document.createElement('div');
      card.className = 'save-slot-card' + (state.activeSlot === i ? ' active' : '');
      if (slotData) {
        const clsName = HERO_CLASSES[slotData.heroClass]?.name || 'Paladin';
        card.innerHTML = `
          <div>
            <div class="slot-meta-title">Slot ${i + 1}: ${slotData.heroName} (${clsName})</div>
            <div class="slot-meta-sub">Lv ${slotData.level} • ${(slotData.gold || 0).toLocaleString()}g • Floor ${slotData.highestFloor || 1}</div>
          </div>
          <button type="button" class="slot-del-btn" aria-label="Delete Slot ${i + 1}">🗑</button>
        `;
        card.addEventListener('click', (e) => {
          if (e.target.closest('.slot-del-btn')) return;
          state.activeSlot = i;
          applySlotDataToRuntime(slotData);
          renderMainMenuSummary();
        });
        card.querySelector('.slot-del-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          state.saveSlots[i] = null;
          localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(state.saveSlots));
          renderMainMenuSummary();
        });
      } else {
        card.innerHTML = `<div><div class="slot-meta-title">Slot ${i + 1}: Empty</div><div class="slot-meta-sub">Tap to select slot &amp; Create Hero</div></div>`;
        card.addEventListener('click', () => {
          state.activeSlot = i;
          renderMainMenuSummary();
        });
      }
      dom.saveSlotGrid.appendChild(card);
    }
    const activeData = state.saveSlots[state.activeSlot];
    dom.btnContinueTown.textContent = activeData ? `CONTINUE AS ${activeData.heroName.toUpperCase()}` : 'ENTER TOWN (DEFAULT HERO)';
    syncAudioToggleLabels();
  }

  function renderClassPortraits() {
    dom.classSelectGrid.innerHTML = '';
    for (const id of Object.keys(HERO_CLASSES)) {
      const cls = HERO_CLASSES[id];
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'class-pill-btn' + (state.selectedCreateClass === id ? ' selected' : '');
      pill.textContent = cls.name;
      pill.addEventListener('click', () => { sfx.unlock(); state.selectedCreateClass = id; renderClassPortraits(); });
      dom.classSelectGrid.appendChild(pill);
    }

    const selCls = HERO_CLASSES[state.selectedCreateClass] || HERO_CLASSES.paladin;
    if (dom.classPreviewCanvas) {
      const pCtx = dom.classPreviewCanvas.getContext('2d');
      pCtx.fillStyle = '#07090e'; pCtx.fillRect(0, 0, 88, 88);
      const grad = pCtx.createRadialGradient(44, 44, 4, 44, 44, 42);
      grad.addColorStop(0, 'rgba(217, 119, 6, 0.25)'); grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      pCtx.fillStyle = grad; pCtx.fillRect(0, 0, 88, 88);
      pCtx.save(); pCtx.translate(44, 66); pCtx.scale(1.25, 1.25);
      pCtx.fillStyle = selCls.cloak; pCtx.fillRect(-8, -26, 16, 20);
      pCtx.fillStyle = selCls.armorColor; pCtx.fillRect(-7, -28, 14, 15);
      pCtx.fillStyle = selCls.trimColor; pCtx.fillRect(-1.5, -26, 3, 11);
      pCtx.fillStyle = selCls.id === 'paladin' ? '#cbd5e1' : selCls.cloak; pCtx.fillRect(-6, -39, 12, 11);
      pCtx.fillStyle = selCls.trimColor; pCtx.fillRect(-3, -34, 6, 2);
      pCtx.restore();
    }
    if (dom.classPreviewInfo) {
      dom.classPreviewInfo.innerHTML = `
        <div class="class-card-name">${selCls.name}</div>
        <div class="class-card-role">${selCls.role}</div>
        <div class="class-stat-chips">
          <div class="stat-chip">STR<strong>${selCls.stats.str}</strong></div>
          <div class="stat-chip">DEX<strong>${selCls.stats.dex}</strong></div>
          <div class="stat-chip">INT<strong>${selCls.stats.int}</strong></div>
          <div class="stat-chip">VIT<strong>${selCls.stats.vit}</strong></div>
        </div>
        <div class="class-skills-list">
          <span>Kit:</span> ${selCls.skills[1].name} • ${selCls.skills[2].name} • ${selCls.skills[3].name} • <span>Ult:</span> ${selCls.ultName}
        </div>
      `;
    }

    // Pet selector pills
    dom.petSelectGrid.innerHTML = '';
    for (const pId of Object.keys(PETS_CONFIG)) {
      const pet = PETS_CONFIG[pId];
      const pc = document.createElement('button');
      pc.type = 'button';
      pc.className = 'pet-pill-btn' + (state.selectedCreatePet === pId ? ' selected' : '');
      pc.innerHTML = `<strong style="color:${pet.color}">${pet.name}</strong><br><small>${pet.passiveDesc}</small>`;
      pc.addEventListener('click', () => { sfx.unlock(); state.selectedCreatePet = pId; renderClassPortraits(); });
      dom.petSelectGrid.appendChild(pc);
    }
  }

  function setScreen(nextScreen) {
    state.screen = nextScreen;
    dom.mainMenuScreen.classList.toggle('hidden', nextScreen !== 'MAIN_MENU');
    dom.charCreateScreen.classList.toggle('hidden', nextScreen !== 'CHAR_CREATE');

    const inWorld = nextScreen === 'TOWN' || nextScreen === 'DUNGEON';
    dom.hudTopLeft.classList.toggle('hidden', !inWorld);
    dom.hudTopRight.classList.toggle('hidden', !inWorld);
    dom.touchControls.classList.toggle('hidden', !inWorld);

    const inTown = nextScreen === 'TOWN';
    dom.townQuickBar.classList.toggle('hidden', !inTown);
    dom.combatCluster.classList.toggle('hidden', inTown);
    dom.btnTownPortal.classList.toggle('hidden', inTown);
    dom.btnLootFilter.classList.toggle('hidden', inTown);

    if (nextScreen === 'MAIN_MENU') renderMainMenuSummary();
    if (nextScreen === 'CHAR_CREATE') {
      if (!dom.heroNameInput.value.trim()) dom.heroNameInput.value = GOTHIC_NAMES[Math.floor(Math.random() * GOTHIC_NAMES.length)];
      renderClassPortraits();
    }
    if (inWorld) {
      syncClassSkillLabels();
      syncAudioToggleLabels();
      dom.lootFilterLabel.textContent = LOOT_FILTER_LABELS[state.lootFilter];
      resizeCanvas();
      syncHudDom(true);
    }
  }

  function createNewHero(rawName, classId, petId = 'hound') {
    const cleanName = (rawName || '').trim().slice(0, 18) || 'Aldric';
    const fresh = createFreshHeroSlotData(cleanName, classId, petId);
    state.saveSlots[state.activeSlot] = fresh;
    applySlotDataToRuntime(fresh);
    saveHeroProfile();
    enterTown();
  }

  function enterTown() {
    generateTown();
    setScreen('TOWN');
  }

  function enterDungeonFloor(seed, floor, opts = {}) {
    generateDungeon(seed, floor, opts);
    setScreen('DUNGEON');
    if (window.CryptCoop && window.CryptCoop.active && window.CryptCoop.isHost) {
      window.CryptCoop.syncFloor(state.seed, state.floor, state.biome);
    }
    saveHeroProfile();
  }

  function refreshBlacksmithStock() {
    const stock = [];
    const oldFloor = state.floor;
    state.floor = Math.max(1, state.highestFloor);
    const rarities = ['common', 'magic', 'magic', 'rare', 'rare', 'magic'];
    for (let i = 0; i < rarities.length; i++) {
      const r = rarities[i];
      const item = generateItem(r === 'common' ? 'magic' : r);
      if (r === 'common') item.rarity = 'common';
      const cost = (r === 'rare' ? 120 : r === 'magic' ? 65 : 35) + state.highestFloor * 18;
      stock.push({ item, cost });
    }
    state.floor = oldFloor;
    state.blacksmithStock = stock;
  }

  function temperItem(item) {
    if (!item || !item.stats) return;
    item.temper = (item.temper || 0) + 1;
    if (!item.name.includes('+')) item.name = `${item.name} +1`;
    else item.name = item.name.replace(/\+\d+$/, `+${item.temper}`);
    for (const k of Object.keys(item.stats)) {
      item.stats[k] = k === 'crit' ? Math.round((item.stats[k] + 1.2) * 10) / 10 : Math.max(1, Math.round(item.stats[k] * 1.18 + 2));
    }
  }

  function openTownNpcDrawer(npcId, subTab = 'buy') {
    const p = state.player;
    dom.townNpcGold.textContent = p.gold.toLocaleString();
    dom.townNpcBody.innerHTML = '';

    if (npcId === 'blacksmith') {
      dom.townNpcTitle.textContent = 'Blacksmith Forge';
      dom.townNpcSubtitle.textContent = `Arcane Dust: ${p.dust} • Instant Gear Upgrade & Salvage`;
      const tabs = document.createElement('div');
      tabs.className = 'npc-tabs';
      for (const [tid, lbl] of [['buy', 'Buy'], ['temper', 'Temper'], ['reforge', 'Reforge'], ['salvage', 'Salvage']]) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'npc-tab-btn' + (subTab === tid ? ' active' : '');
        b.textContent = lbl;
        b.addEventListener('click', () => openTownNpcDrawer('blacksmith', tid));
        tabs.appendChild(b);
      }
      dom.townNpcBody.appendChild(tabs);

      const list = document.createElement('div');
      list.className = 'npc-list';
      if (subTab === 'buy') {
        state.blacksmithStock.forEach((entry, idx) => {
          const row = document.createElement('div');
          row.className = 'npc-row';
          row.innerHTML = `<div class="npc-row-info"><div class="npc-row-title rarity-${entry.item.rarity}">${entry.item.name}</div><div class="npc-row-sub">${SLOT_LABELS[entry.item.slot]} • ${formatStatsLine(entry.item.stats).map(([k, v, u]) => `${k} +${v}${u}`).join(', ')}</div></div><button type="button" class="npc-action-btn" ${p.gold < entry.cost || p.bag.length >= MAX_BAG_SLOTS ? 'disabled' : ''}>${entry.cost}g</button>`;
          row.querySelector('button').addEventListener('click', () => {
            if (p.gold < entry.cost || p.bag.length >= MAX_BAG_SLOTS) return;
            p.gold -= entry.cost; p.bag.push(entry.item); state.blacksmithStock.splice(idx, 1);
            sfx.anvil(); saveHeroProfile(); syncHudDom(true); openTownNpcDrawer('blacksmith', 'buy');
          });
          list.appendChild(row);
        });
      } else if (subTab === 'temper') {
        for (const slot of SLOTS) {
          const eq = p.equipped[slot]; if (!eq) continue;
          const cost = 60 + ((eq.temper || 0) * 45) + state.highestFloor * 12;
          const row = document.createElement('div');
          row.className = 'npc-row';
          row.innerHTML = `<div class="npc-row-info"><div class="npc-row-title rarity-${eq.rarity}">${eq.name}</div><div class="npc-row-sub">${SLOT_LABELS[slot]} • +18% Stats</div></div><button type="button" class="npc-action-btn" ${p.gold < cost ? 'disabled' : ''}>${cost}g</button>`;
          row.querySelector('button').addEventListener('click', () => {
            if (p.gold < cost) return;
            p.gold -= cost; temperItem(eq); syncPlayerVitalsBounds(); p.hp = p.maxHp;
            sfx.anvil(); saveHeroProfile(); syncHudDom(true); openTownNpcDrawer('blacksmith', 'temper');
          });
          list.appendChild(row);
        }
      } else if (subTab === 'reforge') {
        for (const slot of SLOTS) {
          const eq = p.equipped[slot]; if (!eq || !eq.stats) continue;
          const row = document.createElement('div');
          row.className = 'npc-row';
          row.innerHTML = `<div class="npc-row-info"><div class="npc-row-title rarity-${eq.rarity}">${eq.name}</div><div class="npc-row-sub">Reroll 1 random affix • Cost: 45g + 3 Dust</div></div><button type="button" class="npc-action-btn" ${p.gold < 45 || p.dust < 3 ? 'disabled' : ''}>Reforge</button>`;
          row.querySelector('button').addEventListener('click', () => {
            if (p.gold < 45 || p.dust < 3) return;
            p.gold -= 45; p.dust -= 3;
            const keys = Object.keys(eq.stats);
            const rk = keys[Math.floor(Math.random() * keys.length)];
            if (rk) eq.stats[rk] = Math.max(2, Math.round(eq.stats[rk] * (0.95 + Math.random() * 0.35)));
            syncPlayerVitalsBounds(); sfx.anvil(); saveHeroProfile(); syncHudDom(true); openTownNpcDrawer('blacksmith', 'reforge');
          });
          list.appendChild(row);
        }
      } else {
        // SALVAGE TAB WITH PROMINENT "SALVAGE ALL" BUTTON
        const gearItems = p.bag.filter((it) => it && it.kind !== 'gem');
        const totalG = gearItems.reduce((acc, it) => acc + salvageGoldValue(it), 0);
        const totalD = gearItems.length * 2;
        const salAllBtn = document.createElement('button');
        salAllBtn.type = 'button';
        salAllBtn.id = 'btnBlacksmithSalvageAll';
        salAllBtn.className = 'salvage-all-btn';
        salAllBtn.disabled = gearItems.length === 0;
        salAllBtn.textContent = gearItems.length
          ? `⚒ Salvage All (${gearItems.length} items → +${totalG}g, +${totalD} Dust)`
          : '⚒ Salvage All (Backpack Empty)';
        salAllBtn.addEventListener('click', () => {
          if (!gearItems.length) return;
          const hasHigh = gearItems.some((it) => it.rarity === 'rare' || it.rarity === 'set' || it.rarity === 'legendary');
          if (hasHigh && !window.confirm('Backpack contains Rare/Set/Legendary gear. Salvage ALL items?')) return;
          p.gold += totalG;
          p.dust += totalD;
          p.bag = p.bag.filter((it) => it && it.kind === 'gem');
          sfx.anvil();
          saveHeroProfile();
          syncHudDom(true);
          showToast(`Salvaged ${gearItems.length} items (+${totalG}g, +${totalD} Dust)!`);
          openTownNpcDrawer('blacksmith', 'salvage');
        });
        dom.townNpcBody.appendChild(salAllBtn);

        if (!p.bag.length) {
          list.innerHTML = '<div class="compare-empty">Your satchel is empty.</div>';
        } else {
          p.bag.forEach((it, idx) => {
            const val = it.kind === 'gem' ? 15 : salvageGoldValue(it);
            const row = document.createElement('div');
            row.className = 'npc-row';
            row.innerHTML = `<div class="npc-row-info"><div class="npc-row-title rarity-${it.rarity}">${it.name}</div><div class="npc-row-sub">${it.kind === 'gem' ? it.desc : SLOT_LABELS[it.slot]}</div></div><button type="button" class="npc-action-btn">+${val}g</button>`;
            row.querySelector('button').addEventListener('click', () => {
              p.gold += val; p.dust += 2; p.bag.splice(idx, 1);
              sfx.anvil(); saveHeroProfile(); syncHudDom(true); openTownNpcDrawer('blacksmith', 'salvage');
            });
            list.appendChild(row);
          });
        }
      }
      dom.townNpcBody.appendChild(list);
    } else if (npcId === 'stash') {
      dom.townNpcTitle.textContent = 'Hero Stash Chest';
      dom.townNpcSubtitle.textContent = `Shared Account Storage (${state.account.stash.length}/${MAX_STASH_SLOTS})`;
      const list = document.createElement('div');
      list.className = 'npc-list';
      list.innerHTML = '<div class="section-heading">Stash Items (Tap to Withdraw)</div>';
      if (!state.account.stash.length) list.innerHTML += '<div class="compare-empty">Stash is empty.</div>';
      state.account.stash.forEach((it, idx) => {
        const row = document.createElement('div');
        row.className = 'npc-row';
        row.innerHTML = `<div class="npc-row-info"><div class="npc-row-title rarity-${it.rarity}">${it.name}</div><div class="npc-row-sub">${it.kind === 'gem' ? it.desc : SLOT_LABELS[it.slot]}</div></div><button type="button" class="npc-action-btn" ${p.bag.length >= MAX_BAG_SLOTS ? 'disabled' : ''}>Take</button>`;
        row.querySelector('button').addEventListener('click', () => {
          if (p.bag.length >= MAX_BAG_SLOTS) return;
          p.bag.push(it); state.account.stash.splice(idx, 1); sfx.loot(); saveHeroProfile(); syncHudDom(true); openTownNpcDrawer('stash');
        });
        list.appendChild(row);
      });
      const bagHead = document.createElement('div');
      bagHead.className = 'section-heading'; bagHead.style.marginTop = '10px';
      bagHead.textContent = `Satchel (${p.bag.length}/${MAX_BAG_SLOTS}) — Tap to Deposit`;
      list.appendChild(bagHead);
      p.bag.forEach((it, idx) => {
        const row = document.createElement('div');
        row.className = 'npc-row';
        row.innerHTML = `<div class="npc-row-info"><div class="npc-row-title rarity-${it.rarity}">${it.name}</div><div class="npc-row-sub">${it.kind === 'gem' ? it.desc : SLOT_LABELS[it.slot]}</div></div><button type="button" class="npc-action-btn" ${state.account.stash.length >= MAX_STASH_SLOTS ? 'disabled' : ''}>Store</button>`;
        row.querySelector('button').addEventListener('click', () => {
          if (state.account.stash.length >= MAX_STASH_SLOTS) return;
          state.account.stash.push(it); p.bag.splice(idx, 1); sfx.loot(); saveHeroProfile(); syncHudDom(true); openTownNpcDrawer('stash');
        });
        list.appendChild(row);
      });
      dom.townNpcBody.appendChild(list);
    } else if (npcId === 'apothecary') {
      dom.townNpcTitle.textContent = 'Alchemist & Apothecary';
      dom.townNpcSubtitle.textContent = 'Potions • Blade Oils • Shrine Buffs';
      const list = document.createElement('div');
      list.className = 'npc-list';
      const offers = [
        { title: 'Sanctuary Full Restore', sub: 'Refill Health & Mana 100%', cost: 0, fn: () => { p.hp = p.maxHp; p.mp = p.maxMp; sfx.holy(); } },
        { title: 'Health Potion (+1)', sub: `Carried: ${p.potions}`, cost: 35, fn: () => { p.potions += 1; sfx.potion(); } },
        { title: 'Mana Elixir (+1)', sub: `Carried: ${p.manaElixirs}`, cost: 40, fn: () => { p.manaElixirs += 1; sfx.potion(); } },
        { title: 'Ember Blade Oil (90s)', sub: 'Attacks inflict Burn', cost: 45, fn: () => { p.bladeOil = { type: 'burn', label: 'Burn Oil', timer: 90 }; sfx.potion(); } },
        { title: 'Venom Blade Oil (90s)', sub: 'Attacks inflict Poison', cost: 45, fn: () => { p.bladeOil = { type: 'poison', label: 'Poison Oil', timer: 90 }; sfx.potion(); } },
        { title: 'Frost Blade Oil (90s)', sub: 'Attacks inflict Chill/Freeze', cost: 50, fn: () => { p.bladeOil = { type: 'chill', label: 'Frost Oil', timer: 90 }; sfx.potion(); } },
        { title: 'Shrine of Precision', sub: '1-Floor Buff: +15% Crit', cost: 60, fn: () => { state.activeBuff = { id: 'crit', label: '+15% Crit', crit: 15, speed: 0, gold: 0 }; sfx.holy(); } },
        { title: 'Shrine of Alacrity', sub: '1-Floor Buff: +20% Move Speed', cost: 50, fn: () => { state.activeBuff = { id: 'speed', label: '+20% Speed', crit: 0, speed: 0.2, gold: 0 }; sfx.holy(); } }
      ];
      for (const off of offers) {
        const row = document.createElement('div');
        row.className = 'npc-row';
        row.innerHTML = `<div class="npc-row-info"><div class="npc-row-title">${off.title}</div><div class="npc-row-sub">${off.sub}</div></div><button type="button" class="npc-action-btn" ${p.gold < off.cost ? 'disabled' : ''}>${off.cost === 0 ? 'Free' : off.cost + 'g'}</button>`;
        row.querySelector('button').addEventListener('click', () => {
          if (p.gold < off.cost) return;
          p.gold -= off.cost; off.fn(); saveHeroProfile(); syncHudDom(true); openTownNpcDrawer('apothecary');
        });
        list.appendChild(row);
      }
      dom.townNpcBody.appendChild(list);
    } else if (npcId === 'bounties') {
      dom.townNpcTitle.textContent = 'Shadowhaven Bounty Board';
      dom.townNpcSubtitle.textContent = `Mercenary Marks: ${state.account.mercenaryMarks || 0}`;
      const list = document.createElement('div');
      list.className = 'npc-list';
      (state.account.bounties || []).forEach((b, idx) => {
        const ready = b.prog >= b.target && !b.claimed;
        const row = document.createElement('div');
        row.className = 'npc-row';
        row.innerHTML = `<div class="npc-row-info"><div class="npc-row-title">${b.title} (${b.prog}/${b.target})</div><div class="npc-row-sub">${b.desc} • Reward: ${b.gold}g + ${b.marks} Marks</div></div><button type="button" class="npc-action-btn" ${!ready ? 'disabled' : ''}>${b.claimed ? 'Done' : ready ? 'Claim' : 'Active'}</button>`;
        row.querySelector('button').addEventListener('click', () => {
          if (!ready) return;
          p.gold += b.gold; state.account.mercenaryMarks += b.marks; b.claimed = true;
          sfx.legendary(); saveHeroProfile(); syncHudDom(true); openTownNpcDrawer('bounties');
        });
        list.appendChild(row);
      });
      dom.townNpcBody.appendChild(list);
    } else if (npcId === 'pets') {
      dom.townNpcTitle.textContent = 'Companion Pet Sanctuary';
      dom.townNpcSubtitle.textContent = `Monster Essence: ${p.essence} • Active: ${PETS_CONFIG[p.petId]?.name}`;
      const list = document.createElement('div');
      list.className = 'npc-list';
      for (const pId of Object.keys(PETS_CONFIG)) {
        const cfg = PETS_CONFIG[pId];
        const rk = p.petRanks[pId] || 1;
        const isAct = p.petId === pId;
        const row = document.createElement('div');
        row.className = 'npc-row';
        row.innerHTML = `<div class="npc-row-info"><div class="npc-row-title" style="color:${cfg.color}">${cfg.name} (Rank ${rk}/5)</div><div class="npc-row-sub">${cfg.skillName} • ${cfg.passiveDesc}</div></div><div style="display:flex;gap:6px;"><button type="button" class="npc-action-btn">${isAct ? 'Active' : 'Summon'}</button><button type="button" class="npc-action-btn" ${rk >= 5 || p.essence < 2 ? 'disabled' : ''}>Feed (2 Ess)</button></div>`;
        const btns = row.querySelectorAll('button');
        btns[0].addEventListener('click', () => { p.petId = pId; spawnCompanionPet(); syncPlayerVitalsBounds(); saveHeroProfile(); openTownNpcDrawer('pets'); });
        btns[1].addEventListener('click', () => {
          if (rk >= 5 || p.essence < 2) return;
          p.essence -= 2; p.petRanks[pId] = rk + 1; syncPlayerVitalsBounds(); sfx.lvl(); saveHeroProfile(); openTownNpcDrawer('pets');
        });
        list.appendChild(row);
      }
      dom.townNpcBody.appendChild(list);
    } else if (npcId === 'codex') {
      dom.townNpcTitle.textContent = 'Bestiary Codex';
      let totalK = 0; for (const k of Object.values(state.account.bestiary || {})) totalK += k;
      dom.townNpcSubtitle.textContent = `Account Kill Bonus: +${Math.min(20, Math.floor(totalK / 25))} ATK (${totalK} kills)`;
      const list = document.createElement('div');
      list.className = 'npc-list';
      const entries = Object.entries(state.account.bestiary || {});
      if (!entries.length) list.innerHTML = '<div class="compare-empty">Slay monsters in the Crypt to record Bestiary entries.</div>';
      for (const [mName, cnt] of entries) {
        const row = document.createElement('div');
        row.className = 'npc-row';
        row.innerHTML = `<div class="npc-row-info"><div class="npc-row-title">${mName}</div><div class="npc-row-sub">Recorded Kills: ${cnt}</div></div>`;
        list.appendChild(row);
      }
      dom.townNpcBody.appendChild(list);
    } else if (npcId === 'wardrobe') {
      dom.townNpcTitle.textContent = 'Cosmetic Wardrobe';
      dom.townNpcSubtitle.textContent = 'Weapon Trails & Cloak Dyes (Boss Unlocks)';
      const list = document.createElement('div');
      list.className = 'npc-list';
      for (const tr of WARDROBE_ITEMS.trails) {
        const unl = state.account.wardrobeUnlocked.trails.includes(tr.id);
        const eq = state.account.equippedTrail === tr.id;
        const row = document.createElement('div');
        row.className = 'npc-row';
        row.innerHTML = `<div class="npc-row-info"><div class="npc-row-title" style="color:${tr.color}">${tr.name} Trail</div><div class="npc-row-sub">${unl ? 'Unlocked' : 'Defeat ' + tr.reqBoss}</div></div><button type="button" class="npc-action-btn" ${!unl ? 'disabled' : ''}>${eq ? 'Equipped' : 'Equip'}</button>`;
        row.querySelector('button').addEventListener('click', () => { state.account.equippedTrail = tr.id; saveAccount(); openTownNpcDrawer('wardrobe'); });
        list.appendChild(row);
      }
      for (const cp of WARDROBE_ITEMS.capes) {
        const unl = state.account.wardrobeUnlocked.capes.includes(cp.id);
        const eq = state.account.equippedCape === cp.id;
        const row = document.createElement('div');
        row.className = 'npc-row';
        row.innerHTML = `<div class="npc-row-info"><div class="npc-row-title">${cp.name} Cape</div><div class="npc-row-sub">${unl ? 'Unlocked' : 'Defeat ' + cp.reqBoss}</div></div><button type="button" class="npc-action-btn" ${!unl ? 'disabled' : ''}>${eq ? 'Equipped' : 'Equip'}</button>`;
        row.querySelector('button').addEventListener('click', () => { state.account.equippedCape = cp.id; saveAccount(); openTownNpcDrawer('wardrobe'); });
        list.appendChild(row);
      }
      dom.townNpcBody.appendChild(list);
    } else if (npcId === 'coop') {
      dom.townNpcTitle.textContent = '4-Player WebRTC Co-Op';
      dom.townNpcSubtitle.textContent = window.CryptCoop?.active ? `Connected: ${window.CryptCoop.roomCode}` : 'PeerJS + ntfy.sh Zero-Server Co-Op';
      const wrap = document.createElement('div');
      wrap.className = 'npc-list';
      wrap.innerHTML = `
        <div style="display:flex;gap:8px;">
          <button id="btnCoopHost" type="button" class="npc-action-btn" style="flex:1">Host New Room</button>
          <button id="btnCoopRefresh" type="button" class="npc-action-btn">Refresh Rooms</button>
        </div>
        <div style="display:flex;gap:8px;">
          <input id="coopCodeInput" class="gothic-input" type="text" placeholder="CRYPT-XXXX" maxlength="12">
          <button id="btnCoopJoin" type="button" class="npc-action-btn">Join Code</button>
        </div>
        <div id="coopRoomsList" class="npc-list"><div class="compare-empty">Searching active rooms...</div></div>
      `;
      dom.townNpcBody.appendChild(wrap);
      const heroInfo = { name: state.heroName, cls: state.heroClass, level: p.level };
      wrap.querySelector('#btnCoopHost').addEventListener('click', async () => {
        try {
          const seed = Math.floor(1000 + Math.random() * 8999);
          const res = await window.CryptCoop.hostRoom(heroInfo, seed, state.floor, state.biome);
          dom.townNpcDrawer.close();
          enterDungeonFloor(seed, state.floor);
          showToast(`Hosting Co-Op Room: ${res.code}`);
        } catch (err) { showToast('Co-Op Host failed (check network)'); }
      });
      wrap.querySelector('#btnCoopJoin').addEventListener('click', async () => {
        try {
          const code = wrap.querySelector('#coopCodeInput').value;
          const pkt = await window.CryptCoop.joinRoom(code, heroInfo);
          dom.townNpcDrawer.close();
          enterDungeonFloor(pkt.seed, pkt.floor, { biome: pkt.biome });
          showToast(`Joined ${code}!`);
        } catch (err) { showToast('Could not join room code'); }
      });
      const loadList = async () => {
        const listEl = wrap.querySelector('#coopRoomsList');
        const rooms = await window.CryptCoop.listRooms();
        listEl.innerHTML = rooms.length ? '' : '<div class="compare-empty">No active public rooms right now. Host one!</div>';
        for (const r of rooms) {
          const row = document.createElement('div');
          row.className = 'npc-row';
          row.innerHTML = `<div class="npc-row-info"><div class="npc-row-title">${r.code} • ${r.hostName}</div><div class="npc-row-sub">Floor ${r.floor} • ${r.players}/4 Players</div></div><button type="button" class="npc-action-btn">Join</button>`;
          row.querySelector('button').addEventListener('click', async () => {
            try {
              const pkt = await window.CryptCoop.joinRoom(r.code, heroInfo);
              dom.townNpcDrawer.close();
              enterDungeonFloor(pkt.seed, pkt.floor, { biome: pkt.biome });
            } catch (_) { showToast('Room unreachable'); }
          });
          listEl.appendChild(row);
        }
      };
      wrap.querySelector('#btnCoopRefresh').addEventListener('click', loadList);
      loadList();
    } else if (npcId === 'waypoint') {
      dom.townNpcTitle.textContent = 'Waypoint Portal & Keystones';
      dom.townNpcSubtitle.textContent = `Best Floor: ${state.highestFloor} • Best Rift Tier: ${state.account.bestRiftTier || 0}`;

      const ctrl = document.createElement('div');
      ctrl.className = 'npc-list';
      ctrl.innerHTML = `
        <div class="npc-tabs" id="wpSizeTabs">
          ${Object.values(MAP_SIZES).map((ms) => `<button type="button" data-size="${ms.id}" class="npc-tab-btn ${state.mapSize === ms.id ? 'active' : ''}">${ms.label}</button>`).join('')}
        </div>
        <div class="npc-tabs" id="wpBiomeTabs">
          ${Object.values(BIOMES).map((bm) => `<button type="button" data-biome="${bm.id}" class="npc-tab-btn ${state.biome === bm.id ? 'active' : ''}">${bm.name.split(' ')[0]}</button>`).join('')}
        </div>
      `;
      ctrl.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => { state.mapSize = b.dataset.size; savePrefs(); openTownNpcDrawer('waypoint'); }));
      ctrl.querySelectorAll('[data-biome]').forEach((b) => b.addEventListener('click', () => { state.biome = b.dataset.biome; openTownNpcDrawer('waypoint'); }));
      dom.townNpcBody.appendChild(ctrl);

      const grid = document.createElement('div');
      grid.className = 'waypoint-grid';
      for (let fl = 1; fl <= state.highestFloor; fl++) {
        const isBoss = fl % 3 === 0;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'waypoint-floor-btn' + (isBoss ? ' boss-floor' : '');
        btn.innerHTML = isBoss ? `Floor ${fl}<br><small>★ Guardian</small>` : `Floor ${fl}<br><small>Crypt</small>`;
        btn.addEventListener('click', () => {
          dom.townNpcDrawer.close(); sfx.portal();
          enterDungeonFloor(Math.floor(1000 + Math.random() * 8999), fl, { biome: state.biome, mapSize: state.mapSize });
        });
        grid.appendChild(btn);
      }
      // Endless Abyssal Keystone Rift Button
      const nextRift = (state.account.bestRiftTier || 0) + 1;
      const riftBtn = document.createElement('button');
      riftBtn.type = 'button';
      riftBtn.className = 'waypoint-floor-btn boss-floor';
      riftBtn.innerHTML = `Abyssal Rift T${nextRift}<br><small>⏱ 3m Keystone</small>`;
      riftBtn.addEventListener('click', () => {
        dom.townNpcDrawer.close(); sfx.portal();
        enterDungeonFloor(Math.floor(1000 + Math.random() * 8999), state.highestFloor, { biome: state.biome, mapSize: state.mapSize, riftTier: nextRift });
      });
      grid.appendChild(riftBtn);
      dom.townNpcBody.appendChild(grid);
    }

    if (!dom.townNpcDrawer.open) dom.townNpcDrawer.showModal();
  }

  function openSkillTreeModal(forceOpen) {
    if (!dom.skillTreeModal) return;
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !dom.skillTreeModal.open;
    if (!shouldOpen) {
      if (dom.skillTreeModal.open) dom.skillTreeModal.close();
      return;
    }
    const p = state.player;
    const cfg = getActiveSkillConfig();
    if (dom.stSpCount) dom.stSpCount.textContent = p.skillPoints || 0;
    if (dom.stMpCount) dom.stMpCount.textContent = p.masteryPoints || 0;

    if (dom.skillTreeBody) {
      const skillsHtml = [1, 2, 3].map((id) => {
        const rk = p.skillRanks[id] || 1;
        const aw = state.awakenedSkills[id] ? ' ★ AWAKENED' : '';
        return `<div class="npc-row"><div class="npc-row-info"><div class="npc-row-title">${cfg[id].name} (Lv ${rk}/5${aw})</div><div class="npc-row-sub">Mana ${cfg[id].mana} • CD ${cfg[id].cd}s • +18% Dmg/Lv</div></div><button type="button" class="npc-action-btn" data-st-skill="${id}" ${rk >= 5 || p.skillPoints < 1 ? 'disabled' : ''}>+1 Lv (1 SP)</button></div>`;
      }).join('');

      const weaponsHtml = `
        <div class="npc-row"><div class="npc-row-info"><div class="npc-row-title">Bone Blades (Lv ${state.autoWeapons.boneBlades}/3)</div><div class="npc-row-sub">Orbiting blades auto-slice foes</div></div></div>
        <div class="npc-row"><div class="npc-row-info"><div class="npc-row-title">Chain Lightning (Lv ${state.autoWeapons.chainLightning}/3)</div><div class="npc-row-sub">Storm arcs zap multiple foes</div></div></div>
        <div class="npc-row"><div class="npc-row-info"><div class="npc-row-title">Ember Aura (Lv ${state.autoWeapons.emberAura}/3)</div><div class="npc-row-sub">Scorching fire aura burns nearby</div></div></div>
      `;

      const masteryHtml = MASTERY_NODES.map((n) => {
        const unl = p.masteryUnlocked.includes(n.id);
        const can = !unl && p.masteryPoints > 0 && (!n.req || p.masteryUnlocked.includes(n.req));
        return `<button type="button" class="mastery-node-btn ${unl ? 'unlocked' : ''}" data-st-mastery="${n.id}" ${!can && !unl ? 'disabled' : ''}><strong>${n.name}</strong><br>${n.desc}</button>`;
      }).join('');

      dom.skillTreeBody.innerHTML = `
        <div class="skill-tree-cols">
          <div class="skill-col-card"><div class="section-heading">Active Skills & Auto-Weapons</div><div class="npc-list">${skillsHtml}${weaponsHtml}</div></div>
          <div class="skill-col-card"><div class="section-heading">Constellation Mastery</div><div class="mastery-node-grid">${masteryHtml}</div></div>
        </div>
      `;

      dom.skillTreeBody.querySelectorAll('[data-st-skill]').forEach((b) => {
        b.addEventListener('click', () => {
          const sid = Number(b.dataset.stSkill);
          if (p.skillPoints < 1 || (p.skillRanks[sid] || 1) >= 5) return;
          p.skillPoints -= 1; p.skillRanks[sid] = (p.skillRanks[sid] || 1) + 1;
          sfx.lvl(); saveHeroProfile(); openSkillTreeModal(true); syncHudDom(true);
        });
      });
      dom.skillTreeBody.querySelectorAll('[data-st-mastery]').forEach((b) => {
        b.addEventListener('click', () => {
          const id = b.dataset.stMastery;
          const node = MASTERY_NODES.find((n) => n.id === id);
          if (!node || p.masteryUnlocked.includes(id) || p.masteryPoints < 1) return;
          if (node.req && !p.masteryUnlocked.includes(node.req)) return;
          p.masteryPoints -= 1; p.masteryUnlocked.push(id);
          syncPlayerVitalsBounds(); sfx.holy(); saveHeroProfile(); openSkillTreeModal(true); syncHudDom(true);
        });
      });
    }
    if (!dom.skillTreeModal.open) dom.skillTreeModal.showModal();
  }

  function salvageAllBagGear() {
    const p = state.player;
    const gearItems = p.bag.filter((it) => it && it.kind !== 'gem');
    if (!gearItems.length) { showToast('Backpack has no gear to salvage.'); return; }
    const totalG = gearItems.reduce((acc, it) => acc + salvageGoldValue(it), 0);
    const totalD = gearItems.length * 2;
    p.gold += totalG;
    p.dust += totalD;
    p.bag = p.bag.filter((it) => it && it.kind === 'gem');
    state.selectedInspect = null;
    sfx.anvil(); saveHeroProfile(); syncHudDom(true); renderInventoryUI();
    showToast(`Salvaged ${gearItems.length} items (+${totalG}g, +${totalD} Dust)!`);
  }

  function toggleInventory(forceOpen) {
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !dom.inventoryDrawer.open;
    if (shouldOpen) {
      renderInventoryUI();
      if (!dom.inventoryDrawer.open) dom.inventoryDrawer.showModal();
    } else if (dom.inventoryDrawer.open) {
      dom.inventoryDrawer.close();
    }
  }

  function formatStatsLine(stats) {
    const parts = [];
    if (stats.atk) parts.push(['Attack', stats.atk, '']);
    if (stats.crit) parts.push(['Crit', stats.crit, '%']);
    if (stats.hp) parts.push(['Max HP', stats.hp, '']);
    if (stats.loh) parts.push(['Life on Hit', stats.loh, '']);
    if (stats.arm) parts.push(['Armor', stats.arm, '']);
    return parts;
  }

  function drawItemIcon(can, item) {
    if (!can || !item) return;
    const g = can.getContext('2d');
    g.clearRect(0, 0, 30, 30);
    if (item.kind === 'gem') {
      const def = GEM_DEFS[item.gemId] || GEM_DEFS.ruby;
      g.fillStyle = def.color;
      g.beginPath(); g.moveTo(15, 4); g.lineTo(24, 15); g.lineTo(15, 26); g.lineTo(6, 15); g.closePath(); g.fill();
      return;
    }
    const col = RARITY[item.rarity]?.color || '#cbd5e1';
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2;
    if (item.slot === 'weapon') {
      g.beginPath(); g.moveTo(7, 23); g.lineTo(23, 7); g.stroke();
      g.fillRect(10, 17, 6, 3);
    } else if (item.slot === 'offhand') {
      g.strokeRect(8, 7, 14, 16);
    } else if (item.slot === 'helm') {
      g.beginPath(); g.arc(15, 16, 8, Math.PI, 0); g.lineTo(23, 22); g.lineTo(7, 22); g.closePath(); g.stroke();
    } else if (item.slot === 'armor') {
      g.strokeRect(7, 7, 16, 16);
    } else if (item.slot === 'boots') {
      g.fillRect(8, 12, 6, 11); g.fillRect(16, 12, 6, 11);
    } else {
      g.beginPath(); g.arc(15, 15, 7, 0, Math.PI * 2); g.stroke();
    }
  }

  let dragPayload = null;
  function attachInvDrag(el, source, key, item) {
    if (!item) return;
    let startX = 0, startY = 0, dragging = false;
    el.addEventListener('pointerdown', (e) => {
      startX = e.clientX; startY = e.clientY; dragging = false;
      dragPayload = { source, key, item };
    });
    el.addEventListener('pointermove', (e) => {
      if (!dragPayload || dragPayload.key !== key || dragPayload.source !== source) return;
      if (!dragging && Math.hypot(e.clientX - startX, e.clientY - startY) > 10) {
        dragging = true;
        dom.dragGhost.textContent = item.name;
        dom.dragGhost.classList.remove('hidden');
      }
      if (dragging) {
        dom.dragGhost.style.left = `${e.clientX}px`;
        dom.dragGhost.style.top = `${e.clientY}px`;
      }
    });
    const finishDrag = (e) => {
      if (!dragPayload || dragPayload.key !== key || dragPayload.source !== source) return;
      if (dragging) {
        dom.dragGhost.classList.add('hidden');
        const targetEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop-type]');
        if (targetEl) handleInvDrop(dragPayload, targetEl.dataset.dropType, targetEl.dataset.dropKey);
      }
      dragPayload = null;
      dragging = false;
    };
    el.addEventListener('pointerup', finishDrag);
    el.addEventListener('pointercancel', finishDrag);
  }

  function handleInvDrop(drag, dropType, dropKey) {
    const p = state.player;
    if (dropType === 'salvage' && drag.source === 'bag') {
      const val = drag.item.kind === 'gem' ? 15 : salvageGoldValue(drag.item);
      p.gold += val; p.dust += 2; p.bag.splice(drag.key, 1);
      sfx.anvil(); saveHeroProfile(); syncHudDom(true); renderInventoryUI();
      return;
    }
    if (dropType === 'equipped' && drag.source === 'bag') {
      if (drag.item.kind === 'gem') {
        const eq = p.equipped[dropKey];
        if (eq && (eq.sockets || 0) > (eq.gems?.length || 0)) {
          eq.gems = eq.gems || []; eq.gems.push(drag.item.gemId);
          p.bag.splice(drag.key, 1);
          sfx.anvil(); syncPlayerVitalsBounds(); saveHeroProfile(); renderInventoryUI();
          showToast(`Socketed ${drag.item.name}!`);
        } else { showToast('No open sockets on that slot!'); }
        return;
      }
      if (drag.item.slot === dropKey) {
        const prev = p.equipped[dropKey];
        p.equipped[dropKey] = drag.item;
        if (prev) p.bag[drag.key] = prev; else p.bag.splice(drag.key, 1);
        sfx.loot(); syncPlayerVitalsBounds(); saveHeroProfile(); syncHudDom(true); renderInventoryUI();
      }
      return;
    }
    if (dropType === 'bag' && drag.source === 'bag') {
      const targetIdx = Number(dropKey);
      const targetItem = p.bag[targetIdx];
      if (drag.item.kind === 'gem' && targetItem && targetItem.kind !== 'gem' && (targetItem.sockets || 0) > (targetItem.gems?.length || 0)) {
        targetItem.gems = targetItem.gems || []; targetItem.gems.push(drag.item.gemId);
        p.bag.splice(drag.key, 1);
        sfx.anvil(); saveHeroProfile(); renderInventoryUI();
        return;
      }
      const tmp = p.bag[targetIdx];
      p.bag[targetIdx] = p.bag[drag.key];
      if (tmp) p.bag[drag.key] = tmp; else p.bag.splice(drag.key, 1);
      p.bag = p.bag.filter(Boolean);
      renderInventoryUI();
    }
  }

  function renderInventoryUI() {
    const p = state.player;
    const totals = getHeroStats();
    dom.invGold.textContent = p.gold.toLocaleString();
    dom.invDust.textContent = p.dust || 0;
    dom.invEssence.textContent = p.essence || 0;
    dom.invCapacity.textContent = `${p.bag.length} / ${MAX_BAG_SLOTS}`;
    dom.spBadge.textContent = p.skillPoints || 0;
    dom.mpBadge.textContent = p.masteryPoints || 0;

    dom.invTabGear.classList.toggle('active', state.invTab === 'gear');
    dom.invTabStats?.classList.toggle('active', state.invTab === 'stats');
    dom.invTabSkills.classList.toggle('active', state.invTab === 'skills');
    dom.invTabMastery.classList.toggle('active', state.invTab === 'mastery');
    dom.invGearPanel.classList.toggle('hidden', state.invTab !== 'gear');
    dom.invStatsPanel?.classList.toggle('hidden', state.invTab !== 'stats');
    dom.invSkillsPanel.classList.toggle('hidden', state.invTab !== 'skills');
    dom.invMasteryPanel.classList.toggle('hidden', state.invTab !== 'mastery');

    dom.heroStatsStrip.innerHTML = [
      `<div class="stat-chip"><span>ATK</span>${totals.atk}</div>`,
      `<div class="stat-chip"><span>CRIT</span>${totals.crit}%</div>`,
      `<div class="stat-chip"><span>HP</span>${totals.maxHp}</div>`,
      `<div class="stat-chip"><span>LOH</span>${totals.loh}</div>`,
      `<div class="stat-chip"><span>ARM</span>${Math.round(totals.arm)}</div>`
    ].join('');

    if (state.invTab === 'stats' && dom.invStatsPanel) {
      const sets = getSetCounts();
      const setLines = Object.entries(sets).filter(([, c]) => c >= 2).map(([id, c]) => `${SET_DEFS[id].name} (${c}pc)`).join(' • ') || 'None active';
      dom.invStatsPanel.innerHTML = `<div class="npc-list">
        <div class="npc-row"><div class="npc-row-info"><div class="npc-row-title">Combat Rating & Speed</div><div class="npc-row-sub">ATK ${totals.atk} • Crit ${totals.crit}% (${Math.round(totals.critDmg * 100)}%) • AtkSpd ${Math.round(totals.atkSpeedMult * 100)}% • Move ${totals.speed.toFixed(1)}</div></div></div>
        <div class="npc-row"><div class="npc-row-info"><div class="npc-row-title">Defense & Sustain</div><div class="npc-row-sub">HP ${p.maxHp} • MP ${p.maxMp} • Armor ${Math.round(totals.arm)} • Life on Hit +${totals.loh}</div></div></div>
        <div class="npc-row"><div class="npc-row-info"><div class="npc-row-title">Auto-Weapons & Run Passives</div><div class="npc-row-sub">Blades Lv${state.autoWeapons.boneBlades} • Chain Lv${state.autoWeapons.chainLightning} • Ember Lv${state.autoWeapons.emberAura} • Magnet ${Math.round(totals.magnetMult * 100)}%</div></div></div>
        <div class="npc-row"><div class="npc-row-info"><div class="npc-row-title">Active Set Bonuses</div><div class="npc-row-sub">${setLines}</div></div></div>
      </div>`;
      return;
    }

    if (state.invTab === 'skills') {
      const cfg = getActiveSkillConfig();
      dom.invSkillsPanel.innerHTML = `<div class="npc-list">${[1, 2, 3].map((id) => {
        const rk = p.skillRanks[id] || 1;
        return `<div class="npc-row"><div class="npc-row-info"><div class="npc-row-title">${cfg[id].name} (Rank ${rk}/5)</div><div class="npc-row-sub">Mana: ${cfg[id].mana} • CD: ${cfg[id].cd}s • +18% Dmg/Rank</div></div><button type="button" class="npc-action-btn" data-rank-skill="${id}" ${rk >= 5 || p.skillPoints < 1 ? 'disabled' : ''}>Upgrade (1 SP)</button></div>`;
      }).join('')}</div>`;
      dom.invSkillsPanel.querySelectorAll('[data-rank-skill]').forEach((b) => {
        b.addEventListener('click', () => {
          const sid = Number(b.dataset.rankSkill);
          if (p.skillPoints < 1 || (p.skillRanks[sid] || 1) >= 5) return;
          p.skillPoints -= 1; p.skillRanks[sid] = (p.skillRanks[sid] || 1) + 1;
          sfx.lvl(); saveHeroProfile(); renderInventoryUI();
        });
      });
      return;
    }

    if (state.invTab === 'mastery') {
      const branches = ['Offense', 'Defense', 'Utility'];
      dom.invMasteryPanel.innerHTML = `<div class="mastery-wheel-wrap"><div class="mastery-node-grid">${branches.map((br) => `
        <div class="mastery-branch-card">
          <div class="section-heading">${br} Constellation</div>
          ${MASTERY_NODES.filter((n) => n.branch === br).map((n) => {
            const unl = p.masteryUnlocked.includes(n.id);
            const can = !unl && p.masteryPoints > 0 && (!n.req || p.masteryUnlocked.includes(n.req));
            return `<button type="button" class="mastery-node-btn ${unl ? 'unlocked' : ''}" data-mastery="${n.id}" ${!can && !unl ? 'disabled' : ''}><strong>${n.name}</strong><br>${n.desc}</button>`;
          }).join('')}
        </div>`).join('')}</div></div>`;
      dom.invMasteryPanel.querySelectorAll('[data-mastery]').forEach((b) => {
        b.addEventListener('click', () => {
          const id = b.dataset.mastery;
          const node = MASTERY_NODES.find((n) => n.id === id);
          if (!node || p.masteryUnlocked.includes(id) || p.masteryPoints < 1) return;
          if (node.req && !p.masteryUnlocked.includes(node.req)) return;
          p.masteryPoints -= 1; p.masteryUnlocked.push(id);
          syncPlayerVitalsBounds(); sfx.holy(); saveHeroProfile(); renderInventoryUI();
        });
      });
      return;
    }

    // Set summary
    const sets = getSetCounts();
    const setMsgs = Object.entries(sets).filter(([, c]) => c >= 2).map(([id, c]) => `${SET_DEFS[id].name} (${c}pc)`);
    dom.setBonusSummary.textContent = setMsgs.join(' • ');

    // Paper-Doll Slots
    dom.paperDollGrid.innerHTML = '';
    for (const slot of SLOTS) {
      const item = p.equipped[slot];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gear-slot';
      btn.dataset.dropType = 'equipped';
      btn.dataset.dropKey = slot;
      if (item) btn.dataset.rarity = item.rarity;
      if (state.selectedInspect?.source === 'equipped' && state.selectedInspect.key === slot) btn.classList.add('selected');
      const pips = item && item.sockets ? `<div class="socket-pips">${Array.from({ length: item.sockets }, (_, si) => `<span class="socket-pip ${item.gems?.[si] ? 'filled-' + item.gems[si] : ''}"></span>`).join('')}</div>` : '';
      btn.innerHTML = `<span class="slot-type">${SLOT_LABELS[slot]}</span><canvas class="item-icon-canvas" width="30" height="30"></canvas><span class="slot-name ${item ? `rarity-${item.rarity}` : ''}">${item ? item.name : 'Empty'}</span>${pips}`;
      if (item) drawItemIcon(btn.querySelector('canvas'), item);
      btn.addEventListener('click', () => { if (!item) return; state.selectedInspect = { source: 'equipped', key: slot }; renderInventoryUI(); });
      attachInvDrag(btn, 'equipped', slot, item);
      dom.paperDollGrid.appendChild(btn);
    }

    // Weapon Swap Set Strip
    dom.swapSetStrip.innerHTML = `<span>Swap Set: <strong>${p.swapSet?.weapon ? p.swapSet.weapon.name : 'None'}</strong></span><button id="btnInvSwapNow" type="button" class="compact-toggle-btn">⇄ Swap</button>`;
    dom.swapSetStrip.querySelector('#btnInvSwapNow').addEventListener('click', () => { swapWeaponLoadout(); renderInventoryUI(); });

    // Backpack Grid (12 streamlined slots)
    dom.backpackGrid.innerHTML = '';
    for (let i = 0; i < MAX_BAG_SLOTS; i++) {
      const item = p.bag[i];
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'bag-cell' + (item ? '' : ' empty');
      cell.dataset.dropType = 'bag';
      cell.dataset.dropKey = String(i);
      if (item) {
        cell.dataset.rarity = item.rarity;
        if (state.selectedInspect?.source === 'bag' && state.selectedInspect.key === i) cell.classList.add('selected');
        cell.innerHTML = `<canvas class="item-icon-canvas" width="30" height="30"></canvas><span class="slot-name rarity-${item.rarity}">${item.name}</span>`;
        drawItemIcon(cell.querySelector('canvas'), item);
        cell.addEventListener('click', () => { state.selectedInspect = { source: 'bag', key: i }; renderInventoryUI(); });
        attachInvDrag(cell, 'bag', i, item);
      } else {
        cell.innerHTML = '<span class="slot-type">—</span>';
      }
      dom.backpackGrid.appendChild(cell);
    }

    renderComparePanel();
  }

  function renderComparePanel() {
    const p = state.player;
    const sel = state.selectedInspect;
    let item = null;
    if (sel?.source === 'bag') item = p.bag[sel.key];
    else if (sel?.source === 'equipped') item = p.equipped[sel.key];

    if (!item) {
      dom.itemComparePanel.innerHTML = '<div class="compare-empty">Tap or drag an item to equip, socket gems, compare stats, or salvage.</div>';
      return;
    }
    if (item.kind === 'gem') {
      dom.itemComparePanel.innerHTML = `<div class="compare-top"><span class="compare-title rarity-rare">${item.name}</span><span class="compare-sub">${item.desc}</span></div><div class="compare-empty">Drag this gem onto a socketed Weapon, Helm, or Armor to socket it!</div>`;
      return;
    }

    const equippedItem = p.equipped[item.slot];
    const statKeys = ['atk', 'crit', 'hp', 'loh', 'arm', 'spd'];
    const labels = { atk: 'Attack', crit: 'Crit %', hp: 'Max HP', loh: 'Life on Hit', arm: 'Armor', spd: 'Move %' };

    let rowsHtml = '';
    for (const k of statKeys) {
      const val = item.stats[k] || 0;
      const eqVal = equippedItem?.stats?.[k] || 0;
      if (val === 0 && (sel.source === 'equipped' || eqVal === 0)) continue;
      const diff = Math.round((val - eqVal) * 10) / 10;
      let deltaHtml = '';
      if (sel.source === 'bag') {
        deltaHtml = diff > 0 ? `<span class="delta-pos">(+${diff})</span>` : diff < 0 ? `<span class="delta-neg">(${diff})</span>` : '<span class="delta-eq">(=)</span>';
      }
      rowsHtml += `<div class="affix-row"><span>${labels[k]}: +${val}${k === 'crit' || k === 'spd' ? '%' : ''}</span>${deltaHtml}</div>`;
    }

    const rarityLabel = RARITY[item.rarity]?.label || 'Common';
    const actionsHtml = sel.source === 'bag'
      ? `<div class="compare-actions">
           <button id="btnEquipItem" class="btn-equip" type="button">Equip ${SLOT_LABELS[item.slot]}</button>
           ${item.slot === 'weapon' || item.slot === 'offhand' ? '<button id="btnPutSwap" type="button">To Swap Set</button>' : ''}
           <button id="btnSalvageItem" type="button">Salvage (+${salvageGoldValue(item)}g)</button>
         </div>`
      : `<div class="compare-actions"><button id="btnUnequipItem" type="button">Move to Bag</button></div>`;

    dom.itemComparePanel.innerHTML = `
      <div class="compare-top">
        <span class="compare-title rarity-${item.rarity}">${item.name}</span>
        <span class="compare-sub">${rarityLabel} ${SLOT_LABELS[item.slot]}${item.sockets ? ` • ${item.gems?.length || 0}/${item.sockets} Sockets` : ''}</span>
      </div>
      <div class="compare-affixes">${rowsHtml}</div>
      ${actionsHtml}
    `;

    if (sel.source === 'bag') {
      document.getElementById('btnEquipItem').addEventListener('click', () => {
        const idx = sel.key, chosen = p.bag[idx]; if (!chosen) return;
        const prev = p.equipped[chosen.slot];
        p.equipped[chosen.slot] = chosen;
        if (prev) p.bag[idx] = prev; else p.bag.splice(idx, 1);
        state.selectedInspect = { source: 'equipped', key: chosen.slot };
        syncPlayerVitalsBounds(); syncClassSkillLabels(); sfx.loot(); updateHud(); renderInventoryUI(); saveProgress();
      });
      document.getElementById('btnPutSwap')?.addEventListener('click', () => {
        const idx = sel.key, chosen = p.bag[idx]; if (!chosen) return;
        const prev = p.swapSet[chosen.slot];
        p.swapSet[chosen.slot] = chosen;
        if (prev) p.bag[idx] = prev; else p.bag.splice(idx, 1);
        state.selectedInspect = null; sfx.loot(); renderInventoryUI(); saveProgress();
      });
      document.getElementById('btnSalvageItem').addEventListener('click', () => {
        const idx = sel.key, chosen = p.bag[idx]; if (!chosen) return;
        p.gold += salvageGoldValue(chosen); p.dust += 2; p.bag.splice(idx, 1);
        state.selectedInspect = null; sfx.anvil(); updateHud(); renderInventoryUI(); saveProgress();
      });
    } else {
      document.getElementById('btnUnequipItem')?.addEventListener('click', () => {
        if (p.bag.length >= MAX_BAG_SLOTS) { showToast('Satchel full!'); return; }
        const slot = sel.key;
        p.bag.push(p.equipped[slot]); p.equipped[slot] = null;
        state.selectedInspect = null; syncPlayerVitalsBounds(); updateHud(); renderInventoryUI(); saveProgress();
      });
    }
    void formatStatsLine;
  }

  function salvageGoldValue(item) {
    const base = item.rarity === 'legendary' ? 45 : item.rarity === 'set' ? 36 : item.rarity === 'rare' ? 22 : item.rarity === 'magic' ? 12 : 6;
    return base + (state.floor - 1) * 4;
  }

  // =========================================================================
  // CANVAS RESIZE, MAIN LOOP & PWA REGISTRATION
  // =========================================================================
  function resizeCanvas() {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuildVignetteCache(w, h);
  }

  let lastFrame = performance.now();
  let hudTick = 0;

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
    lastFrame = now;

    if (state.screen === 'TOWN' || state.screen === 'DUNGEON') {
      if (!state.draftOpen && !dom.skillTreeModal?.open) {
        updatePlayer(dt);
        updatePets(dt);
        updateMinions(dt);
        updateMonsters(dt);
        updateEffectsAndLoot(dt);
      }
      renderIsometricWorld(now);

      if (window.CryptCoop && window.CryptCoop.active) {
        window.CryptCoop.broadcastState({
          name: state.heroName, cls: state.heroClass, level: state.player.level,
          x: state.player.x, y: state.player.y, hp: state.player.hp, maxHp: state.player.maxHp, downed: state.player.dead
        });
      }

      hudTick += dt;
      if (hudTick >= 0.08) {
        hudTick = 0;
        syncHudDom();
        renderMinimap();
      }
    }

    requestAnimationFrame(frame);
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  function boot() {
    buildTextureAtlas();
    loadProgress();
    setupInputs();
    if (window.CryptCoop) {
      window.CryptCoop.onRoomJoined = (pkt) => {
        if (pkt && pkt.seed) enterDungeonFloor(pkt.seed, pkt.floor || 1, { biome: pkt.biome });
      };
      window.CryptCoop.onBossHit = (dmg) => {
        const boss = state.monsters.find((m) => m.type === 'boss');
        if (boss) damageMonster(boss, dmg, 0, 0, false, 4);
      };
      window.CryptCoop.onRevive = () => {
        if (state.player.dead) respawnAtWaypoint(false);
      };
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setScreen('MAIN_MENU');
    registerServiceWorker();
    requestAnimationFrame(frame);
  }

  boot();
})();
