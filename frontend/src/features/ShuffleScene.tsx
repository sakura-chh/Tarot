import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

const stages = ['将牌组分成两叠', '交错洗入每一张牌', '拱起牌组，轻轻收拢', '整齐收牌，准备选择'];

export function ShuffleScene({ back }: { back: string }) {
  const [stage, set_stage] = useState(0);
  useEffect(() => {
    const timers = [650, 1800, 2550].map((delay, i) => setTimeout(() => set_stage(i + 1), delay));
    return () => timers.forEach(clearTimeout);
  }, []);
  return <section className="shuffling-state" aria-label="扑克牌式洗牌过程">
    <span className="eyebrow">THE ART OF SHUFFLING</span>
    <h2>洗开思绪，让直觉入场。</h2>
    <div className="riffle-table" aria-hidden="true">
      <div className="riffle-surface" />
      <div className="riffle-deck">
        {['left', 'right'].flatMap((side, side_index) => Array.from({ length: 12 }, (_, i) =>
          <div className={`riffle-card riffle-${side}`} key={`${side}-${i}`}
            style={{ '--layer': i, '--riffle-delay': `${i * 42}ms`, zIndex: i * 2 + side_index } as CSSProperties}>
            <img src={back} alt="" />
          </div>))}
      </div>
    </div>
    <p className="shuffle-stage" role="status">{stages[stage]}</p>
    <div className="shuffle-steps" aria-hidden="true">{stages.map((_, i) => <span key={i} className={i <= stage ? 'active' : ''} />)}</div>
    <p className="quiet">78 张牌 · 分堆 / 交错 / 收拢</p>
  </section>;
}
