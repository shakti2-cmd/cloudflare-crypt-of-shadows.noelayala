(() => {
  'use strict';

  // =========================================================================
  // CONSTANTS & CONFIG
  // =========================================================================
  const VERSION = '0.2.0';
  const SAVE_KEY = 'crypt_arpg_v020_save';
  const LEGACY_SAVE_KEY = 'crypt_arpg_v010_save';
  const STASH_KEY = 'crypt_arpg_stash_v020';
  const PREFS_KEY = 'crypt_arpg_prefs_v020';
  const MAP_W = 42;
  const MAP_H = 42;
  const TILE_W = 64;
  const TILE_H = 32;
  const WALL_H = 52;
  const MAX_BAG_SLOTS = 20;
  const MAX_STASH_SLOTS = 24;

  const TILE = {
    VOID: 0,
    FLOOR: 1,
    WALL: 2,
    SANCTUM: 3,
    BOSS_FLOOR: 4
  };

  const RARITY = {
    common:    { label: 'Common',    color: '#cbd5e1', beam: 'rgba(203, 213, 225, 0.25)', bg: 'rgba(15, 23, 42, 0.88)' },
    magic:     { label: 'Magic',     color: '#60a5fa', beam: 'rgba(96, 165, 250, 0.52)',  bg: 'rgba(15, 28, 56, 0.90)' },
    rare:      { label: 'Rare',      color: '#facc15', beam: 'rgba(250, 204, 21, 0.62)',  bg: 'rgba(42, 30, 8, 0.92)' },
    legendary: { label: 'Legendary', color: '#fb923c', beam: 'rgba(251, 146, 60, 0.78)',  bg: 'rgba(54, 21, 8, 0.94)' }
  };

  const SLOTS = ['weapon', 'helm', 'armor', 'ring'];
  const SLOT_LABELS = { weapon: 'Weapon', helm: 'Helm', armor: 'Armor', ring: 'Ring' };
  const LOOT_FILTER_MODES = ['all', 'magic', 'rare'];
  const LOOT_FILTER_LABELS = { all: 'Loot: All', magic: 'Loot: Magic+', rare: 'Loot: Rare+' };

  const HERO_CLASSES = {
    paladin: {
      id: 'paladin',
      name: 'Paladin',
      role: 'Armored Crusader',
      stats: { str: 14, dex: 9, int: 8, vit: 15 },
      baseHp: 115,
      hpPerLvl: 26,
      baseMp: 75,
      mpPerLvl: 8,
      baseAtk: 11,
      baseArm: 4,
      baseCrit: 6,
      speed: 4.65,
      cloak: '#7f1d1d',
      armorColor: '#94a3b8',
      trimColor: '#facc15',
      basicName: 'SLASH',
      skills: {
        1: { name: 'Whirlwind Cleave', mana: 15, cd: 4.5, elId: 'btnSkill1' },
        2: { name: 'Fireball',         mana: 20, cd: 3.5, elId: 'btnSkill2' },
        3: { name: 'Holy Nova',        mana: 28, cd: 7.0, elId: 'btnSkill3' }
      }
    },
    rogue: {
      id: 'rogue',
      name: 'Shadow Rogue',
      role: 'Agile Skirmisher',
      stats: { str: 9, dex: 16, int: 9, vit: 11 },
      baseHp: 95,
      hpPerLvl: 20,
      baseMp: 85,
      mpPerLvl: 9,
      baseAtk: 13,
      baseArm: 2,
      baseCrit: 12,
      speed: 5.25,
      cloak: '#1e293b',
      armorColor: '#334155',
      trimColor: '#4ade80',
      basicName: 'TWIN',
      skills: {
        1: { name: 'Multishot',   mana: 14, cd: 3.2, elId: 'btnSkill1' },
        2: { name: 'Poison Trap', mana: 18, cd: 5.5, elId: 'btnSkill2' },
        3: { name: 'Shadow Dash', mana: 20, cd: 4.5, elId: 'btnSkill3' }
      }
    },
    sorcerer: {
      id: 'sorcerer',
      name: 'Blood Sorcerer',
      role: 'Arcane Warlock',
      stats: { str: 7, dex: 10, int: 17, vit: 11 },
      baseHp: 90,
      hpPerLvl: 19,
      baseMp: 115,
      mpPerLvl: 13,
      baseAtk: 14,
      baseArm: 2,
      baseCrit: 8,
      speed: 4.75,
      cloak: '#4c1d95',
      armorColor: '#312e81',
      trimColor: '#c084fc',
      basicName: 'BOLT',
      skills: {
        1: { name: 'Bone Nova',  mana: 16, cd: 4.0, elId: 'btnSkill1' },
        2: { name: 'Frost Orb',  mana: 22, cd: 3.8, elId: 'btnSkill2' },
        3: { name: 'Soul Drain', mana: 26, cd: 6.5, elId: 'btnSkill3' }
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
    savedHeroCard: document.getElementById('savedHeroCard'),
    savedHeroName: document.getElementById('savedHeroName'),
    savedHeroClass: document.getElementById('savedHeroClass'),
    savedHeroMeta: document.getElementById('savedHeroMeta'),
    btnContinueTown: document.getElementById('btnContinueTown'),
    btnOpenCharCreate: document.getElementById('btnOpenCharCreate'),
    btnAudioToggle: document.getElementById('btnAudioToggle'),
    charCreateScreen: document.getElementById('charCreateScreen'),
    heroNameInput: document.getElementById('heroNameInput'),
    btnRandomName: document.getElementById('btnRandomName'),
    classSelectGrid: document.getElementById('classSelectGrid'),
    btnCharCreateBack: document.getElementById('btnCharCreateBack'),
    btnForgeHero: document.getElementById('btnForgeHero'),
    hudTopLeft: document.getElementById('hudTopLeft'),
    hudTopRight: document.getElementById('hudTopRight'),
    touchControls: document.getElementById('touchControls'),
    combatCluster: document.getElementById('combatCluster'),
    townQuickBar: document.getElementById('townQuickBar'),
    btnTownForge: document.getElementById('btnTownForge'),
    btnTownStash: document.getElementById('btnTownStash'),
    btnTownApothecary: document.getElementById('btnTownApothecary'),
    btnTownWaypoint: document.getElementById('btnTownWaypoint'),
    btnTownMenu: document.getElementById('btnTownMenu'),
    townNpcDrawer: document.getElementById('townNpcDrawer'),
    townNpcTitle: document.getElementById('townNpcTitle'),
    townNpcSubtitle: document.getElementById('townNpcSubtitle'),
    townNpcGold: document.getElementById('townNpcGold'),
    btnCloseTownNpc: document.getElementById('btnCloseTownNpc'),
    townNpcBody: document.getElementById('townNpcBody'),
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
    bossBar: document.getElementById('bossBar'),
    bossName: document.getElementById('bossName'),
    bossHpText: document.getElementById('bossHpText'),
    bossHpFill: document.getElementById('bossHpFill'),
    toastBanner: document.getElementById('toastBanner'),
    btnInventory: document.getElementById('btnInventory'),
    lootCountBadge: document.getElementById('lootCountBadge'),
    btnNewFloor: document.getElementById('btnNewFloor'),
    newFloorBtnLabel: document.getElementById('newFloorBtnLabel'),
    btnTownPortal: document.getElementById('btnTownPortal'),
    btnLootFilter: document.getElementById('btnLootFilter'),
    lootFilterLabel: document.getElementById('lootFilterLabel'),
    btnHudAudio: document.getElementById('btnHudAudio'),
    hudAudioLabel: document.getElementById('hudAudioLabel'),
    joystickZone: document.getElementById('joystickZone'),
    joystickKnob: document.getElementById('joystickKnob'),
    btnAttack: document.getElementById('btnAttack'),
    attackLabel: document.getElementById('attackLabel'),
    btnSkill1: document.getElementById('btnSkill1'),
    btnSkill2: document.getElementById('btnSkill2'),
    btnSkill3: document.getElementById('btnSkill3'),
    skill1Cost: document.getElementById('skill1Cost'),
    skill2Cost: document.getElementById('skill2Cost'),
    skill3Cost: document.getElementById('skill3Cost'),
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
    invCapacity: document.getElementById('invCapacity'),
    btnCloseInventory: document.getElementById('btnCloseInventory'),
    heroStatsStrip: document.getElementById('heroStatsStrip'),
    equippedSlots: document.getElementById('equippedSlots'),
    itemComparePanel: document.getElementById('itemComparePanel'),
    backpackGrid: document.getElementById('backpackGrid')
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

  function buildTextureAtlas() {
    atlas.floors = [
      buildFloorSprite(0, 'normal'),
      buildFloorSprite(1, 'normal'),
      buildFloorSprite(2, 'normal')
    ];
    atlas.sanctum = buildFloorSprite(0, 'sanctum');
    atlas.bossFloor = buildFloorSprite(0, 'boss');
    atlas.wall = buildWallSprite();
    atlas.urn = buildPropSprite('urn');
    atlas.barrel = buildPropSprite('barrel');
    atlas.torchGlow = buildGlowSprite('rgba(249, 115, 22, 0.26)', 'rgba(217, 119, 6, 0.10)', 74);
    atlas.arcaneGlow = buildGlowSprite('rgba(59, 130, 246, 0.28)', 'rgba(37, 99, 235, 0.09)', 74);
  }

  // =========================================================================
  // HERO, GEAR & PERSISTENCE STATE
  // =========================================================================
  function createStarterGear(classId = 'paladin') {
    if (classId === 'rogue') {
      return {
        weapon: { id: 'starter_twin', name: 'Shadowfang Daggers', slot: 'weapon', rarity: 'common', stats: { atk: 11, crit: 8 } },
        helm:   { id: 'starter_hood', name: 'Nightstalker Cowl',  slot: 'helm',   rarity: 'common', stats: { hp: 14, arm: 2 } },
        armor:  { id: 'starter_coat', name: 'Ravenhide Jerkin',   slot: 'armor',  rarity: 'common', stats: { hp: 22, arm: 4 } },
        ring: null
      };
    }
    if (classId === 'sorcerer') {
      return {
        weapon: { id: 'starter_staff', name: 'Bonechannel Rod',   slot: 'weapon', rarity: 'common', stats: { atk: 13, crit: 5 } },
        helm:   { id: 'starter_circ',  name: 'Hexwoven Crown',    slot: 'helm',   rarity: 'common', stats: { hp: 12, arm: 2 } },
        armor:  { id: 'starter_robe',  name: 'Bloodsilk Vestment',slot: 'armor',  rarity: 'common', stats: { hp: 20, arm: 3 } },
        ring: null
      };
    }
    return {
      weapon: { id: 'starter_blade', name: 'Iron Broadsword',   slot: 'weapon', rarity: 'common', stats: { atk: 12, crit: 4 } },
      helm:   { id: 'starter_helm',  name: 'Tempered Barbute',  slot: 'helm',   rarity: 'common', stats: { hp: 20, arm: 3 } },
      armor:  { id: 'starter_armor', name: 'Cryptguard Cuirass',slot: 'armor',  rarity: 'common', stats: { hp: 30, arm: 6 } },
      ring: null
    };
  }

  const state = {
    screen: 'MAIN_MENU', // 'MAIN_MENU' | 'CHAR_CREATE' | 'TOWN' | 'DUNGEON'
    mode: 'TOWN',        // 'TOWN' | 'DUNGEON'
    selectedCreateClass: 'paladin',
    heroName: 'Aldric',
    heroClass: 'paladin',
    highestFloor: 1,
    floor: 1,
    seed: 1047,
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
    props: [],
    townNpcs: [],
    monsters: [],
    lootDrops: [],
    projectiles: [],
    poisonClouds: [],
    particles: [],
    floatTexts: [],
    slashArcs: [],
    novaWaves: [],
    camera: { x: 0, y: 0, shake: 0 },
    player: {
      x: 5,
      y: 5,
      vx: 0,
      vy: 0,
      facingX: 1,
      facingY: 0,
      hp: 150,
      maxHp: 150,
      mp: 80,
      maxMp: 80,
      level: 1,
      xp: 0,
      nextXp: 100,
      gold: 0,
      potions: 3,
      manaElixirs: 1,
      walkPhase: 0,
      attackAnim: 0,
      castAnim: 0,
      attackCd: 0,
      potionCd: 0,
      chillTimer: 0,
      skillCds: { 1: 0, 2: 0, 3: 0 },
      hitFlash: 0,
      dead: false,
      kills: 0,
      equipped: createStarterGear('paladin'),
      bag: []
    },
    activeBuff: null, // { id, label, crit, speed, gold }
    stash: [],
    blacksmithStock: [],
    lootFilter: 'all',
    selectedInspect: null,
    pendingLootTarget: null,
    toastTimer: 0,
    lastSaveAt: 0,
    lastFogTileX: -999,
    lastFogTileY: -999,
    fogDirty: true,
    hudCache: {}
  };

  function getHeroStats() {
    const p = state.player;
    const cls = HERO_CLASSES[state.heroClass] || HERO_CLASSES.paladin;
    const totals = {
      atk: cls.baseAtk + (p.level - 1) * 4,
      crit: cls.baseCrit + (p.level - 1) * 0.6,
      maxHp: cls.baseHp + (p.level - 1) * cls.hpPerLvl,
      maxMp: cls.baseMp + (p.level - 1) * cls.mpPerLvl,
      loh: 0,
      arm: cls.baseArm + (p.level - 1) * 1.5,
      speed: cls.speed,
      goldBonus: 1
    };
    for (const slot of SLOTS) {
      const item = p.equipped[slot];
      if (!item || !item.stats) continue;
      totals.atk += item.stats.atk || 0;
      totals.crit += item.stats.crit || 0;
      totals.maxHp += item.stats.hp || 0;
      totals.loh += item.stats.loh || 0;
      totals.arm += item.stats.arm || 0;
    }
    if (state.activeBuff) {
      if (state.activeBuff.crit) totals.crit += state.activeBuff.crit;
      if (state.activeBuff.speed) totals.speed *= (1 + state.activeBuff.speed);
      if (state.activeBuff.gold) totals.goldBonus += state.activeBuff.gold;
    }
    if (p.chillTimer > 0) totals.speed *= 0.7;
    totals.crit = Math.min(75, Math.round(totals.crit * 10) / 10);
    return totals;
  }

  function syncPlayerVitalsBounds() {
    const st = getHeroStats();
    state.player.maxHp = st.maxHp;
    state.player.maxMp = st.maxMp;
    state.player.hp = Math.min(state.player.hp, state.player.maxHp);
    state.player.mp = Math.min(state.player.mp, state.player.maxMp);
  }

  function saveHeroProfile() {
    try {
      const p = state.player;
      const payload = {
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
        potions: p.potions,
        manaElixirs: p.manaElixirs,
        kills: p.kills,
        equipped: p.equipped,
        bag: p.bag,
        activeBuff: state.activeBuff
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (_) {}
  }
  const saveProgress = saveHeroProfile;

  function saveStash() {
    try {
      localStorage.setItem(STASH_KEY, JSON.stringify(state.stash.slice(0, MAX_STASH_SLOTS)));
    } catch (_) {}
  }

  function loadStash() {
    try {
      const raw = localStorage.getItem(STASH_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) state.stash = arr.slice(0, MAX_STASH_SLOTS);
      }
    } catch (_) {}
  }

  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ muted: sfx.muted, lootFilter: state.lootFilter }));
    } catch (_) {}
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const pr = JSON.parse(raw);
      if (typeof pr.muted === 'boolean') sfx.muted = pr.muted;
      if (LOOT_FILTER_MODES.includes(pr.lootFilter)) state.lootFilter = pr.lootFilter;
    } catch (_) {}
  }

  function loadProgress() {
    let hasSave = false;
    try {
      const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(LEGACY_SAVE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          hasSave = true;
          const p = state.player;
          if (typeof data.heroName === 'string' && data.heroName.trim()) state.heroName = data.heroName.trim();
          if (HERO_CLASSES[data.heroClass]) state.heroClass = data.heroClass;
          if (Number.isFinite(data.floor) && data.floor >= 1) state.floor = data.floor;
          if (Number.isFinite(data.highestFloor) && data.highestFloor >= 1) {
            state.highestFloor = Math.max(state.floor, data.highestFloor);
          } else {
            state.highestFloor = state.floor;
          }
          if (Number.isFinite(data.seed)) state.seed = data.seed;
          if (Number.isFinite(data.level) && data.level >= 1) p.level = data.level;
          if (Number.isFinite(data.xp)) p.xp = data.xp;
          if (Number.isFinite(data.nextXp)) p.nextXp = data.nextXp;
          if (Number.isFinite(data.gold)) p.gold = data.gold;
          if (Number.isFinite(data.potions)) p.potions = data.potions;
          if (Number.isFinite(data.manaElixirs)) p.manaElixirs = data.manaElixirs;
          if (Number.isFinite(data.kills)) p.kills = data.kills;
          if (data.equipped) p.equipped = Object.assign(createStarterGear(state.heroClass), data.equipped);
          if (Array.isArray(data.bag)) p.bag = data.bag.slice(0, MAX_BAG_SLOTS);
          if (data.activeBuff && typeof data.activeBuff === 'object') state.activeBuff = data.activeBuff;
        }
      }
    } catch (_) {}
    loadStash();
    loadPrefs();
    syncPlayerVitalsBounds();
    state.player.hp = state.player.maxHp;
    state.player.mp = state.player.maxMp;
    return hasSave;
  }

  // =========================================================================
  // PROCEDURAL DUNGEON GENERATOR
  // =========================================================================
  function generateDungeon(seed, floor) {
    state.seed = (seed >>> 0) || 1047;
    state.floor = Math.max(1, floor | 0);
    const rng = mulberry32(state.seed ^ (state.floor * 7919));
    state.rng = rng;

    state.grid = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W));
    state.tileVariant = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W));
    state.explored = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W));
    state.rooms = [];
    state.torches = [];
    state.gates = [];
    state.props = [];
    state.monsters = [];
    state.lootDrops = [];
    state.projectiles = [];
    state.particles = [];
    state.floatTexts = [];
    state.slashArcs = [];
    state.novaWaves = [];
    state.pendingLootTarget = null;

    // 1. Place 8-10 non-overlapping rectangular chambers
    const targetRooms = randInt(rng, 8, 10);
    for (let attempt = 0; attempt < 160 && state.rooms.length < targetRooms; attempt++) {
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
          x: rx,
          y: ry,
          w: rw,
          h: rh,
          cx: Math.floor(rx + rw * 0.5),
          cy: Math.floor(ry + rh * 0.5)
        });
      }
    }

    // Fallback safety if RNG packed unusually
    if (state.rooms.length < 3) {
      state.rooms = [
        { id: 0, x: 4, y: 4, w: 6, h: 6, cx: 7, cy: 7 },
        { id: 1, x: 16, y: 14, w: 7, h: 7, cx: 19, cy: 17 },
        { id: 2, x: 28, y: 26, w: 7, h: 7, cx: 31, cy: 29 }
      ];
    }

    // Carve rooms
    for (const r of state.rooms) {
      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
          state.grid[y][x] = TILE.FLOOR;
          state.tileVariant[y][x] = randInt(rng, 0, 2);
        }
      }
    }

    // 2. Connect rooms with Prim MST + 2 loop corridors (2-tile wide)
    const connected = new Set([0]);
    const edges = [];
    while (connected.size < state.rooms.length) {
      let bestA = 0;
      let bestB = 0;
      let bestD = Infinity;
      for (const a of connected) {
        for (let b = 0; b < state.rooms.length; b++) {
          if (connected.has(b)) continue;
          const d = dist(state.rooms[a].cx, state.rooms[a].cy, state.rooms[b].cx, state.rooms[b].cy);
          if (d < bestD) {
            bestD = d;
            bestA = a;
            bestB = b;
          }
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
      let x = rA.cx;
      let y = rA.cy;
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

    for (const [a, b] of edges) {
      carveCorridor(state.rooms[a], state.rooms[b]);
    }

    // 3. Wrap all walkable tiles with STONE WALL borders
    for (let y = 1; y < MAP_H - 1; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        if (state.grid[y][x] !== TILE.VOID) continue;
        let touchesFloor = false;
        for (let dy = -1; dy <= 1 && !touchesFloor; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const t = state.grid[y + dy][x + dx];
            if (t === TILE.FLOOR || t === TILE.SANCTUM || t === TILE.BOSS_FLOOR) {
              touchesFloor = true;
              break;
            }
          }
        }
        if (touchesFloor) state.grid[y][x] = TILE.WALL;
      }
    }

    // 4. Identify Spawn Sanctum (Room 0) and Boss Chamber (furthest from Room 0)
    const spawnRoom = state.rooms[0];
    let bossRoom = state.rooms[state.rooms.length - 1];
    let maxRoomDist = -1;
    for (let i = 1; i < state.rooms.length; i++) {
      const r = state.rooms[i];
      const d = dist(spawnRoom.cx, spawnRoom.cy, r.cx, r.cy);
      if (d > maxRoomDist) {
        maxRoomDist = d;
        bossRoom = r;
      }
    }

    for (let y = spawnRoom.y; y < spawnRoom.y + spawnRoom.h; y++) {
      for (let x = spawnRoom.x; x < spawnRoom.x + spawnRoom.w; x++) {
        state.grid[y][x] = TILE.SANCTUM;
      }
    }
    for (let y = bossRoom.y; y < bossRoom.y + bossRoom.h; y++) {
      for (let x = bossRoom.x; x < bossRoom.x + bossRoom.w; x++) {
        state.grid[y][x] = TILE.BOSS_FLOOR;
      }
    }

    state.waypoint = { x: spawnRoom.cx + 0.5, y: spawnRoom.cy + 0.5 };
    state.stairs = { x: bossRoom.cx + 0.5, y: bossRoom.cy + 0.5, unlocked: false };

    // Spawn player adjacent to Waypoint
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

    // 5. Place Iron Gates in narrow corridor pinch points
    for (let i = 0; i < corridorTiles.length && state.gates.length < 4; i += 7) {
      const ct = corridorTiles[i];
      if (dist(ct.x, ct.y, state.waypoint.x, state.waypoint.y) < 5) continue;
      const horizPinch = state.grid[ct.y - 1]?.[ct.x] === TILE.WALL && state.grid[ct.y + 1]?.[ct.x] === TILE.WALL;
      const vertPinch = state.grid[ct.y]?.[ct.x - 1] === TILE.WALL && state.grid[ct.y]?.[ct.x + 1] === TILE.WALL;
      if ((horizPinch || vertPinch) && state.gates.every((g) => dist(g.x, g.y, ct.x + 0.5, ct.y + 0.5) > 5)) {
        state.gates.push({
          x: ct.x + 0.5,
          y: ct.y + 0.5,
          axis: horizPinch ? 'v' : 'h',
          open: 0,
          isOpen: false
        });
      }
    }

    // 6. Place Flickering Wall Torches along chamber borders
    for (const r of state.rooms) {
      const corners = [
        { x: r.x + 0.5, y: r.y + 0.5 },
        { x: r.x + r.w - 0.5, y: r.y + 0.5 },
        { x: r.x + 0.5, y: r.y + r.h - 0.5 },
        { x: r.x + r.w - 0.5, y: r.y + r.h - 0.5 }
      ];
      for (const c of corners) {
        if (rng() > 0.25) {
          state.torches.push({
            x: c.x,
            y: c.y,
            phase: rng() * Math.PI * 2,
            isArcane: r === spawnRoom
          });
        }
      }
    }

    // 7. Place Destructible Urns & Barrels
    for (const r of state.rooms) {
      const propCount = randInt(rng, 2, 4);
      for (let i = 0; i < propCount; i++) {
        const px = r.x + 0.7 + rng() * Math.max(1, r.w - 1.4);
        const py = r.y + 0.7 + rng() * Math.max(1, r.h - 1.4);
        if (dist(px, py, state.waypoint.x, state.waypoint.y) < 1.8) continue;
        if (dist(px, py, state.stairs.x, state.stairs.y) < 1.8) continue;
        if (dist(px, py, state.player.x, state.player.y) < 1.5) continue;
        state.props.push({
          x: px,
          y: py,
          kind: rng() > 0.45 ? 'urn' : 'barrel',
          hp: 1,
          broken: false
        });
      }
    }

    // 8. Spawn Dungeon Monsters (Skeletal Warriors, Champion Ghouls with Affixes, Boss / Floor Guardian)
    const floorMult = 1 + (state.floor - 1) * 0.28;
    const isMilestone = state.floor % 3 === 0;
    for (const r of state.rooms) {
      if (r === spawnRoom) continue;

      if (r === bossRoom) {
        const boss = createMonster('boss', bossRoom.cx + 0.2, bossRoom.cy - 0.9, floorMult, isMilestone, rng);
        state.monsters.push(boss);
        // Two skeletal honor guards
        state.monsters.push(createMonster('skeleton', bossRoom.x + 1.2, bossRoom.y + 1.2, floorMult, false, rng));
        state.monsters.push(createMonster('skeleton', bossRoom.x + bossRoom.w - 1.2, bossRoom.y + bossRoom.h - 1.2, floorMult, false, rng));
        continue;
      }

      const skelCount = randInt(rng, 2, 4);
      for (let i = 0; i < skelCount; i++) {
        const mx = r.x + 1 + rng() * Math.max(1, r.w - 2);
        const my = r.y + 1 + rng() * Math.max(1, r.h - 2);
        state.monsters.push(createMonster('skeleton', mx, my, floorMult, false, rng));
      }

      if (rng() > 0.35 || r.id % 2 === 1) {
        const gx = r.cx + (rng() - 0.5) * 1.6;
        const gy = r.cy + (rng() - 0.5) * 1.6;
        state.monsters.push(createMonster('ghoul', gx, gy, floorMult, false, rng));
      }
    }

    state.mode = 'DUNGEON';
    state.townNpcs = [];
    state.poisonClouds = [];
    state.waypointArmed = false;
    state.lastFogTileX = -999;
    state.lastFogTileY = -999;
    updateFogOfWar(true);
    updateHud(true);
    showToast(isMilestone ? `Floor ${state.floor} • Guardian Lair (#${state.seed})` : `Floor ${state.floor} • Crypt (#${state.seed})`);
  }

  function generateTown() {
    state.mode = 'TOWN';
    state.grid = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W));
    state.tileVariant = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W));
    state.explored = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W));
    state.rooms = [];
    state.torches = [];
    state.gates = [];
    state.props = [];
    state.monsters = [];
    state.lootDrops = [];
    state.projectiles = [];
    state.poisonClouds = [];
    state.particles = [];
    state.floatTexts = [];
    state.slashArcs = [];
    state.novaWaves = [];
    state.pendingLootTarget = null;
    state.stairs = { x: 0, y: 0, unlocked: false };

    const minX = 11, maxX = 30, minY = 11, maxY = 30;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const isBorder = x === minX || x === maxX || y === minY || y === maxY;
        if (isBorder) {
          state.grid[y][x] = TILE.WALL;
        } else {
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

    // Warm Town Lanterns & Central Campfire Glow
    const lanternCoords = [
      { x: 13.5, y: 13.5 }, { x: 27.5, y: 13.5 },
      { x: 13.5, y: 27.5 }, { x: 27.5, y: 27.5 },
      { x: 18.2, y: 18.2 }, { x: 22.8, y: 18.2 },
      { x: 18.2, y: 22.8 }, { x: 22.8, y: 22.8 }
    ];
    for (let i = 0; i < lanternCoords.length; i++) {
      state.torches.push({ x: lanternCoords[i].x, y: lanternCoords[i].y, phase: i * 0.9, isArcane: false });
    }
    state.torches.push({ x: 20.5, y: 20.5, phase: 0.4, isArcane: true });

    state.townNpcs = [
      { id: 'blacksmith', label: 'Blacksmith Forge', short: 'FORGE', x: 15.5, y: 16.5, color: '#f97316' },
      { id: 'stash',      label: 'Hero Stash',       short: 'STASH', x: 25.5, y: 16.5, color: '#facc15' },
      { id: 'apothecary', label: 'Apothecary',       short: 'HEALER',x: 15.5, y: 25.5, color: '#4ade80' },
      { id: 'waypoint',   label: 'Waypoint Portal',  short: 'PORTAL',x: 20.5, y: 20.5, color: '#60a5fa' }
    ];

    state.fogDirty = true;
    state.lastFogTileX = Math.floor(state.player.x);
    state.lastFogTileY = Math.floor(state.player.y);
    refreshBlacksmithStock();
    updateHud(true);
    showToast('Shadowhaven Sanctuary — Vitals Restored');
  }

  function createMonster(type, x, y, floorMult, isGuardian = false, rng = Math.random) {
    const specs = {
      skeleton: {
        name: 'Skeletal Warrior',
        maxHp: Math.round(48 * floorMult),
        atk: Math.round(9 * floorMult),
        speed: 2.35,
        range: 1.05,
        aggro: 7.5,
        cd: 1.15,
        xp: Math.round(28 * floorMult),
        radius: 0.34,
        tier: 'normal'
      },
      ghoul: {
        name: 'Champion Ghoul',
        maxHp: Math.round(105 * floorMult),
        atk: Math.round(15 * floorMult),
        speed: 2.95,
        range: 1.15,
        aggro: 8.5,
        cd: 0.95,
        xp: Math.round(68 * floorMult),
        radius: 0.38,
        tier: 'elite'
      },
      boss: {
        name: 'Horned Demon Brute',
        maxHp: Math.round(320 * floorMult),
        atk: Math.round(24 * floorMult),
        speed: 2.1,
        range: 1.45,
        aggro: 9.5,
        cd: 1.45,
        xp: Math.round(240 * floorMult),
        radius: 0.52,
        tier: 'boss'
      }
    };
    const s = specs[type];
    const affixKeys = Object.keys(ELITE_AFFIXES);
    const affixes = [];
    if (type === 'ghoul') {
      affixes.push(affixKeys[Math.floor(rng() * affixKeys.length)]);
    } else if (type === 'boss') {
      const count = isGuardian ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const pick = affixKeys[Math.floor(rng() * affixKeys.length)];
        if (!affixes.includes(pick)) affixes.push(pick);
      }
    }

    let name = s.name;
    let maxHp = s.maxHp;
    let speed = s.speed;
    let cd = s.cd;
    let xp = s.xp;
    if (isGuardian && type === 'boss') {
      const gIdx = Math.floor((state.floor / 3 - 1) % FLOOR_GUARDIANS.length);
      name = FLOOR_GUARDIANS[Math.max(0, gIdx)];
      maxHp = Math.round(maxHp * 1.35);
      xp = Math.round(xp * 1.6);
    }
    if (affixes.includes('fast')) {
      speed *= 1.35;
      cd *= 0.78;
    }

    return {
      id: Math.random().toString(36).slice(2, 9),
      type,
      name,
      affixes,
      isGuardian: Boolean(isGuardian && type === 'boss'),
      x,
      y,
      hp: maxHp,
      maxHp,
      atk: s.atk,
      speed,
      range: s.range,
      aggro: s.aggro,
      atkCdMax: cd,
      atkCd: 0.3,
      xp,
      radius: s.radius,
      tier: s.tier,
      facingX: 0,
      facingY: 1,
      walkPhase: rng() * Math.PI * 2,
      hitFlash: 0,
      stunTimer: 0,
      windupTimer: 0,
      slamTelegraph: 0,
      vx: 0,
      vy: 0,
      engaged: false
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
    weapon: {
      magic: ['Rune-Etched Gladius', 'Cryptsteel Saber', 'Sanctified Edge'],
      rare: ['Sunfire Claymore', 'Soulreaver Blade', 'Oathkeeper Greatsword'],
      legendary: ['Dawnbreaker Executioner', 'Ashen Verdict']
    },
    helm: {
      magic: ['Ironwarden Visor', 'Vigilant Greathelm', 'Ashbone Crown'],
      rare: ['Seraphic Sallet', 'Dreadplate Bascinet', 'Cryptlord Casque'],
      legendary: ['Crown of the Undying Sun', 'Obsidian Halo']
    },
    armor: {
      magic: ['Tempered Brigandine', 'Gloomplate Mail', 'Warded Hauberk'],
      rare: ['Cathedral Aegis', 'Bloodforged Cuirass', 'Sentinel Plate'],
      legendary: ['Archangel Bastion', 'Shroud of St. Valen']
    },
    ring: {
      magic: ['Silver Signet', 'Sapphire Band', 'Oath Ring'],
      rare: ['Crimson Seal', 'Wraithbone Loop', 'Sunstone Band'],
      legendary: ['Sovereign Signet of Light', 'Hellfire Coil']
    }
  };

  function generateItem(rarity) {
    const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
    const names = ITEM_NAMES[slot][rarity] || ITEM_NAMES[slot].magic;
    const name = names[Math.floor(Math.random() * names.length)];
    const scale = 1 + (state.floor - 1) * 0.26;
    const mult = rarity === 'legendary' ? 2.2 : rarity === 'rare' ? 1.55 : 1.1;

    const stats = {};
    if (slot === 'weapon') {
      stats.atk = Math.round((8 + Math.random() * 8) * scale * mult);
      stats.crit = Math.round((2 + Math.random() * 4) * mult * 10) / 10;
      if (rarity !== 'magic') stats.loh = Math.round((2 + Math.random() * 4) * scale * mult);
    } else if (slot === 'helm') {
      stats.hp = Math.round((22 + Math.random() * 18) * scale * mult);
      stats.arm = Math.round((3 + Math.random() * 4) * scale * mult);
      if (rarity !== 'magic') stats.crit = Math.round((1.5 + Math.random() * 3) * mult * 10) / 10;
    } else if (slot === 'armor') {
      stats.hp = Math.round((32 + Math.random() * 24) * scale * mult);
      stats.arm = Math.round((6 + Math.random() * 6) * scale * mult);
      if (rarity === 'legendary') stats.loh = Math.round((4 + Math.random() * 4) * scale);
    } else {
      stats.atk = Math.round((4 + Math.random() * 6) * scale * mult);
      stats.crit = Math.round((3 + Math.random() * 5) * mult * 10) / 10;
      if (rarity !== 'magic') stats.loh = Math.round((3 + Math.random() * 4) * scale * mult);
    }

    return {
      id: 'itm_' + Math.random().toString(36).slice(2, 10),
      name,
      slot,
      rarity,
      stats
    };
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
      state.lootDrops.push(Object.assign({
        x: wx,
        y: wy,
        destX,
        destY,
        z: 18,
        vz: 95,
        age: 0,
        screenRect: null
      }, drop));
    };

    if (sourceTier === 'guardian') {
      const goldMult = getHeroStats().goldBonus;
      pushDrop({ kind: 'gold', amount: Math.round((85 + Math.random() * 45) * state.floor * goldMult), label: 'Guardian Chest' });
      pushDrop({ kind: 'potion', amount: 2, label: 'Crimson Vials' });
      const leg = generateItem('legendary');
      pushDrop({ kind: 'gear', item: leg, rarity: 'legendary', label: leg.name });
      const rareItem = generateItem('rare');
      pushDrop({ kind: 'gear', item: rareItem, rarity: 'rare', label: rareItem.name, destX: wx + 0.5, destY: wy - 0.35 });
      sfx.legendary();
      return;
    }

    if (sourceTier === 'boss') {
      const goldMult = getHeroStats().goldBonus;
      pushDrop({ kind: 'gold', amount: Math.round((45 + Math.random() * 35) * state.floor * goldMult), label: 'Boss Hoard' });
      pushDrop({ kind: 'potion', amount: 1, label: 'Crimson Vial' });
      const gearRarity = Math.random() < 0.45 ? 'legendary' : 'rare';
      const item = generateItem(gearRarity);
      pushDrop({ kind: 'gear', item, rarity: gearRarity, label: item.name });
      if (gearRarity === 'legendary') sfx.legendary();
      const bonus = generateItem(Math.random() < 0.5 ? 'rare' : 'magic');
      pushDrop({
        kind: 'gear',
        item: bonus,
        rarity: bonus.rarity,
        label: bonus.name,
        destX: wx + 0.4,
        destY: wy - 0.3
      });
      return;
    }

    const goldMult = getHeroStats().goldBonus;
    if (sourceTier === 'elite') {
      pushDrop({ kind: 'gold', amount: Math.round((18 + Math.random() * 18) * state.floor * goldMult), label: 'Gold Coins' });
      const rarity = roll < 0.18 ? 'legendary' : roll < 0.55 ? 'rare' : 'magic';
      const item = generateItem(rarity);
      pushDrop({ kind: 'gear', item, rarity, label: item.name });
      if (rarity === 'legendary') sfx.legendary();
      return;
    }

    if (sourceTier === 'prop') {
      if (roll < 0.55) {
        const amt = Math.round((6 + Math.random() * 10) * state.floor * goldMult);
        pushDrop({ kind: 'gold', amount: amt, label: `${amt} Gold` });
      } else if (roll < 0.78) {
        pushDrop({ kind: 'potion', amount: 1, label: 'Health Potion' });
      } else {
        const rarity = Math.random() < 0.2 ? 'rare' : 'magic';
        const item = generateItem(rarity);
        pushDrop({ kind: 'gear', item, rarity, label: item.name });
      }
      return;
    }

    // Normal skeleton drop
    if (roll < 0.45) {
      const amt = Math.round((8 + Math.random() * 14) * state.floor * goldMult);
      pushDrop({ kind: 'gold', amount: amt, label: `${amt} Gold` });
    } else if (roll < 0.58) {
      pushDrop({ kind: 'potion', amount: 1, label: 'Health Potion' });
    } else if (roll < 0.88) {
      const rarity = roll > 0.84 ? 'legendary' : roll > 0.74 ? 'rare' : 'magic';
      const item = generateItem(rarity);
      pushDrop({ kind: 'gear', item, rarity, label: item.name });
      if (rarity === 'legendary') sfx.legendary();
    }
  }

  function passesLootFilter(drop) {
    if (!drop || drop.kind !== 'gear') return true;
    if (drop.rarity === 'legendary') return true;
    if (state.lootFilter === 'rare') return drop.rarity === 'rare';
    if (state.lootFilter === 'magic') return drop.rarity === 'magic' || drop.rarity === 'rare';
    return true;
  }

  function collectLootDrop(dropIdx) {
    const drop = state.lootDrops[dropIdx];
    if (!drop) return false;
    const p = state.player;

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

    if (drop.kind === 'gear') {
      if (p.bag.length >= MAX_BAG_SLOTS) {
        showToast('Satchel full! Salvage gear in Bag.');
        return false;
      }
      p.bag.push(drop.item);
      const rColor = RARITY[drop.rarity]?.color || '#60a5fa';
      addFloatText(drop.x, drop.y, drop.item.name, rColor, drop.rarity === 'legendary');
      if (drop.rarity === 'legendary') {
        showToast(`Legendary Found: ${drop.item.name}!`);
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
  // COMBAT, SKILLS & PROGRESSION
  // =========================================================================
  function addFloatText(wx, wy, text, color, isCrit = false) {
    state.floatTexts.push({
      x: wx,
      y: wy,
      z: 36,
      vy: 38,
      text,
      color,
      isCrit,
      life: isCrit ? 1.05 : 0.78,
      maxLife: isCrit ? 1.05 : 0.78
    });
  }

  function spawnParticles(wx, wy, color, count = 8, speed = 2.4, zStart = 18) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (0.4 + Math.random() * 0.8) * speed;
      state.particles.push({
        x: wx,
        y: wy,
        z: zStart,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        vz: 30 + Math.random() * 55,
        color,
        size: 2.2 + Math.random() * 2.5,
        life: 0.35 + Math.random() * 0.3,
        maxLife: 0.65
      });
    }
  }

  function grantXp(amount) {
    const p = state.player;
    p.xp += amount;
    while (p.xp >= p.nextXp) {
      p.xp -= p.nextXp;
      p.level += 1;
      p.nextXp = Math.round(p.nextXp * 1.42);
      syncPlayerVitalsBounds();
      p.hp = p.maxHp;
      p.mp = p.maxMp;
      p.potions += 1;
      sfx.lvl();
      spawnParticles(p.x, p.y, '#facc15', 22, 3.6, 20);
      addFloatText(p.x, p.y, `LEVEL ${p.level}!`, '#fde047', true);
      showToast(`Level ${p.level} Reached! Full Restore +1 Potion`);
    }
    saveProgress();
  }

  function damageMonster(m, rawDmg, knockDirX, knockDirY, canCrit = true) {
    const stats = getHeroStats();
    const isCrit = canCrit && Math.random() * 100 < stats.crit;
    const dmg = Math.max(1, Math.round(rawDmg * (isCrit ? 1.85 : 0.92 + Math.random() * 0.16)));

    m.hp -= dmg;
    m.hitFlash = 0.14;
    m.engaged = true;
    if (m.tier !== 'boss') {
      m.vx += knockDirX * 3.4;
      m.vy += knockDirY * 3.4;
    }

    if (stats.loh > 0 && state.player.hp > 0) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + stats.loh);
    }

    addFloatText(
      m.x,
      m.y,
      isCrit ? `Critical! ${dmg}` : `${dmg}`,
      isCrit ? '#facc15' : '#f8fafc',
      isCrit
    );
    spawnParticles(m.x, m.y, isCrit ? '#facc15' : '#dc2626', isCrit ? 10 : 5, 2.2);
    if (isCrit) {
      sfx.crit();
      state.camera.shake = Math.max(state.camera.shake, 4.5);
    }

    if (m.hp <= 0) {
      handleMonsterDeath(m);
    }
  }

  function handleMonsterDeath(m) {
    const idx = state.monsters.indexOf(m);
    if (idx !== -1) state.monsters.splice(idx, 1);

    state.player.kills += 1;
    spawnParticles(m.x, m.y, m.type === 'ghoul' ? '#60a5fa' : '#94a3b8', 16, 3.0);

    // Molten affix death explosion
    if (m.affixes && m.affixes.includes('molten')) {
      sfx.fire();
      state.novaWaves.push({ x: m.x, y: m.y, r: 0.3, maxR: 2.1, color: '#f97316', life: 0.28, maxLife: 0.28 });
      spawnParticles(m.x, m.y, '#fb923c', 16, 3.6);
      if (dist(m.x, m.y, state.player.x, state.player.y) <= 2.1) {
        damagePlayer(Math.round(m.atk * 1.1));
      }
    }

    grantXp(m.xp);
    spawnLootDrop(m.x, m.y, m.isGuardian ? 'guardian' : m.tier);

    if (m.type === 'boss') {
      state.stairs.unlocked = true;
      state.highestFloor = Math.max(state.highestFloor, state.floor + 1);
      state.camera.shake = 9;
      showToast(`${m.name} Slain! Descent Stairs Unsealed!`);
      saveHeroProfile();
      updateHud();
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
    p.attackCd = cls === 'rogue' ? 0.25 : cls === 'sorcerer' ? 0.36 : 0.34;
    p.attackAnim = 0.22;

    if (input.aimX !== null && input.aimY !== null) {
      p.facingX = input.aimX;
      p.facingY = input.aimY;
    } else {
      autoFaceTarget(cls === 'sorcerer' ? 8.5 : 3.4);
    }

    const stats = getHeroStats();

    if (cls === 'sorcerer') {
      // Shadow Bolt projectile
      sfx.arcane();
      state.projectiles.push({
        kind: 'shadow',
        x: p.x + p.facingX * 0.45,
        y: p.y + p.facingY * 0.45,
        vx: p.facingX * 11.2,
        vy: p.facingY * 11.2,
        dmg: stats.atk * 1.15,
        aoe: 0.9,
        life: 1.15
      });
      return;
    }

    sfx.slash();
    const reach = cls === 'rogue' ? 1.85 : 2.05;
    state.slashArcs.push({
      x: p.x,
      y: p.y,
      angle: Math.atan2(p.facingY, p.facingX),
      life: 0.18,
      maxLife: 0.18,
      radius: cls === 'rogue' ? 38 : 44,
      color: cls === 'rogue' ? '#4ade80' : '#fde047'
    });

    const mult = cls === 'rogue' ? 0.9 : 1.0;
    for (let i = state.monsters.length - 1; i >= 0; i--) {
      const m = state.monsters[i];
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d <= reach + m.radius) {
        const dot = (dx / (d || 1)) * p.facingX + (dy / (d || 1)) * p.facingY;
        if (dot >= -0.25 || d < 1.05) {
          damageMonster(m, stats.atk * mult, dx / (d || 1), dy / (d || 1), true);
        }
      }
    }
    breakNearbyProps(p.x + p.facingX * 0.9, p.y + p.facingY * 0.9, 1.45);
  }
  const performSwordSlash = performBasicAttack;

  function castSkill(slotId) {
    const p = state.player;
    if (state.mode === 'TOWN') return;
    const cfg = getActiveSkillConfig()[slotId];
    if (!cfg || p.dead) return;
    if (p.skillCds[slotId] > 0) return;
    if (p.mp < cfg.mana) {
      showToast('Not enough Mana!');
      return;
    }

    p.mp -= cfg.mana;
    p.skillCds[slotId] = cfg.cd;
    p.castAnim = 0.28;
    const stats = getHeroStats();
    const cls = state.heroClass;

    if (cls === 'rogue') {
      if (slotId === 1) {
        // Multishot (3-bolt fan)
        autoFaceTarget(9.0);
        sfx.slash();
        const baseAng = Math.atan2(p.facingY, p.facingX);
        for (const off of [-0.24, 0, 0.24]) {
          const a = baseAng + off;
          state.projectiles.push({
            kind: 'bolt',
            x: p.x + Math.cos(a) * 0.4,
            y: p.y + Math.sin(a) * 0.4,
            vx: Math.cos(a) * 12.2,
            vy: Math.sin(a) * 12.2,
            dmg: stats.atk * 1.25,
            aoe: 0.8,
            life: 1.0
          });
        }
      } else if (slotId === 2) {
        // Poison Trap cloud at hero feet
        sfx.arcane();
        state.poisonClouds.push({ x: p.x, y: p.y, r: 2.3, life: 4.5, tick: 0, dmg: stats.atk * 0.72 });
        spawnParticles(p.x, p.y, '#4ade80', 14, 2.5);
      } else if (slotId === 3) {
        // Shadow Dash forward + slash
        sfx.slash();
        moveWithSlide(p, p.facingX * 2.8, p.facingY * 2.8, 0.31);
        updateFogOfWar();
        state.novaWaves.push({ x: p.x, y: p.y, r: 0.3, maxR: 2.1, color: '#4ade80', life: 0.24, maxLife: 0.24 });
        for (let i = state.monsters.length - 1; i >= 0; i--) {
          const m = state.monsters[i];
          const d = dist(p.x, p.y, m.x, m.y);
          if (d <= 2.2 + m.radius) {
            damageMonster(m, stats.atk * 1.65, (m.x - p.x) / (d || 1), (m.y - p.y) / (d || 1), true);
          }
        }
      }
      updateHud();
      return;
    }

    if (cls === 'sorcerer') {
      if (slotId === 1) {
        // Bone Nova
        sfx.arcane();
        state.novaWaves.push({ x: p.x, y: p.y, r: 0.4, maxR: 2.7, color: '#e2e8f0', life: 0.3, maxLife: 0.3 });
        for (let i = state.monsters.length - 1; i >= 0; i--) {
          const m = state.monsters[i];
          const d = dist(p.x, p.y, m.x, m.y);
          if (d <= 2.7 + m.radius) {
            damageMonster(m, stats.atk * 1.6, (m.x - p.x) / (d || 1), (m.y - p.y) / (d || 1), true);
          }
        }
        breakNearbyProps(p.x, p.y, 2.5);
      } else if (slotId === 2) {
        // Frost Orb projectile
        autoFaceTarget(9.0);
        sfx.arcane();
        state.projectiles.push({
          kind: 'frost',
          x: p.x + p.facingX * 0.45,
          y: p.y + p.facingY * 0.45,
          vx: p.facingX * 9.0,
          vy: p.facingY * 9.0,
          dmg: stats.atk * 2.0,
          aoe: 2.3,
          life: 1.5
        });
      } else if (slotId === 3) {
        // Soul Drain AoE + Lifesteal
        sfx.holy();
        let totalHeal = 0;
        state.novaWaves.push({ x: p.x, y: p.y, r: 0.4, maxR: 3.1, color: '#c084fc', life: 0.36, maxLife: 0.36 });
        for (let i = state.monsters.length - 1; i >= 0; i--) {
          const m = state.monsters[i];
          const d = dist(p.x, p.y, m.x, m.y);
          if (d <= 3.1 + m.radius) {
            damageMonster(m, stats.atk * 1.5, (m.x - p.x) / (d || 1), (m.y - p.y) / (d || 1), true);
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

    // Paladin default kit
    if (slotId === 1) {
      sfx.slash();
      state.novaWaves.push({ x: p.x, y: p.y, r: 0.4, maxR: 2.35, color: '#facc15', life: 0.28, maxLife: 0.28 });
      state.camera.shake = Math.max(state.camera.shake, 4);
      for (let i = state.monsters.length - 1; i >= 0; i--) {
        const m = state.monsters[i];
        const d = dist(p.x, p.y, m.x, m.y);
        if (d <= 2.35 + m.radius) {
          damageMonster(m, stats.atk * 1.65, (m.x - p.x) / (d || 1), (m.y - p.y) / (d || 1), true);
        }
      }
      breakNearbyProps(p.x, p.y, 2.35);
    } else if (slotId === 2) {
      autoFaceTarget(9.0);
      sfx.fire();
      state.projectiles.push({
        kind: 'fire',
        x: p.x + p.facingX * 0.45,
        y: p.y + p.facingY * 0.45,
        vx: p.facingX * 10.5,
        vy: p.facingY * 10.5,
        dmg: stats.atk * 2.1,
        aoe: 2.0,
        life: 1.4
      });
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
          damageMonster(m, stats.atk * 1.45, (m.x - p.x) / (d || 1), (m.y - p.y) / (d || 1), true);
        }
      }
      breakNearbyProps(p.x, p.y, 3.0);
    }
    updateHud();
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
      if (dom.inventoryDrawer.open || dom.townNpcDrawer.open || state.player.dead) return;

      input.keys.add(k);
      if (k === ' ') performBasicAttack();
      else if (k === '1') castSkill(1);
      else if (k === '2') castSkill(2);
      else if (k === '3') castSkill(3);
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

    // Combat buttons
    const bindBtn = (el, fn) => {
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
    bindBtn(dom.btnPotion, drinkHealthPotion);
    bindBtn(dom.btnManaElixir, drinkManaElixir);

    // Canvas Tap / Click: Town Station tap OR Loot Nameplate hit-test OR Basic Attack
    canvas.addEventListener('pointerdown', (e) => {
      sfx.unlock();
      if (state.screen === 'MAIN_MENU' || state.screen === 'CHAR_CREATE') return;
      if (state.player.dead || dom.inventoryDrawer.open || dom.townNpcDrawer.open) return;

      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      if (state.mode === 'TOWN') {
        const worldX = sx - rect.width * 0.5 + state.camera.x;
        const worldY = sy - rect.height * 0.5 + state.camera.y;
        const wp = isoToWorld(worldX, worldY);
        for (const npc of state.townNpcs) {
          if (dist(wp.x, wp.y, npc.x, npc.y) <= 1.65) {
            openTownNpcDrawer(npc.id);
            return;
          }
        }
        return;
      }

      // 1. Check tappable ground item nameplates first
      for (let i = state.lootDrops.length - 1; i >= 0; i--) {
        const d = state.lootDrops[i];
        if (!d.screenRect || !passesLootFilter(d)) continue;
        if (sx >= d.screenRect.x && sx <= d.screenRect.x + d.screenRect.w &&
            sy >= d.screenRect.y && sy <= d.screenRect.y + d.screenRect.h) {
          if (dist(state.player.x, state.player.y, d.x, d.y) <= 4.5) {
            collectLootDrop(i);
          } else {
            state.pendingLootTarget = d;
            showToast(`Moving to pick up ${d.label}`);
          }
          return;
        }
      }

      // 2. Otherwise aim toward click & attack
      const worldX = sx - rect.width * 0.5 + state.camera.x;
      const worldY = sy - rect.height * 0.5 + state.camera.y;
      const wp = isoToWorld(worldX, worldY);
      const dx = wp.x - state.player.x;
      const dy = wp.y - state.player.y;
      const len = Math.hypot(dx, dy) || 1;
      input.aimX = dx / len;
      input.aimY = dy / len;
      performBasicAttack();
      input.aimX = null;
      input.aimY = null;
    });

    // Main Menu & Character Creation
    dom.btnContinueTown.addEventListener('click', () => {
      sfx.unlock();
      enterTown();
    });
    dom.btnOpenCharCreate.addEventListener('click', () => {
      sfx.unlock();
      setScreen('CHAR_CREATE');
    });
    dom.btnCharCreateBack.addEventListener('click', () => setScreen('MAIN_MENU'));
    dom.btnRandomName.addEventListener('click', () => {
      sfx.unlock();
      dom.heroNameInput.value = GOTHIC_NAMES[Math.floor(Math.random() * GOTHIC_NAMES.length)];
    });
    dom.btnForgeHero.addEventListener('click', () => {
      sfx.unlock();
      createNewHero(dom.heroNameInput.value, state.selectedCreateClass);
    });

    const toggleMuteAll = () => {
      sfx.muted = !sfx.muted;
      if (!sfx.muted) sfx.unlock();
      savePrefs();
      syncAudioToggleLabels();
    };
    dom.btnAudioToggle.addEventListener('click', toggleMuteAll);
    dom.btnHudAudio.addEventListener('click', toggleMuteAll);

    // Town Quick Dock & NPC Drawer
    dom.btnTownForge.addEventListener('click', () => { sfx.unlock(); openTownNpcDrawer('blacksmith'); });
    dom.btnTownStash.addEventListener('click', () => { sfx.unlock(); openTownNpcDrawer('stash'); });
    dom.btnTownApothecary.addEventListener('click', () => { sfx.unlock(); openTownNpcDrawer('apothecary'); });
    dom.btnTownWaypoint.addEventListener('click', () => { sfx.unlock(); openTownNpcDrawer('waypoint'); });
    dom.btnTownMenu.addEventListener('click', () => {
      saveHeroProfile();
      setScreen('MAIN_MENU');
    });
    dom.btnCloseTownNpc.addEventListener('click', () => dom.townNpcDrawer.close());
    dom.townNpcDrawer.addEventListener('click', (e) => {
      if (e.target === dom.townNpcDrawer) dom.townNpcDrawer.close();
    });

    // Top-right & modal controls
    dom.btnInventory.addEventListener('click', () => { sfx.unlock(); toggleInventory(); });
    dom.btnCloseInventory.addEventListener('click', () => toggleInventory(false));
    dom.inventoryDrawer.addEventListener('click', (e) => {
      if (e.target === dom.inventoryDrawer) toggleInventory(false);
    });

    dom.btnTownPortal.addEventListener('click', () => {
      sfx.unlock();
      sfx.portal();
      enterTown();
    });

    dom.btnLootFilter.addEventListener('click', () => {
      sfx.unlock();
      const idx = LOOT_FILTER_MODES.indexOf(state.lootFilter);
      state.lootFilter = LOOT_FILTER_MODES[(idx + 1) % LOOT_FILTER_MODES.length];
      dom.lootFilterLabel.textContent = LOOT_FILTER_LABELS[state.lootFilter];
      savePrefs();
      showToast(`Filter: ${LOOT_FILTER_LABELS[state.lootFilter]}`);
    });

    dom.btnNewFloor.addEventListener('click', () => {
      sfx.unlock();
      if (state.mode === 'TOWN') {
        openTownNpcDrawer('waypoint');
        return;
      }
      const nextFloor = state.stairs.unlocked ? state.floor + 1 : state.floor;
      const nextSeed = Math.floor(1000 + Math.random() * 8999);
      enterDungeonFloor(nextSeed, nextFloor);
    });

    dom.btnRespawn.addEventListener('click', () => {
      sfx.unlock();
      respawnAtWaypoint(false);
    });
    dom.btnRespawnNew.addEventListener('click', () => {
      sfx.unlock();
      respawnAtWaypoint(true);
    });
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
    p.attackAnim = Math.max(0, p.attackAnim - dt);
    p.castAnim = Math.max(0, p.castAnim - dt);
    p.hitFlash = Math.max(0, p.hitFlash - dt);
    p.chillTimer = Math.max(0, p.chillTimer - dt);
    for (const s of [1, 2, 3]) {
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
    } else if (state.pendingLootTarget) {
      const idx = state.lootDrops.indexOf(state.pendingLootTarget);
      if (idx === -1) {
        state.pendingLootTarget = null;
      } else {
        const d = dist(p.x, p.y, state.pendingLootTarget.x, state.pendingLootTarget.y);
        if (d <= 1.2) {
          collectLootDrop(idx);
          state.pendingLootTarget = null;
        } else {
          const isoDir = worldToIso(state.pendingLootTarget.x - p.x, state.pendingLootTarget.y - p.y);
          const il = Math.hypot(isoDir.x, isoDir.y) || 1;
          sx = isoDir.x / il;
          sy = isoDir.y / il;
        }
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

    // Iron Gates smoothly lift open as hero approaches
    for (const g of state.gates) {
      const near = dist(p.x, p.y, g.x, g.y) <= 2.7;
      if (near && !g.isOpen) g.isOpen = true;
      if (g.isOpen && g.open < 1) g.open = Math.min(1, g.open + dt * 3.2);
    }

    // Arm Waypoint return-to-town once player steps away from spawn
    const wpDist = dist(p.x, p.y, state.waypoint.x, state.waypoint.y);
    if (!state.waypointArmed && wpDist > 2.6) state.waypointArmed = true;
    else if (state.waypointArmed && wpDist <= 0.95) {
      state.waypointArmed = false;
      sfx.portal();
      enterTown();
      return;
    }

    // Auto-pickup nearby Gold Coins & Health Potions
    for (let i = state.lootDrops.length - 1; i >= 0; i--) {
      const drop = state.lootDrops[i];
      if (drop.z > 2) continue;
      if ((drop.kind === 'gold' || drop.kind === 'potion') && dist(p.x, p.y, drop.x, drop.y) <= 1.15) {
        collectLootDrop(i);
      }
    }

    // Descent Stairs Transition when unlocked
    if (state.stairs.unlocked && dist(p.x, p.y, state.stairs.x, state.stairs.y) <= 1.05) {
      const nextFloor = state.floor + 1;
      state.highestFloor = Math.max(state.highestFloor, nextFloor);
      const nextSeed = Math.floor(1000 + Math.random() * 8999);
      enterDungeonFloor(nextSeed, nextFloor);
    }
  }

  function updateMonsters(dt) {
    if (state.mode === 'TOWN') {
      dom.bossBar.classList.add('hidden');
      return;
    }
    const p = state.player;
    let activeBoss = null;

    for (let i = 0; i < state.monsters.length; i++) {
      const m = state.monsters[i];
      m.hitFlash = Math.max(0, m.hitFlash - dt);
      m.stunTimer = Math.max(0, m.stunTimer - dt);
      m.atkCd = Math.max(0, m.atkCd - dt);

      if (m.affixes && m.affixes.includes('molten') && Math.random() < dt * 4.5) {
        spawnParticles(m.x, m.y, '#f97316', 1, 0.9, 10);
      }

      // Apply knockback decay
      if (Math.hypot(m.vx, m.vy) > 0.05) {
        moveWithSlide(m, m.vx * dt, m.vy * dt, m.radius);
        m.vx *= Math.pow(0.05, dt);
        m.vy *= Math.pow(0.05, dt);
      }

      const d = dist(m.x, m.y, p.x, p.y);
      if (d <= m.aggro) m.engaged = true;
      if (m.type === 'boss' && m.engaged) activeBoss = m;

      if (p.dead || !m.engaged || m.stunTimer > 0) continue;

      const nx = (p.x - m.x) / (d || 1);
      const ny = (p.y - m.y) / (d || 1);
      m.facingX = nx;
      m.facingY = ny;

      // Boss telegraphed slam windup
      if (m.type === 'boss' && m.slamTelegraph > 0) {
        m.slamTelegraph -= dt;
        if (m.slamTelegraph <= 0) {
          state.novaWaves.push({ x: m.x, y: m.y, r: 0.4, maxR: 2.4, color: '#ef4444', life: 0.3, maxLife: 0.3 });
          state.camera.shake = Math.max(state.camera.shake, 6);
          if (dist(m.x, m.y, p.x, p.y) <= 2.4) {
            damagePlayer(Math.round(m.atk * 1.45), m);
          }
          m.atkCd = m.atkCdMax;
        }
        continue;
      }

      if (d > m.range) {
        let sepX = 0;
        let sepY = 0;
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
        moveWithSlide(m, (nx * m.speed + sepX) * dt, (ny * m.speed + sepY) * dt, m.radius);
        m.walkPhase += dt * 8;
      } else if (m.atkCd <= 0) {
        if (m.type === 'boss' && Math.random() < 0.4) {
          m.slamTelegraph = 0.65;
        } else {
          m.atkCd = m.atkCdMax;
          damagePlayer(m.atk, m);
        }
      }
    }

    // Toggle Boss Bar
    if (activeBoss) {
      dom.bossBar.classList.remove('hidden');
      const affStr = activeBoss.affixes?.length
        ? ` [${activeBoss.affixes.map((a) => ELITE_AFFIXES[a]?.label || a).join(' • ')}]`
        : '';
      dom.bossName.textContent = activeBoss.name + affStr;
      dom.bossHpText.textContent = `${Math.max(0, activeBoss.hp)} / ${activeBoss.maxHp}`;
      dom.bossHpFill.style.width = `${clamp((activeBoss.hp / activeBoss.maxHp) * 100, 0, 100)}%`;
    } else {
      dom.bossBar.classList.add('hidden');
    }
  }

  function damagePlayer(rawDmg, attacker = null) {
    const p = state.player;
    if (p.dead || state.mode === 'TOWN') return;
    const stats = getHeroStats();
    const mitigated = Math.max(2, Math.round(rawDmg - stats.arm * 0.45));
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
      if (attacker.affixes.includes('frozen')) {
        p.chillTimer = 2.0;
      }
    }

    if (p.hp <= 0) {
      p.dead = true;
      const clsName = HERO_CLASSES[state.heroClass]?.name || 'Hero';
      dom.deathSummary.textContent = `${state.heroName} slain on Floor ${state.floor} • Lv ${p.level} ${clsName} (${p.kills} vanquished).`;
      dom.deathOverlay.classList.remove('hidden');
    }
    updateHud();
  }

  function updateEffectsAndLoot(dt) {
    const p = state.player;

    // Projectiles (Fireball, Shadow Bolt, Frost Orb, Rogue Bolts)
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const pr = state.projectiles[i];
      pr.life -= dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      if (Math.random() < 0.5) {
        const pCol = pr.kind === 'frost' ? '#38bdf8' : pr.kind === 'shadow' ? '#c084fc' : pr.kind === 'bolt' ? '#4ade80' : '#f97316';
        spawnParticles(pr.x, pr.y, pCol, 1, 0.7, 18);
      }

      let hit = !isPositionClear(pr.x, pr.y, 0.16) || pr.life <= 0;
      if (!hit) {
        for (const m of state.monsters) {
          if (dist(pr.x, pr.y, m.x, m.y) <= m.radius + 0.35) {
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        const aoeR = pr.aoe || 2.0;
        const wCol = pr.kind === 'frost' ? '#38bdf8' : pr.kind === 'shadow' ? '#c084fc' : pr.kind === 'bolt' ? '#4ade80' : '#f97316';
        state.novaWaves.push({ x: pr.x, y: pr.y, r: 0.25, maxR: aoeR, color: wCol, life: 0.22, maxLife: 0.22 });
        spawnParticles(pr.x, pr.y, wCol, 10, 3.0, 16);
        if (aoeR >= 1.5) state.camera.shake = Math.max(state.camera.shake, 3.5);
        for (let j = state.monsters.length - 1; j >= 0; j--) {
          const m = state.monsters[j];
          const d = dist(pr.x, pr.y, m.x, m.y);
          if (d <= aoeR + m.radius) {
            if (pr.kind === 'frost') m.stunTimer = Math.max(m.stunTimer, 0.95);
            damageMonster(m, pr.dmg, (m.x - pr.x) / (d || 1), (m.y - pr.y) / (d || 1), true);
          }
        }
        breakNearbyProps(pr.x, pr.y, aoeR);
        state.projectiles.splice(i, 1);
      }
    }

    // Rogue Poison Trap Clouds
    for (let i = state.poisonClouds.length - 1; i >= 0; i--) {
      const pc = state.poisonClouds[i];
      pc.life -= dt;
      pc.tick -= dt;
      if (pc.tick <= 0) {
        pc.tick = 0.5;
        for (let j = state.monsters.length - 1; j >= 0; j--) {
          const m = state.monsters[j];
          if (dist(pc.x, pc.y, m.x, m.y) <= pc.r + m.radius) {
            damageMonster(m, pc.dmg, 0, 0, false);
          }
        }
      }
      if (pc.life <= 0) state.poisonClouds.splice(i, 1);
    }

    // Loot Drop parabolic bounce + Auto-Loot Gold Magnet (within 90px screen distance)
    for (let i = state.lootDrops.length - 1; i >= 0; i--) {
      const d = state.lootDrops[i];
      d.age += dt;
      if (d.z > 0 || d.vz > 0) {
        d.x += (d.destX - d.x) * Math.min(1, dt * 6);
        d.y += (d.destY - d.y) * Math.min(1, dt * 6);
        d.z += d.vz * dt;
        d.vz -= 290 * dt;
        if (d.z <= 0) {
          d.z = 0;
          d.vz = 0;
          d.x = d.destX;
          d.y = d.destY;
        }
      } else if (d.kind === 'gold' && !p.dead) {
        const dx = p.x - d.x;
        const dy = p.y - d.y;
        const isoDx = (dx - dy) * (TILE_W * 0.5);
        const isoDy = (dx + dy) * (TILE_H * 0.5);
        const pxDist = Math.hypot(isoDx, isoDy);
        if (pxDist <= 90) {
          const wDist = Math.hypot(dx, dy) || 1;
          const pull = Math.min(wDist, 9.5 * dt);
          d.x += (dx / wDist) * pull;
          d.y += (dy / wDist) * pull;
          d.destX = d.x;
          d.destY = d.y;
          if (wDist <= 0.65) collectLootDrop(i);
        }
      }
    }

    // Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const pt = state.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.z = Math.max(0, pt.z + pt.vz * dt);
      pt.vz -= 160 * dt;
    }

    // Slash arcs & nova waves
    for (let i = state.slashArcs.length - 1; i >= 0; i--) {
      state.slashArcs[i].life -= dt;
      if (state.slashArcs[i].life <= 0) state.slashArcs.splice(i, 1);
    }
    for (let i = state.novaWaves.length - 1; i >= 0; i--) {
      const w = state.novaWaves[i];
      w.life -= dt;
      w.r = w.maxR * (1 - w.life / w.maxLife);
      if (w.life <= 0) state.novaWaves.splice(i, 1);
    }

    // Floating combat text
    for (let i = state.floatTexts.length - 1; i >= 0; i--) {
      const f = state.floatTexts[i];
      f.life -= dt;
      f.z += f.vy * dt;
      if (f.life <= 0) state.floatTexts.splice(i, 1);
    }

    // Camera smooth follow + shake decay
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

    ctx.fillStyle = '#07080c';
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

    // Pass 1: Explored Ground Tiles (Culled)
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
            : atlas.floors[rowVar[x] % atlas.floors.length];

        ctx.drawImage(sprite, sx - TILE_W * 0.5 - 1, sy - TILE_H * 0.5 - 1);
        if (exp === 1) {
          ctx.fillStyle = 'rgba(4, 5, 9, 0.5)';
          drawIsoDiamondPath(ctx, sx, sy, TILE_W, TILE_H);
          ctx.fill();
        }
      }
    }

    // Pass 1b: Pre-rendered Ground Light Pools (zero per-frame gradient allocations)
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

    const pIso = worldToIso(state.player.x, state.player.y);
    pushDraw(state.player.x + state.player.y, 7, pIso.x + offX, pIso.y + offY, null, 0);

    drawPool.length = drawLen;
    drawPool.sort((a, b) => a.depth - b.depth);
    for (let i = 0; i < drawLen; i++) {
      const it = drawPool[i];
      switch (it.kind) {
        case 1:
          ctx.drawImage(atlas.wall, it.sx - TILE_W * 0.5 - 1, it.sy - TILE_H * 0.5 - WALL_H - 1);
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
      }
    }

    // Pass 3: Slash Arcs, Projectiles & Particles
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
      // Curved Horns
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - 7, sy - 56);
      ctx.quadraticCurveTo(sx - 17, sy - 68, sx - 12, sy - 74);
      ctx.moveTo(sx + 7, sy - 56);
      ctx.quadraticCurveTo(sx + 17, sy - 68, sx + 12, sy - 74);
      ctx.stroke();
      // Glowing ember eyes
      ctx.fillStyle = '#fde047';
      ctx.fillRect(sx - 5, sy - 51, 3, 3);
      ctx.fillRect(sx + 2, sy - 51, 3, 3);
      // Legs
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(sx - 11, sy - 13 + stride * 0.4, 8, 13);
      ctx.fillRect(sx + 3, sy - 13 - stride * 0.4, 8, 13);
    } else if (isGhoul) {
      // Champion Ghoul
      ctx.fillStyle = flash ? '#ffffff' : '#1e3a8a';
      ctx.beginPath();
      ctx.roundRect(sx - 9, sy - 28, 18, 19, 5);
      ctx.fill();
      ctx.fillStyle = flash ? '#ffffff' : '#60a5fa';
      ctx.beginPath();
      ctx.arc(sx, sy - 33, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(sx - 3.5, sy - 34, 2, 2);
      ctx.fillRect(sx + 1.5, sy - 34, 2, 2);
      ctx.fillStyle = '#172554';
      ctx.fillRect(sx - 6, sy - 10 + stride * 0.4, 4.5, 10);
      ctx.fillRect(sx + 1.5, sy - 10 - stride * 0.4, 4.5, 10);
    } else {
      // Skeletal Warrior
      ctx.fillStyle = flash ? '#ffffff' : '#cbd5e1';
      ctx.fillRect(sx - 5, sy - 25, 10, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx - 3, sy - 22, 6, 2);
      ctx.fillRect(sx - 3, sy - 18, 6, 2);
      // Skull
      ctx.fillStyle = flash ? '#ffffff' : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(sx, sy - 31, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx - 3, sy - 32, 2, 2);
      ctx.fillRect(sx + 1, sy - 32, 2, 2);
      // Rusty Blade
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(sx + 6, sy - 26, 2.5, 14);
      // Legs
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(sx - 4.5, sy - 11 + stride * 0.4, 3, 11);
      ctx.fillRect(sx + 1.5, sy - 11 - stride * 0.4, 3, 11);
    }

    // Overhead affix tag on Champion Ghouls & compact HP bar
    if (!isBoss && isGhoul && m.affixes?.length) {
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
      if (d.z > 4 || !passesLootFilter(d)) {
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
    const floorStr = state.mode === 'TOWN' ? 'Shadowhaven • Town' : `Floor ${state.floor} • Crypt`;
    const seedStr = `#${state.seed} • v${VERSION}`;
    const buffStr = state.activeBuff ? state.activeBuff.label : '';

    if (force || c.hpPct !== hpPct) { dom.hpOrbFill.style.height = hpPct; c.hpPct = hpPct; }
    if (force || c.mpPct !== mpPct) { dom.mpOrbFill.style.height = mpPct; c.mpPct = mpPct; }
    if (force || c.hpStr !== hpStr) { dom.hpText.textContent = hpStr; c.hpStr = hpStr; }
    if (force || c.mpStr !== mpStr) { dom.mpText.textContent = mpStr; c.mpStr = mpStr; }
    if (force || c.lvlStr !== lvlStr) { dom.heroLevelText.textContent = lvlStr; c.lvlStr = lvlStr; }
    if (force || c.goldStr !== goldStr) { dom.goldValue.textContent = goldStr; c.goldStr = goldStr; }
    if (force || c.xpPct !== xpPct) { dom.xpBarFill.style.width = xpPct; c.xpPct = xpPct; }
    if (force || c.floorStr !== floorStr) { dom.floorBadge.textContent = floorStr; c.floorStr = floorStr; }
    if (force || c.seedStr !== seedStr) { dom.seedBadge.textContent = seedStr; c.seedStr = seedStr; }
    if (force || c.buffStr !== buffStr) {
      dom.buffBadge.textContent = buffStr;
      dom.buffBadge.classList.toggle('hidden', !buffStr);
      c.buffStr = buffStr;
    }

    if (force || c.bagLen !== p.bag.length) { dom.lootCountBadge.textContent = p.bag.length; c.bagLen = p.bag.length; }
    if (force || c.potions !== p.potions) { dom.potionCount.textContent = p.potions; c.potions = p.potions; }
    if (force || c.elixirs !== p.manaElixirs) { dom.manaElixirCount.textContent = p.manaElixirs; c.elixirs = p.manaElixirs; }

    const nfLabel = state.mode === 'TOWN' ? 'Waypoint' : (state.stairs.unlocked ? 'Next Floor' : 'New Map');
    if (force || c.nfLabel !== nfLabel || c.unlocked !== state.stairs.unlocked) {
      dom.newFloorBtnLabel.textContent = nfLabel;
      dom.btnNewFloor.classList.toggle('ready-glow', state.mode === 'DUNGEON' && state.stairs.unlocked);
      c.nfLabel = nfLabel;
      c.unlocked = state.stairs.unlocked;
    }

    // Skill & potion cooldown sweeps
    const skillCfg = getActiveSkillConfig();
    for (const id of [1, 2, 3]) {
      const cfg = skillCfg[id];
      const btn = document.getElementById(cfg.elId);
      const rem = p.skillCds[id];
      const frac = rem > 0 ? clamp(rem / cfg.cd, 0, 1) : 0;
      const key = `${frac.toFixed(2)}_${rem > 0 ? rem.toFixed(1) : ''}`;
      if (force || c['cd' + id] !== key) {
        btn.style.setProperty('--cd', frac.toFixed(3));
        btn.classList.toggle('is-cooldown', rem > 0);
        btn.querySelector('.cd-text').textContent = rem > 0 ? rem.toFixed(1) : '';
        c['cd' + id] = key;
      }
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
  }
  const updateHud = syncHudDom;

  function syncClassSkillLabels() {
    const cls = HERO_CLASSES[state.heroClass] || HERO_CLASSES.paladin;
    dom.attackLabel.textContent = cls.basicName;
    dom.skill1Cost.textContent = cls.skills[1].mana;
    dom.skill2Cost.textContent = cls.skills[2].mana;
    dom.skill3Cost.textContent = cls.skills[3].mana;
    dom.btnSkill1.title = `${cls.skills[1].name} (1) — ${cls.skills[1].mana} MP`;
    dom.btnSkill2.title = `${cls.skills[2].name} (2) — ${cls.skills[2].mana} MP`;
    dom.btnSkill3.title = `${cls.skills[3].name} (3) — ${cls.skills[3].mana} MP`;
  }

  function renderMainMenuSummary() {
    const hasSave = Boolean(localStorage.getItem(SAVE_KEY) || localStorage.getItem(LEGACY_SAVE_KEY));
    dom.savedHeroCard.classList.toggle('hidden', !hasSave);
    if (hasSave) {
      const clsName = HERO_CLASSES[state.heroClass]?.name || 'Paladin';
      dom.savedHeroName.textContent = state.heroName;
      dom.savedHeroClass.textContent = clsName;
      dom.savedHeroMeta.textContent = `Lv ${state.player.level} • ${state.player.gold.toLocaleString()} Gold • Best Floor ${state.highestFloor}`;
      dom.btnContinueTown.textContent = 'CONTINUE TO TOWN';
    } else {
      dom.btnContinueTown.textContent = 'ENTER TOWN';
    }
    syncAudioToggleLabels();
  }

  function renderClassPortraits() {
    dom.classSelectGrid.innerHTML = '';
    for (const id of ['paladin', 'rogue', 'sorcerer']) {
      const cls = HERO_CLASSES[id];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'class-card' + (state.selectedCreateClass === id ? ' selected' : '');
      card.innerHTML = `
        <div class="class-card-top">
          <canvas class="class-portrait" width="96" height="96"></canvas>
          <div>
            <div class="class-card-name">${cls.name}</div>
            <div class="class-card-role">${cls.role}</div>
          </div>
        </div>
        <div class="class-stat-chips">
          <div class="stat-chip">STR<strong>${cls.stats.str}</strong></div>
          <div class="stat-chip">DEX<strong>${cls.stats.dex}</strong></div>
          <div class="stat-chip">INT<strong>${cls.stats.int}</strong></div>
          <div class="stat-chip">VIT<strong>${cls.stats.vit}</strong></div>
        </div>
        <div class="class-skills-list">
          <span>Kit:</span> ${cls.basicName} • ${cls.skills[1].name} • ${cls.skills[2].name} • ${cls.skills[3].name}
        </div>
      `;
      card.addEventListener('click', () => {
        sfx.unlock();
        state.selectedCreateClass = id;
        renderClassPortraits();
      });
      dom.classSelectGrid.appendChild(card);

      // Draw live isometric portrait on the card canvas
      const pCan = card.querySelector('canvas');
      const pCtx = pCan.getContext('2d');
      pCtx.fillStyle = '#07090e';
      pCtx.fillRect(0, 0, 96, 96);
      const grad = pCtx.createRadialGradient(48, 48, 4, 48, 48, 46);
      grad.addColorStop(0, 'rgba(217, 119, 6, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 96, 96);
      pCtx.save();
      pCtx.translate(48, 72);
      pCtx.scale(1.35, 1.35);
      pCtx.fillStyle = cls.cloak;
      pCtx.fillRect(-8, -26, 16, 20);
      pCtx.fillStyle = cls.armorColor;
      pCtx.fillRect(-7, -28, 14, 15);
      pCtx.fillStyle = cls.trimColor;
      pCtx.fillRect(-1.5, -26, 3, 11);
      pCtx.fillStyle = id === 'paladin' ? '#cbd5e1' : cls.cloak;
      pCtx.fillRect(-6, -39, 12, 11);
      pCtx.fillStyle = cls.trimColor;
      pCtx.fillRect(-3, -34, 6, 2);
      pCtx.restore();
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
      if (!dom.heroNameInput.value.trim()) {
        dom.heroNameInput.value = GOTHIC_NAMES[Math.floor(Math.random() * GOTHIC_NAMES.length)];
      }
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

  function createNewHero(rawName, classId) {
    const cleanName = (rawName || '').trim().slice(0, 18) || 'Aldric';
    const cls = HERO_CLASSES[classId] ? classId : 'paladin';
    state.heroName = cleanName;
    state.heroClass = cls;
    state.floor = 1;
    state.highestFloor = 1;
    state.seed = Math.floor(1000 + Math.random() * 8999);
    state.activeBuff = null;
    const p = state.player;
    p.level = 1;
    p.xp = 0;
    p.nextXp = 100;
    p.gold = 100;
    p.potions = 3;
    p.manaElixirs = 2;
    p.kills = 0;
    p.dead = false;
    p.equipped = createStarterGear(cls);
    p.bag = [];
    syncPlayerVitalsBounds();
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    saveHeroProfile();
    enterTown();
  }

  function enterTown() {
    generateTown();
    setScreen('TOWN');
  }

  function enterDungeonFloor(seed, floor) {
    generateDungeon(seed, floor);
    setScreen('DUNGEON');
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
      item.stats[k] = k === 'crit'
        ? Math.round((item.stats[k] + 1.2) * 10) / 10
        : Math.max(1, Math.round(item.stats[k] * 1.18 + 2));
    }
  }

  function openTownNpcDrawer(npcId, subTab = 'buy') {
    const p = state.player;
    dom.townNpcGold.textContent = p.gold.toLocaleString();
    dom.townNpcBody.innerHTML = '';

    if (npcId === 'blacksmith') {
      dom.townNpcTitle.textContent = 'Blacksmith Forge';
      dom.townNpcSubtitle.textContent = 'Buy Gear • Temper Equipped • Salvage';
      const tabs = document.createElement('div');
      tabs.className = 'npc-tabs';
      for (const [tid, lbl] of [['buy', 'Buy Gear'], ['temper', 'Temper'], ['salvage', 'Salvage']]) {
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
          row.innerHTML = `
            <div class="npc-row-info">
              <div class="npc-row-title rarity-${entry.item.rarity}">${entry.item.name}</div>
              <div class="npc-row-sub">${SLOT_LABELS[entry.item.slot]} • ${formatStatsLine(entry.item.stats).map(([k, v, u]) => `${k} +${v}${u}`).join(', ')}</div>
            </div>
            <button type="button" class="npc-action-btn" ${p.gold < entry.cost || p.bag.length >= MAX_BAG_SLOTS ? 'disabled' : ''}>${entry.cost}g</button>
          `;
          row.querySelector('button').addEventListener('click', () => {
            if (p.gold < entry.cost || p.bag.length >= MAX_BAG_SLOTS) return;
            p.gold -= entry.cost;
            p.bag.push(entry.item);
            state.blacksmithStock.splice(idx, 1);
            sfx.anvil();
            saveHeroProfile();
            syncHudDom(true);
            openTownNpcDrawer('blacksmith', 'buy');
          });
          list.appendChild(row);
        });
      } else if (subTab === 'temper') {
        for (const slot of SLOTS) {
          const eq = p.equipped[slot];
          if (!eq) continue;
          const cost = 60 + ((eq.temper || 0) * 45) + state.highestFloor * 12;
          const row = document.createElement('div');
          row.className = 'npc-row';
          row.innerHTML = `
            <div class="npc-row-info">
              <div class="npc-row-title rarity-${eq.rarity}">${eq.name}</div>
              <div class="npc-row-sub">${SLOT_LABELS[slot]} • +18% Stats on Temper</div>
            </div>
            <button type="button" class="npc-action-btn" ${p.gold < cost ? 'disabled' : ''}>Temper ${cost}g</button>
          `;
          row.querySelector('button').addEventListener('click', () => {
            if (p.gold < cost) return;
            p.gold -= cost;
            temperItem(eq);
            syncPlayerVitalsBounds();
            p.hp = p.maxHp;
            sfx.anvil();
            saveHeroProfile();
            syncHudDom(true);
            openTownNpcDrawer('blacksmith', 'temper');
          });
          list.appendChild(row);
        }
      } else {
        if (!p.bag.length) {
          list.innerHTML = '<div class="compare-empty">Your satchel is empty.</div>';
        } else {
          p.bag.forEach((it, idx) => {
            const val = salvageGoldValue(it);
            const row = document.createElement('div');
            row.className = 'npc-row';
            row.innerHTML = `
              <div class="npc-row-info">
                <div class="npc-row-title rarity-${it.rarity}">${it.name}</div>
                <div class="npc-row-sub">${SLOT_LABELS[it.slot]}</div>
              </div>
              <button type="button" class="npc-action-btn">+${val}g</button>
            `;
            row.querySelector('button').addEventListener('click', () => {
              p.gold += val;
              p.bag.splice(idx, 1);
              sfx.anvil();
              saveHeroProfile();
              syncHudDom(true);
              openTownNpcDrawer('blacksmith', 'salvage');
            });
            list.appendChild(row);
          });
        }
      }
      dom.townNpcBody.appendChild(list);
    } else if (npcId === 'stash') {
      dom.townNpcTitle.textContent = 'Hero Stash Chest';
      dom.townNpcSubtitle.textContent = `Shared Account Storage (${state.stash.length}/${MAX_STASH_SLOTS})`;
      const list = document.createElement('div');
      list.className = 'npc-list';
      list.innerHTML = '<div class="section-heading">Stash Items (Tap to Withdraw)</div>';
      if (!state.stash.length) {
        list.innerHTML += '<div class="compare-empty">Stash is empty. Deposit items from your satchel below.</div>';
      } else {
        state.stash.forEach((it, idx) => {
          const row = document.createElement('div');
          row.className = 'npc-row';
          row.innerHTML = `
            <div class="npc-row-info">
              <div class="npc-row-title rarity-${it.rarity}">${it.name}</div>
              <div class="npc-row-sub">${SLOT_LABELS[it.slot]}</div>
            </div>
            <button type="button" class="npc-action-btn" ${p.bag.length >= MAX_BAG_SLOTS ? 'disabled' : ''}>Take</button>
          `;
          row.querySelector('button').addEventListener('click', () => {
            if (p.bag.length >= MAX_BAG_SLOTS) return;
            p.bag.push(it);
            state.stash.splice(idx, 1);
            sfx.loot();
            saveStash();
            saveHeroProfile();
            syncHudDom(true);
            openTownNpcDrawer('stash');
          });
          list.appendChild(row);
        });
      }
      const bagHead = document.createElement('div');
      bagHead.className = 'section-heading';
      bagHead.style.marginTop = '10px';
      bagHead.textContent = `Satchel (${p.bag.length}/${MAX_BAG_SLOTS}) — Tap to Deposit`;
      list.appendChild(bagHead);
      p.bag.forEach((it, idx) => {
        const row = document.createElement('div');
        row.className = 'npc-row';
        row.innerHTML = `
          <div class="npc-row-info">
            <div class="npc-row-title rarity-${it.rarity}">${it.name}</div>
            <div class="npc-row-sub">${SLOT_LABELS[it.slot]}</div>
          </div>
          <button type="button" class="npc-action-btn" ${state.stash.length >= MAX_STASH_SLOTS ? 'disabled' : ''}>Store</button>
        `;
        row.querySelector('button').addEventListener('click', () => {
          if (state.stash.length >= MAX_STASH_SLOTS) return;
          state.stash.push(it);
          p.bag.splice(idx, 1);
          sfx.loot();
          saveStash();
          saveHeroProfile();
          syncHudDom(true);
          openTownNpcDrawer('stash');
        });
        list.appendChild(row);
      });
      dom.townNpcBody.appendChild(list);
    } else if (npcId === 'apothecary') {
      dom.townNpcTitle.textContent = 'Shadowhaven Apothecary';
      dom.townNpcSubtitle.textContent = 'Potions • Elixirs • 1-Floor Shrine Buffs';
      const list = document.createElement('div');
      list.className = 'npc-list';
      const offers = [
        { title: 'Sanctuary Full Restore', sub: 'Refill Health & Mana to 100%', cost: 0, fn: () => { p.hp = p.maxHp; p.mp = p.maxMp; sfx.holy(); } },
        { title: 'Health Potion (+1)', sub: `Currently carried: ${p.potions}`, cost: 35, fn: () => { p.potions += 1; sfx.potion(); } },
        { title: 'Mana Elixir (+1)', sub: `Currently carried: ${p.manaElixirs}`, cost: 40, fn: () => { p.manaElixirs += 1; sfx.potion(); } },
        { title: 'Shrine of Precision', sub: '1-Floor Buff: +15% Crit Chance', cost: 60, fn: () => { state.activeBuff = { id: 'crit', label: '+15% Crit', crit: 15, speed: 0, gold: 0 }; sfx.holy(); } },
        { title: 'Shrine of Alacrity', sub: '1-Floor Buff: +20% Move Speed', cost: 50, fn: () => { state.activeBuff = { id: 'speed', label: '+20% Speed', crit: 0, speed: 0.2, gold: 0 }; sfx.holy(); } },
        { title: 'Shrine of Fortune', sub: '1-Floor Buff: +25% Gold Find', cost: 55, fn: () => { state.activeBuff = { id: 'gold', label: '+25% Gold', crit: 0, speed: 0, gold: 0.25 }; sfx.holy(); } }
      ];
      for (const off of offers) {
        const row = document.createElement('div');
        row.className = 'npc-row';
        row.innerHTML = `
          <div class="npc-row-info">
            <div class="npc-row-title">${off.title}</div>
            <div class="npc-row-sub">${off.sub}</div>
          </div>
          <button type="button" class="npc-action-btn" ${p.gold < off.cost ? 'disabled' : ''}>${off.cost === 0 ? 'Free' : off.cost + 'g'}</button>
        `;
        row.querySelector('button').addEventListener('click', () => {
          if (p.gold < off.cost) return;
          p.gold -= off.cost;
          off.fn();
          saveHeroProfile();
          syncHudDom(true);
          openTownNpcDrawer('apothecary');
        });
        list.appendChild(row);
      }
      dom.townNpcBody.appendChild(list);
    } else if (npcId === 'waypoint') {
      dom.townNpcTitle.textContent = 'Waypoint Portal';
      dom.townNpcSubtitle.textContent = `Select Unlocked Crypt Floor (Best: ${state.highestFloor})`;
      const grid = document.createElement('div');
      grid.className = 'waypoint-grid';
      for (let fl = 1; fl <= state.highestFloor; fl++) {
        const isBoss = fl % 3 === 0;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'waypoint-floor-btn' + (isBoss ? ' boss-floor' : '');
        btn.innerHTML = isBoss ? `Floor ${fl}<br><small>★ Guardian</small>` : `Floor ${fl}<br><small>Crypt</small>`;
        btn.addEventListener('click', () => {
          dom.townNpcDrawer.close();
          sfx.portal();
          enterDungeonFloor(Math.floor(1000 + Math.random() * 8999), fl);
        });
        grid.appendChild(btn);
      }
      dom.townNpcBody.appendChild(grid);
    }

    if (!dom.townNpcDrawer.open) dom.townNpcDrawer.showModal();
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

  function renderInventoryUI() {
    const p = state.player;
    const totals = getHeroStats();
    dom.invGold.textContent = p.gold.toLocaleString();
    dom.invCapacity.textContent = `${p.bag.length} / ${MAX_BAG_SLOTS}`;

    dom.heroStatsStrip.innerHTML = [
      `<div class="stat-chip"><span>ATK</span>${totals.atk}</div>`,
      `<div class="stat-chip"><span>CRIT</span>${totals.crit}%</div>`,
      `<div class="stat-chip"><span>HP</span>${totals.maxHp}</div>`,
      `<div class="stat-chip"><span>LOH</span>${totals.loh}</div>`,
      `<div class="stat-chip"><span>ARM</span>${Math.round(totals.arm)}</div>`
    ].join('');

    // Equipped Slots
    dom.equippedSlots.innerHTML = '';
    for (const slot of SLOTS) {
      const item = p.equipped[slot];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gear-slot';
      if (item) btn.dataset.rarity = item.rarity;
      if (state.selectedInspect?.source === 'equipped' && state.selectedInspect.key === slot) {
        btn.classList.add('selected');
      }
      btn.innerHTML = `
        <span class="slot-type">${SLOT_LABELS[slot]}</span>
        <span class="slot-name ${item ? `rarity-${item.rarity}` : ''}">${item ? item.name : 'Empty'}</span>
      `;
      btn.addEventListener('click', () => {
        if (!item) return;
        state.selectedInspect = { source: 'equipped', key: slot };
        renderInventoryUI();
      });
      dom.equippedSlots.appendChild(btn);
    }

    // Backpack Grid
    dom.backpackGrid.innerHTML = '';
    for (let i = 0; i < MAX_BAG_SLOTS; i++) {
      const item = p.bag[i];
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'bag-cell' + (item ? '' : ' empty');
      if (item) {
        cell.dataset.rarity = item.rarity;
        if (state.selectedInspect?.source === 'bag' && state.selectedInspect.key === i) {
          cell.classList.add('selected');
        }
        cell.innerHTML = `
          <span class="slot-type">${SLOT_LABELS[item.slot]}</span>
          <span class="slot-name rarity-${item.rarity}">${item.name}</span>
        `;
        cell.addEventListener('click', () => {
          state.selectedInspect = { source: 'bag', key: i };
          renderInventoryUI();
        });
      } else {
        cell.disabled = true;
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
      dom.itemComparePanel.innerHTML = '<div class="compare-empty">Tap an item in your satchel or equipped slots to inspect stats and compare upgrades.</div>';
      return;
    }

    const equippedItem = p.equipped[item.slot];
    const statKeys = ['atk', 'crit', 'hp', 'loh', 'arm'];
    const labels = { atk: 'Attack', crit: 'Crit %', hp: 'Max HP', loh: 'Life on Hit', arm: 'Armor' };

    let rowsHtml = '';
    for (const k of statKeys) {
      const val = item.stats[k] || 0;
      const eqVal = equippedItem?.stats?.[k] || 0;
      if (val === 0 && (sel.source === 'equipped' || eqVal === 0)) continue;
      const diff = Math.round((val - eqVal) * 10) / 10;
      let deltaHtml = '';
      if (sel.source === 'bag') {
        if (diff > 0) deltaHtml = `<span class="delta-pos">(+${diff})</span>`;
        else if (diff < 0) deltaHtml = `<span class="delta-neg">(${diff})</span>`;
        else deltaHtml = '<span class="delta-eq">(=)</span>';
      }
      rowsHtml += `<div class="affix-row"><span>${labels[k]}: +${val}${k === 'crit' ? '%' : ''}</span>${deltaHtml}</div>`;
    }

    const rarityLabel = RARITY[item.rarity]?.label || 'Common';
    const actionsHtml = sel.source === 'bag'
      ? `<div class="compare-actions">
           <button id="btnEquipItem" class="btn-equip" type="button">Equip ${SLOT_LABELS[item.slot]}</button>
           <button id="btnSalvageItem" type="button">Salvage (+${salvageGoldValue(item)}g)</button>
         </div>`
      : `<div class="compare-actions"><button id="btnUnequipItem" type="button">Move to Bag</button></div>`;

    dom.itemComparePanel.innerHTML = `
      <div class="compare-top">
        <span class="compare-title rarity-${item.rarity}">${item.name}</span>
        <span class="compare-sub">${rarityLabel} ${SLOT_LABELS[item.slot]}</span>
      </div>
      <div class="compare-affixes">${rowsHtml}</div>
      ${actionsHtml}
    `;

    if (sel.source === 'bag') {
      document.getElementById('btnEquipItem').addEventListener('click', () => {
        const idx = sel.key;
        const chosen = p.bag[idx];
        if (!chosen) return;
        const prev = p.equipped[chosen.slot];
        p.equipped[chosen.slot] = chosen;
        if (prev) p.bag[idx] = prev;
        else p.bag.splice(idx, 1);
        state.selectedInspect = { source: 'equipped', key: chosen.slot };
        syncPlayerVitalsBounds();
        sfx.loot();
        updateHud();
        renderInventoryUI();
        saveProgress();
      });

      document.getElementById('btnSalvageItem').addEventListener('click', () => {
        const idx = sel.key;
        const chosen = p.bag[idx];
        if (!chosen) return;
        const g = salvageGoldValue(chosen);
        p.gold += g;
        p.bag.splice(idx, 1);
        state.selectedInspect = null;
        sfx.loot();
        updateHud();
        renderInventoryUI();
        saveProgress();
      });
    } else {
      document.getElementById('btnUnequipItem')?.addEventListener('click', () => {
        if (p.bag.length >= MAX_BAG_SLOTS) {
          showToast('Satchel full!');
          return;
        }
        const slot = sel.key;
        p.bag.push(p.equipped[slot]);
        p.equipped[slot] = null;
        state.selectedInspect = null;
        syncPlayerVitalsBounds();
        updateHud();
        renderInventoryUI();
        saveProgress();
      });
    }

    void formatStatsLine;
  }

  function salvageGoldValue(item) {
    const base = item.rarity === 'legendary' ? 45 : item.rarity === 'rare' ? 22 : item.rarity === 'magic' ? 12 : 6;
    return base + (state.floor - 1) * 4;
  }

  // =========================================================================
  // CANVAS RESIZE, MAIN LOOP & PWA REGISTRATION
  // =========================================================================
  function resizeCanvas() {
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
      updatePlayer(dt);
      updateMonsters(dt);
      updateEffectsAndLoot(dt);
      renderIsometricWorld(now);

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
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setScreen('MAIN_MENU');
    registerServiceWorker();
    requestAnimationFrame(frame);
  }

  boot();
})();
