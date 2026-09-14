import Skeleton from '../../ui/Skeleton/Skeleton';
import styles from './SheetSkeleton.module.css';

function SheetSkeleton() {
  return (
    <div className={styles.wrap} role="status" aria-label="Carregando ficha">
      <div className={styles.header}>
        <Skeleton width={54} height={54} radius={17} />
        <div className={styles.headerText}>
          <Skeleton width="55%" height={16} />
          <Skeleton width="35%" height={11} className={styles.gapTop} />
        </div>
      </div>
      <div className={styles.vitals}>
        <Skeleton height={54} radius={15} />
        <Skeleton height={54} radius={15} />
        <Skeleton height={54} radius={15} />
      </div>
      <div className={styles.cards}>
        <Skeleton height={72} radius={18} />
        <Skeleton height={72} radius={18} />
        <Skeleton height={72} radius={18} />
      </div>
    </div>
  );
}

SheetSkeleton.displayName = 'SheetSkeleton';

export default SheetSkeleton;
