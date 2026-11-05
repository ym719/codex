import { ArrowUpRight, CalendarDays, Palette } from 'lucide-react';
import type { Artwork } from '../types';
import { displayDate, groupByMonth } from '../lib/artworks';
import ArtworkImage from './ArtworkImage';

export default function Archive({
  artworks,
  onSelect,
}: {
  artworks: Artwork[];
  onSelect: (art: Artwork) => void;
}) {
  const groups = groupByMonth(artworks);
  const years = new Set(artworks.map((a) => a.date.slice(0, 4))).size;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE CREATIVE CHRONICLE / 创作档案</span>
          <h1>
            时间会走，<em>创作会留下。</em>
          </h1>
          <p>回头看看，每一个小小的尝试，都构成了独一无二的你。</p>
        </div>
        <div className="archive-summary">
          <CalendarDays size={23} />
          <strong>{years}</strong>
          <span>个创作年份</span>
          <Palette size={23} />
          <strong>{artworks.length}</strong>
          <span>件作品</span>
        </div>
      </div>
      <div className="timeline">
        {groups.map((group) => (
          <section className="timeline-group" key={group.month}>
            <div className="timeline-label">
              <span>{group.month.slice(0, 4)}</span>
              <h2>{Number(group.month.slice(5))} 月</h2>
              <small>{group.artworks.length} 件作品</small>
            </div>
            <div className="timeline-artworks">
              {group.artworks.map((art) => (
                <button className="timeline-card" key={art.id} onClick={() => onSelect(art)}>
                  <ArtworkImage artwork={art} />
                  <div>
                    <span className="eyebrow">{displayDate(art.date)}</span>
                    <h3>{art.title}</h3>
                    <p>
                      {art.category} · {art.medium || '自由创作'}
                    </p>
                  </div>
                  <ArrowUpRight size={18} />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      {!artworks.length && (
        <div className="empty-state">
          <CalendarDays size={35} />
          <h3>时间线，等待第一笔。</h3>
          <p>添加作品并记录创作日期，这里就会留下你的足迹。</p>
        </div>
      )}
    </>
  );
}
