import { ArrowDownRight, ArrowUpRight, Dices, Plus, Sparkles } from 'lucide-react';
import type { Theme } from '../types';
import type { PointerEvent } from 'react';

export function ArtMark() {
  return (
    <svg width="35" height="35" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M20 1v38M1 20h38M6.5 6.5l27 27M6.5 33.5l27-27"
        stroke="currentColor"
        strokeWidth="5"
      />
      <circle cx="20" cy="20" r="6" fill="var(--paper)" />
    </svg>
  );
}
export default function StudioHero({
  theme,
  onAdd,
  onRandom,
  disabled,
  noArt,
}: {
  theme: Theme;
  onAdd: () => void;
  onRandom: () => void;
  disabled: boolean;
  noArt: boolean;
}) {
  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      '--rx',
      `${((event.clientY - rect.top) / rect.height - 0.5) * -5}deg`,
    );
    event.currentTarget.style.setProperty(
      '--ry',
      `${((event.clientX - rect.left) / rect.width - 0.5) * 5}deg`,
    );
  }
  return (
    <section className="studio-hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="hero-kicker">
          <span className="little-sun">✷</span> 灵感不设限，创作有归处
        </span>
        <h1 id="hero-title">
          Life, in
          <br />
          <em>full color.</em>
          <svg viewBox="0 0 300 20" aria-hidden="true">
            <path
              d="M3 13Q136 -2 295 10M19 18Q128 9 268 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>
        </h1>
        <h2>把日常，过成自己的艺术展。</h2>
        <p>
          收藏一束光、一抹大胆的颜色，和每一次心动。
          <br />
          这里是你的作品档案，也是灵感自由生长的地方。
        </p>
        <div className="hero-actions">
          <button className="button button-primary" onClick={onAdd} disabled={disabled}>
            <Plus size={17} />
            收藏新作品 <ArrowUpRight size={17} />
          </button>
          <button className="button button-outline" onClick={onRandom} disabled={disabled || noArt}>
            <Dices size={17} />
            偶遇一件作品
          </button>
        </div>
        <div className="hero-footnote">
          <div className="mini-palette" aria-hidden="true">
            {['#c34b36', '#e7b64c', '#6d9476', '#537ca1', '#9e85a1'].map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </div>
          <span>A little impression. A little expression.</span>
        </div>
      </div>
      <div
        className="hero-art-scene"
        onPointerMove={tilt}
        onPointerLeave={(e) => {
          e.currentTarget.style.setProperty('--rx', '0deg');
          e.currentTarget.style.setProperty('--ry', '0deg');
        }}
      >
        <div className="scene-orbit" aria-hidden="true" />
        <span className="scene-label">
          <Sparkles size={13} /> THE ART OF NOTICING
        </span>
        <div className="hero-painting">
          <div className="tape" aria-hidden="true" />
          <img
            src={`${import.meta.env.BASE_URL}studio/${theme === 'day' ? 'sunlit' : 'moonlit'}-garden.svg`}
            alt={
              theme === 'day'
                ? '暖金色天空下，群青远山与翠绿庭园的原创色彩风景'
                : '靛蓝夜空下，月光映照花园的原创色彩风景'
            }
          />
          <div className="painting-caption">
            <span>{theme === 'day' ? '阳光落在调色盘上' : '夜色也有它的颜色'}</span>
            <span>STUDIO STUDY / 01</span>
          </div>
        </div>
        <div className="flower-painting">
          <img
            src={`${import.meta.env.BASE_URL}studio/wild-flowers.svg`}
            alt="珊瑚色背景上的群青花瓶与朱红花朵"
          />
          <span>STAY A LITTLE WILD.</span>
        </div>
        <div className="round-stamp" aria-hidden="true">
          <span>MADE OF</span>
          <strong>
            小小
            <br />
            热爱
          </strong>
          <span>LITTLE THINGS</span>
        </div>
        <div className="handwritten">
          不必完美，只需表达。
          <ArrowDownRight size={25} />
        </div>
      </div>
    </section>
  );
}
