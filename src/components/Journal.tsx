import { useState } from 'react';
import { ArrowUpRight, BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import type { JournalEntry } from '../types';
import { displayDate, isValidDate, localDate } from '../lib/artworks';
import { storageError } from '../lib/db';
import Modal from './Modal';

export function JournalPage({
  entries,
  onAdd,
  onEdit,
  onDelete,
  onColors,
}: {
  entries: JournalEntry[];
  onAdd: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  onColors: () => void;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">FIELD NOTES / 灵感手记</span>
          <h1>
            先记下来，<em>再慢慢发光。</em>
          </h1>
          <p>不成形的想法、路过的颜色，都可以是下一件作品的开始。</p>
        </div>
        <button className="button button-primary" onClick={onAdd}>
          <Plus size={17} />
          写一则手记
        </button>
      </div>
      <div className="journal-grid">
        <article className="journal-invite">
          <span className="eyebrow">TODAY’S LITTLE OBSERVATION</span>
          <BookOpen size={40} strokeWidth={1} />
          <h2>
            今天，有什么颜色
            <br />
            让你多看了一眼？
          </h2>
          <p>不急着完成什么。只要留意，只要记录。</p>
          <button className="text-link" onClick={onColors}>
            去色彩实验室找找灵感 <ArrowUpRight size={17} />
          </button>
        </article>
        {[...entries]
          .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt)
          .map((entry, index) => (
            <article className={`journal-card note-${index % 3}`} key={entry.id}>
              <div className="note-top">
                <span>NOTE / {String(index + 1).padStart(2, '0')}</span>
                <time>{displayDate(entry.date)}</time>
              </div>
              <h2>{entry.title}</h2>
              <p>{entry.body || '留一点空白，给下一次灵感。'}</p>
              <div className="note-palette">
                {entry.colors.map((c, i) => (
                  <span key={`${c}-${i}`} style={{ background: c }} title={c} />
                ))}
              </div>
              <div className="note-actions">
                <button className="text-link" onClick={() => onEdit(entry)}>
                  <Pencil size={13} />
                  继续书写
                </button>
                <button
                  className="icon-button"
                  aria-label={`删除手记：${entry.title}`}
                  onClick={() => onDelete(entry)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        {entries.length === 0 && (
          <button className="blank-note" onClick={onAdd}>
            <Plus size={30} strokeWidth={1} />
            <span>写下第一则灵感</span>
            <small>一段话，一种颜色，一次新的开始。</small>
          </button>
        )}
      </div>
    </>
  );
}
export function JournalEditor({
  entry,
  onSave,
  onClose,
}: {
  entry: Partial<JournalEntry>;
  onSave: (entry: JournalEntry) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(entry.title ?? '');
  const [body, setBody] = useState(entry.body ?? '');
  const [date, setDate] = useState(entry.date ?? localDate());
  const [colors, setColors] = useState(entry.colors ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Modal
      title={entry.id ? '编辑手记' : '新建手记'}
      onClose={onClose}
      busy={busy}
      className="journal-editor"
    >
      <div className="modal-heading">
        <span className="eyebrow">LEAVE A LITTLE TRACE</span>
        <h2>给灵感，留一页纸。</h2>
      </div>
      <form
        className="journal-form form-fields"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim() || !isValidDate(date)) {
            setError('请填写标题和有效日期。');
            return;
          }
          setBusy(true);
          try {
            await onSave({
              id: entry.id ?? crypto.randomUUID(),
              title: title.trim(),
              body: body.trim(),
              date,
              colors,
              updatedAt: Date.now(),
            });
          } catch (err) {
            setError(storageError(err));
            setBusy(false);
          }
        }}
      >
        <label>
          手记标题
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            placeholder="今天，我注意到…"
            disabled={busy}
          />
        </label>
        <label>
          记录日期
          <input
            type="date"
            value={date}
            min="0001-01-01"
            max="9999-12-31"
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={busy}
          />
        </label>
        <label>
          灵感内容
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={7}
            maxLength={5000}
            placeholder="随手写下你的观察、构图想法或下一次创作计划。"
            disabled={busy}
          />
        </label>
        {colors.length > 0 && (
          <div className="editor-palette">
            <span>这一页的颜色</span>
            <div>
              {colors.map((c, i) => (
                <i key={`${c}-${i}`} style={{ background: c }} title={c} />
              ))}
            </div>
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={() => setColors([])}
            >
              移除色卡
            </button>
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <span className="local-note">仅保存在此浏览器</span>
          <button className="button button-primary" disabled={busy} type="submit">
            {busy ? '正在保存…' : '保存手记'}
            <ArrowUpRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
