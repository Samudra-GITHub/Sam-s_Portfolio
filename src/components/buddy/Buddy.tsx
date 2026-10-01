import type { Ref } from 'react';
import { BUDDY } from './palette';
import './buddy.css';

/**
 * The site's character, drawn once as layered SVG so it can move.
 * Drawn on a 200 x 210 grid (ear to ear 20..180). Both the Portfolio scene and
 * the roaming companion embed this head and scale it; mood classes (bd-*) are
 * switched by a data-mood / data-talk attribute on an ancestor, see buddy.css.
 */

function HairShapes({ fill, stroke, sw }: { fill: string; stroke?: string; sw?: number }) {
  const p = { fill, stroke, strokeWidth: sw, strokeLinejoin: 'round' as const };
  return (
    <g>
      <path d="M22 110 C10 52 52 16 100 20 C150 16 192 52 178 110 C172 86 160 68 138 64 C118 72 84 72 62 64 C40 68 28 86 22 110 Z" {...p} />
      <circle cx="58" cy="32" r="22" {...p} />
      <circle cx="100" cy="21" r="24" {...p} />
      <circle cx="144" cy="30" r="22" {...p} />
      <circle cx="30" cy="64" r="17" {...p} />
      <circle cx="172" cy="64" r="17" {...p} />
    </g>
  );
}

export function BuddyHead({ pupilsRef }: { pupilsRef?: Ref<SVGGElement> }) {
  const { ink, skin, skinShade, hair } = BUDDY;
  return (
    <g className="bd-head">
      {/* ears */}
      <ellipse cx="20" cy="122" rx="15" ry="20" fill={skin} stroke={ink} strokeWidth="4.5" />
      <ellipse cx="22" cy="124" rx="6" ry="10" fill={skinShade} />
      <ellipse cx="180" cy="122" rx="15" ry="20" fill={skin} stroke={ink} strokeWidth="4.5" />
      <ellipse cx="178" cy="124" rx="6" ry="10" fill={skinShade} />

      {/* face */}
      <ellipse cx="100" cy="116" rx="80" ry="82" fill={skin} stroke={ink} strokeWidth="4.5" />

      {/* hair: thick ink pass first, then the fill, so the outline merges */}
      <HairShapes fill={ink} stroke={ink} sw={9} />
      <HairShapes fill={hair} />
      <ellipse cx="92" cy="30" rx="20" ry="7" fill="#7a4630" transform="rotate(-8 92 30)" />

      {/* brows */}
      <g className="bd-brows">
        <path className="bd-brow bd-brow--l" d="M42 80 Q62 66 88 76" fill="none" stroke="#3b1d10" strokeWidth="10" strokeLinecap="round" />
        <path className="bd-brow bd-brow--r" d="M112 76 Q138 66 158 80" fill="none" stroke="#3b1d10" strokeWidth="10" strokeLinecap="round" />
      </g>

      {/* eyes */}
      <g className="bd-eyes-open">
        <g className="bd-blink">
          <ellipse cx="63" cy="107" rx="17" ry="18" fill="#fff" stroke={ink} strokeWidth="4" />
          <ellipse cx="137" cy="107" rx="17" ry="18" fill="#fff" stroke={ink} strokeWidth="4" />
          <g ref={pupilsRef} className="bd-pupils">
            <circle cx="63" cy="108" r="11.5" fill="#6b3a1e" />
            <circle cx="137" cy="108" r="11.5" fill="#6b3a1e" />
            <circle cx="63" cy="108" r="5.8" fill={ink} />
            <circle cx="137" cy="108" r="5.8" fill={ink} />
            <circle cx="67" cy="103" r="3.4" fill="#fff" />
            <circle cx="141" cy="103" r="3.4" fill="#fff" />
          </g>
        </g>
      </g>
      <g className="bd-eyes-laugh">
        <path d="M46 116 Q63 90 80 116" fill="none" stroke={ink} strokeWidth="6.5" strokeLinecap="round" />
        <path d="M120 116 Q137 90 154 116" fill="none" stroke={ink} strokeWidth="6.5" strokeLinecap="round" />
      </g>

      {/* nose + cheeks */}
      <ellipse cx="100" cy="140" rx="16" ry="13" fill="#e7966a" stroke={ink} strokeWidth="3.6" />
      <ellipse cx="95" cy="135" rx="5" ry="3" fill="#f6c8a8" />
      <ellipse cx="42" cy="152" rx="12" ry="7" fill="#ff5226" opacity="0.26" />
      <ellipse cx="158" cy="152" rx="12" ry="7" fill="#ff5226" opacity="0.26" />

      {/* mouths */}
      <g className="bd-mouth-smile">
        <path d="M66 160 Q100 154 134 160 Q128 182 100 182 Q72 182 66 160 Z" fill="#4a1710" stroke={ink} strokeWidth="4.2" strokeLinejoin="round" />
        <path d="M70 161 Q100 156 130 161 L128 167 Q100 163 72 167 Z" fill="#fff" />
        <ellipse cx="100" cy="176" rx="10" ry="4.5" fill="#e0574a" />
      </g>
      <g className="bd-mouth-laugh">
        <path d="M56 157 Q100 148 144 157 Q138 194 100 194 Q62 194 56 157 Z" fill="#4a1710" stroke={ink} strokeWidth="4.2" strokeLinejoin="round" />
        <path d="M61 158 Q100 150 139 158 L136 169 Q100 162 64 169 Z" fill="#fff" />
        <ellipse cx="100" cy="186" rx="16" ry="7" fill="#e0574a" />
      </g>
      <path className="bd-mouth-sad" d="M70 186 Q100 162 130 186" fill="none" stroke={ink} strokeWidth="5.5" strokeLinecap="round" />

      {/* tears */}
      <path className="bd-tear bd-tear--l" d="M44 138 Q35 154 44 160 Q53 154 44 138 Z" fill="#7aa2ff" stroke={ink} strokeWidth="2" />
      <path className="bd-tear bd-tear--r" d="M156 138 Q147 154 156 160 Q165 154 156 138 Z" fill="#7aa2ff" stroke={ink} strokeWidth="2" />
    </g>
  );
}
