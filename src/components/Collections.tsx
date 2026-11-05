import { useState } from 'react';
import { ArrowUpRight, Heart, Layers3, Plus, Trash2 } from 'lucide-react';
import type { Artwork } from '../types';
import { seriesGroups } from '../lib/studio';
import { storageError } from '../lib/db';
import ArtworkImage from './ArtworkImage';
import Modal from './Modal';

export default function Collections({
  artworks,
  onOpen,
  onCreate,
  onDelete,
}: {
  artworks: Artwork[];
  onOpen: (series: string, favorites?: boolean) => void;
  onCreate: () => void;
  onDelete: (series: string) => void;
}) {
  const groups = seriesGroups(artworks);
  const favorites = artworks.filter((a) => a.favorite);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CURATED BY YOU / 我的策展</span>
          <h1>
            让作品之间，<em>发生一点关联。</em>
          </h1>
          <p>按主题、情绪或某一段旅程，策划属于自己的小型展览。</p>
        </div>
        <button className="button button-primary" onClick={onCreate} disabled={!artworks.length}>
          <Plus size={17} />
          创建策展系列
        </button>
      </div>
      <div className="collections-grid">
        <button className="favorite-collection" onClick={() => onOpen('', true)}>
          <span className="eyebrow">THE ONES CLOSE TO YOUR HEART</span>
          <Heart size={65} strokeWidth={1} />
          <h2>心选作品</h2>
          <p>有些作品，想一看再看。</p>
          <div>
            <span>{favorites.length} 件心动</span>
            <ArrowUpRight size={24} />
          </div>
        </button>
        {groups.map((group, index) => (
          <article className={`series-card tone-${index % 4}`} key={group.name}>
            <button
              className="series-open"
              onClick={() => onOpen(group.name)}
              aria-label={`打开系列：${group.name}`}
            >
              <div className="series-cover">
                {group.artworks.slice(0, 3).map((art) => (
                  <ArtworkImage key={art.id} artwork={art} />
                ))}
              </div>
              <span className="eyebrow">
                PERSONAL EXHIBITION / {String(index + 1).padStart(2, '0')}
              </span>
              <h2>{group.name}</h2>
              <p>
                {group.artworks.length} 件作品 <ArrowUpRight size={20} />
              </p>
            </button>
            <button
              className="icon-button remove-series"
              aria-label={`移除系列：${group.name}`}
              onClick={() => onDelete(group.name)}
            >
              <Trash2 size={15} />
            </button>
          </article>
        ))}
        <button className="new-series-card" onClick={onCreate} disabled={!artworks.length}>
          <span>
            <Layers3 size={29} strokeWidth={1.2} />
            <Plus size={15} />
          </span>
          <h3>{artworks.length ? '策划你的下一场展览' : '先收藏一件作品'}</h3>
          <p>一个名字，几件作品，就是一个新的故事。</p>
        </button>
      </div>
    </>
  );
}
export function SeriesEditor({
  artworks,
  onClose,
  onSave,
}: {
  artworks: Artwork[];
  onClose: () => void;
  onSave: (ids: string[], name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Modal title="创建策展系列" onClose={onClose} busy={busy} className="series-editor">
      <div className="modal-heading">
        <span className="eyebrow">YOUR NEXT LITTLE EXHIBITION</span>
        <h2>把喜欢的作品，放在一起。</h2>
        <p>每件作品属于一个系列；选中的作品会移动到新系列。</p>
      </div>
      <form
        className="form-fields"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim() || !ids.length) {
            setError('请填写系列名称，并至少选择一件作品。');
            return;
          }
          setBusy(true);
          try {
            await onSave(ids, name.trim());
          } catch (err) {
            setError(storageError(err));
            setBusy(false);
          }
        }}
      >
        <label>
          系列名称
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
            disabled={busy}
            placeholder="例如：窗外的四季"
          />
        </label>
        <div className="series-picker">
          {artworks.map((art) => (
            <label className="series-choice" key={art.id}>
              <input
                type="checkbox"
                checked={ids.includes(art.id)}
                disabled={busy}
                onChange={(e) =>
                  setIds(e.target.checked ? [...ids, art.id] : ids.filter((id) => id !== art.id))
                }
              />
              <ArtworkImage artwork={art} />
              <span>
                {art.title}
                <small>{art.series || '未归入系列'}</small>
              </span>
            </label>
          ))}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <span className="local-note">已选择 {ids.length} 件作品</span>
          <button className="button button-primary" disabled={busy}>
            保存系列 <ArrowUpRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
