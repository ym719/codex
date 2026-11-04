import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Grid2X2,
  HardDrive,
  LayoutList,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  categories,
  type Artwork,
  type ArtworkInput,
  type Category,
  type SortOrder,
} from './types';
import {
  deleteArtworks,
  getArtworks,
  initializeLibrary,
  restoreArtworks,
  saveArtwork,
  storageError,
} from './lib/db';
import {
  countCategories,
  displayDate,
  groupByMonth,
  localDate,
  selectArtworks,
} from './lib/artworks';
import { createDemoArtworks } from './lib/demo';
import { createBackup, downloadFile, readBackup } from './lib/backup';
import ArtworkImage from './components/ArtworkImage';
import ArtworkForm from './components/ArtworkForm';
import Modal from './components/Modal';

type Confirmation =
  | { kind: 'delete'; artwork: Artwork }
  | { kind: 'clear' }
  | { kind: 'restore'; artworks: Artwork[] };

function Mark({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? 'brand-mark small' : 'brand-mark'}
      width="34"
      height="36"
      viewBox="0 0 34 36"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 32V17a14 14 0 0 1 28 0v15M10 32V17a7 7 0 0 1 14 0v15M3 32h28"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [view, setView] = useState<'collection' | 'archive'>('collection');
  const [category, setCategory] = useState<Category | '全部'>('全部');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [editor, setEditor] = useState<Artwork | 'new' | null>(null);
  const [about, setAbout] = useState(false);
  const [confirm, setConfirm] = useState<Confirmation | null>(null);
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');
  const backupInput = useRef<HTMLInputElement>(null);
  const channel = useRef<BroadcastChannel | null>(null);

  const initialize = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      await initializeLibrary(createDemoArtworks);
      setArtworks(await getArtworks());
    } catch (error) {
      setLoadError(storageError(error));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void initialize();
  }, [initialize]);
  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;
    const next = new BroadcastChannel('art-archive-updates');
    channel.current = next;
    next.onmessage = () => {
      void getArtworks()
        .then(setArtworks)
        .catch(() => setToast('档案同步失败，请刷新重试。'));
    };
    return () => {
      next.close();
      channel.current = null;
    };
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const counts = useMemo(() => countCategories(artworks), [artworks]);
  const visible = useMemo(
    () => selectArtworks(artworks, category, query, sort),
    [artworks, category, query, sort],
  );
  const groups = useMemo(() => groupByMonth(visible), [visible]);
  const demos = artworks.filter((art) => art.isDemo).length;
  const years = new Set(artworks.map((art) => art.date.slice(0, 4))).size;
  const selectedIndex = selected ? visible.findIndex((art) => art.id === selected.id) : -1;

  async function refresh() {
    setArtworks(await getArtworks());
    channel.current?.postMessage('updated');
  }
  function startUpload() {
    setEditor('new');
    setSelected(null);
  }
  function navigate(next: 'collection' | 'archive') {
    setView(next);
  }
  async function save(input: ArtworkInput) {
    const now = Date.now();
    const previous = editor && editor !== 'new' ? editor : null;
    const artwork: Artwork = {
      ...input,
      id: previous?.id ?? crypto.randomUUID(),
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      isDemo: false,
    };
    await saveArtwork(artwork);
    await refresh();
    setEditor(null);
    setCategory('全部');
    setQuery('');
    setToast(previous ? '作品已更新' : '新作品已收入你的档案');
  }
  async function exportBackup() {
    setWorking(true);
    setActionError('');
    try {
      downloadFile(await createBackup(artworks), `art-archive-${localDate()}.json`);
      setToast('备份已导出，请妥善保存下载的文件');
    } catch (error) {
      setActionError(storageError(error));
    } finally {
      setWorking(false);
    }
  }
  async function importBackup(file?: File) {
    if (!file) return;
    setWorking(true);
    setActionError('');
    try {
      const entries = await readBackup(file);
      setAbout(false);
      setConfirm({ kind: 'restore', artworks: entries });
    } catch (error) {
      setActionError(storageError(error));
    } finally {
      setWorking(false);
    }
  }
  async function confirmAction() {
    if (!confirm || working) return;
    setWorking(true);
    setActionError('');
    try {
      if (confirm.kind === 'restore') await restoreArtworks(confirm.artworks);
      else
        await deleteArtworks(
          confirm.kind === 'delete'
            ? [confirm.artwork.id]
            : artworks.filter((a) => a.isDemo).map((a) => a.id),
        );
      await refresh();
      setSelected(null);
      setConfirm(null);
      setCategory('全部');
      setQuery('');
      setToast(
        confirm.kind === 'restore'
          ? '备份已恢复'
          : confirm.kind === 'clear'
            ? '示例已清空，开始收藏你的作品吧'
            : '作品已删除',
      );
    } catch (error) {
      setActionError(storageError(error));
    } finally {
      setWorking(false);
    }
  }
  function requestConfirm(next: Confirmation) {
    setActionError('');
    setSelected(null);
    setConfirm(next);
  }

  return (
    <>
      <header className="site-header">
        <a
          className="brand"
          href="#"
          aria-label="Art Archive 首页"
          onClick={(event) => {
            event.preventDefault();
            navigate('collection');
            setCategory('全部');
            setQuery('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Mark />
          <span>
            Art Archive<span className="brand-subtitle">A PERSONAL COLLECTION</span>
          </span>
        </a>
        <nav aria-label="主导航">
          <button
            className={view === 'collection' ? 'nav-link active' : 'nav-link'}
            onClick={() => navigate('collection')}
          >
            作品集
          </button>
          <button
            className={view === 'archive' ? 'nav-link active' : 'nav-link'}
            onClick={() => navigate('archive')}
          >
            创作档案
          </button>
          <button
            className="nav-link about-nav"
            onClick={() => {
              setActionError('');
              setAbout(true);
            }}
          >
            关于
          </button>
        </nav>
        <button
          className="button button-dark header-upload"
          onClick={startUpload}
          disabled={loading || !!loadError}
        >
          <Plus size={17} />
          <span>添加作品</span>
        </button>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-line" />{' '}
              {view === 'collection' ? 'YOUR ART. YOUR STORY.' : 'A JOURNEY IN THE MAKING.'}
            </div>
            <h1 id="hero-title">
              {view === 'collection' ? (
                <>
                  Every work,
                  <br />a little <em>of you.</em>
                  <svg
                    className="hero-period"
                    width="46"
                    height="46"
                    viewBox="0 0 46 46"
                    aria-hidden="true"
                  >
                    <path
                      d="M23 3v40M3 23h40M9 9l28 28M9 37L37 9"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </>
              ) : (
                <>
                  A life told
                  <br />
                  in <em>little moments.</em>
                </>
              )}
            </h1>
            <p>
              {view === 'collection'
                ? '为灵感留一处空间，为创作留一份记录。'
                : '沿着时间，重新遇见每一次创作。'}
              <br />
              <span>
                {view === 'collection'
                  ? '这里，收藏你的每一次看见与表达。'
                  : '那些微小的进步，都在这里留下痕迹。'}
              </span>
            </p>
          </div>
          <aside className="collection-summary">
            <div className="summary-caption">
              <span className="status-dot" /> YOUR GROWING ARCHIVE
              <span className="summary-number">№ 001</span>
            </div>
            <div className="total-stat">
              <span>{String(artworks.length).padStart(2, '0')}</span>
              <div>
                件作品<span>A collection of moments</span>
              </div>
              <ArrowDown size={22} strokeWidth={1} />
            </div>
            <div className="category-stats">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  aria-label={`查看${c}，${counts[c]}件`}
                >
                  <span>{c}</span>
                  <strong>{String(counts[c]).padStart(2, '0')}</strong>
                </button>
              ))}
            </div>
            <p>
              慢慢创作，慢慢收藏。
              <span>
                EST.{' '}
                {artworks.length
                  ? [...artworks].sort((a, b) => a.date.localeCompare(b.date))[0].date.slice(0, 4)
                  : new Date().getFullYear()}
              </span>
            </p>
          </aside>
        </section>

        <section
          id="collection"
          className="collection-section"
          aria-label={view === 'collection' ? '作品集' : '创作档案'}
        >
          <div className="section-title">
            <h2>{view === 'collection' ? '所有的灵感，都在这里。' : '创作，是一条慢慢走的路。'}</h2>
            <span>{view === 'collection' ? 'THE COLLECTION' : 'THE CHRONICLE'}</span>
          </div>
          <div className="collection-toolbar">
            <div className="filter-tabs" role="group" aria-label="作品分类">
              {(['全部', ...categories] as const).map((c) => (
                <button
                  key={c}
                  className={category === c ? 'filter-tab selected' : 'filter-tab'}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c === '全部' ? '全部作品' : c}
                  <span>{c === '全部' ? artworks.length : counts[c]}</span>
                </button>
              ))}
            </div>
            <div className="view-tools">
              <button
                className={`icon-button ${searchOpen ? 'is-active' : ''}`}
                aria-label={searchOpen ? '关闭搜索' : '搜索作品'}
                aria-expanded={searchOpen}
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  if (searchOpen) setQuery('');
                }}
              >
                <Search size={18} />
              </button>
              {view === 'collection' && (
                <>
                  <span className="tool-divider" />
                  <label className="sort-select">
                    <select
                      aria-label="作品排序"
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOrder)}
                    >
                      <option value="newest">创作日期 · 从新到旧</option>
                      <option value="oldest">创作日期 · 从旧到新</option>
                      <option value="added">最近添加</option>
                    </select>
                    <ChevronDown size={13} />
                  </label>
                  <span className="tool-divider" />
                  <div className="layout-switch" role="group" aria-label="显示方式">
                    <button
                      className={`icon-button ${layout === 'grid' ? 'is-active' : ''}`}
                      aria-label="网格视图"
                      aria-pressed={layout === 'grid'}
                      onClick={() => setLayout('grid')}
                    >
                      <Grid2X2 size={16} />
                    </button>
                    <button
                      className={`icon-button ${layout === 'list' ? 'is-active' : ''}`}
                      aria-label="列表视图"
                      aria-pressed={layout === 'list'}
                      onClick={() => setLayout('list')}
                    >
                      <LayoutList size={17} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          {searchOpen && (
            <div className="search-box">
              <Search size={19} />
              <input
                aria-label="搜索作品名称、媒介或笔记"
                placeholder="搜索作品名称、媒介或笔记…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <button
                className="icon-button"
                aria-label="清空搜索"
                onClick={() => setQuery('')}
                disabled={!query}
              >
                <X size={17} />
              </button>
            </div>
          )}
          {demos > 0 && !loading && (
            <div className="demo-notice">
              <span>
                <span className="demo-dot" /> 一点灵感，作为开始。
                <span className="demo-explanation">当前包含 {demos} 件示例作品。</span>
              </span>
              <button onClick={() => requestConfirm({ kind: 'clear' })}>
                清空示例 <ArrowUpRight size={13} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="empty-state" role="status">
              <LoaderCircle className="spin" size={28} />
              <h3>正在打开你的艺术档案…</h3>
            </div>
          ) : loadError ? (
            <div className="empty-state" role="alert">
              <HardDrive size={32} />
              <h3>暂时无法打开本地档案</h3>
              <p>{loadError}</p>
              <button className="button button-dark" onClick={() => void initialize()}>
                重新尝试
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="empty-state">
              <span className="empty-illustration">
                <Mark />
              </span>
              <span className="eyebrow">SPACE FOR SOMETHING GOOD</span>
              <h3>
                {artworks.length === 0 ? '你的故事，从第一件作品开始。' : '还没有找到这件作品。'}
              </h3>
              <p>
                {artworks.length === 0
                  ? '一张画、一帧光影、一页随手的速写。把喜欢的创作留在这里。'
                  : '试试其他分类，或换一个搜索词。'}
              </p>
              <button
                className="button button-dark"
                onClick={
                  artworks.length === 0
                    ? startUpload
                    : () => {
                        setCategory('全部');
                        setQuery('');
                      }
                }
              >
                {artworks.length === 0 ? '添加第一件作品' : '查看全部作品'}
                <Plus size={16} />
              </button>
            </div>
          ) : view === 'archive' ? (
            <div className="timeline">
              {groups.map((group) => (
                <section className="timeline-group" key={group.month}>
                  <div className="timeline-label">
                    <span>{group.month.slice(0, 4)}</span>
                    <h3>{Number(group.month.slice(5))} 月</h3>
                    <small>{group.artworks.length} 件作品</small>
                  </div>
                  <div className="timeline-artworks">
                    {group.artworks.map((art) => (
                      <button
                        className="timeline-card"
                        key={art.id}
                        onClick={() => setSelected(art)}
                      >
                        <ArtworkImage artwork={art} />
                        <div>
                          <span className="eyebrow">{displayDate(art.date)}</span>
                          <h3>{art.title}</h3>
                          <p>
                            {art.category} <span>·</span> {art.medium || '媒介未记录'}
                          </p>
                        </div>
                        <ArrowUpRight size={18} />
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className={`artwork-grid ${layout === 'list' ? 'list-layout' : ''}`}>
              {visible.map((art, index) => (
                <article
                  className="artwork-card"
                  key={art.id}
                  style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                >
                  <button
                    className="artwork-open"
                    onClick={() => setSelected(art)}
                    aria-label={`查看作品：${art.title}`}
                  >
                    <div className={`artwork-frame frame-${index % 3}`}>
                      <ArtworkImage artwork={art} eager={index < 3} />
                      <span className="artwork-peek">
                        <ArrowUpRight size={21} strokeWidth={1.5} />
                      </span>
                      {art.isDemo && <span className="sample-label">示例</span>}
                    </div>
                    <div className="artwork-meta">
                      <div>
                        <h3>{art.title}</h3>
                        <p>{art.medium || art.category}</p>
                      </div>
                      <time dateTime={art.date}>{displayDate(art.date)}</time>
                    </div>
                  </button>
                  <button
                    className="card-menu icon-button"
                    aria-label={`管理作品：${art.title}`}
                    onClick={() => setSelected(art)}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </article>
              ))}
            </div>
          )}
          {!loading && !loadError && visible.length > 0 && (
            <div className="collection-end">
              <span className="end-line" />
              <span>已收藏 {artworks.length} 件作品，灵感仍在继续</span>
              <span className="end-line" />
            </div>
          )}
        </section>
        <section className="closing-note">
          <span className="eyebrow">MAKE ROOM FOR YOUR CREATIVITY</span>
          <p>
            Keep creating. <em>Keep a little.</em>
          </p>
          <button className="text-link" onClick={startUpload} disabled={loading || !!loadError}>
            收藏下一份灵感 <ArrowRight size={17} />
          </button>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-brand">
          <Mark small />
          <span>Art Archive</span>
          <span className="footer-caption">给创作一个安静的角落。</span>
        </div>
        <button
          className="local-note"
          onClick={() => {
            setActionError('');
            setAbout(true);
          }}
        >
          <span className="status-dot" /> 作品仅保存在此浏览器 <ArrowUpRight size={12} />
        </button>
        <span className="footer-year">© {new Date().getFullYear()} Art Archive</span>
      </footer>

      {editor && (
        <ArtworkForm
          artwork={editor === 'new' ? undefined : editor}
          onClose={() => setEditor(null)}
          onSave={save}
        />
      )}
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)} className="detail-modal">
          <div className="detail-image">
            <ArtworkImage artwork={selected} eager />
          </div>
          <div className="detail-info">
            <span className="eyebrow">
              {selected.category} {selected.isDemo && ' / 示例作品'}
            </span>
            <h2>{selected.title}</h2>
            <time dateTime={selected.date}>{displayDate(selected.date)}</time>
            <dl>
              <div>
                <dt>创作媒介</dt>
                <dd>{selected.medium || '尚未记录'}</dd>
              </div>
              <div>
                <dt>图片尺寸</dt>
                <dd>
                  {selected.width} × {selected.height} px
                </dd>
              </div>
            </dl>
            <div className="detail-notes">
              <h3>创作笔记</h3>
              <p>{selected.notes || '有些作品，无需言语。也可以编辑作品，补上一段创作笔记。'}</p>
            </div>
            {selected.isDemo && (
              <p className="sample-info">
                这是一张原创 SVG
                示意作品，用于展示收藏效果。摄影类别使用构图示意图。你可以清空示例，加入自己的创作。
              </p>
            )}
            <div className="detail-actions">
              <button
                className="button button-dark"
                onClick={() => {
                  setEditor(selected);
                  setSelected(null);
                }}
              >
                <Pencil size={15} /> 编辑作品
              </button>
              <button
                className="icon-button danger-text"
                aria-label="删除作品"
                onClick={() => requestConfirm({ kind: 'delete', artwork: selected })}
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="detail-pagination">
              <span>
                {selectedIndex >= 0
                  ? `${String(selectedIndex + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')}`
                  : '当前作品'}
              </span>
              <div>
                <button
                  className="icon-button"
                  aria-label="上一件作品"
                  disabled={selectedIndex <= 0}
                  onClick={() => setSelected(visible[selectedIndex - 1])}
                >
                  <ArrowRight className="rotate" size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label="下一件作品"
                  disabled={selectedIndex < 0 || selectedIndex >= visible.length - 1}
                  onClick={() => setSelected(visible[selectedIndex + 1])}
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {about && (
        <Modal
          title="关于 Art Archive"
          onClose={() => setAbout(false)}
          className="about-modal"
          busy={working}
        >
          <Mark />
          <span className="eyebrow">A QUIET HOME FOR YOUR ART</span>
          <h2>
            属于你的，
            <br />
            小小艺术档案馆。
          </h2>
          <p className="about-intro">
            不必是完成的杰作，也不必被谁认可。
            <br />
            每一份创作，都值得被认真收藏。
          </p>
          <div className="about-stats">
            <div>
              <strong>{artworks.length}</strong>
              <span>件作品</span>
            </div>
            <div>
              <strong>{categories.filter((c) => counts[c] > 0).length}</strong>
              <span>种表达</span>
            </div>
            <div>
              <strong>{years}</strong>
              <span>个创作年份</span>
            </div>
          </div>
          <div className="privacy-note">
            <ShieldCheck size={23} />
            <div>
              <h3>你的作品，由你保管。</h3>
              <p>
                图片和信息通过 IndexedDB
                保存在当前浏览器，不会上传到服务器。清除网站数据、更换浏览器或设备后，作品不会自动转移。隐私模式的数据可能在关闭窗口后消失。
              </p>
              <p>请定期导出备份；在其他设备打开本站后，可用备份恢复收藏。</p>
            </div>
          </div>
          <div className="backup-actions">
            <button
              className="button button-dark"
              disabled={working}
              onClick={() => void exportBackup()}
            >
              <ArrowDownToLine size={16} />
              {working ? '正在处理…' : '导出完整备份'}
            </button>
            <button
              className="button button-outline"
              disabled={working}
              onClick={() => backupInput.current?.click()}
            >
              <Upload size={16} />
              从备份恢复
            </button>
          </div>
          <input
            className="sr-only"
            type="file"
            accept="application/json,.json"
            ref={backupInput}
            aria-label="导入备份文件"
            onChange={(e) => {
              void importBackup(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {actionError && (
            <p className="form-error" role="alert">
              {actionError}
            </p>
          )}
          <p className="about-footnote">无需账号 · 无需订阅 · 留给创作的空间</p>
        </Modal>
      )}
      {confirm && (
        <Modal
          title={
            confirm.kind === 'delete'
              ? '删除作品'
              : confirm.kind === 'clear'
                ? '清空示例'
                : '恢复备份'
          }
          onClose={() => setConfirm(null)}
          className="confirm-modal"
          busy={working}
        >
          <span className="confirm-icon">
            {confirm.kind === 'restore' ? <HardDrive size={24} /> : <Trash2 size={24} />}
          </span>
          <h2>
            {confirm.kind === 'delete'
              ? '和这件作品告别？'
              : confirm.kind === 'clear'
                ? '为你的创作腾出空间。'
                : '用备份恢复你的收藏？'}
          </h2>
          <p>
            {confirm.kind === 'delete'
              ? `「${confirm.artwork.title}」的图片和记录会从此浏览器删除，此操作无法撤销。`
              : confirm.kind === 'clear'
                ? `将删除 ${demos} 件示例作品。你自己上传或编辑过的作品会保留。此操作无法撤销。`
                : `备份中的 ${confirm.artworks.length} 件作品将替换当前 ${artworks.length} 件作品。建议先导出当前收藏；恢复后无法撤销。`}
          </p>
          {actionError && (
            <p className="form-error" role="alert">
              {actionError}
            </p>
          )}
          <div className="confirm-actions">
            <button
              className="button button-outline"
              disabled={working}
              onClick={() => setConfirm(null)}
            >
              取消
            </button>
            <button
              className={`button ${confirm.kind === 'restore' ? 'button-dark' : 'button-danger'}`}
              disabled={working}
              onClick={() => void confirmAction()}
            >
              {working
                ? '正在处理…'
                : confirm.kind === 'delete'
                  ? '确认删除'
                  : confirm.kind === 'clear'
                    ? '确认清空示例'
                    : '确认恢复'}
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button aria-label="关闭通知" onClick={() => setToast('')}>
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
