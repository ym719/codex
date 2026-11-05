import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Grid2X2,
  Heart,
  Layers3,
  LayoutList,
  LoaderCircle,
  Maximize2,
  Moon,
  Palette,
  Plus,
  Search,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import {
  categories,
  type Artwork,
  type ArtworkInput,
  type ArchiveBackup,
  type Category,
  type JournalEntry,
  type PageView,
  type SortOrder,
} from './types';
import {
  assignSeries,
  deleteArtworks,
  getArtworks,
  getJournals,
  initializeLibrary,
  removeSeries,
  restoreArtworks,
  saveArtwork,
  storageError,
  toggleArtworkFavorite,
  updateJournal,
} from './lib/db';
import { countCategories, localDate, selectArtworks } from './lib/artworks';
import { createDemoArtworks } from './lib/demo';
import { createBackup, downloadFile, readBackup } from './lib/backup';
import { useTheme } from './lib/useTheme';
import { palettes, seriesGroups } from './lib/studio';
import ArtworkForm from './components/ArtworkForm';
import ArtworkCard from './components/ArtworkCard';
import ArtworkDetail from './components/ArtworkDetail';
import StudioHero, { ArtMark } from './components/StudioHero';
import ColorLab from './components/ColorLab';
import Collections, { SeriesEditor } from './components/Collections';
import { JournalEditor, JournalPage } from './components/Journal';
import Archive from './components/Archive';
import About from './components/About';
import Modal from './components/Modal';

type Confirmation =
  | { kind: 'delete'; artwork: Artwork }
  | { kind: 'clear' }
  | { kind: 'restore'; data: ArchiveBackup }
  | { kind: 'journal'; entry: JournalEntry }
  | { kind: 'series'; name: string };
