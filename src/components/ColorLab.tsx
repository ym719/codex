import { useState } from 'react';
import { ArrowUpRight, Check, Copy, RefreshCw, Sparkles } from 'lucide-react';
import { ArtMark } from './StudioHero';
import { palettes } from '../lib/studio';
import type { JournalEntry } from '../types';

export default function ColorLab({
  onNote,
  onMessage,
}: {
  onNote: (entry: Partial<JournalEntry>) => void;
  onMessage: (message: string) => void;
}) {
  const [filter, setFilter] = useState('全部');
  const [inspiration, setInspiration] = useState(0);
  const [copied, setCopied] = useState('');
  const palette = palettes[inspiration];
  async function copy(color: string) {
    try {
      await navigator.clipboard.writeText(color);
      setCopied(color);
      onMessage(`色值 ${color} 已复制`);
    } catch {
      onMessage(`当前浏览器无法自动复制，可手动记录色值：${color}`);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE COLOR LAB / 色彩实验室</span>
          <h1>
            别问像不像，<em>先问喜不喜欢。</em>
          </h1>
          <p>从印象派的光影，到野兽派的自由。让颜色，替你说点什么。</p>
        </div>
        <span className="page-decoration" aria-hidden="true">
          <ArtMark />
        </span>
      </div>
      <section className="color-prompt">
        <div>
          <span className="eyebrow">
            <Sparkles size={14} /> 给今天的一点创作提案
          </span>
          <h2>{palette.prompt}</h2>
          <div className="prompt-actions">
            <button
              className="button button-paper"
              onClick={() =>
                onNote({ title: palette.name, body: palette.prompt, colors: palette.colors })
              }
            >
              带着这组色彩写手记 <ArrowUpRight size={16} />
            </button>
            <button
              className="text-link"
              onClick={() =>
                setInspiration(
                  (inspiration + 1 + Math.floor(Math.random() * (palettes.length - 1))) %
                    palettes.length,
                )
              }
            >
              <RefreshCw size={15} />
              换个灵感
            </button>
          </div>
        </div>
        <div className="prompt-swatches" aria-label={palette.name}>
          {palette.colors.map((c, i) => (
            <span key={c} style={{ background: c, transform: `rotate(${(i - 2) * 7}deg)` }}>
              <small>{String(i + 1).padStart(2, '0')}</small>
            </span>
          ))}
        </div>
      </section>
      <div className="section-heading">
        <h2>
          你的下一块调色盘 <span>COLOR STORIES</span>
        </h2>
        <p>悬停展开色卡 · 点击复制色值</p>
      </div>
      <div className="filter-tabs color-filters" role="group" aria-label="色彩风格">
        {['全部', '印象派灵感', '野兽派灵感', '表现性色彩'].map((f) => (
          <button
            className={`filter-tab ${filter === f ? 'selected' : ''}`}
            key={f}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="palette-grid">
        {palettes
          .filter((p) => filter === '全部' || p.movement === filter)
          .map((p, index) => (
            <article className="palette-card" key={p.id}>
              <div className="palette-card-top">
                <span>{p.movement}</span>
                <span>PALETTE / {String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="interactive-palette">
                {p.colors.map((c) => (
                  <button
                    key={c}
                    style={{ background: c }}
                    aria-label={`复制色值 ${c}`}
                    onClick={() => void copy(c)}
                  >
                    <span>{c}</span>
                    <i>{copied === c ? <Check size={16} /> : <Copy size={16} />}</i>
                  </button>
                ))}
              </div>
              <div className="palette-description">
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.note}</p>
                </div>
                <button
                  className="icon-button"
                  aria-label={`用${p.name}写手记`}
                  onClick={() => onNote({ title: p.name, body: p.prompt, colors: p.colors })}
                >
                  <ArrowUpRight size={22} />
                </button>
              </div>
            </article>
          ))}
      </div>
      <p className="art-credit">色谱为对艺术流派的原创色彩解读，并非具体名画的采样。</p>
    </>
  );
}
