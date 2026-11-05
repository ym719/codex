import { useRef, useState, type FormEvent, type DragEvent } from 'react';
import { ArrowUpRight, ImagePlus, LoaderCircle, Upload } from 'lucide-react';
import { categories, type Artwork, type ArtworkInput } from '../types';
import { isValidDate, localDate } from '../lib/artworks';
import { prepareImage } from '../lib/images';
import { parseTags } from '../lib/studio';
import { storageError } from '../lib/db';
import ArtworkImage from './ArtworkImage';
import Modal from './Modal';

export default function ArtworkForm({
  artwork,
  onClose,
  onSave,
}: {
  artwork?: Artwork;
  onClose: () => void;
  onSave: (input: ArtworkInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(artwork?.title ?? '');
  const [date, setDate] = useState(artwork?.date ?? localDate());
  const [category, setCategory] = useState(artwork?.category ?? '绘画');
  const [medium, setMedium] = useState(artwork?.medium ?? '');
  const [notes, setNotes] = useState(artwork?.notes ?? '');
  const [series, setSeries] = useState(artwork?.series ?? '');
  const [tags, setTags] = useState((artwork?.tags ?? []).join('，'));
  const [picture, setPicture] = useState<Pick<Artwork, 'image' | 'width' | 'height'> | undefined>(
    artwork ? { image: artwork.image, width: artwork.width, height: artwork.height } : undefined,
  );
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const busy = processing || saving;
  async function chooseFile(file?: File) {
    if (!file || busy) return;
    setError('');
    setProcessing(true);
    try {
      setPicture(await prepareImage(file));
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').slice(0, 120));
    } catch (err) {
      setError(storageError(err));
    } finally {
      setProcessing(false);
    }
  }
  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 1) {
      setError('每次添加一件作品，请选择一张图片。');
      return;
    }
    void chooseFile(event.dataTransfer.files[0]);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!picture) {
      setError('请先选择一张作品图片。');
      return;
    }
    if (!title.trim()) {
      setError('请填写作品名称。');
      return;
    }
    if (!isValidDate(date)) {
      setError('请选择有效的创作日期。');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        date,
        category,
        medium: medium.trim(),
        notes: notes.trim(),
        series: series.trim(),
        tags: parseTags(tags),
        favorite: artwork?.favorite ?? false,
        ...picture,
      });
    } catch (err) {
      setError(storageError(err));
      setSaving(false);
    }
  }
  return (
    <Modal
      title={artwork ? '编辑作品' : '添加作品'}
      onClose={onClose}
      className="form-modal"
      busy={busy}
    >
      <div className="modal-heading">
        <span className="eyebrow">{artwork ? 'REFINE YOUR ARCHIVE' : 'A NEW PIECE OF YOU'}</span>
        <h2>{artwork ? '让记录更完整。' : '把这一刻，收藏起来。'}</h2>
        <p>每一件作品，都有值得留下的故事。</p>
      </div>
      <form onSubmit={submit}>
        <div className="form-layout">
          <div>
            <button
              type="button"
              className={`upload-zone ${picture ? 'has-image' : ''} ${dragging ? 'is-dragging' : ''}`}
              onClick={() => input.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={drop}
              disabled={busy}
              aria-label="选择作品图片"
            >
              {picture ? (
                <>
                  <ArtworkImage artwork={{ ...picture, title: '作品预览' } as Artwork} eager />
                  <span className="replace-image">
                    <ImagePlus size={16} /> 更换图片
                  </span>
                </>
              ) : (
                <>
                  <span className="upload-icon">
                    <Upload size={26} strokeWidth={1.3} />
                  </span>
                  <strong>将作品拖到这里</strong>
                  <span>或点击选择图片</span>
                </>
              )}
              {processing && (
                <span className="processing">
                  <LoaderCircle className="spin" /> 正在处理图片…
                </span>
              )}
            </button>
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              tabIndex={-1}
              aria-label="上传图片文件"
              disabled={busy}
              onChange={(e) => {
                void chooseFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <p className="upload-hint">
              JPG、PNG、WebP、AVIF · 单张不超过 20 MB
              <br />
              图片会优化至最长边 2400 px，便于本地收藏。
            </p>
          </div>
          <div className="form-fields">
            <label>
              作品名称 <span className="required">*</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
                placeholder="给这件作品一个名字"
                disabled={busy}
              />
            </label>
            <div className="field-row">
              <label>
                创作日期 <span className="required">*</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  min="0001-01-01"
                  max="9999-12-31"
                  disabled={busy}
                />
              </label>
              <label>
                作品类别
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Artwork['category'])}
                  disabled={busy}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              创作媒介
              <input
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                maxLength={120}
                placeholder="例如：布面油画、胶片、铅笔"
                disabled={busy}
              />
            </label>
            <div className="field-row">
              <label>
                策展系列
                <input
                  value={series}
                  maxLength={50}
                  onChange={(e) => setSeries(e.target.value)}
                  placeholder="例如：夏日观察"
                  disabled={busy}
                />
              </label>
              <label>
                作品标签
                <input
                  value={tags}
                  maxLength={200}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="光影，植物，旅行"
                  disabled={busy}
                />
              </label>
            </div>
            <label>
              创作笔记
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={5000}
                rows={4}
                placeholder="灵感从哪里来？记录一点当时的想法…"
                disabled={busy}
              />
            </label>
            <span className="character-count">{notes.length} / 5000</span>
          </div>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <span className="local-note">
            <span className="status-dot" /> 安心保存在此浏览器
          </span>
          <div>
            <button type="button" className="button button-ghost" disabled={busy} onClick={onClose}>
              取消
            </button>
            <button type="submit" className="button button-dark" disabled={busy}>
              {saving ? '正在保存…' : processing ? '正在处理…' : artwork ? '保存更改' : '收藏作品'}
              {busy ? <LoaderCircle size={16} className="spin" /> : <ArrowUpRight size={17} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
