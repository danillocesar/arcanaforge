import styles from './SheetBackground.module.css';

interface SheetBackgroundProps {
  url?: string;
}

/**
 * Camada atmosférica fixa atrás da ficha inteira — reaproveita a foto do
 * personagem (já existente, sem upload próprio) em preto-e-branco e bem
 * transparente, com vinhetas por cima pra não atrapalhar a leitura.
 */
function SheetBackground({ url }: SheetBackgroundProps) {
  if (!url) return null;

  return (
    <div className={styles.layer} aria-hidden="true">
      <div className={styles.image} style={{ backgroundImage: `url(${url})` }} />
      <div className={styles.vignetteRadial} />
      <div className={styles.vignetteVertical} />
    </div>
  );
}

SheetBackground.displayName = 'SheetBackground';

export default SheetBackground;
