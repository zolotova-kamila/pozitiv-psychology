// Картинка карты: настоящий рисунок из cards/img/NN.webp, а пока его нет — нарисованная заглушка.
(() => {
  'use strict';

  const H = 290;           // линия горизонта (нижняя треть карты — часть стиля колоды)
  const GLOW = '#F2C879';  // тёплый источник света есть на каждой карте
  const CREAM = '#FAF8F5';

  const PALETTES = [
    { top: '#D9C9D6', bot: '#F1E4D8', gr: '#A88F82', ac: '#C98B8B' }, // мальва и песок
    { top: '#CFC9DD', bot: '#EFE6DC', gr: '#9C8E86', ac: '#D4A5A5' }, // лаванда
    { top: '#B8A9C9', bot: '#F0D9C0', gr: '#85746F', ac: '#E8B4A0' }, // вечерняя сирень
    { top: '#E3C7C7', bot: '#F6EADC', gr: '#B9977D', ac: '#9C8AA8' }, // пыльная роза
    { top: '#D5D3DA', bot: '#F3EDE6', gr: '#9A918D', ac: '#C98B8B' }, // дымка
    { top: '#A99BBF', bot: '#EBCFB4', gr: '#6F6266', ac: '#F2C879' }, // сумерки
  ];

  const hex = (cx, cy, r) => {
    let p = '';
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      p += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    }
    return `${p}Z`;
  };

  // Каждый мотив рисует один предмет карты простыми фигурами.
  const motifs = {
    thread: ({ ac, gr: K }) => `
      <circle cx="105" cy="${H - 34}" r="34" fill="${ac}"/>
      <g fill="none" stroke="${CREAM}" stroke-opacity=".65" stroke-width="2" stroke-linecap="round">
        <path d="M78 ${H - 44}C96 ${H - 66} 128 ${H - 56} 137 ${H - 32}"/>
        <path d="M72 ${H - 30}C98 ${H - 50} 128 ${H - 40} 133 ${H - 16}"/>
      </g>
      <path d="M138 ${H - 30}C168 ${H - 18} 190 ${H - 6} 214 ${H - 22}S240 ${H - 58} 228 ${H - 90}" fill="none" stroke="${ac}" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="224" y="${H - 120}" width="5" height="112" fill="${K}"/><circle cx="226" cy="${H - 124}" r="22" fill="${K}"/>`,

    lighthouse: ({ gr: K }) => `
      <path d="M140 ${H - 30}L146 ${H - 120}H156L162 ${H - 30}Z" fill="${K}"/>
      <path d="M141 ${H - 134}L151 ${H - 148}L161 ${H - 134}Z" fill="${K}"/>
      <rect x="143" y="${H - 134}" width="16" height="14" fill="${GLOW}"/>
      <ellipse cx="151" cy="${H - 127}" rx="48" ry="30" fill="${GLOW}" opacity=".22"/>
      <g fill="${CREAM}" opacity=".6">
        <ellipse cx="150" cy="${H - 26}" rx="200" ry="26"/><ellipse cx="70" cy="${H - 66}" rx="130" ry="16"/><ellipse cx="240" cy="${H - 96}" rx="110" ry="14"/>
      </g>`,

    stairs: ({ ac }) => {
      let s = '';
      for (let i = 0; i < 7; i++) {
        const x = 46 + i * 28, y = H - 34 - i * 30;
        s += `<rect x="${x}" y="${y}" width="38" height="12" rx="6" fill="${CREAM}" opacity=".92"/><rect x="${x + 4}" y="${y + 12}" width="30" height="4" rx="2" fill="${ac}" opacity=".25"/>`;
      }
      return `${s}<ellipse cx="228" cy="${H - 34 - 6 * 30 - 16}" rx="26" ry="22" fill="${GLOW}" opacity=".3"/><circle cx="228" cy="${H - 34 - 6 * 30 - 16}" r="6" fill="${GLOW}"/>`;
    },

    birds: ({ gr: K }) => {
      let s = '';
      for (let i = 0; i < 7; i++) {
        s += `<path d="M0 0L24 -7L9 2L4 10Z" transform="translate(${64 + i * 30 + (i % 2) * 10} ${150 - (i * 37) % 70}) rotate(${-24 + (i % 3) * 8})" fill="${CREAM}" stroke="${K}" stroke-opacity=".25"/>`;
      }
      let b = '';
      for (let i = 0; i < 6; i++) b += `<rect x="${60 + i * 30}" y="${H - 14}" width="30" height="16" fill="${i % 2 ? K : CREAM}" opacity=".9"/>`;
      return s + b;
    },

    table: ({ gr: K, ac }) => `
      <path d="M0 ${H - 30}H120V400H0Z" fill="${K}"/>
      <rect x="70" y="${H - 72}" width="82" height="5" fill="${CREAM}"/>
      <path d="M84 ${H - 67}V${H - 30}M138 ${H - 67}V${H - 12}" stroke="${CREAM}" stroke-width="2"/>
      <rect x="92" y="${H - 88}" width="4" height="16" fill="${ac}"/><rect x="116" y="${H - 88}" width="4" height="16" fill="${ac}"/>
      <circle cx="94" cy="${H - 93}" r="4" fill="${GLOW}"/><circle cx="118" cy="${H - 93}" r="4" fill="${GLOW}"/>`,

    hourglass: ({ ac }) => `
      <path d="M116 ${H - 186}H184L158 ${H - 112}L184 ${H - 36}H116L142 ${H - 112}Z" fill="${CREAM}" fill-opacity=".3" stroke="${CREAM}" stroke-width="2"/>
      <rect x="110" y="${H - 194}" width="80" height="8" rx="3" fill="${ac}"/><rect x="110" y="${H - 38}" width="80" height="8" rx="3" fill="${ac}"/>
      <path d="M130 ${H - 184}H170L152 ${H - 136}H148Z" fill="${ac}"/>
      <path d="M150 ${H - 112}V${H - 138}" stroke="${ac}" stroke-width="2" stroke-dasharray="2 4"/>
      <path d="M136 ${H - 38}L150 ${H - 60}L164 ${H - 38}Z" fill="${ac}" opacity=".7"/>
      <g><circle cx="60" cy="${H + 14}" r="4" fill="${GLOW}"/><circle cx="92" cy="${H + 26}" r="4" fill="${CREAM}"/><circle cx="210" cy="${H + 18}" r="4" fill="${GLOW}"/><circle cx="244" cy="${H + 30}" r="4" fill="${CREAM}"/></g>`,

    knot: ({ gr: K, ac }) => `
      <rect x="36" y="80" width="14" height="${H - 70}" fill="${K}"/>
      <path d="M46 110C110 92 190 108 262 94" fill="none" stroke="${K}" stroke-width="9" stroke-linecap="round"/>
      <ellipse cx="150" cy="104" rx="13" ry="25" fill="none" stroke="${ac}" stroke-width="6"/>
      <circle cx="150" cy="132" r="10" fill="${ac}"/>
      <path d="M150 140C150 196 214 180 240 124" fill="none" stroke="${ac}" stroke-width="6" stroke-linecap="round"/>`,

    stone: () => `
      <g fill="none" stroke="${CREAM}" stroke-opacity=".55" stroke-width="1.5">
        <ellipse cx="150" cy="${H + 26}" rx="104" ry="18"/><ellipse cx="150" cy="${H + 26}" rx="72" ry="12"/><ellipse cx="150" cy="${H + 26}" rx="42" ry="7"/>
      </g>
      <ellipse cx="150" cy="${H + 18}" rx="36" ry="22" fill="#E8E2DA"/><ellipse cx="140" cy="${H + 10}" rx="14" ry="7" fill="${CREAM}" opacity=".8"/>`,

    shell: ({ ac }) => `
      <path d="M150 ${H - 6}L116 40H184Z" fill="${GLOW}" opacity=".16"/>
      <path d="M150 ${H - 2}C96 ${H - 6} 90 ${H - 66} 150 ${H - 78}C210 ${H - 66} 204 ${H - 6} 150 ${H - 2}Z" fill="${CREAM}"/>
      <g stroke="${ac}" stroke-opacity=".5" stroke-width="1.5" fill="none"><path d="M150 ${H - 4}V${H - 76}M150 ${H - 4}L112 ${H - 56}M150 ${H - 4}L188 ${H - 56}"/></g>
      <path d="M142 ${H - 34}Q150 ${H - 48} 158 ${H - 34}" fill="none" stroke="${GLOW}" stroke-width="4" stroke-linecap="round"/>`,

    sail: ({ gr: K, ac }) => `
      <path d="M-10 ${H + 8}Q80 ${H - 30} 170 ${H + 4}T310 ${H - 6}V400H-10Z" fill="${ac}" opacity=".55"/>
      <rect x="148" y="${H - 176}" width="4" height="${H - 100}" fill="${K}"/>
      <path d="M154 ${H - 170}Q226 ${H - 112} 154 ${H - 36}Z" fill="${CREAM}"/>
      <path d="M146 ${H - 150}Q108 ${H - 104} 146 ${H - 62}Z" fill="${CREAM}" opacity=".8"/>`,

    spring: ({ gr: K }) => {
      let d = 'M64 ' + (H - 100);
      for (let i = 1; i <= 16; i++) d += `L${64 + i * 11} ${H - 106 + (i % 2 ? -16 : 16)}`;
      return `<path d="M-20 ${H}L66 ${H - 130}L152 ${H}Z" fill="${K}"/><path d="M148 ${H}L236 ${H - 140}L320 ${H}Z" fill="${K}"/>
        <path d="${d}" fill="none" stroke="${GLOW}" stroke-width="3.5" stroke-linejoin="round"/>`;
    },

    hive: ({ ac }) => {
      let s = '';
      const r = 22, dx = r * Math.sqrt(3);
      [[150, 190], [150 + dx, 190], [150 - dx, 190], [150 + dx / 2, 190 - dx * 0.87], [150 - dx / 2, 190 - dx * 0.87], [150 + dx / 2, 190 + dx * 0.87], [150 - dx / 2, 190 + dx * 0.87]].forEach(([x, y]) => {
        s += `<path d="${hex(x, y, r - 2)}" fill="${GLOW}" fill-opacity=".45" stroke="${CREAM}" stroke-width="2"/>`;
      });
      for (let i = 0; i < 9; i++) s += `<circle cx="${70 + (i * 53) % 170}" cy="${110 + (i * 37) % 130}" r="2.6" fill="${ac}"/>`;
      return `<rect x="147" y="${H - 50}" width="6" height="50" fill="${CREAM}" opacity=".7"/>${s}`;
    },

    door: ({ ac, gr: K }) => `
      <path d="M100 ${H + 2}V${H - 92}A50 50 0 0 1 200 ${H - 92}V${H + 2}Z" fill="${ac}"/>
      <path d="M110 ${H + 2}V${H - 90}A40 40 0 0 1 190 ${H - 90}V${H + 2}Z" fill="${K}" opacity=".3"/>
      <circle cx="180" cy="${H - 42}" r="4" fill="${GLOW}"/>
      <rect x="104" y="${H}" width="92" height="4" fill="${GLOW}"/>`,

    eggs: ({ gr: K }) => {
      let s = '';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
        const x = 52 + c * 48 + (r % 2) * 24, y = H - 16 + r * 30 - 40 * (r === 0 ? 0 : 0);
        const cracked = r === 0 && c === 2;
        if (cracked) s += `<ellipse cx="${x}" cy="${y}" rx="20" ry="24" fill="${GLOW}" opacity=".4"/>`;
        s += `<ellipse cx="${x}" cy="${y}" rx="11" ry="14" fill="${CREAM}"/>`;
        if (cracked) s += `<path d="M${x - 8} ${y - 4}L${x - 2} ${y - 1}L${x + 2} ${y - 8}L${x + 8} ${y - 3}" fill="none" stroke="${K}" stroke-width="1.5"/><path d="M${x - 2} ${y - 1}L${x} ${y + 3}" stroke="${GLOW}" stroke-width="2"/>`;
      }
      return s;
    },

    wheel: ({ ac, gr: K }) => {
      let spokes = '';
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i, x2 = 150 + 66 * Math.cos(a), y2 = H - 100 + 66 * Math.sin(a);
        spokes += `<path d="M150 ${H - 100}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${ac}" stroke-width="5" stroke-linecap="round"/><circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="5" fill="${ac}"/>`;
      }
      return `<rect x="147" y="${H - 50}" width="6" height="52" fill="${K}"/>
        <circle cx="150" cy="${H - 100}" r="52" fill="none" stroke="${ac}" stroke-width="7"/>${spokes}<circle cx="150" cy="${H - 100}" r="12" fill="${ac}"/>`;
    },

    windows: () => {
      const tints = ['#F2C879', '#CFDAD0', '#8FA9A3', '#E7B99A', '#FAF8F5'];
      let s = '';
      for (let i = 0; i < 5; i++) {
        const x = 24 + i * 52, up = (i % 2) * 18, y = H - 124 - up;
        s += `<rect x="${x}" y="${y}" width="44" height="${124 + up}" fill="${tints[i]}" stroke="${CREAM}" stroke-width="3"/>`;
        if (i % 3 === 0) s += `<circle cx="${x + 22}" cy="${y + 26}" r="8" fill="#FFF3D0"/>`;
        if (i === 1) s += `<ellipse cx="${x + 22}" cy="${y + 30}" rx="14" ry="7" fill="#FAF8F5"/>`;
      }
      return s;
    },

    suitcase: ({ ac, gr: K }) => `
      <rect x="105" y="${H - 64}" width="90" height="62" rx="7" fill="${ac}"/>
      <path d="M135 ${H - 64}V${H - 74}H165V${H - 64}" fill="none" stroke="${K}" stroke-width="4"/>
      <path d="M118 ${H - 64}V${H - 2}M182 ${H - 64}V${H - 2}" stroke="${K}" stroke-opacity=".35" stroke-width="4"/>
      <rect x="147" y="${H - 138}" width="6" height="66" fill="${K}"/><circle cx="150" cy="${H - 150}" r="26" fill="${K}"/><circle cx="162" cy="${H - 158}" r="12" fill="${GLOW}" opacity=".6"/>`,

    horn: ({ gr: K }) => `
      <path d="M40 ${H}L110 ${H - 46}L180 ${H}Z" fill="${K}"/>
      <path d="M84 ${H - 84}L84 ${H - 62}L142 ${H - 32}L142 ${H - 114}Z" fill="${CREAM}"/>
      <g fill="none" stroke="${GLOW}" stroke-linecap="round" stroke-width="3">
        <path d="M156 ${H - 106}Q184 ${H - 73} 156 ${H - 40}"/><path d="M176 ${H - 128}Q222 ${H - 73} 176 ${H - 18}" opacity=".7"/><path d="M198 ${H - 150}Q262 ${H - 73} 198 ${H + 4}" opacity=".45"/>
      </g>`,

    island: ({ gr: K }) => `
      <ellipse cx="150" cy="${H + 6}" rx="74" ry="20" fill="#6F8F6A"/>
      <rect x="118" y="${H - 80}" width="5" height="82" fill="${K}"/><circle cx="120" cy="${H - 88}" r="24" fill="${K}"/>
      <rect x="180" y="${H - 66}" width="3" height="66" fill="${CREAM}"/>
      <circle cx="181" cy="${H - 70}" r="20" fill="${GLOW}" opacity=".3"/><circle cx="181" cy="${H - 70}" r="5" fill="${GLOW}"/>
      <ellipse cx="150" cy="${H + 34}" rx="70" ry="8" fill="${CREAM}" opacity=".25"/>`,

    teapot: ({ ac }) => `
      <ellipse cx="150" cy="${H + 8}" rx="72" ry="14" fill="#E8E2DA"/>
      <circle cx="136" cy="${H - 18}" r="23" fill="${ac}"/><rect x="124" y="${H - 46}" width="24" height="6" rx="3" fill="${ac}"/><circle cx="136" cy="${H - 50}" r="3.5" fill="${CREAM}"/>
      <path d="M156 ${H - 26}Q184 ${H - 40} 178 ${H - 56}" fill="none" stroke="${ac}" stroke-width="5" stroke-linecap="round"/>
      <path d="M112 ${H - 28}Q92 ${H - 24} 108 ${H - 8}" fill="none" stroke="${ac}" stroke-width="4"/>
      <path d="M190 ${H - 2}h22v8a11 11 0 0 1-22 0Z" fill="${CREAM}"/><path d="M220 ${H - 2}h22v8a11 11 0 0 1-22 0Z" fill="${CREAM}"/>
      <g fill="none" stroke="${CREAM}" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"><path d="M180 ${H - 62}q-8 -12 0 -24t0 -22"/><path d="M190 ${H - 62}q-8 -12 0 -24"/></g>`,

    bridge: ({ gr: K }) => `
      <path d="M72 ${H}L92 400H208L228 ${H}Z" fill="${K}" opacity=".6"/>
      <path d="M40 ${H - 8}Q150 ${H - 150} 260 ${H - 8}" fill="none" stroke="${GLOW}" stroke-opacity=".3" stroke-width="22" stroke-linecap="round"/>
      <path d="M40 ${H - 8}Q150 ${H - 150} 260 ${H - 8}" fill="none" stroke="${GLOW}" stroke-width="8" stroke-linecap="round"/>
      <path d="M96 ${H - 8}Q150 ${H - 60} 204 ${H - 8}" fill="none" stroke="${CREAM}" stroke-opacity=".5" stroke-width="2"/>`,

    blanket: ({ gr: K, ac }) => `
      <path d="M-20 ${H + 10}Q150 ${H - 210} 320 ${H + 10}Z" fill="${K}"/>
      <path d="M26 ${H + 10}Q150 ${H - 176} 274 ${H + 10}Q244 ${H - 22} 214 ${H - 36}Q176 ${H - 6} 140 ${H - 28}Q100 ${H - 2} 70 ${H - 28}Q44 ${H - 8} 26 ${H + 10}Z" fill="${ac}"/>
      <rect x="132" y="${H - 96}" width="14" height="18" rx="2" fill="${GLOW}"/><rect x="164" y="${H - 80}" width="14" height="18" rx="2" fill="${GLOW}"/><rect x="104" y="${H - 66}" width="12" height="16" rx="2" fill="${GLOW}"/>`,

    fence: ({ ac }) => {
      let s = `<rect x="40" y="${H - 30}" width="60" height="4" fill="${CREAM}"/><rect x="40" y="${H - 16}" width="60" height="4" fill="${CREAM}"/>
        <rect x="190" y="${H - 30}" width="70" height="4" fill="${CREAM}"/><rect x="190" y="${H - 16}" width="70" height="4" fill="${CREAM}"/>`;
      for (let i = 0; i < 8; i++) if (i !== 3 && i !== 4) s += `<rect x="${40 + i * 30}" y="${H - 42}" width="6" height="46" fill="${CREAM}"/>`;
      s += `<rect x="100" y="${H - 42}" width="6" height="46" fill="${CREAM}"/><rect x="190" y="${H - 42}" width="6" height="46" fill="${CREAM}"/>`;
      s += `<rect x="106" y="${H - 38}" width="4" height="40" fill="${CREAM}" transform="rotate(-62 106 ${H})"/>`;
      for (let i = 0; i < 8; i++) s += `<circle cx="${60 + i * 24}" cy="${H + 18 + (i % 3) * 6}" r="4" fill="${i % 2 ? GLOW : ac}"/>`;
      return s;
    },

    wave: () => `
      <path d="M44 ${H + 6}C44 ${H - 170} 256 ${H - 170} 256 ${H + 6}" fill="none" stroke="${CREAM}" stroke-opacity=".35" stroke-width="26"/>
      <path d="M44 ${H + 6}C44 ${H - 170} 256 ${H - 170} 256 ${H + 6}" fill="none" stroke="${CREAM}" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="150" cy="${H + 14}" rx="38" ry="12" fill="${GLOW}" opacity=".3"/>
      <path d="M128 ${H + 8}H172L160 ${H + 22}H140Z" fill="${GLOW}"/><path d="M150 ${H + 8}V${H - 18}L166 ${H + 4}Z" fill="${CREAM}"/>`,
  };

  let counter = 0;

  function placeholderSvg(card) {
    const c = PALETTES[card.hue % PALETTES.length];
    const n = ++counter;
    const sx = 50 + (card.id * 67) % 200;
    const sy = 60 + (card.id * 41) % 90;
    const body = (motifs[card.motif] || (() => ''))(c);
    return `<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Заглушка карты «${card.title}»" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sk${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.top}"/><stop offset=".75" stop-color="${c.bot}"/></linearGradient>
        <radialGradient id="gl${n}"><stop offset="0" stop-color="${GLOW}" stop-opacity=".85"/><stop offset="1" stop-color="${GLOW}" stop-opacity="0"/></radialGradient>
        <filter id="gr${n}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${card.id}"/><feColorMatrix type="saturate" values="0"/></filter>
      </defs>
      <rect width="300" height="400" fill="url(#sk${n})"/>
      <circle cx="${sx}" cy="${sy}" r="74" fill="url(#gl${n})"/><circle cx="${sx}" cy="${sy}" r="11" fill="${GLOW}"/>
      <path d="M0 ${H}Q75 ${H - 14} 150 ${H - 4}T300 ${H - 10}V400H0Z" fill="${c.gr}"/>
      ${body}
      <rect width="300" height="400" filter="url(#gr${n})" opacity=".09"/>
    </svg>`;
  }

  const pad = (n) => String(n).padStart(2, '0');

  // Возвращает блок с картинкой. onState(true/false) сообщает, найден ли настоящий рисунок.
  function art(card, onState) {
    const deck = window.ARHIV_DECK;
    const el = document.createElement('div');
    el.className = 'art';
    el.innerHTML = placeholderSvg(card);
    const img = new Image();
    img.alt = card.desc || card.title; // описание видят только программы чтения с экрана, на странице его нет
    img.decoding = 'async';
    img.onload = () => { el.replaceChildren(img); el.dataset.real = '1'; if (onState) onState(true); };
    img.onerror = () => { el.dataset.real = '0'; if (onState) onState(false); };
    const v = deck.imageVersion ? `?v=${deck.imageVersion}` : '';
    img.src = `${deck.imageDir}${pad(card.id)}.${deck.imageExt}${v}`;
    return el;
  }

  window.ArhivArt = { art, pad };
})();
