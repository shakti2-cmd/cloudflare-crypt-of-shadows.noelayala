(() => {
  'use strict';

  const NTFY_TOPIC = 'crypt_shadows_coop_v030';
  const NTFY_BASE = `https://ntfy.sh/${NTFY_TOPIC}`;
  const PEERJS_CDN = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
  const MAX_PARTY_SIZE = 4;

  function loadPeerJs() {
    if (window.Peer) return Promise.resolve(window.Peer);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-peerjs]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.Peer));
        existing.addEventListener('error', () => reject(new Error('PeerJS load failed')));
        return;
      }
      const s = document.createElement('script');
      s.src = PEERJS_CDN;
      s.async = true;
      s.dataset.peerjs = '1';
      s.onload = () => (window.Peer ? resolve(window.Peer) : reject(new Error('PeerJS missing')));
      s.onerror = () => reject(new Error('PeerJS load failed'));
      document.head.appendChild(s);
    });
  }

  function makeRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = 'CRYPT-';
    for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  const coop = {
    active: false,
    isHost: false,
    roomCode: '',
    localId: '',
    peer: null,
    conns: new Map(),   // peerId -> DataConnection
    peers: new Map(),   // peerId -> { id, name, cls, level, x, y, hp, maxHp, downed, facingX, facingY, updatedAt }
    lastSendAt: 0,
    heartbeatTimer: null,
    onRoomJoined: null,
    onBossHit: null,
    onRevive: null,
    onStatus: null,

    async listRooms() {
      try {
        const res = await fetch(`${NTFY_BASE}/json?poll=1&since=10m`, { cache: 'no-store' });
        if (!res.ok) return [];
        const text = await res.text();
        const roomsMap = new Map();
        for (const line of text.split('\n')) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line);
            if (!ev.message) continue;
            const msg = JSON.parse(ev.message);
            if (msg && msg.type === 'room_hb' && msg.code) {
              roomsMap.set(msg.code, {
                code: msg.code,
                hostName: msg.hostName || 'Adventurer',
                floor: msg.floor || 1,
                biome: msg.biome || 'crypt',
                players: msg.players || 1,
                ts: msg.ts || Date.now()
              });
            }
          } catch (_) {}
        }
        const now = Date.now();
        return Array.from(roomsMap.values()).filter((r) => now - r.ts < 120000);
      } catch (_) {
        return [];
      }
    },

    async publishHeartbeat(hostName, floor, biome) {
      if (!this.active || !this.isHost || !this.roomCode) return;
      try {
        await fetch(NTFY_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'room_hb',
            code: this.roomCode,
            hostName,
            floor,
            biome,
            players: 1 + this.conns.size,
            ts: Date.now()
          })
        });
      } catch (_) {}
    },

    async hostRoom(heroInfo, seed, floor, biome) {
      this.disconnect();
      const PeerCtor = await loadPeerJs();
      const code = makeRoomCode();
      this.roomCode = code;
      this.isHost = true;
      this.active = true;
      const peerId = `crypt-shadows-${code}`;

      return new Promise((resolve, reject) => {
        const peer = new PeerCtor(peerId, { debug: 0 });
        this.peer = peer;
        peer.on('open', (id) => {
          this.localId = id;
          this.publishHeartbeat(heroInfo.name, floor, biome);
          this.heartbeatTimer = setInterval(() => {
            this.publishHeartbeat(heroInfo.name, this._hostFloor || floor, this._hostBiome || biome);
          }, 25000);
          this._hostSeed = seed;
          this._hostFloor = floor;
          this._hostBiome = biome;
          if (this.onStatus) this.onStatus(`Hosting ${code}`);
          resolve({ code });
        });
        peer.on('connection', (conn) => {
          if (this.conns.size >= MAX_PARTY_SIZE - 1) {
            conn.close();
            return;
          }
          this._bindConn(conn);
          conn.on('open', () => {
            conn.send({
              t: 'welcome',
              seed: this._hostSeed,
              floor: this._hostFloor,
              biome: this._hostBiome
            });
          });
        });
        peer.on('error', (err) => {
          if (this.onStatus) this.onStatus(`Co-Op error: ${err?.type || 'network'}`);
          reject(err);
        });
      });
    },

    async joinRoom(rawCode, heroInfo) {
      this.disconnect();
      const code = String(rawCode || '').trim().toUpperCase();
      if (!code) throw new Error('Invalid room code');
      const PeerCtor = await loadPeerJs();
      this.roomCode = code;
      this.isHost = false;
      this.active = true;

      return new Promise((resolve, reject) => {
        const peer = new PeerCtor(undefined, { debug: 0 });
        this.peer = peer;
        peer.on('open', (id) => {
          this.localId = id;
          const conn = peer.connect(`crypt-shadows-${code}`, { reliable: false });
          this._bindConn(conn, () => {
            conn.send({ t: 'hello', hero: heroInfo });
          });
          const timeout = setTimeout(() => reject(new Error('Room timed out')), 10000);
          conn.on('data', (pkt) => {
            if (pkt && pkt.t === 'welcome') {
              clearTimeout(timeout);
              if (this.onRoomJoined) this.onRoomJoined(pkt);
              resolve(pkt);
            }
          });
          conn.on('error', (e) => { clearTimeout(timeout); reject(e); });
        });
        peer.on('error', (err) => reject(err));
      });
    },

    _bindConn(conn, onOpenExtra = null) {
      conn.on('open', () => {
        this.conns.set(conn.peer, conn);
        if (onOpenExtra) onOpenExtra();
      });
      conn.on('data', (pkt) => {
        if (!pkt || typeof pkt !== 'object') return;
        if (pkt.t === 'state') {
          this.peers.set(conn.peer, Object.assign({ id: conn.peer, updatedAt: Date.now() }, pkt.s));
          if (this.isHost) {
            // Relay state to other guests
            for (const [pid, c] of this.conns) {
              if (pid !== conn.peer && c.open) c.send({ t: 'peer_state', id: conn.peer, s: pkt.s });
            }
          }
        } else if (pkt.t === 'peer_state' && pkt.id) {
          this.peers.set(pkt.id, Object.assign({ id: pkt.id, updatedAt: Date.now() }, pkt.s));
        } else if (pkt.t === 'boss_hit' && this.onBossHit) {
          this.onBossHit(pkt.dmg || 0);
        } else if (pkt.t === 'revive' && pkt.targetId === this.localId && this.onRevive) {
          this.onRevive();
        } else if (pkt.t === 'floor_sync' && !this.isHost && this.onRoomJoined) {
          this.onRoomJoined(pkt);
        }
      });
      conn.on('close', () => {
        this.conns.delete(conn.peer);
        this.peers.delete(conn.peer);
      });
    },

    syncFloor(seed, floor, biome) {
      if (!this.active || !this.isHost) return;
      this._hostSeed = seed;
      this._hostFloor = floor;
      this._hostBiome = biome;
      for (const c of this.conns.values()) {
        if (c.open) c.send({ t: 'floor_sync', seed, floor, biome });
      }
    },

    broadcastState(stateObj) {
      if (!this.active || this.conns.size === 0) return;
      const now = performance.now();
      if (now - this.lastSendAt < 85) return;
      this.lastSendAt = now;
      for (const c of this.conns.values()) {
        if (c.open) c.send({ t: 'state', s: stateObj });
      }
    },

    sendBossHit(dmg) {
      if (!this.active || this.conns.size === 0) return;
      for (const c of this.conns.values()) {
        if (c.open) c.send({ t: 'boss_hit', dmg });
      }
    },

    sendRevive(targetId) {
      if (!this.active || this.conns.size === 0) return;
      for (const c of this.conns.values()) {
        if (c.open) c.send({ t: 'revive', targetId });
      }
    },

    disconnect() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      for (const c of this.conns.values()) {
        try { c.close(); } catch (_) {}
      }
      this.conns.clear();
      this.peers.clear();
      if (this.peer) {
        try { this.peer.destroy(); } catch (_) {}
        this.peer = null;
      }
      this.active = false;
      this.isHost = false;
      this.roomCode = '';
    }
  };

  window.CryptCoop = coop;
})();
