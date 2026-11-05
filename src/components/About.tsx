import { useRef } from 'react';
import { Download, ShieldCheck, Upload } from 'lucide-react';
import { ArtMark } from './StudioHero';
import Modal from './Modal';

export default function About({
  onClose,
  onExport,
  onImport,
  busy,
  error,
  count,
  journals,
}: {
  onClose: () => void;
  onExport: () => void;
  onImport: (file?: File) => void;
  busy: boolean;
  error: string;
  count: number;
  journals: number;
}) {
  const file = useRef<HTMLInputElement>(null);
  return (
    <Modal title="关于 Art Archive" onClose={onClose} busy={busy} className="about-modal">
      <ArtMark />
      <span className="eyebrow">A PERSONAL SPACE, FULL OF COLOR</span>
      <h2>
        你的创作，
        <br />
        <em>值得一个有颜色的家。</em>
      </h2>
      <p className="about-intro">
        Art Archive 是你的私人艺术空间。
        <br />
        慢慢创作，大胆表达；不必完美，也值得珍藏。
      </p>
      <div className="about-stats">
        <span>
          <strong>{count}</strong> 件作品
        </span>
        <span>
          <strong>{journals}</strong> 则手记
        </span>
      </div>
      <div className="privacy-note">
        <ShieldCheck size={25} />
        <div>
          <h3>你的作品，只属于你。</h3>
          <p>
            图片、心选、策展系列与手记均保存在当前浏览器，不会上传服务器。清理网站数据、更换设备或浏览器后，资料不会自动转移；隐私模式下关闭窗口也可能清除数据。
          </p>
          <p>
            请定期导出完整备份，在其他设备打开本站后可以恢复。旧版作品备份也能导入；恢复会替换现有作品和手记。
          </p>
        </div>
      </div>
      <div className="backup-actions">
        <button className="button button-primary" disabled={busy} onClick={onExport}>
          <Download size={16} />
          {busy ? '正在处理…' : '导出完整备份'}
        </button>
        <button
          className="button button-outline"
          disabled={busy}
          onClick={() => file.current?.click()}
        >
          <Upload size={16} />
          从备份恢复
        </button>
      </div>
      <input
        className="sr-only"
        ref={file}
        type="file"
        accept="application/json,.json"
        aria-label="导入备份文件"
        onChange={(e) => {
          onImport(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="about-footnote">无需账号 · 没有订阅 · 为每一种表达留一处空间</p>
    </Modal>
  );
}
