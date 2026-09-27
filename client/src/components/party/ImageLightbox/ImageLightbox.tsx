import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import type { PartyFile } from '../../../types/partyFile';
import styles from './ImageLightbox.module.css';

interface ImageLightboxProps {
  images: PartyFile[];
  /** Índice aberto; null fecha. */
  index: number | null;
  onChange: (index: number | null) => void;
}

/**
 * Visualizador da Galeria: a imagem em tela cheia dentro do sistema, com
 * anterior/próxima (setas do teclado também) e Esc ou clique fora para fechar.
 */
function ImageLightbox({ images, index, onChange }: ImageLightboxProps) {
  const open = index !== null && index >= 0 && index < images.length;
  const count = images.length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChange(null);
      else if (e.key === 'ArrowRight' && count > 1) onChange(((index ?? 0) + 1) % count);
      else if (e.key === 'ArrowLeft' && count > 1) onChange(((index ?? 0) - 1 + count) % count);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, index, count, onChange]);

  if (!open) return null;
  const image = images[index];

  const step = (delta: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange((index + delta + count) % count);
  };

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={image.name} onClick={() => onChange(null)}>
      <div className={styles.topbar} onClick={(e) => e.stopPropagation()}>
        <span className={styles.name} title={image.name}>{image.name}</span>
        {count > 1 && <span className={styles.counter}>{index + 1} / {count}</span>}
        <a className={styles.iconBtn} href={image.url} target="_blank" rel="noreferrer" title="Abrir original em outra aba">
          <ExternalLink size={18} aria-hidden="true" />
        </a>
        <button type="button" className={styles.iconBtn} onClick={() => onChange(null)} title="Fechar (Esc)">
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <img
        key={image.id}
        className={styles.image}
        src={image.url}
        alt={image.name}
        onClick={(e) => e.stopPropagation()}
      />

      {count > 1 && (
        <>
          <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={step(-1)} title="Anterior (←)">
            <ChevronLeft size={28} aria-hidden="true" />
          </button>
          <button type="button" className={`${styles.nav} ${styles.next}`} onClick={step(1)} title="Próxima (→)">
            <ChevronRight size={28} aria-hidden="true" />
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}

ImageLightbox.displayName = 'ImageLightbox';

export default ImageLightbox;
