import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from '../../lib/gsap';
import { useTicker, clamp } from '../../lib/hooks';
import { useIntroDone } from '../../lib/intro';
import { useReducedMotion } from '../../lib/runtime';
import { scrollVelocity } from '../../lib/scroll';
import { BuddyHead } from '../buddy/Buddy';
import { BUDDY } from '../buddy/palette';
import './companion.css';

/**
 * A small buddy that lives in the viewport and wanders the whole site.
 * - roams between random spots (never a fixed path) with a soft spring, and
 *   trails the page a little when you scroll fast
 * - looks at, and points an arm at, the pointer
 * - always smiling; laughs when hovered; gets sad when clicked ("you hit me")
 * - talks in cloud bubbles, with lines that match the section you are in
 * Everything per-frame runs on the shared GSAP ticker and writes straight to
 * the DOM, so React never re-renders while it moves.
 */
type Mood = 'idle' | 'laugh' | 'sad';

const LINES: Record<string, string[]> = {
  top: ["hi! I'm Sam's little buddy 👋", 'scroll down, I will tag along!', 'move your mouse. I will point at it.'],
  work: ['seven worlds, one for each project.', 'click a scene to step inside it!', 'which one is your favourite?'],
  stack: ['the tools behind all of this.', 'bigger sticker = used in more projects.'],
  about: ["that's Sam: designer, developer, student.", 'psst... there is a hidden door on this site 👀'],
  contact: ['go say hi on Instagram, GitHub or LinkedIn!', "don't be shy 💬"],
  detail: ['one of the seven worlds. scroll for the details!', 'there is a way back at the top.'],
  lost: ['oops. I think we are lost. me too!'],
  any: ['still here! 😊', 'having fun?', 'I could float around here all day.'],
};
const LAUGH = ['hehe!', 'hahaha 😄', 'that tickles!', 'hihi!!', 'again, again!'];
const OUCH = ['ouch!! why did you hit me? 😢', 'that hurt... 😭', 'meanie!! 😢', 'ow... what did I do?'];
const FORGIVE = ['...okay, I forgive you 🥲', 'I am fine. really. 🙂'];
const SECTIONS = ['top', 'work', 'stack', 'about', 'contact'];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[], not?: T): T => {
  const pool = arr.length > 1 && not !== undefined ? arr.filter((v) => v !== not) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
};
const shortest = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180;

