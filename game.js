(() => {
  'use strict';

  // =========================================================================
  // CONSTANTS & CONFIG
  // =========================================================================
  const SAVE_KEY = 'crypt_arpg_v010_save';
  const MAP_W = 42;
  const MAP_H = 42;
  const TILE_W = 64;
  const TILE_H = 32;
  const WALL_H = 52;
  const MAX_BAG_SLOTS = 20;

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

  const SKILL_CONFIG = {
    1: { name: 'Whirlwind Cleave', mana: 15, cd: 4.5, elId: 'btnSkill1' },
    2: { name: 'Fireball',         mana: 20, cd: 3.5, elId: 'btnSkill2' },
    3: { name: 'Holy Nova',        mana: 28, cd: 7.0, elId: 'btnSkill3' }
  };

  // =========================================================================
  // DOM REFERENCES
  // =========================================================================
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const minimapCanvas = document.getElementById('minimapCanvas');
  const mctx = minimapCanvas.getContext('2d');

  const dom = {
    hpOrbFill: document.getElementById('hpOrbFill'),
    hpText: document.getElementById('hpText'),
    mpOrbFill: document.getElementById('mpOrbFill'),
    mpText: document.getElementById('mpText'),
    heroLevelText: document.getElementById('heroLevelText'),
    goldValue: document.getElementById('goldValue'),
    xpBarFill: document.getElementById('xpBarFill'),
    floorBadge: document.getElementById('floorBadge'),
    seedBadge: document.getElementById('seedBadge'),
    bossBar: document.getElementById('bossBar'),
    bossName: document.getElementById('bossName'),
    bossHpText: document.getElementById('bossHpText'),
    bossHpFill: document.getElementById('bossHpFill'),
    toastBanner: document.getElementById('toastBanner'),
    btnInventory: document.getElementById('btnInventory'),
    lootCountBadge: document.getElementById('lootCountBadge'),
    btnNewFloor: document.getElementById('btnNewFloor'),
    newFloorBtnLabel: document.getElementById('newFloorBtnLabel'),
    joystickZone: document.getElementById('joystickZone'),
    joystickKnob: document.getElementById('joystickKnob'),
    btnAttack: document.getElementById('btnAttack'),
    btnSkill1: document.getElementById('btnSkill1'),
    btnSkill2: document.getElementById('btnSkill2'),
    btnSkill3: document.getElementById('btnSkill3'),
    btnPotion: document.getElementById('btnPotion'),
    potionCount: document.getElementById('potionCount'),
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
    unlock() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    },
    tone(freq, endFreq, dur, type = 'triangle', gainVal = 0.08) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
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
    slash() { this.tone(360, 120, 0.11, 'sawtooth', 0.06); },
    crit()  { this.tone(620, 210, 0.16, 'square', 0.08); this.tone(920, 440, 0.14, 'triangle', 0.06); },
    fire()  { this.tone(240, 75, 0.24, 'sawtooth', 0.09); },
    holy()  { this.tone(520, 880, 0.26, 'sine', 0.08); this.tone(660, 1040, 0.28, 'triangle', 0.05); },
    loot()  { this.tone(720, 1180, 0.12, 'sine', 0.07); },
    lvl()   { this.tone(440, 880, 0.35, 'triangle', 0.09); }
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
    barrel: null
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
  }

  // =========================================================================
  // HERO, GEAR & PERSISTENCE STATE
  // =========================================================================
  function createStarterGear() {
    return {
      weapon: {
        id: 'starter_blade',
        name: 'Iron Broadsword',
        slot: 'weapon',
        rarity: 'common',
        stats: { atk: 12, crit: 4 }
      },
      helm: {
        id: 'starter_helm',
        name: 'Tempered Barbute',
        slot: 'helm',
        rarity: 'common',
        stats: { hp: 20, arm: 3 }
      },
      armor: {
        id: 'starter_armor',
        name: 'Cryptguard Cuirass',
        slot: 'armor',
        rarity: 'common',
        stats: { hp: 30, arm: 6 }
      },
      ring: null
    };
  }

  const state = {
    floor: 1,
    seed: 1047,
    rng: null,
    grid: [],
    tileVariant: [],
    explored: [],
    rooms: [],
    waypoint: { x: 0, y: 0 },
    stairs: { x: 0, y: 0, unlocked: false },
    torches: [],
    gates: [],
    props: [],
    monsters: [],
    lootDrops: [],
    projectiles: [],
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
      walkPhase: 0,
      attackAnim: 0,
      castAnim: 0,
      attackCd: 0,
      potionCd: 0,
      skillCds: { 1: 0, 2: 0, 3: 0 },
      hitFlash: 0,
      dead: false,
      kills: 0,
      equipped: createStarterGear(),
      bag: []
    },
    selectedInspect: null, // { source: 'bag'|'equipped', indexOrSlot }
    pendingLootTarget: null,
    toastTimer: 0,
    lastSaveAt: 0
  };

  function getHeroStats() {
    const p = state.player;
    const totals = {
      atk: 10 + (p.level - 1) * 4,
      crit: 6 + (p.level - 1) * 0.5,
      maxHp: 100 + (p.level - 1) * 24,
      maxMp: 75 + (p.level - 1) * 8,
      loh: 0,
      arm: 2 + (p.level - 1) * 1.5
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
    totals.crit = Math.min(65, Math.round(totals.crit * 10) / 10);
    return totals;
  }

  function syncPlayerVitalsBounds() {
    const st = getHeroStats();
    state.player.maxHp = st.maxHp;
    state.player.maxMp = st.maxMp;
    state.player.hp = Math.min(state.player.hp, state.player.maxHp);
    state.player.mp = Math.min(state.player.mp, state.player.maxMp);
  }

  function saveProgress() {
    try {
      const p = state.player;
      const payload = {
        v: '0.1.0',
        floor: state.floor,
        seed: state.seed,
        level: p.level,
        xp: p.xp,
        nextXp: p.nextXp,
        gold: p.gold,
        potions: p.potions,
        kills: p.kills,
        equipped: p.equipped,
        bag: p.bag
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (_) {
      // Ignore private-mode storage quota errors
    }
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      const p = state.player;
      if (Number.isFinite(data.floor) && data.floor >= 1) state.floor = data.floor;
      if (Number.isFinite(data.seed)) state.seed = data.seed;
      if (Number.isFinite(data.level) && data.level >= 1) p.level = data.level;
      if (Number.isFinite(data.xp)) p.xp = data.xp;
      if (Number.isFinite(data.nextXp)) p.nextXp = data.nextXp;
      if (Number.isFinite(data.gold)) p.gold = data.gold;
      if (Number.isFinite(data.potions)) p.potions = data.potions;
      if (Number.isFinite(data.kills)) p.kills = data.kills;
      if (data.equipped) p.equipped = Object.assign(createStarterGear(), data.equipped);
      if (Array.isArray(data.bag)) p.bag = data.bag.slice(0, MAX_BAG_SLOTS);
    } catch (_) {
      // Fallback to fresh save
    }
    syncPlayerVitalsBounds();
    state.player.hp = state.player.maxHp;
    state.player.mp = state.player.maxMp;
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

    // 8. Spawn Dungeon Monsters (Skeletal Warriors, Champion Ghouls, Boss Horned Demon Brute)
    const floorMult = 1 + (state.floor - 1) * 0.28;
    for (const r of state.rooms) {
      if (r === spawnRoom) continue;

      if (r === bossRoom) {
        state.monsters.push(createMonster('boss', bossRoom.cx + 0.2, bossRoom.cy - 0.9, floorMult));
        // Two skeletal honor guards
        state.monsters.push(createMonster('skeleton', bossRoom.x + 1.2, bossRoom.y + 1.2, floorMult));
        state.monsters.push(createMonster('skeleton', bossRoom.x + bossRoom.w - 1.2, bossRoom.y + bossRoom.h - 1.2, floorMult));
        continue;
      }

      const skelCount = randInt(rng, 2, 4);
      for (let i = 0; i < skelCount; i++) {
        const mx = r.x + 1 + rng() * Math.max(1, r.w - 2);
        const my = r.y + 1 + rng() * Math.max(1, r.h - 2);
        state.monsters.push(createMonster('skeleton', mx, my, floorMult));
      }

      if (rng() > 0.35 || r.id % 2 === 1) {
        const gx = r.cx + (rng() - 0.5) * 1.6;
        const gy = r.cy + (rng() - 0.5) * 1.6;
        state.monsters.push(createMonster('ghoul', gx, gy, floorMult));
      }
    }

    updateFogOfWar();
    updateHud();
    showToast(`Floor ${state.floor} • Crypt (#${state.seed})`);
  }

  function createMonster(type, x, y, floorMult) {
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
    return {
      id: Math.random().toString(36).slice(2, 9),
      type,
      name: s.name,
      x,
      y,
      hp: s.maxHp,
      maxHp: s.maxHp,
      atk: s.atk,
      speed: s.speed,
      range: s.range,
      aggro: s.aggro,
      atkCdMax: s.cd,
      atkCd: 0.3,
      xp: s.xp,
      radius: s.radius,
      tier: s.tier,
      facingX: 0,
      facingY: 1,
      walkPhase: Math.random() * Math.PI * 2,
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

  function updateFogOfWar() {
    const px = Math.floor(state.player.x);
    const py = Math.floor(state.player.y);
    const visR = 8;

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (state.explored[y][x] === 2) state.explored[y][x] = 1;
      }
    }

    for (let y = Math.max(0, py - visR); y <= Math.min(MAP_H - 1, py + visR); y++) {
      for (let x = Math.max(0, px - visR); x <= Math.min(MAP_W - 1, px + visR); x++) {
        if (dist(px, py, x, y) <= visR) {
          state.explored[y][x] = 2;
        }
      }
    }
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

    if (sourceTier === 'boss') {
      pushDrop({ kind: 'gold', amount: Math.round((45 + Math.random() * 35) * state.floor), label: 'Boss Hoard' });
      pushDrop({ kind: 'potion', amount: 1, label: 'Crimson Vial' });
      const gearRarity = Math.random() < 0.45 ? 'legendary' : 'rare';
      const item = generateItem(gearRarity);
      pushDrop({ kind: 'gear', item, rarity: gearRarity, label: item.name });
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

    if (sourceTier === 'elite') {
      pushDrop({ kind: 'gold', amount: Math.round((18 + Math.random() * 18) * state.floor), label: 'Gold Coins' });
      const rarity = roll < 0.18 ? 'legendary' : roll < 0.55 ? 'rare' : 'magic';
      const item = generateItem(rarity);
      pushDrop({ kind: 'gear', item, rarity, label: item.name });
      return;
    }

    if (sourceTier === 'prop') {
      if (roll < 0.55) {
        const amt = Math.round((6 + Math.random() * 10) * state.floor);
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
      const amt = Math.round((8 + Math.random() * 14) * state.floor);
      pushDrop({ kind: 'gold', amount: amt, label: `${amt} Gold` });
    } else if (roll < 0.58) {
      pushDrop({ kind: 'potion', amount: 1, label: 'Health Potion' });
    } else if (roll < 0.88) {
      const rarity = roll > 0.84 ? 'legendary' : roll > 0.74 ? 'rare' : 'magic';
      const item = generateItem(rarity);
      pushDrop({ kind: 'gear', item, rarity, label: item.name });
    }
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
      addFloatText(drop.x, drop.y, '+1 Potion', '#fca5a5', false);
      sfx.loot();
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
      }
      sfx.loot();
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
    grantXp(m.xp);
    spawnLootDrop(m.x, m.y, m.tier);

    if (m.type === 'boss') {
      state.stairs.unlocked = true;
      state.camera.shake = 9;
      showToast('Horned Demon Brute Slain! Descent Stairs Unsealed!');
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

  function performSwordSlash() {
    const p = state.player;
    if (p.dead || p.attackCd > 0) return;
    p.attackCd = 0.34;
    p.attackAnim = 0.24;

    if (input.aimX !== null && input.aimY !== null) {
      p.facingX = input.aimX;
      p.facingY = input.aimY;
    } else {
      autoFaceTarget(3.4);
    }

    sfx.slash();
    const stats = getHeroStats();
    const reach = 2.05;
    state.slashArcs.push({
      x: p.x,
      y: p.y,
      angle: Math.atan2(p.facingY, p.facingX),
      life: 0.2,
      maxLife: 0.2,
      radius: 44,
      color: '#fde047'
    });

    for (let i = state.monsters.length - 1; i >= 0; i--) {
      const m = state.monsters[i];
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d <= reach + m.radius) {
        const dot = (dx / (d || 1)) * p.facingX + (dy / (d || 1)) * p.facingY;
        if (dot >= -0.25 || d < 1.05) {
          damageMonster(m, stats.atk, dx / (d || 1), dy / (d || 1), true);
        }
      }
    }

    breakNearbyProps(p.x + p.facingX * 0.9, p.y + p.facingY * 0.9, 1.45);
  }

  function castSkill(slotId) {
    const p = state.player;
    const cfg = SKILL_CONFIG[slotId];
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

    if (slotId === 1) {
      // Whirlwind Cleave (360-degree AoE)
      sfx.slash();
      state.novaWaves.push({ x: p.x, y: p.y, r: 0.4, maxR: 2.35, color: '#facc15', life: 0.28, maxLife: 0.28 });
      state.camera.shake = Math.max(state.camera.shake, 4);
      for (let i = state.monsters.length - 1; i >= 0; i--) {
        const m = state.monsters[i];
        const d = dist(p.x, p.y, m.x, m.y);
        if (d <= 2.35 + m.radius) {
          const nx = (m.x - p.x) / (d || 1);
          const ny = (m.y - p.y) / (d || 1);
          damageMonster(m, stats.atk * 1.65, nx, ny, true);
        }
      }
      breakNearbyProps(p.x, p.y, 2.35);
    } else if (slotId === 2) {
      // Fireball projectile
      autoFaceTarget(9.0);
      sfx.fire();
      state.projectiles.push({
        x: p.x + p.facingX * 0.45,
        y: p.y + p.facingY * 0.45,
        vx: p.facingX * 10.5,
        vy: p.facingY * 10.5,
        dmg: stats.atk * 2.1,
        life: 1.4
      });
    } else if (slotId === 3) {
      // Holy Nova: AoE damage + brief stun + heal
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
          const nx = (m.x - p.x) / (d || 1);
          const ny = (m.y - p.y) / (d || 1);
          damageMonster(m, stats.atk * 1.45, nx, ny, true);
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
    sfx.holy();
    addFloatText(p.x, p.y, `+${heal} HP`, '#4ade80', false);
    spawnParticles(p.x, p.y, '#ef4444', 10, 2.2);
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
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        if (!dom.inventoryDrawer.open) e.preventDefault();
      }
      if (k === 'i') {
        toggleInventory();
        return;
      }
      if (dom.inventoryDrawer.open || state.player.dead) return;

      input.keys.add(k);
      if (k === ' ') performSwordSlash();
      else if (k === '1') castSkill(1);
      else if (k === '2') castSkill(2);
      else if (k === '3') castSkill(3);
      else if (k === 'q') drinkHealthPotion();
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
    bindBtn(dom.btnAttack, performSwordSlash);
    bindBtn(dom.btnSkill1, () => castSkill(1));
    bindBtn(dom.btnSkill2, () => castSkill(2));
    bindBtn(dom.btnSkill3, () => castSkill(3));
    bindBtn(dom.btnPotion, drinkHealthPotion);

    // Canvas Tap / Click: Loot Nameplate hit-test OR Desktop Sword Slash toward cursor
    canvas.addEventListener('pointerdown', (e) => {
      sfx.unlock();
      if (state.player.dead || dom.inventoryDrawer.open) return;

      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      // 1. Check tappable ground item nameplates first
      for (let i = state.lootDrops.length - 1; i >= 0; i--) {
        const d = state.lootDrops[i];
        if (!d.screenRect) continue;
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

      // 2. Otherwise aim toward click & slash
      const worldX = sx - rect.width * 0.5 + state.camera.x;
      const worldY = sy - rect.height * 0.5 + state.camera.y;
      const wp = isoToWorld(worldX, worldY);
      const dx = wp.x - state.player.x;
      const dy = wp.y - state.player.y;
      const len = Math.hypot(dx, dy) || 1;
      input.aimX = dx / len;
      input.aimY = dy / len;
      performSwordSlash();
      input.aimX = null;
      input.aimY = null;
    });

    // Top-right & modal controls
    dom.btnInventory.addEventListener('click', () => { sfx.unlock(); toggleInventory(); });
    dom.btnCloseInventory.addEventListener('click', () => toggleInventory(false));
    dom.inventoryDrawer.addEventListener('click', (e) => {
      if (e.target === dom.inventoryDrawer) toggleInventory(false);
    });

    dom.btnNewFloor.addEventListener('click', () => {
      sfx.unlock();
      const nextFloor = state.stairs.unlocked ? state.floor + 1 : state.floor;
      const nextSeed = Math.floor(1000 + Math.random() * 8999);
      generateDungeon(nextSeed, nextFloor);
      saveProgress();
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
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    dom.deathOverlay.classList.add('hidden');
    if (reroll) {
      generateDungeon(Math.floor(1000 + Math.random() * 8999), state.floor);
    } else {
      p.x = state.waypoint.x - 0.7;
      p.y = state.waypoint.y + 0.7;
      const camIso = worldToIso(p.x, p.y);
      state.camera.x = camIso.x;
      state.camera.y = camIso.y;
      updateFogOfWar();
    }
    updateHud();
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
    for (const s of [1, 2, 3]) {
      p.skillCds[s] = Math.max(0, p.skillCds[s] - dt);
    }

    // Passive Mana & Waypoint Sanctum Regeneration
    p.mp = Math.min(p.maxMp, p.mp + 4.5 * dt);
    if (dist(p.x, p.y, state.waypoint.x, state.waypoint.y) <= 2.2) {
      p.hp = Math.min(p.maxHp, p.hp + 16 * dt);
      p.mp = Math.min(p.maxMp, p.mp + 14 * dt);
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
          // Convert world direction back to screen-space input
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
      // Map screen-aligned X/Y into 2:1 isometric world axes
      let wx = nsx + nsy;
      let wy = nsy - nsx;
      const wLen = Math.hypot(wx, wy) || 1;
      wx /= wLen;
      wy /= wLen;

      const speed = 4.65;
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

    // Iron Gates smoothly lift open as hero approaches
    for (const g of state.gates) {
      const near = dist(p.x, p.y, g.x, g.y) <= 2.7;
      if (near && !g.isOpen) {
        g.isOpen = true;
      }
      if (g.isOpen && g.open < 1) {
        g.open = Math.min(1, g.open + dt * 3.2);
      }
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
      const nextSeed = Math.floor(1000 + Math.random() * 8999);
      generateDungeon(nextSeed, nextFloor);
      saveProgress();
    }
  }

  function updateMonsters(dt) {
    const p = state.player;
    const stats = getHeroStats();
    let activeBoss = null;

    for (let i = 0; i < state.monsters.length; i++) {
      const m = state.monsters[i];
      m.hitFlash = Math.max(0, m.hitFlash - dt);
      m.stunTimer = Math.max(0, m.stunTimer - dt);
      m.atkCd = Math.max(0, m.atkCd - dt);

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
            damagePlayer(Math.round(m.atk * 1.45));
          }
          m.atkCd = m.atkCdMax;
        }
        continue;
      }

      if (d > m.range) {
        // Separation force from sibling monsters
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
          damagePlayer(m.atk);
        }
      }
    }

    // Toggle Boss Bar
    if (activeBoss) {
      dom.bossBar.classList.remove('hidden');
      dom.bossName.textContent = activeBoss.name;
      dom.bossHpText.textContent = `${Math.max(0, activeBoss.hp)} / ${activeBoss.maxHp}`;
      dom.bossHpFill.style.width = `${clamp((activeBoss.hp / activeBoss.maxHp) * 100, 0, 100)}%`;
    } else {
      dom.bossBar.classList.add('hidden');
    }

    void stats;
  }

  function damagePlayer(rawDmg) {
    const p = state.player;
    if (p.dead) return;
    const stats = getHeroStats();
    const mitigated = Math.max(2, Math.round(rawDmg - stats.arm * 0.45));
    p.hp = Math.max(0, p.hp - mitigated);
    p.hitFlash = 0.16;
    state.camera.shake = Math.max(state.camera.shake, 3.5);
    addFloatText(p.x, p.y, `-${mitigated}`, '#ef4444', false);
    spawnParticles(p.x, p.y, '#dc2626', 6, 2.0);

    if (p.hp <= 0) {
      p.dead = true;
      dom.deathSummary.textContent = `Slain on Floor ${state.floor} • Level ${p.level} Paladin (${p.kills} foes vanquished).`;
      dom.deathOverlay.classList.remove('hidden');
    }
    updateHud();
  }

  function updateEffectsAndLoot(dt) {
    // Projectiles (Fireball)
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const pr = state.projectiles[i];
      pr.life -= dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      if (Math.random() < 0.6) {
        spawnParticles(pr.x, pr.y, '#f97316', 1, 0.8, 18);
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
        state.novaWaves.push({ x: pr.x, y: pr.y, r: 0.25, maxR: 2.0, color: '#f97316', life: 0.24, maxLife: 0.24 });
        spawnParticles(pr.x, pr.y, '#fb923c', 14, 3.4, 16);
        state.camera.shake = Math.max(state.camera.shake, 4);
        for (let j = state.monsters.length - 1; j >= 0; j--) {
          const m = state.monsters[j];
          const d = dist(pr.x, pr.y, m.x, m.y);
          if (d <= 2.0 + m.radius) {
            damageMonster(m, pr.dmg, (m.x - pr.x) / (d || 1), (m.y - pr.y) / (d || 1), true);
          }
        }
        breakNearbyProps(pr.x, pr.y, 1.9);
        state.projectiles.splice(i, 1);
      }
    }

    // Loot Drop parabolic bounce
    for (const d of state.lootDrops) {
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
  // ISOMETRIC RENDERER (DEPTH-SORTED PASSES)
  // =========================================================================
  function renderIsometricWorld(now) {
    const viewW = canvas.clientWidth;
    const viewH = canvas.clientHeight;
    if (!viewW || !viewH) return;

    ctx.clearRect(0, 0, viewW, viewH);
    ctx.fillStyle = '#07080c';
    ctx.fillRect(0, 0, viewW, viewH);

    const shakeX = (Math.random() - 0.5) * state.camera.shake * 2;
    const shakeY = (Math.random() - 0.5) * state.camera.shake * 2;
    const offX = viewW * 0.5 - state.camera.x + shakeX;
    const offY = viewH * 0.5 - state.camera.y + shakeY;

    // Pass 1: Explored Ground Tiles
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const exp = state.explored[y][x];
        if (!exp) continue;
        const t = state.grid[y][x];
        if (t !== TILE.FLOOR && t !== TILE.SANCTUM && t !== TILE.BOSS_FLOOR) continue;

        const iso = worldToIso(x + 0.5, y + 0.5);
        const sx = iso.x + offX;
        const sy = iso.y + offY;
        if (sx < -80 || sx > viewW + 80 || sy < -80 || sy > viewH + 80) continue;

        const sprite = t === TILE.SANCTUM
          ? atlas.sanctum
          : t === TILE.BOSS_FLOOR
            ? atlas.bossFloor
            : atlas.floors[state.tileVariant[y][x] % atlas.floors.length];

        ctx.drawImage(sprite, sx - TILE_W * 0.5 - 1, sy - TILE_H * 0.5 - 1);
        if (exp === 1) {
          ctx.fillStyle = 'rgba(4, 5, 9, 0.52)';
          drawIsoDiamondPath(ctx, sx, sy, TILE_W, TILE_H);
          ctx.fill();
        }
      }
    }

    // Pass 1b: Ground Light Pools (Torches, Waypoint Portal, Descent Stairs, Nova Waves)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const tc of state.torches) {
      const exp = state.explored[Math.floor(tc.y)]?.[Math.floor(tc.x)];
      if (!exp) continue;
      const iso = worldToIso(tc.x, tc.y);
      const sx = iso.x + offX;
      const sy = iso.y + offY;
      if (sx < -140 || sx > viewW + 140 || sy < -140 || sy > viewH + 140) continue;
      const flicker = 0.88 + Math.sin(now * 0.009 + tc.phase) * 0.12;
      const r = 74 * flicker;
      const g = ctx.createRadialGradient(sx, sy - 6, 4, sx, sy - 6, r);
      if (tc.isArcane) {
        g.addColorStop(0, 'rgba(59, 130, 246, 0.28)');
        g.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else {
        g.addColorStop(0, 'rgba(249, 115, 22, 0.25)');
        g.addColorStop(0.5, 'rgba(217, 119, 6, 0.11)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 6, r, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    drawWaypointAndStairs(offX, offY, now);

    // Nova rings on ground
    for (const w of state.novaWaves) {
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

    // Pass 2: Build Depth-Sorted Drawables (col + row painter's algorithm)
    const drawList = [];

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (!state.explored[y][x] || state.grid[y][x] !== TILE.WALL) continue;
        const iso = worldToIso(x + 0.5, y + 0.5);
        const sx = iso.x + offX;
        const sy = iso.y + offY;
        if (sx < -80 || sx > viewW + 80 || sy < -100 || sy > viewH + 100) continue;
        drawList.push({
          depth: x + y + 0.5,
          draw: () => {
            ctx.drawImage(atlas.wall, sx - TILE_W * 0.5 - 1, sy - TILE_H * 0.5 - WALL_H - 1);
            if (state.explored[y][x] === 1) {
              ctx.fillStyle = 'rgba(4, 5, 9, 0.45)';
              ctx.fillRect(sx - TILE_W * 0.5, sy - TILE_H * 0.5 - WALL_H, TILE_W, TILE_H + WALL_H);
            }
          }
        });
      }
    }

    // Wall Torches
    for (const tc of state.torches) {
      if (!state.explored[Math.floor(tc.y)]?.[Math.floor(tc.x)]) continue;
      const iso = worldToIso(tc.x, tc.y);
      const sx = iso.x + offX;
      const sy = iso.y + offY;
      drawList.push({
        depth: tc.x + tc.y,
        draw: () => drawTorch(sx, sy, now, tc.phase, tc.isArcane)
      });
    }

    // Iron Gates
    for (const g of state.gates) {
      if (!state.explored[Math.floor(g.y)]?.[Math.floor(g.x)]) continue;
      const iso = worldToIso(g.x, g.y);
      drawList.push({
        depth: g.x + g.y,
        draw: () => drawIronGate(iso.x + offX, iso.y + offY, g)
      });
    }

    // Destructible Urns & Barrels
    for (const pr of state.props) {
      if (pr.broken) continue;
      if (!state.explored[Math.floor(pr.y)]?.[Math.floor(pr.x)]) continue;
      const iso = worldToIso(pr.x, pr.y);
      const sprite = pr.kind === 'urn' ? atlas.urn : atlas.barrel;
      drawList.push({
        depth: pr.x + pr.y,
        draw: () => ctx.drawImage(sprite, iso.x + offX - 18, iso.y + offY - 34)
      });
    }

    // Loot Drops (Vertical Rarity Beams + Icons)
    for (const d of state.lootDrops) {
      const iso = worldToIso(d.x, d.y);
      drawList.push({
        depth: d.x + d.y,
        draw: () => drawLootGroundVisual(iso.x + offX, iso.y + offY - d.z, d, now)
      });
    }

    // Monsters (visible tiles only)
    for (const m of state.monsters) {
      if (state.explored[Math.floor(m.y)]?.[Math.floor(m.x)] !== 2) continue;
      const iso = worldToIso(m.x, m.y);
      drawList.push({
        depth: m.x + m.y,
        draw: () => drawMonster(iso.x + offX, iso.y + offY, m, now)
      });
    }

    // Armored Paladin Hero
    const pIso = worldToIso(state.player.x, state.player.y);
    drawList.push({
      depth: state.player.x + state.player.y,
      draw: () => drawPaladin(pIso.x + offX, pIso.y + offY, now)
    });

    drawList.sort((a, b) => a.depth - b.depth);
    for (let i = 0; i < drawList.length; i++) {
      drawList[i].draw();
    }

    // Pass 3: Slash Arcs, Fireball Projectiles & Particles
    for (const s of state.slashArcs) {
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

    for (const pr of state.projectiles) {
      const iso = worldToIso(pr.x, pr.y);
      const sx = iso.x + offX;
      const sy = iso.y + offY - 18;
      const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, 14);
      g.addColorStop(0, '#fef08a');
      g.addColorStop(0.45, '#f97316');
      g.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const pt of state.particles) {
      const iso = worldToIso(pt.x, pt.y);
      ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(iso.x + offX, iso.y + offY - pt.z, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Pass 4: Atmospheric Torchlit Vignette
    const vig = ctx.createRadialGradient(
      viewW * 0.5,
      viewH * 0.5,
      Math.min(viewW, viewH) * 0.24,
      viewW * 0.5,
      viewH * 0.5,
      Math.max(viewW, viewH) * 0.72
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(4, 5, 8, 0.68)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, viewW, viewH);

    // Pass 5: Floating Damage Numbers & Tappable Ground Loot Nameplates
    drawFloatingDamageNumbers(offX, offY);
    drawLootNameplates(offX, offY);
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

    // Descent Stairs in Boss Chamber
    if (state.explored[Math.floor(state.stairs.y)]?.[Math.floor(state.stairs.x)]) {
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

  function drawPaladin(sx, sy, now) {
    const p = state.player;
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
    // Crimson Paladin cloak sway
    ctx.fillStyle = flash ? '#ffffff' : '#7f1d1d';
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

    // Armored Cuirass
    ctx.fillStyle = flash ? '#ffffff' : '#94a3b8';
    ctx.beginPath();
    ctx.roundRect(sx - 8, sy - 28 + breath, 16, 17, 3);
    ctx.fill();
    // Gold breastplate trim
    ctx.fillStyle = '#facc15';
    ctx.fillRect(sx - 1.5, sy - 26 + breath, 3, 12);

    // Greathelm + glowing visor
    ctx.fillStyle = flash ? '#ffffff' : '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(sx - 6.5, sy - 40 + breath, 13, 12, 4);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sx - 4.5, sy - 35 + breath, 9, 2.5);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(sx - 3, sy - 34.5 + breath, 6, 1.5);

    // Kite Shield
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

    // Broadsword + swing pose
    const swingAngle = p.attackAnim > 0 ? -1.4 + (1 - p.attackAnim / 0.24) * 2.4 : (p.castAnim > 0 ? -1.2 : 0.35);
    ctx.save();
    ctx.translate(sx + 8, sy - 20 + breath);
    ctx.rotate(swingAngle);
    ctx.fillStyle = p.attackAnim > 0 ? '#fef08a' : '#e2e8f0';
    ctx.fillRect(-1.5, -20, 3, 18);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-5, -3, 10, 2.5);
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

    // Elite blue arcane aura
    if (isGhoul) {
      ctx.strokeStyle = `rgba(96, 165, 250, ${0.55 + Math.sin(now * 0.008) * 0.25})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 2, 16, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
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

    // Overhead compact HP bar for wounded non-boss foes
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
      if (d.z > 4) {
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

    mctx.clearRect(0, 0, mw, mh);
    mctx.fillStyle = 'rgba(7, 8, 12, 0.92)';
    mctx.fillRect(0, 0, mw, mh);

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const exp = state.explored[y][x];
        if (!exp) continue;
        const t = state.grid[y][x];
        if (t === TILE.WALL) {
          mctx.fillStyle = exp === 2 ? '#475569' : '#262d3d';
        } else if (t !== TILE.VOID) {
          mctx.fillStyle = exp === 2 ? '#1e293b' : '#111622';
        } else {
          continue;
        }
        mctx.fillRect(x * cellW, y * cellH, Math.ceil(cellW), Math.ceil(cellH));
      }
    }

    // Waypoint
    mctx.fillStyle = '#60a5fa';
    mctx.fillRect(state.waypoint.x * cellW - 2, state.waypoint.y * cellH - 2, 4, 4);

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
      if (d.kind === 'gear') {
        mctx.fillStyle = RARITY[d.rarity]?.color || '#facc15';
        mctx.fillRect(d.x * cellW - 1, d.y * cellH - 1, 2.5, 2.5);
      }
    }

    // Hero dot
    mctx.fillStyle = '#4ade80';
    mctx.beginPath();
    mctx.arc(state.player.x * cellW, state.player.y * cellH, 3, 0, Math.PI * 2);
    mctx.fill();
  }

  // =========================================================================
  // HUD & INVENTORY DRAWER UI
  // =========================================================================
  function showToast(msg) {
    dom.toastBanner.textContent = msg;
    dom.toastBanner.classList.remove('hidden');
    state.toastTimer = 2.6;
  }

  function updateHud() {
    const p = state.player;
    dom.hpOrbFill.style.height = `${clamp((p.hp / p.maxHp) * 100, 0, 100)}%`;
    dom.mpOrbFill.style.height = `${clamp((p.mp / p.maxMp) * 100, 0, 100)}%`;
    dom.hpText.textContent = `${Math.ceil(p.hp)}`;
    dom.mpText.textContent = `${Math.floor(p.mp)}`;

    dom.heroLevelText.textContent = `Lv ${p.level} Paladin`;
    dom.goldValue.textContent = p.gold.toLocaleString();
    dom.xpBarFill.style.width = `${clamp((p.xp / p.nextXp) * 100, 0, 100)}%`;
    dom.floorBadge.textContent = `Floor ${state.floor} • Crypt`;
    dom.seedBadge.textContent = `#${state.seed} • v0.1.0`;

    dom.lootCountBadge.textContent = p.bag.length;
    dom.potionCount.textContent = p.potions;
    dom.newFloorBtnLabel.textContent = state.stairs.unlocked ? 'Next Floor' : 'New Map';
    dom.btnNewFloor.classList.toggle('ready-glow', state.stairs.unlocked);

    // Skill & potion cooldown sweeps
    for (const id of [1, 2, 3]) {
      const cfg = SKILL_CONFIG[id];
      const btn = document.getElementById(cfg.elId);
      const rem = p.skillCds[id];
      const frac = rem > 0 ? clamp(rem / cfg.cd, 0, 1) : 0;
      btn.style.setProperty('--cd', frac.toFixed(3));
      btn.classList.toggle('is-cooldown', rem > 0);
      btn.querySelector('.cd-text').textContent = rem > 0 ? rem.toFixed(1) : '';
    }
    const pFrac = p.potionCd > 0 ? clamp(p.potionCd / 1.2, 0, 1) : 0;
    dom.btnPotion.style.setProperty('--cd', pFrac.toFixed(3));
    dom.btnPotion.classList.toggle('is-cooldown', p.potionCd > 0);
    dom.btnPotion.querySelector('.cd-text').textContent = p.potionCd > 0 ? p.potionCd.toFixed(1) : '';
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
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  let lastFrame = performance.now();
  let hudTick = 0;

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
    lastFrame = now;

    updatePlayer(dt);
    updateMonsters(dt);
    updateEffectsAndLoot(dt);
    renderIsometricWorld(now);

    hudTick += dt;
    if (hudTick >= 0.08) {
      hudTick = 0;
      updateHud();
      renderMinimap();
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
    generateDungeon(state.seed, state.floor);
    registerServiceWorker();
    requestAnimationFrame(frame);
  }

  boot();
})();
