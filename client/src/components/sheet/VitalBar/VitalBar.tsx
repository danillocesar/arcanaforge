import { useRef, useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import {
  calcTotalDefense,
  getTotalLevel,
  hpPercent,
} from '../../../utils/calculations';
import { getInitials } from '../../../utils/formatters';
import Popover from '../../ui/Popover/Popover';
import Stepper from '../../ui/Stepper/Stepper';
import DefenseBreakdown from '../DefenseBreakdown/DefenseBreakdown';
import styles from './VitalBar.module.css';

interface VitalBarProps {
  editMode?: boolean;
  onToggleEdit?: () => void;
  /** Desktop renders a single horizontal bar (avatar | id | vitals | tools). */
  desktop?: boolean;
}

type OpenPop = 'pv' | 'pm' | 'def' | null;

function VitalBar({ editMode = false, onToggleEdit, desktop = false }: VitalBarProps) {
  const { character, updateCharacter, sendHpUpdate } = useCharacterContext();
  const [openPop, setOpenPop] = useState<OpenPop>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const pvRef = useRef<HTMLButtonElement>(null);
  const pmRef = useRef<HTMLButtonElement>(null);
  const defRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);

  if (!character) return null;

  const totalLevel = getTotalLevel(character);
  const totalDefense = calcTotalDefense(character);

  const hp = character.hp;
  const mp = character.mp;
  const tempHp = character.temporaryHp || 0;
  const tempMp = character.temporaryMp || 0;

  const hpMax = hp.max + tempHp;
  const mpMax = mp.max + tempMp;

  const setHpCurrent = (next: number) => {
    const clamped = Math.max(0, Math.min(hpMax, next));
    updateCharacter((f) => ({ ...f, hp: { ...f.hp, current: clamped } }));
    setTimeout(sendHpUpdate, 50);
  };

  const setMpCurrent = (next: number) => {
    const clamped = Math.max(0, Math.min(mpMax, next));
    updateCharacter((f) => ({ ...f, mp: { ...f.mp, current: clamped } }));
    setTimeout(sendHpUpdate, 50);
  };

  const toggle = (pop: Exclude<OpenPop, null>) =>
    setOpenPop((prev) => (prev === pop ? null : pop));

  // Class line: every class as "<classe> <nível>", joined for multiclass.
  const classLabel = character.classes
    .filter((c) => c.name?.trim())
    .map((c) => `${c.name} ${c.level}`)
    .join(' / ');
  const deity = character.deity?.trim();

  const avatar = (
    <div className={styles.avatar}>
      {character.avatar ? (
        <img className={styles.avatarImg} src={character.avatar} alt="" />
      ) : (
        getInitials(character.name)
      )}
    </div>
  );

  const idMeta = (
    <div className={styles.idMeta}>
      <div className={styles.idName}>{character.name || 'Sem nome'}</div>
      <div className={styles.idLine}>
        {classLabel && <span>{classLabel}</span>}
        {classLabel && <span className={styles.dot} />}
        <span>Nível {totalLevel}</span>
        {deity && <span className={styles.dot} />}
        {deity && <span className={styles.div}>✦ {deity}</span>}
      </div>
    </div>
  );

  const tools = (
    <div className={styles.fichaTools}>
      <button
        type="button"
        ref={menuRef}
        className={`${styles.btnMenu} ${editMode ? styles.btnMenuEditing : ''}`}
        onClick={() => setMenuOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Mais opções"
      >
        ⋯
      </button>
      {!desktop && (
        <div className={styles.lvlPill}>
          <b>{totalLevel}</b>
          <span>Nível</span>
        </div>
      )}
    </div>
  );

  const vitals = (
    <>
      <button
        type="button"
        ref={pvRef}
        className={`${styles.vital} ${styles.pv} ${styles.tappable}`}
        onClick={() => toggle('pv')}
      >
        <div className={styles.lab}>PV</div>
        <div className={styles.val}>
          <span>{hp.current}</span>
          {tempHp > 0 && <span className={styles.temp}> (+{tempHp})</span>}
          <small>/{hp.max}</small>
        </div>
        <div className={styles.track}>
          <i
            style={{
              width: `${hpPercent(hp.current, hpMax)}%`,
              background: 'var(--accent)',
            }}
          />
        </div>
      </button>

      <button
        type="button"
        ref={pmRef}
        className={`${styles.vital} ${styles.pm} ${styles.tappable}`}
        onClick={() => toggle('pm')}
      >
        <div className={styles.lab}>PM</div>
        <div className={styles.val}>
          <span>{mp.current}</span>
          {tempMp > 0 && <span className={styles.temp}> (+{tempMp})</span>}
          <small>/{mp.max}</small>
        </div>
        <div className={styles.track}>
          <i
            style={{
              width: `${hpPercent(mp.current, mpMax)}%`,
              background: '#3b82f6',
            }}
          />
        </div>
      </button>

      <button
        type="button"
        ref={defRef}
        className={`${styles.vital} ${styles.def} ${styles.tappable}`}
        onClick={() => toggle('def')}
      >
        <span className={styles.shield} aria-hidden="true">🛡</span>
        <div className={styles.lab}>Defesa</div>
        <div className={styles.val}>{totalDefense}</div>
      </button>
    </>
  );

  return (
    <header
      className={[
        styles.appHeader,
        desktop ? styles.desktop : '',
        editMode ? styles.editing : '',
      ].filter(Boolean).join(' ')}
    >
      {desktop ? (
        <>
          {avatar}
          {idMeta}
          <div className={styles.vitalsRow}>{vitals}</div>
          {tools}
        </>
      ) : (
        <>
          <div className={styles.idRow}>
            {avatar}
            {idMeta}
            {tools}
          </div>
          <div className={styles.vitals}>{vitals}</div>
        </>
      )}

      <Popover
        open={openPop === 'pv'}
        anchorRef={pvRef}
        onClose={() => setOpenPop(null)}
        align="start"
      >
        <div className={styles.popH}>Pontos de Vida</div>
        <Stepper value={hp.current} onChange={setHpCurrent} min={0} max={hpMax} />
      </Popover>

      <Popover
        open={openPop === 'pm'}
        anchorRef={pmRef}
        onClose={() => setOpenPop(null)}
        align="center"
      >
        <div className={styles.popH}>Pontos de Mana</div>
        <Stepper value={mp.current} onChange={setMpCurrent} min={0} max={mpMax} />
      </Popover>

      <Popover
        open={openPop === 'def'}
        anchorRef={defRef}
        onClose={() => setOpenPop(null)}
        align="end"
      >
        <DefenseBreakdown />
      </Popover>

      <Popover
        open={menuOpen}
        anchorRef={menuRef}
        onClose={() => setMenuOpen(false)}
        align="end"
        glow={false}
      >
        <div className={styles.menu} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              onToggleEdit?.();
              setMenuOpen(false);
            }}
          >
            <span aria-hidden="true">{editMode ? '✓' : '✎'}</span>
            <span>{editMode ? 'Concluir edição' : 'Editar ficha'}</span>
          </button>
          {/* Fase G: Identidade, Notas, Logs, Progressão */}
        </div>
      </Popover>
    </header>
  );
}

VitalBar.displayName = 'VitalBar';

export default VitalBar;