const navigation: { id: PageView; label: string }[] = [
  { id: 'home', label: '艺术空间' },
  { id: 'collections', label: '我的策展' },
  { id: 'archive', label: '创作档案' },
  { id: 'colors', label: '色彩实验室' },
  { id: 'journal', label: '灵感手记' },
];

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [view, setView] = useState<PageView>('home');
  const [category, setCategory] = useState<Category | '全部'>('全部');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [series, setSeries] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [immersive, setImmersive] = useState(false);
  const [editor, setEditor] = useState<Artwork | 'new' | null>(null);
  const [journalEditor, setJournalEditor] = useState<Partial<JournalEntry> | null>(null);
  const [seriesEditor, setSeriesEditor] = useState(false);
  const [about, setAbout] = useState(false);
  const [confirm, setConfirm] = useState<Confirmation | null>(null);
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');
  const channel = useRef<BroadcastChannel | null>(null);
  const refresh = useCallback(async (broadcast = true) => {
    const [arts, notes] = await Promise.all([getArtworks(), getJournals()]);
    setArtworks(arts);
    setJournals(notes);
    if (broadcast) channel.current?.postMessage('updated');
  }, []);
  const initialize = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      await initializeLibrary(createDemoArtworks);
      await refresh(false);
    } catch (error) {
      setLoadError(storageError(error));
    } finally {
      setLoading(false);
    }
  }, [refresh]);
  useEffect(() => {
    void initialize();
  }, [initialize]);
  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;
    const next = new BroadcastChannel('art-archive-updates');
    channel.current = next;
    next.onmessage = () => {
      void refresh(false).catch(() => setToast('同步失败，请刷新页面重试。'));
    };
    return () => {
      next.close();
      channel.current = null;
    };
  }, [refresh]);
  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const counts = useMemo(() => countCategories(artworks), [artworks]);
  const visible = useMemo(
    () =>
      selectArtworks(artworks, category, query, sort).filter(
        (art) => (!favoritesOnly || art.favorite) && (!series || art.series === series),
      ),
    [artworks, category, query, sort, favoritesOnly, series],
  );
  const groups = useMemo(() => seriesGroups(artworks), [artworks]);
  const favorites = artworks.filter((art) => art.favorite).length;
  const demos = artworks.filter((art) => art.isDemo).length;
  const selected = artworks.find((art) => art.id === selectedId);
  const selectedList = view === 'home' ? visible : selectArtworks(artworks, '全部', '', 'newest');
  function navigate(next: PageView) {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function resetFilters() {
    setCategory('全部');
    setQuery('');
    setFavoritesOnly(false);
    setSeries('');
  }
  function openCatalog(name = '', onlyFavorites = false) {
    setView('home');
    resetFilters();
    setSeries(name);
    setFavoritesOnly(onlyFavorites);
    requestAnimationFrame(() =>
      document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }),
    );
  }
  function startUpload() {
    setEditor('new');
    setSelectedId(null);
  }
  function openArt(art: Artwork, theater = false) {
    setSelectedId(art.id);
    setImmersive(theater);
  }
  function openNote(note: Partial<JournalEntry> = {}) {
    setJournalEditor(note);
  }
  async function save(input: ArtworkInput) {
    const now = Date.now();
    const previous = editor && editor !== 'new' ? editor : null;
    await saveArtwork({
      ...input,
      id: previous?.id ?? crypto.randomUUID(),
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      isDemo: false,
    });
    await refresh();
    setEditor(null);
    resetFilters();
    setToast(previous ? '作品已更新，故事还在继续' : '新作品已收入你的艺术空间');
  }
  async function favorite(id: string) {
    try {
      await toggleArtworkFavorite(id);
      await refresh();
    } catch (error) {
      setToast(storageError(error));
    }
  }
  async function exportBackup() {
    setWorking(true);
    setActionError('');
    try {
      downloadFile(await createBackup(artworks, journals), `art-archive-${localDate()}.json`);
      setToast('作品与手记已导出，请妥善保管备份');
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
      const data = await readBackup(file);
      setAbout(false);
      setConfirm({ kind: 'restore', data });
    } catch (error) {
      setActionError(storageError(error));
    } finally {
      setWorking(false);
    }
  }
  function requestConfirm(next: Confirmation) {
    setActionError('');
    setSelectedId(null);
    setConfirm(next);
  }
  async function confirmAction() {
    if (!confirm || working) return;
    setWorking(true);
    setActionError('');
    try {
      if (confirm.kind === 'restore')
        await restoreArtworks(confirm.data.artworks, confirm.data.journals);
      else if (confirm.kind === 'journal') await updateJournal(null, confirm.entry.id);
      else if (confirm.kind === 'series') await removeSeries(confirm.name);
      else
        await deleteArtworks(
          confirm.kind === 'delete'
            ? [confirm.artwork.id]
            : artworks.filter((a) => a.isDemo).map((a) => a.id),
        );
      await refresh();
      setConfirm(null);
      resetFilters();
      setToast(
        confirm.kind === 'restore'
          ? '备份已恢复，欢迎回到你的艺术空间'
          : confirm.kind === 'series'
            ? '系列已移除，所有作品仍然保留'
            : '已完成，给新的灵感留一点空间',
      );
    } catch (error) {
      setActionError(storageError(error));
    } finally {
      setWorking(false);
    }
  }
  const confirmationTitle =
    confirm?.kind === 'delete'
      ? '删除作品'
      : confirm?.kind === 'clear'
        ? '清空示例'
        : confirm?.kind === 'journal'
          ? '删除手记'
          : confirm?.kind === 'series'
            ? '移除系列'
            : '恢复备份';

  return (
    <>
      <div className="top-strip">
        <span>ART IS A WAY OF SEEING.</span>
        <span>
          <i /> 你的私人艺术空间 · 作品仅存本地
        </span>
        <span>MAKE SOMETHING THAT FEELS LIKE YOU ↗</span>
      </div>
      <header className="site-header">
        <a
          className="brand"
          href="#"
          aria-label="Art Archive 首页"
          onClick={(e) => {
            e.preventDefault();
            resetFilters();
            navigate('home');
          }}
        >
          <ArtMark />
          <span>
            Art Archive<small>收藏创作，也收藏生活。</small>
          </span>
        </a>
        <nav aria-label="主导航">
          {navigation.map((item) => (
            <button
              className={`nav-link ${view === item.id ? 'active' : ''}`}
              key={item.id}
              aria-current={view === item.id ? 'page' : undefined}
              onClick={() => navigate(item.id)}
            >
              {item.label}
              {item.id === 'colors' && <i className="nav-new" />}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="theme-toggle"
            aria-label={theme === 'day' ? '切换到夜间主题' : '切换到白天主题'}
            aria-pressed={theme === 'night'}
            onClick={toggleTheme}
          >
            {theme === 'day' ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === 'day' ? '日间' : '夜间'}</span>
          </button>
          <button
            className="button button-primary header-upload"
            onClick={startUpload}
            disabled={loading || !!loadError}
          >
            <Plus size={17} />
            <span>添加作品</span>
          </button>
        </div>
      </header>
      <main>
        {view === 'home' && (
          <>
            <StudioHero
              theme={theme}
              onAdd={startUpload}
              onRandom={() => {
                resetFilters();
                openArt(artworks[Math.floor(Math.random() * artworks.length)]);
              }}
              disabled={loading || !!loadError}
              noArt={!artworks.length}
            />
            <div className="color-ribbon" aria-hidden="true">
              <span>COLLECT MOMENTS</span>
              <i />
              <span>CREATE WITH FEELING</span>
              <i />
              <span>LIVE IN COLOR</span>
              <i />
              <span>STAY A LITTLE WILD</span>
              <i />
              <span>COLLECT MOMENTS</span>
            </div>
            <div className="studio-stats">
              <button onClick={() => openCatalog()}>
                <span className="stat-icon">
                  <Palette size={22} />
                </span>
                <div>
                  <strong>{String(artworks.length).padStart(2, '0')}</strong>
                  <span>
                    件作品 <small>每一笔都算数</small>
                  </span>
                </div>
                <ArrowUpRight size={17} />
              </button>
              <button onClick={() => openCatalog('', true)}>
                <span className="stat-icon">
                  <Heart size={22} />
                </span>
                <div>
                  <strong>{String(favorites).padStart(2, '0')}</strong>
                  <span>
                    件心选 <small>值得再看一眼</small>
                  </span>
                </div>
                <ArrowUpRight size={17} />
              </button>
              <button onClick={() => navigate('collections')}>
                <span className="stat-icon">
                  <Layers3 size={22} />
                </span>
                <div>
                  <strong>{String(groups.length).padStart(2, '0')}</strong>
                  <span>
                    个策展系列 <small>让灵感发生关联</small>
                  </span>
                </div>
                <ArrowUpRight size={17} />
              </button>
              <button onClick={() => navigate('journal')}>
                <span className="stat-icon">
                  <BookOpen size={22} />
                </span>
                <div>
                  <strong>{String(journals.length).padStart(2, '0')}</strong>
                  <span>
                    则灵感手记 <small>抓住一闪而过</small>
                  </span>
                </div>
                <ArrowUpRight size={17} />
              </button>
            </div>
          </>
        )}
        {loading ? (
          <div className="empty-state" role="status">
            <LoaderCircle className="spin" size={30} />
            <h3>正在打开你的艺术档案…</h3>
          </div>
        ) : loadError ? (
          <div className="empty-state" role="alert">
            <Palette size={34} />
            <h3>暂时无法打开本地档案</h3>
            <p>{loadError}</p>
            <button className="button button-primary" onClick={() => void initialize()}>
              重新尝试
            </button>
          </div>
        ) : (
          <>
            {view === 'home' && (
              <>
                <section id="collection" className="collection-section" aria-label="作品集">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">THE COLLECTION / 作品集</span>
                      <h2>
                        {series
                          ? series
                          : favoritesOnly
                            ? '偏爱，是最好的策展人。'
                            : '每一件作品，都有自己的温度。'}
                        <span className="heading-spark" aria-hidden="true">
                          ✷
                        </span>
                      </h2>
                    </div>
                    <button
                      className="text-link exhibition-link"
                      onClick={() => openArt(visible[0], true)}
                      disabled={!visible.length}
                    >
                      <Maximize2 size={16} />
                      沉浸看展 <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="collection-toolbar">
                    <div className="filter-tabs" role="group" aria-label="作品分类">
                      {(['全部', ...categories] as const).map((c) => (
                        <button
                          key={c}
                          className={`filter-tab ${category === c ? 'selected' : ''}`}
                          aria-pressed={category === c}
                          onClick={() => setCategory(c)}
                        >
                          {c === '全部' ? '全部作品' : c}
                          <span>{c === '全部' ? artworks.length : counts[c]}</span>
                        </button>
                      ))}
                      <button
                        className={`filter-tab heart-filter ${favoritesOnly ? 'selected' : ''}`}
                        aria-pressed={favoritesOnly}
                        onClick={() => setFavoritesOnly(!favoritesOnly)}
                      >
                        <Heart size={13} fill={favoritesOnly ? 'currentColor' : 'none'} />
                        只看心选
                      </button>
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
                        <Search size={17} />
                      </button>
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
                    </div>
                  </div>
                  {searchOpen && (
                    <div className="search-box">
                      <Search size={18} />
                      <input
                        aria-label="搜索作品名称、媒介或笔记"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="搜索作品、媒介、笔记、标签或系列…"
                        autoFocus
                      />
                      <button
                        className="icon-button"
                        aria-label="清空搜索"
                        onClick={() => setQuery('')}
                        disabled={!query}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {series && (
                    <div className="active-series">
                      <Layers3 size={14} />
                      正在浏览系列：{series}
                      <button
                        className="icon-button"
                        aria-label="清除系列筛选"
                        onClick={() => setSeries('')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {demos > 0 && (
                    <div className="demo-notice">
                      <span>
                        <i />
                        一点灵感，作为开始。<span>当前包含 {demos} 件示例作品。</span>
                      </span>
                      <button onClick={() => requestConfirm({ kind: 'clear' })}>
                        清空示例 <ArrowUpRight size={13} />
                      </button>
                    </div>
                  )}
                  {visible.length === 0 ? (
                    <div className="empty-state">
                      <Palette size={38} strokeWidth={1} />
                      <span className="eyebrow">ROOM FOR YOUR NEXT LITTLE MASTERPIECE</span>
                      <h3>
                        {artworks.length === 0
                          ? '你的故事，从第一件作品开始。'
                          : favoritesOnly
                            ? '把偏爱的作品，留在这里。'
                            : '还没有找到这件作品。'}
                      </h3>
                      <p>
                        {artworks.length === 0
                          ? '一张画、一帧光影、一页速写。你的每一次表达，都值得被收藏。'
                          : favoritesOnly
                            ? '点击作品上的爱心，即可收入心选收藏。'
                            : '试试其他分类，或换一个搜索词。'}
                      </p>
                      <button
                        className="button button-primary"
                        onClick={artworks.length === 0 ? startUpload : resetFilters}
                      >
                        {artworks.length === 0 ? '添加第一件作品' : '查看全部作品'}
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className={`artwork-grid ${layout === 'list' ? 'list-layout' : ''}`}>
                      {visible.map((art, index) => (
                        <ArtworkCard
                          key={art.id}
                          art={art}
                          index={index}
                          onOpen={() => openArt(art)}
                          onFavorite={() => void favorite(art.id)}
                        />
                      ))}
                    </div>
                  )}
                  {visible.length > 0 && (
                    <div className="collection-end">
                      <span />
                      已展出 {visible.length} 件作品 · 灵感仍在继续
                      <span />
                    </div>
                  )}
                </section>
                <section className="inspiration-section">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">A LITTLE INSPIRATION / 给灵感加点颜色</span>
                      <h2>换一种颜色，看看世界。</h2>
                    </div>
                    <button className="text-link" onClick={() => navigate('colors')}>
                      走进色彩实验室 <ArrowUpRight size={17} />
                    </button>
                  </div>
                  <div className="inspiration-cards">
                    <button
                      className="movement-card impression"
                      onClick={() => {
                        navigate('colors');
                      }}
                    >
                      <div>
                        <span className="eyebrow">01 / CHASING THE LIGHT</span>
                        <h3>
                          像印象派一样，
                          <br />
                          捕捉转瞬的光。
                        </h3>
                        <p>柔和的色彩，不柔弱的表达。</p>
                        <span className="movement-link">
                          寻找光影的颜色 <ArrowUpRight size={19} />
                        </span>
                      </div>
                      <div className="movement-art lily-art" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                      </div>
                    </button>
                    <button className="movement-card fauvism" onClick={() => navigate('colors')}>
                      <div>
                        <span className="eyebrow">02 / FEELING OVER REALITY</span>
                        <h3>
                          像野兽派一样，
                          <br />
                          让颜色先开口。
                        </h3>
                        <p>把真实交给眼睛，把大胆交给自己。</p>
                        <span className="movement-link">
                          试试更自由的色彩 <ArrowUpRight size={19} />
                        </span>
                      </div>
                      <div className="movement-art wild-art" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                      </div>
                    </button>
                  </div>
                </section>
                <section className="daily-note">
                  <span className="daily-mark" aria-hidden="true">
                    “
                  </span>
                  <div>
                    <span className="eyebrow">A SMALL INVITATION</span>
                    <h2>今天，给自己一点创作的时间。</h2>
                    <p>不必等待灵感，只需记录眼前的一点点美好。</p>
                  </div>
                  <button
                    className="button button-ink"
                    onClick={() =>
                      openNote({
                        title: '今天的一点观察',
                        body: palettes[0].prompt,
                        colors: palettes[0].colors,
                      })
                    }
                  >
                    <PencilIcon />
                    写一则灵感 <ArrowUpRight size={16} />
                  </button>
                </section>
              </>
            )}
            {view === 'collections' && (
              <Collections
                artworks={artworks}
                onOpen={openCatalog}
                onCreate={() => setSeriesEditor(true)}
                onDelete={(name) => requestConfirm({ kind: 'series', name })}
              />
            )}
            {view === 'archive' && <Archive artworks={artworks} onSelect={(art) => openArt(art)} />}
            {view === 'colors' && <ColorLab onNote={openNote} onMessage={setToast} />}
            {view === 'journal' && (
              <JournalPage
                entries={journals}
                onAdd={() => openNote()}
                onEdit={openNote}
                onDelete={(entry) => requestConfirm({ kind: 'journal', entry })}
                onColors={() => navigate('colors')}
              />
            )}
          </>
        )}
        <section className="closing-note">
          <ArtMark />
          <p>
            Make art. <em>Make it yours.</em>
          </p>
          <span>不必成为谁，只管大胆表达。</span>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('home');
            }}
          >
            <ArtMark />
            <span>
              Art Archive<small>一个有颜色的私人艺术空间。</small>
            </span>
          </a>
          <div className="footer-links">
            <button onClick={() => navigate('colors')}>色彩实验室</button>
            <button onClick={() => navigate('journal')}>灵感手记</button>
            <button
              onClick={() => {
                setActionError('');
                setAbout(true);
              }}
            >
              关于与备份
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Art Archive · Made for the art of living.</span>
          <button
            className="local-note"
            onClick={() => {
              setActionError('');
              setAbout(true);
            }}
          >
            <i />
            作品仅保存在此浏览器 <ArrowUpRight size={12} />
          </button>
          <span>STAY CURIOUS. STAY COLORFUL.</span>
        </div>
        <div className="footer-colors" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </footer>
      {editor && (
        <ArtworkForm
          artwork={editor === 'new' ? undefined : editor}
          onSave={save}
          onClose={() => setEditor(null)}
        />
      )}
      {selected && (
        <ArtworkDetail
          artwork={selected}
          artworks={selectedList.some((a) => a.id === selected.id) ? selectedList : artworks}
          immersive={immersive}
          onSelect={(art) => setSelectedId(art.id)}
          onClose={() => setSelectedId(null)}
          onEdit={() => {
            setEditor(selected);
            setSelectedId(null);
          }}
          onDelete={() => requestConfirm({ kind: 'delete', artwork: selected })}
          onFavorite={() => void favorite(selected.id)}
        />
      )}
      {journalEditor && (
        <JournalEditor
          entry={journalEditor}
          onClose={() => setJournalEditor(null)}
          onSave={async (entry) => {
            await updateJournal(entry, entry.id);
            await refresh();
            setJournalEditor(null);
            navigate('journal');
            setToast('灵感已留下，随时回来继续');
          }}
        />
      )}
      {seriesEditor && (
        <SeriesEditor
          artworks={artworks}
          onClose={() => setSeriesEditor(false)}
          onSave={async (ids, name) => {
            await assignSeries(ids, name);
            await refresh();
            setSeriesEditor(false);
            navigate('collections');
            setToast('新的策展系列已经准备好');
          }}
        />
      )}
      {about && (
        <About
          count={artworks.length}
          journals={journals.length}
          busy={working}
          error={actionError}
          onClose={() => setAbout(false)}
          onExport={() => void exportBackup()}
          onImport={(file) => void importBackup(file)}
        />
      )}
      {confirm && (
        <Modal
          title={confirmationTitle}
          onClose={() => setConfirm(null)}
          busy={working}
          className="confirm-modal"
        >
          <span className="confirm-icon">
            <Trash2 size={24} />
          </span>
          <h2>
            {confirm.kind === 'delete'
              ? '和这件作品告别？'
              : confirm.kind === 'clear'
                ? '为你的创作腾出空间。'
                : confirm.kind === 'journal'
                  ? '删除这则灵感手记？'
                  : confirm.kind === 'series'
                    ? '移除这个策展系列？'
                    : '用备份恢复你的收藏？'}
          </h2>
          <p>
            {confirm.kind === 'delete'
              ? `「${confirm.artwork.title}」的图片和记录会从此浏览器删除，此操作无法撤销。`
              : confirm.kind === 'clear'
                ? `将删除 ${demos} 件示例作品。你自己上传、编辑或加入策展系列的作品会保留。此操作无法撤销。`
                : confirm.kind === 'journal'
                  ? `「${confirm.entry.title}」将被永久删除，此操作无法撤销。`
                  : confirm.kind === 'series'
                    ? `仅移除「${confirm.name}」的分组关系，所有作品及图片都会保留。`
                    : `备份中的 ${confirm.data.artworks.length} 件作品将替换当前 ${artworks.length} 件作品，同时用 ${confirm.data.journals.length} 则手记替换当前 ${journals.length} 则手记。旧版备份不含手记。建议先导出当前收藏；恢复后无法撤销。`}
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
              className="button button-danger"
              disabled={working}
              onClick={() => void confirmAction()}
            >
              {working
                ? '正在处理…'
                : confirm.kind === 'delete' || confirm.kind === 'journal'
                  ? '确认删除'
                  : confirm.kind === 'clear'
                    ? '确认清空示例'
                    : confirm.kind === 'series'
                      ? '确认移除'
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
function PencilIcon() {
  return <BookOpen size={16} />;
}
