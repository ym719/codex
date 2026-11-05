import { useEffect, useRef, type ReactNode, type KeyboardEventHandler } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  title,
  onClose,
  children,
  className = '',
  busy = false,
  onKeyDown,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  busy?: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLDialogElement>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const active = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      active?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-label={title}
      onKeyDown={onKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          const r = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < r.left ||
            event.clientX > r.right ||
            event.clientY < r.top ||
            event.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <button
        className="icon-button modal-close"
        type="button"
        aria-label="关闭"
        disabled={busy}
        onClick={onClose}
      >
        <X size={20} />
      </button>
      {children}
    </dialog>
  );
}
