import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useBeat, useScene } from '../scene';
import './worlds.css';
import './rinti.css';

/**
 * RINTI AI: conversation, research, layers.
 * Scroll plays one exchange: a question lands, the assistant thinks, the
 * research pipeline (the real one: plan, search, read, check claims, write)
 * lights up stage by stage, then the answer streams in. Source cards sit in
 * layers behind and fan apart as it goes; the cursor slides the layers.
 */
const STAGES = ['plan', 'search', 'read', 'check claims', 'write'];

export default function RintiWorld() {
  const { progress, x, y, compact } = useScene();

  const ask = useBeat(progress, 0.08, 0.2);
  const think = useBeat(progress, 0.18, 0.3);
  const research = useBeat(progress, 0.28, 0.72);
  const answer = useBeat(progress, 0.62, 0.92);

  const askY = useTransform(ask, [0, 1], [24, 0]);
  const dotsOp = useTransform(think, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const stageIdx = useTransform(research, (v) => Math.min(STAGES.length - 1, Math.floor(v * STAGES.length)));
  const barScale = useTransform(research, [0, 1], [0.04, 1]);

  const l1 = useTransform(answer, [0, 1], [0, 1]);
  const l2 = useTransform(answer, [0.25, 1], [0, 1], { clamp: true });
  const l3 = useTransform(answer, [0.55, 1], [0, 1], { clamp: true });

  // source layers
  const spread = useBeat(progress, 0.15, 0.7);
  const fanA = useTransform(spread, [0, 1], [-4, -13]);
  const fanB = useTransform(spread, [0, 1], [2, 4]);
  const fanC = useTransform(spread, [0, 1], [7, 17]);
  const backX = useTransform(x, [-1, 1], ['-4%', '4%']);
  const backY = useTransform(y, [-1, 1], ['-3%', '3%']);
  const midX = useTransform(x, [-1, 1], ['2.5%', '-2.5%']);
  const midY = useTransform(y, [-1, 1], ['2%', '-2%']);
  const fgX = useTransform(x, [-1, 1], ['5%', '-5%']);

  return (
    <div className="world rw">
      <div className="layer rw-grid" aria-hidden="true" />

      {/* layer 1: sources, fanned */}
      <motion.div className="layer rw-sources" style={{ x: backX, y: backY }} aria-hidden="true">
        <motion.div className="rw-src rw-src-a" style={{ rotate: fanA }}>
          <span className="mono">src 01</span>
          <i /><i /><i />
        </motion.div>
        <motion.div className="rw-src rw-src-b" style={{ rotate: fanB }}>
          <span className="mono">src 02</span>
          <i /><i /><i />
        </motion.div>
        <motion.div className="rw-src rw-src-c" style={{ rotate: fanC }}>
          <span className="mono">src 03</span>
          <i /><i /><i />
        </motion.div>
      </motion.div>

      {/* layer 2: the conversation */}
      <motion.div className="layer rw-chat-wrap" style={{ x: midX, y: midY }}>
        <div className="rw-chat">
          <motion.div className="rw-bubble rw-user" style={{ opacity: ask, y: askY }}>
            <i /><i />
          </motion.div>

          <motion.div className="rw-thinking" style={{ opacity: dotsOp }} aria-hidden="true">
            <i /><i /><i />
          </motion.div>

          <div className="rw-pipeline" aria-hidden="true">
            {STAGES.map((s, i) => (
              <Stage key={s} label={s} index={i} active={stageIdx} />
            ))}
            <div className="rw-pipe-bar">
              <motion.i style={{ scaleX: barScale }} />
            </div>
          </div>

          <div className="rw-bubble rw-ai" aria-hidden="true">
            <motion.i style={{ scaleX: l1 }} />
            <motion.i style={{ scaleX: l2 }} />
            <motion.i style={{ scaleX: l3 }} />
          </div>
        </div>
      </motion.div>

      {/* layer 3: memory and voice, riding above */}
      {!compact && (
        <motion.div className="layer" style={{ x: fgX }} aria-hidden="true">
          <span className="world-label rw-memory">memory</span>
          <span className="world-label rw-voice">
            voice
            <span className="rw-bars">
              <i /><i /><i />
            </span>
          </span>
        </motion.div>
      )}
    </div>
  );
}

function Stage({ label, index, active }: { label: string; index: number; active: MotionValue<number> }) {
  const bg = useTransform(active, (a) => (a === index ? '#d8f827' : a > index ? '#111215' : '#fdf9f1'));
  const fg = useTransform(active, (a) => (a > index ? '#fdf9f1' : '#111215'));
  return (
    <motion.span className="rw-stage mono" style={{ backgroundColor: bg, color: fg }}>
      {label}
    </motion.span>
  );
}
