// Generate NOVA icon PNGs (192 & 512) — orange hexagon w/ white "N" on black.
// Pure-JS PNG (RFC 2083) using zlib + Node built-ins; no native deps.
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function makePNG(size) {
  const w = size, h = size;
  // RGBA pixel buffer
  const px = Buffer.alloc(w * h * 4);
  const cx = w / 2, cy = h / 2;
  const R = size * 0.42;        // hexagon radius (center to vertex)
  const R2 = size * 0.28;       // inner orange circle
  const R3 = size * 0.12;       // white core
  // Hexagon (pointy-top) vertex angles: start at -90deg so a vertex points up.
  const hexVerts = [];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 3;
    hexVerts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  function inHex(x, y) {
    // Point-in-convex-polygon: cross products all same sign (or zero).
    let sign = 0;
    for (let i = 0; i < 6; i++) {
      const [x1, y1] = hexVerts[i];
      const [x2, y2] = hexVerts[(i + 1) % 6];
      const cross = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);
      if (cross !== 0) {
        const s = cross > 0 ? 1 : -1;
        if (sign === 0) sign = s;
        else if (s !== sign) return false;
      }
    }
    return true;
  }
  // Pre-compute "N" geometry. We'll rasterize a bold angular N as two vertical bars + diagonal.
  // Normalized N in [-1,1]x[-1,1], centered; we fill a pixel when inside any stroke rectangle.
  const nHalf = size * 0.17;     // letter half-width (in px)
  const nTop = cy - size * 0.19;
  const nBot = cy + size * 0.19;
  const nLeftX = cx - size * 0.13;
  const nRightX = cx + size * 0.13;
  const strokeW = Math.max(2, Math.round(size * 0.055));
  function distToSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const x = x1 + t * dx, y = y1 + t * dy;
    return Math.hypot(px - x, py - y);
  }
  function inN(x, y) {
    // Left vertical bar (rectangle)
    if (x >= nLeftX - strokeW / 2 && x <= nLeftX + strokeW / 2 && y >= nTop && y <= nBot) return true;
    // Right vertical bar
    if (x >= nRightX - strokeW / 2 && x <= nRightX + strokeW / 2 && y >= nTop && y <= nBot) return true;
    // Diagonal from top-left bar to bottom-right bar
    if (distToSeg(x, y, nLeftX, nTop, nRightX, nBot) <= strokeW / 2) return true;
    return false;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // Background is black (transparent)
      let r = 0, g = 0, b = 0, a = 0;
      const dxC = x - cx + 0.5, dyC = y - cy + 0.5;
      const dist = Math.hypot(dxC, dyC);
      if (inHex(x + 0.5, y + 0.5)) {
        // Orange fill (#FF8C00)
        r = 0xFF; g = 0x8C; b = 0x00; a = 0xFF;
        // Subtle darker edge ring
        if (dist > R - size * 0.03) { r = 0xCC; g = 0x55; b = 0x00; }
      }
      // Inner bright glow circle (yellow-orange core)
      if (dist < R3 * 1.2) {
        const t = Math.max(0, 1 - dist / (R3 * 1.2));
        r = Math.round(0xFF * t + r * (1 - t));
        g = Math.round(0xE8 * t + g * (1 - t));
        b = Math.round(0xB0 * t + b * (1 - t));
      }
      // White "N" on top
      if (inN(x + 0.5, y + 0.5)) { r = 0xFF; g = 0xFF; b = 0xFF; a = 0xFF; }
      px[i] = r; px[i+1] = g; px[i+2] = b; px[i+3] = a;
    }
  }
  // Build scanlines with filter byte 0
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.writeFileSync(path.join(__dirname, "..", "public", "icon-192.png"), makePNG(192));
fs.writeFileSync(path.join(__dirname, "..", "public", "icon-512.png"), makePNG(512));
console.log("Wrote public/icon-192.png and public/icon-512.png");
