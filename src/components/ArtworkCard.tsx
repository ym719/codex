import { ArrowUpRight, Heart } from 'lucide-react';
import type { Artwork } from '../types';
import { displayDate } from '../lib/artworks';
import ArtworkImage from './ArtworkImage';

export default function ArtworkCard({
  art,
  index,
  onOpen,
  onFavorite,
}: {
  art: Artwork;
  index: number;
  onOpen: () => void;
  onFavorite: () => void;
}) {
  return (
    <article
      className={`artwork-card tone-${index % 4}`}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <button className="artwork-open" onClick={onOpen} aria-label={`查看作品：${art.title}`}>
        <div className="artwork-frame">
          <ArtworkImage artwork={art} eager={index < 3} />
          <span className="artwork-peek">
            走近一点 <ArrowUpRight size={17} />
          </span>
          {art.isDemo && <span className="sample-label">示例作品</span>}
        </div>
        <div className="artwork-meta">
          <div className="artwork-topline">
            <span className="category-label">{art.category}</span>
            <time dateTime={art.date}>{displayDate(art.date)}</time>
          </div>
          <h3>{art.title}</h3>
          <p>
            {art.medium || '每一份表达，都值得收藏'}
            <ArrowUpRight size={17} />
          </p>
          {art.series && <span className="series-chip">{art.series}</span>}
        </div>
      </button>
      <button
        className={`favorite-button ${art.favorite ? 'is-favorite' : ''}`}
        aria-label={`${art.favorite ? '取消心选' : '加入心选'}：${art.title}`}
        aria-pressed={!!art.favorite}
        onClick={onFavorite}
      >
        <Heart size={17} fill={art.favorite ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}
