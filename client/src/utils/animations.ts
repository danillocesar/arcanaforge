import { showToast } from '../services/toastService';

export type AnimationStyle = 'personagem' | 'toast' | 'floating';

interface AnimOpts {
  type?: string;
  name?: string;
  mpCost?: number;
}

export function triggerAttackAnim(
  style: AnimationStyle,
  opts: AnimOpts = {},
): void {
  switch (style) {
    case 'personagem':
      playCharacterAnim(opts);
      break;
    case 'toast':
      playToastAnim(opts);
      break;
    case 'floating':
      playFloatingAnim(opts);
      break;
  }
}

function playCharacterAnim(opts: AnimOpts) {
  let overlay = document.getElementById('atkAnimOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'atkAnimOverlay';
    overlay.className = 'atk-anim-overlay';
    document.body.appendChild(overlay);
  }

  let emoji: string;
  let animClass: string;
  if (opts.type === 'ranged') {
    emoji = '🏹';
    animClass = 'anim-arrow';
  } else if (opts.type === 'magic' || (opts.mpCost && opts.mpCost > 0 && opts.type === 'magic')) {
    emoji = '✨';
    animClass = 'anim-magic';
  } else {
    emoji = '⚔️';
    animClass = 'anim-slash';
  }

  const label = opts.mpCost && opts.mpCost > 0
    ? `${opts.name || 'Ataque'} — ${opts.mpCost} PM`
    : opts.name || 'Ataque';

  overlay.innerHTML = `<div class="atk-anim-char ${animClass}">${emoji}</div><div class="atk-anim-label">${label}</div>`;
  overlay.classList.add('active');

  setTimeout(() => {
    overlay!.innerHTML = '';
    overlay!.classList.remove('active');
  }, 1200);
}

function playToastAnim(opts: AnimOpts) {
  const mpCost = opts.mpCost && opts.mpCost > 0 ? opts.mpCost : undefined;
  showToast(`${opts.name || 'Ataque'} usado!`, 'attack', mpCost);
}

function playFloatingAnim(opts: AnimOpts) {
  const el = document.createElement('div');
  el.className = 'atk-floating';
  el.textContent = opts.mpCost && opts.mpCost > 0 ? `-${opts.mpCost} PM` : 'Hit!';
  document.body.appendChild(el);

  const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6'];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'atk-particle';
    const angle = (i / 12) * Math.PI * 2;
    const dist = 40 + Math.random() * 40;
    Object.assign(p.style, {
      position: 'absolute',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: colors[i % colors.length],
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      transition: 'all 0.6s ease-out',
      opacity: '1',
    });
    el.appendChild(p);
    requestAnimationFrame(() => {
      p.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px))`;
      p.style.opacity = '0';
    });
  }

  requestAnimationFrame(() => {
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%, -50%) translateY(-30px)';
  });
  setTimeout(() => el.remove(), 1300);
}