export default function Companion() {
  const introDone = useIntroDone();
  const reduce = useReducedMotion();
  const { pathname } = useLocation();
  const routeKey = pathname.startsWith('/work/') ? 'detail' : pathname === '/' ? '' : 'lost';

  const rootRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<SVGGElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);
  const armRRef = useRef<SVGGElement>(null);
  const armLRef = useRef<SVGGElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const alwaysOn = useRef(true);
  const s = useRef({
    x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0,
    placed: false, nextPick: 0, nextChat: 0, lag: 0,
    aimX: -1, aimY: -1, aimSeen: false,
    angR: 62, angL: 118,
    mood: 'idle' as Mood, moodUntil: 0, flee: 0, hover: false,
    lastLine: '', section: '', sectionSaid: {} as Record<string, number>,
    side: 'above', bubbleOn: false,
    typeTimer: 0, hideTimer: 0, talkTimer: 0, calmTimer: 0,
  });
  const routeRef = useRef(routeKey);
  useEffect(() => {
    routeRef.current = routeKey;
  }, [routeKey]);

  const size = () => (window.innerWidth < 700 ? 74 : 98);

  const setMood = (m: Mood) => {
    s.current.mood = m;
    rootRef.current?.setAttribute('data-mood', m);
  };

  const say = (text: string, hold = 3600) => {
    const st = s.current;
    const bubble = bubbleRef.current;
    const out = textRef.current;
    const root = rootRef.current;
    if (!bubble || !out || !root) return;
    window.clearTimeout(st.typeTimer);
    window.clearTimeout(st.hideTimer);
    st.lastLine = text;
    st.bubbleOn = true;
    bubble.setAttribute('data-show', 'true');
    root.setAttribute('data-talk', 'true');
    if (reduce) {
      out.textContent = text;
      st.talkTimer = window.setTimeout(() => root.setAttribute('data-talk', 'false'), 600);
    } else {
      let i = 0;
      const step = () => {
        i += 1;
        out.textContent = text.slice(0, i);
        if (i < text.length) st.typeTimer = window.setTimeout(step, 26);
        else st.talkTimer = window.setTimeout(() => root.setAttribute('data-talk', 'false'), 260);
      };
      out.textContent = '';
      step();
    }
    st.hideTimer = window.setTimeout(() => {
      bubble.setAttribute('data-show', 'false');
      st.bubbleOn = false;
    }, hold + text.length * 26);
  };

  // where the pointer is (last mouse position, or last tap on touch)
  useEffect(() => {
    const st = s.current;
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      st.aimX = e.clientX;
      st.aimY = e.clientY;
      st.aimSeen = true;
    };
    const down = (e: PointerEvent) => {
      st.aimX = e.clientX;
      st.aimY = e.clientY;
      st.aimSeen = true;
      // touch screens: the buddy is click-through (CSS), so a tap that lands on him is detected here
      if (e.pointerType === 'touch' && rootRef.current) {
        const r = rootRef.current.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) hitRef.current();
      }
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
    };
  }, []);

  // clear timers on unmount
  useEffect(() => {
    const st = s.current;
    return () => {
      window.clearTimeout(st.typeTimer);
      window.clearTimeout(st.hideTimer);
      window.clearTimeout(st.talkTimer);
      window.clearTimeout(st.calmTimer);
    };
  }, []);

  // arrival: drop in on the home page and say hello
  useEffect(() => {
    if (!introDone) return;
    const t = window.setTimeout(() => say(LINES.top[0], 4200), 1300);
    return () => window.clearTimeout(t);
    // say() only reads refs; run once per arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introDone]);

  const chooseTarget = (fleeFrom?: boolean) => {
    const st = s.current;
    const sz = size();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const m = 14;
    const top = 84;
    const maxX = Math.max(m, w - sz - m);
    const maxY = Math.max(top, h - sz * 1.25 - m);
    let best = { x: rand(m, maxX), y: rand(top, maxY) };
    let bestD = -1;
    for (let i = 0; i < 9; i++) {
      let cx: number;
      let cy: number;
      if (!fleeFrom && st.aimSeen && Math.random() < 0.4) {
        const a = rand(0, Math.PI * 2);
        const d = rand(170, 300);
        cx = clamp(st.aimX + Math.cos(a) * d - sz / 2, m, maxX);
        cy = clamp(st.aimY + Math.sin(a) * d - sz / 2, top, maxY);
      } else {
        cx = rand(m, maxX);
        cy = rand(top, maxY);
      }
      const d = st.aimSeen ? Math.hypot(cx + sz / 2 - st.aimX, cy + sz / 2 - st.aimY) : 999;
      if (fleeFrom ? d > bestD : d > 150) {
        best = { x: cx, y: cy };
        bestD = d;
        if (!fleeFrom) break;
      }
    }
    st.tx = best.x;
    st.ty = best.y;
  };

  const sectionNow = () => {
    if (routeRef.current) return routeRef.current;
    const mid = window.innerHeight * 0.5;
    for (const id of SECTIONS) {
      const r = document.getElementById(id)?.getBoundingClientRect();
      if (r && r.top <= mid && r.bottom > mid) return id;
    }
    return '';
  };

  useTicker((t, dt) => {
    const root = rootRef.current;
    if (!root) return;
    const st = s.current;
    const sz = size();
    const w = window.innerWidth;
    const h = window.innerHeight;
    root.style.setProperty('--cp-size', `${sz}px`);

    // first placement: bottom-left of the hero, a little in from the edge
    if (!st.placed) {
      st.placed = true;
      st.x = st.tx = reduce ? w - sz - 16 : w * 0.1;
      st.y = st.ty = reduce ? h - sz * 1.25 - 16 : h * 0.56;
      st.nextPick = t + 3;
      st.nextChat = t + 11;
    }

    // wander: new random spot every few seconds
    if (!reduce) {
      if (t > st.nextPick) {
        chooseTarget(false);
        st.nextPick = t + rand(3.2, 6.5);
      }
    } else {
      st.tx = w - sz - 16;
      st.ty = h - sz * 1.25 - 16;
    }

    // hold still while he is being tickled or poked, so he can actually be clicked
    if (st.hover && st.mood !== 'sad') {
      st.tx = st.x;
      st.ty = st.y;
      st.vx *= 0.8;
      st.vy *= 0.8;
      st.nextPick = Math.max(st.nextPick, t + 1.2);
    }

    // soft spring (a hair underdamped: it floats, it does not slide)
    const k = st.flee > t ? 32 : 7;
    const c = st.flee > t ? 9 : 4.4;
    st.vx += ((st.tx - st.x) * k - st.vx * c) * dt;
    st.vy += ((st.ty - st.y) * k - st.vy * c) * dt;
    st.x += st.vx * dt;
    st.y += st.vy * dt;
    st.x = clamp(st.x, 4, Math.max(4, w - sz - 4));
    st.y = clamp(st.y, 60, Math.max(60, h - sz * 1.25 - 2));

    // fast scrolling drags the buddy along behind the page
    const lagTarget = reduce ? 0 : clamp(scrollVelocity.get() * -1.1, -70, 70);
    st.lag += (lagTarget - st.lag) * (1 - Math.exp(-dt * 5));

    const bobX = reduce ? 0 : Math.sin(t * 1.1) * 6;
    const bobY = reduce ? 0 : Math.sin(t * 2.1) * 5;
    const px = st.x + bobX;
    const py = st.y + bobY + st.lag;
    const tilt = reduce ? 0 : clamp(st.vx * 0.028, -11, 11);
    root.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
    if (tiltRef.current) tiltRef.current.style.transform = `rotate(${tilt.toFixed(2)}deg)`;

    // look and point at the pointer
    const sc = sz / 120;
    const cx = px + 60 * sc;
    const cy = py + 62 * sc;
    const ax = st.aimSeen ? st.aimX : cx + 120;
    const ay = st.aimSeen ? st.aimY : cy + 80;
    const dx = ax - cx;
    const dy = ay - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const look = Math.min(1, dist / 220);
    if (pupilsRef.current) {
      const sad = st.mood === 'sad';
      pupilsRef.current.style.transform = `translate(${((dx / dist) * 6.5 * look).toFixed(2)}px, ${((dy / dist) * 5 * look + (sad ? 4 : 0)).toFixed(2)}px)`;
    }
    const rest = st.mood === 'idle' ? 0 : 1;
    const pointRight = dx >= 0;
    const targetR = !rest && pointRight ? (Math.atan2(ay - (py + 110 * sc), ax - (px + 84 * sc)) * 180) / Math.PI : st.mood === 'laugh' ? 40 : 76;
    const targetL = !rest && !pointRight ? (Math.atan2(ay - (py + 110 * sc), ax - (px + 36 * sc)) * 180) / Math.PI : st.mood === 'laugh' ? 140 : 104;
    const ease = 1 - Math.exp(-dt * 9);
    st.angR += shortest(st.angR, targetR) * ease;
    st.angL += shortest(st.angL, targetL) * ease;
    if (armRRef.current) armRRef.current.style.transform = `rotate(${st.angR.toFixed(1)}deg)`;
    if (armLRef.current) armLRef.current.style.transform = `rotate(${st.angL.toFixed(1)}deg)`;

    // mood timeout
    if (st.mood === 'sad' && t > st.moodUntil) {
      setMood('idle');
      say(pick(FORGIVE), 2600);
    }

    // bubble stays on screen and flips under the head near the top edge
    const bubble = bubbleRef.current;
    if (bubble && st.bubbleOn) {
      const bw = bubble.offsetWidth;
      const bh = bubble.offsetHeight;
      const left = cx - bw / 2;
      const shift = clamp(left, 8, w - bw - 8) - left;
      bubble.style.setProperty('--bx', `${shift.toFixed(1)}px`);
      const side = py < bh + 96 ? 'below' : 'above';
      if (side !== st.side) {
        st.side = side;
        bubble.setAttribute('data-side', side);
      }
    }

    // a line when the section changes, and an idle remark now and then
    if (st.mood === 'idle' && introDone) {
      const sec = sectionNow();
      if (sec !== st.section) {
        st.section = sec;
        const key = sec || 'any';
        const last = st.sectionSaid[key] ?? -99;
        if (LINES[key] && t - last > 22 && !st.bubbleOn) {
          st.sectionSaid[key] = t;
          st.nextChat = t + rand(12, 17);
          window.setTimeout(() => {
            if (s.current.mood === 'idle') say(pick(LINES[key], s.current.lastLine), 3800);
          }, 700);
        }
      } else if (t > st.nextChat && !st.bubbleOn) {
        st.nextChat = t + rand(12, 18);
        const pool = Math.random() < 0.7 && LINES[st.section || 'any'] ? LINES[st.section || 'any'] : LINES.any;
        say(pick(pool, st.lastLine), 3400);
      }
    }
  }, alwaysOn);

  const onEnter = () => {
    const st = s.current;
    st.hover = true;
    if (st.mood === 'sad') return;
    window.clearTimeout(st.calmTimer);
    setMood('laugh');
    say(pick(LAUGH, st.lastLine), 1200);
    // a short chuckle, not a fit: back to a smile even if the pointer stays
    st.calmTimer = window.setTimeout(() => {
      if (s.current.mood === 'laugh') setMood('idle');
    }, 1300);
  };
  const onLeave = () => {
    const st = s.current;
    st.hover = false;
    if (st.mood !== 'laugh') return;
    window.clearTimeout(st.calmTimer);
    st.calmTimer = window.setTimeout(() => {
      if (s.current.mood === 'laugh') setMood('idle');
    }, 700);
  };
  const hitRef = useRef<() => void>(() => {});
  const onHit = () => {
    const st = s.current;
    const now = gsap.ticker.time;
    window.clearTimeout(st.calmTimer);
    setMood('sad');
    st.moodUntil = now + 2.8;
    say(pick(OUCH, st.lastLine), 2200);
    // he scoots away from you, then goes back to wandering
    chooseTarget(true);
    st.flee = now + 0.9;
    st.nextPick = now + 4.5;
  };

  useEffect(() => {
    hitRef.current = onHit;
  });

  return (
    <div
      ref={rootRef}
      className="cp"
      data-in={introDone}
      data-mood="idle"
      data-talk="false"
      data-reduce={reduce || undefined}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onPointerDown={onHit}
      data-cursor="play"
      data-cursor-label="HI!"
      role="img"
      aria-label="A small cartoon buddy that floats around the page. Decorative."
    >
      <div className="cp-bubble" ref={bubbleRef} data-show="false" data-side="above" aria-hidden="true">
        <span ref={textRef} />
      </div>

      <svg className="cp-svg" viewBox="0 0 120 150" aria-hidden="true">
        <g className="cp-tilt" ref={tiltRef}>
          <g className="cp-bounce">
            {/* shoes, tee, denim overalls */}
            <ellipse cx="46" cy="143" rx="10" ry="5.5" fill={BUDDY.shoe} stroke={BUDDY.ink} strokeWidth="2.6" />
            <ellipse cx="74" cy="143" rx="10" ry="5.5" fill={BUDDY.shoe} stroke={BUDDY.ink} strokeWidth="2.6" />
            <path d="M34 138 C31 114 44 101 60 101 C76 101 89 114 86 138 Q60 148 34 138 Z" fill={BUDDY.tee} stroke={BUDDY.ink} strokeWidth="3.4" strokeLinejoin="round" />
            <path d="M47 122 H73 V141 Q60 146 47 141 Z" fill={BUDDY.denim} stroke={BUDDY.ink} strokeWidth="3" strokeLinejoin="round" />
            <path d="M49 122 L51 104 M71 122 L69 104" stroke={BUDDY.ink} strokeWidth="8" strokeLinecap="round" />
            <path d="M49 122 L51 104 M71 122 L69 104" stroke={BUDDY.denim} strokeWidth="4" strokeLinecap="round" />
            <circle cx="49.5" cy="121" r="2.6" fill={BUDDY.brass} stroke={BUDDY.ink} strokeWidth="1.4" />
            <circle cx="70.5" cy="121" r="2.6" fill={BUDDY.brass} stroke={BUDDY.ink} strokeWidth="1.4" />

            {/* arms: drawn along +x from the shoulder, rotated toward the pointer */}
            <g className="cp-arm" ref={armLRef} style={{ transformOrigin: '36px 110px' }}>
              <path d="M36 110 H58" stroke={BUDDY.ink} strokeWidth="11" strokeLinecap="round" />
              <path d="M36 110 H58" stroke={BUDDY.tee} strokeWidth="5.4" strokeLinecap="round" />
              <circle cx="61" cy="110" r="6.4" fill={BUDDY.skin} stroke={BUDDY.ink} strokeWidth="3" />
              <rect x="64" y="107.4" width="11" height="5.2" rx="2.6" fill={BUDDY.skin} stroke={BUDDY.ink} strokeWidth="2.6" />
            </g>
            <g className="cp-arm" ref={armRRef} style={{ transformOrigin: '84px 110px' }}>
              <path d="M84 110 H106" stroke={BUDDY.ink} strokeWidth="11" strokeLinecap="round" />
              <path d="M84 110 H106" stroke={BUDDY.tee} strokeWidth="5.4" strokeLinecap="round" />
              <circle cx="109" cy="110" r="6.4" fill={BUDDY.skin} stroke={BUDDY.ink} strokeWidth="3" />
              <rect x="112" y="107.4" width="11" height="5.2" rx="2.6" fill={BUDDY.skin} stroke={BUDDY.ink} strokeWidth="2.6" />
            </g>

            {/* head */}
            <g transform="translate(10 4) scale(0.5)">
              <BuddyHead pupilsRef={pupilsRef} />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
