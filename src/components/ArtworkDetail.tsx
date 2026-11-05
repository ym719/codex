import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Maximize2,
  Minimize2,
  Pause,
  Pencil,
  Play,
  Trash2,
} from 'lucide-react';
import type { Artwork } from '../types';
import { displayDate } from '../lib/artworks';
import ArtworkImage from './ArtworkImage';
import Modal from './Modal';

export default function ArtworkDetail({
  artwork,
  artworks,
  immersive = false,
  onSelect,
  onClose,
  onEdit,
  onDelete,
  onFavorite,
}: {
  artwork: Artwork;
  artworks: Artwork[];
  immersive?: boolean;
  onSelect: (art: Artwork) => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFavorite: () => void;
}) {
  const [exhibition, setExhibition] = useState(immersive);
  const [playing, setPlaying] = useState(false);
  const index = artworks.findIndex((art) => art.id === artwork.id);
  const prev = () => {
    if (index > 0) onSelect(artworks[index - 1]);
  };
  const next = () => {
    if (index >= 0 && index < artworks.length - 1) onSelect(artworks[index + 1]);
  };
  useEffect(() => {
    if (!playing || artworks.length < 2) return;
    const timer = window.setInterval(() => onSelect(artworks[(index + 1) % artworks.length]), 5000);
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', pause);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', pause);
    };
  }, [playing, index, artworks, onSelect]);
  return (
    <Modal
      title={artwork.title}
      onClose={onClose}
      className={`detail-modal ${exhibition ? 'exhibition-modal' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          prev();
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          next();
        }
      }}
    >
      <div className="detail-layout">
        <div className="detail-image">
          <ArtworkImage key={artwork.id} artwork={artwork} eager />
          <button
            className="view-mode-button"
            onClick={() => {
              setExhibition(!exhibition);
              setPlaying(false);
            }}
            aria-label={exhibition ? '退出沉浸看展' : '沉浸看展'}
          >
            {exhibition ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            {exhibition ? '返回详情' : '沉浸看展'}
          </button>
        </div>
        <div className="detail-info">
          <span className="eyebrow">
            {artwork.category}
            {artwork.isDemo && ' / 示例作品'}
          </span>
          <h2>{artwork.title}</h2>
          <time>{displayDate(artwork.date)}</time>
          <div className="detail-text">
            <dl>
              <div>
                <dt>创作媒介</dt>
                <dd>{artwork.medium || '尚未记录'}</dd>
              </div>
              <div>
                <dt>策展系列</dt>
                <dd>{artwork.series || '自由创作'}</dd>
              </div>
              <div>
                <dt>图片尺寸</dt>
                <dd>
                  {artwork.width} × {artwork.height} px
                </dd>
              </div>
            </dl>
            <div className="detail-notes">
              <h3>作品背后的故事</h3>
              <p>{artwork.notes || '有些作品，无需言语。也可以编辑作品，补上一段创作笔记。'}</p>
            </div>
            {!!artwork.tags?.length && (
              <div className="tag-list">
                {artwork.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}
            {artwork.isDemo && (
              <p className="sample-info">
                原创示例图 · 摄影类别为构图示意。清空示例后，开始自己的收藏。
              </p>
            )}
          </div>
          <div className="detail-actions">
            <button className="button button-primary" onClick={onEdit}>
              <Pencil size={15} />
              编辑作品
            </button>
            <button
              className={`icon-button ${artwork.favorite ? 'is-favorite' : ''}`}
              aria-label={artwork.favorite ? '取消心选' : '加入心选'}
              aria-pressed={!!artwork.favorite}
              onClick={onFavorite}
            >
              <Heart size={18} fill={artwork.favorite ? 'currentColor' : 'none'} />
            </button>
            <button className="icon-button danger-text" aria-label="删除作品" onClick={onDelete}>
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        <div className="detail-pagination">
          <span>
            {String(index + 1).padStart(2, '0')} <i>/</i> {String(artworks.length).padStart(2, '0')}{' '}
            <small>使用 ← → 键浏览</small>
          </span>
          <div>
            {exhibition && (
              <button
                className="icon-button"
                aria-label={playing ? '暂停自动播放' : '自动播放'}
                disabled={artworks.length < 2}
                onClick={() => setPlaying(!playing)}
              >
                {playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
            )}
            <button
              className="icon-button"
              aria-label="上一件作品"
              onClick={prev}
              disabled={index <= 0}
            >
              <ArrowLeft size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="下一件作品"
              onClick={next}
              disabled={index < 0 || index >= artworks.length - 1}
            >
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
