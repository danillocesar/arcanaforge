import { useRef, useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import {
  calcTotalDefense,
  getActiveBuffs,
  getEffectiveMaxHp,
  getEffectiveMaxMp,
  getTotalLevel,
  hpPercent,
} from '../../../utils/calculations';
import { normalizeEffectType } from '../../../utils/buffEffects';
import {
  applyDamage,
  applyHeal,
  clampVital,
  describeNewDay,
  getVital,
  newDay,
  normalizeVitals,
  setVital,
  type VitalPool,
} from '../../../utils/vitals';
import ConfirmModal from '../../ui/ConfirmModal/ConfirmModal';
import { getInitials } from '../../../utils/formatters';
import { apiUploadAvatar } from '../../../api';
import Popover from '../../ui/Popover/Popover';
import Stepper from '../../ui/Stepper/Stepper';
import NumericInput from '../../ui/NumericInput/NumericInput';
import DefenseBreakdown from '../DefenseBreakdown/DefenseBreakdown';
import ClassesBreakdown from '../ClassesBreakdown/ClassesBreakdown';
import NotesSheet from '../NotesSheet/NotesSheet';
import InfoSheet from '../InfoSheet/InfoSheet';
import TemporaryEffectsSheet from '../TemporaryEffectsSheet/TemporaryEffectsSheet';
import ProgressionSheet from '../ProgressionSheet/ProgressionSheet';
import LogsSheet from '../LogsSheet/LogsSheet';
import TakeDamageSheet from '../TakeDamageSheet/TakeDamageSheet';
import styles from './VitalBar.module.css';

interface VitalBarProps {
  /** Desktop renders a single horizontal bar (avatar | id | vitals | tools). */
  desktop?: boolean;
}

type OpenPop = 'pv' | 'pm' | 'def' | 'level' | null;

function VitalBar({ desktop = false }: VitalBarProps) {
  const { character, updateCharacter, sendHpUpdate, readOnly } = useCharacterContext();
  const [openPop, setOpenPop] = useState<OpenPop>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [effectsOpen, setEffectsOpen] = useState(false);
  const [progressionOpen, setProgressionOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [damageOpen, setDamageOpen] = useState(false);
  const [newDayOpen, setNewDayOpen] = useState(false);

  const pvRef = useRef<HTMLButtonElement>(null);
  const pmRef = useRef<HTMLButtonElement>(null);
  const defRef = useRef<HTMLButtonElement>(null);
  const lvlRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !character) return;
    const { url } = await apiUploadAvatar(character._id, file);
    updateCharacter((c) => ({ ...c, avatar: url }));
  };

  if (!character) return null;

  const totalLevel = getTotalLevel(character);
  const totalDefense = calcTotalDefense(character);

  const hp = character.hp;
  const mp = character.mp;
  const tempHp = character.temporaryHp || 0;
  const tempMp = character.temporaryMp || 0;

  const effectiveMaxHp = getEffectiveMaxHp(character);
  const effectiveMaxMp = getEffectiveMaxMp(character);
  const fixedHpBonus = effectiveMaxHp - hp.max;
  const fixedMpBonus = effectiveMaxMp - mp.max;

  // Modelo de sobrevida (utils/vitals.ts): o atual nunca passa do máximo efetivo; o
  // temporário é pool separado, consumido antes e nunca curado.
  const afterVitals = () => setTimeout(sendHpUpdate, 50);

  /** Digitar/arrastar define o atual, clampado no máximo efetivo (sem o temporário). */
  const setCurrent = (pool: VitalPool) => (next: number) => {
    updateCharacter((f) => setVital(f, pool, clampVital({ ...getVital(f, pool), current: next })));
    afterVitals();
  };
  /** −/+ são dano/cura de 1: dano consome o temporário primeiro; cura nunca o repõe. */
  const stepVital = (pool: VitalPool) => (delta: number) => {
    updateCharacter((f) => (delta < 0 ? applyDamage(f, -delta, pool) : applyHeal(f, delta, pool)));
    afterVitals();
  };
  const healAll = (pool: VitalPool) => () => {
    updateCharacter((f) => applyHeal(f, Infinity, pool));
    afterVitals();
  };
  const setMax = (pool: VitalPool) => (next: number) => {
    updateCharacter((f) => normalizeVitals(
      pool === 'hp'
        ? { ...f, hp: { ...f.hp, max: Math.max(0, next) } }
        : { ...f, mp: { ...f.mp, max: Math.max(0, next) } },
    ));
    afterVitals();
  };
  const setTemp = (pool: VitalPool) => (next: number) => {
    updateCharacter((f) => setVital(f, pool, { ...getVital(f, pool), temp: Math.max(0, next) }));
    afterVitals();
  };
  /** Buffs ativos que concedem temporário deste pool — a origem mostrada no popover. */
  const tempSources = (pool: VitalPool) => {
    const wanted = pool === 'hp' ? 'temp_hp' : 'temp_mp';
    return getActiveBuffs(character)
      .filter((b) => (b.effects || []).some((e) => normalizeEffectType(e.type) === wanted))
      .map((b) => b.name)
      .filter(Boolean)
      .join(', ');
  };

  /** "Novo dia" (decisão da mesa): desliga todos os buffs, zera temporários, cura tudo, renova usos. */
  const newDaySummary = describeNewDay(character);
  const newDayMessage =
    `${newDaySummary.buffsOff} buff(s) desligado(s) · PV temporário ${newDaySummary.tempHp} e PM temporário `
    + `${newDaySummary.tempMp} zerados · PV +${newDaySummary.healHp} e PM +${newDaySummary.healMp} (ao máximo) · `
    + 'usos por dia renovados.';
  const confirmNewDay = () => {
    updateCharacter((f) => {
      const d = describeNewDay(f);
      return {
        ...newDay(f),
        logs: [
          ...f.logs,
          {
            type: 'rest',
            name: 'Novo dia',
            mpSpent: 0,
            timestamp: Date.now(),
            details: `${d.buffsOff} buffs desligados · temp PV ${d.tempHp} / PM ${d.tempMp} zerados · PV +${d.healHp} · PM +${d.healMp}`,
          },
        ],
      };
    });
    afterVitals();
  };

  const setHpCurrent = setCurrent('hp');
  const setMpCurrent = setCurrent('mp');
  const setHpMax = setMax('hp');
  const setMpMax = setMax('mp');
  const setTempHp = setTemp('hp');
  const setTempMp = setTemp('mp');

  const toggle = (pop: Exclude<OpenPop, null>) =>
    setOpenPop((prev) => (prev === pop ? null : pop));

  // Class line: every class as "<classe> <nível>", joined for multiclass.
  const classLabel = character.classes
    .filter((c) => c.name?.trim())
    .map((c) => `${c.name} ${c.level}`)
    .join(' / ');
  const deity = character.deity?.trim();

  const avatar = (
    <div
      className={`${styles.avatar} ${styles.avatarBtn}`}
      role="button"
      tabIndex={0}
      aria-label="Alterar foto"
      onClick={() => fileRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
    >
      {character.avatar ? (
        <img className={styles.avatarImg} src={character.avatar} alt="" />
      ) : (
        getInitials(character.name)
      )}
      <span className={styles.avatarOverlay}>📷</span>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={handleAvatarUpload}
      />
    </div>
  );

  const idMeta = (
    <div className={styles.idMeta}>
      {readOnly ? (
        <div className={styles.idName}>{character.name || 'Sem nome'}</div>
      ) : (
        <input
          className={`${styles.idName} ${styles.idNameInput}`}
          value={character.name}
          onChange={(e) => updateCharacter((f) => ({ ...f, name: e.target.value }))}
          placeholder="Nome do personagem"
        />
      )}
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
        ref={lvlRef}
        className={styles.lvlPill}
        onClick={() => toggle('level')}
        aria-label="Ver e alterar nível"
      >
        <b>{totalLevel}</b>
        <span>Nível</span>
      </button>
      <button
        type="button"
        ref={menuRef}
        className={styles.btnMenu}
        onClick={() => setMenuOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Mais opções"
      >
        ⋯
      </button>
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
          <small>/{effectiveMaxHp}</small>
        </div>
        <div className={styles.track}>
          <i
            style={{
              width: `${hpPercent(hp.current, effectiveMaxHp + tempHp)}%`,
              background: '#ef4444',
            }}
          />
          {tempHp > 0 && (
            <i
              className={styles.tempSeg}
              style={{
                left: `${hpPercent(effectiveMaxHp, effectiveMaxHp + tempHp)}%`,
                width: `${hpPercent(tempHp, effectiveMaxHp + tempHp)}%`,
              }}
              aria-hidden="true"
            />
          )}
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
          <small>/{effectiveMaxMp}</small>
        </div>
        <div className={styles.track}>
          <i
            style={{
              width: `${hpPercent(mp.current, effectiveMaxMp + tempMp)}%`,
              background: '#3b82f6',
            }}
          />
          {tempMp > 0 && (
            <i
              className={styles.tempSeg}
              style={{
                left: `${hpPercent(effectiveMaxMp, effectiveMaxMp + tempMp)}%`,
                width: `${hpPercent(tempMp, effectiveMaxMp + tempMp)}%`,
              }}
              aria-hidden="true"
            />
          )}
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
      className={[styles.appHeader, desktop ? styles.desktop : ''].filter(Boolean).join(' ')}
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
        className={styles.vitalPop}
      >
        <div className={styles.popH}>Pontos de Vida</div>
        {!readOnly ? (
          <Stepper value={hp.current} onChange={setHpCurrent} onStep={stepVital('hp')} min={0} max={effectiveMaxHp} barColor="#ef4444" />
        ) : (
          <div className={styles.popRow}>
            <span>Atual</span>
            <b>{hp.current}</b>
          </div>
        )}
        <div className={styles.popRow}>
          <span>Máximo</span>
          {!readOnly ? (
            <NumericInput
              className={styles.maxInput}
              value={hp.max}
              onChange={setHpMax}
              min={0}
            />
          ) : (
            <b>{hp.max}</b>
          )}
        </div>
        {fixedHpBonus > 0 && (
          <div className={styles.popRow}>
            <span>Bônus fixo (poderes)</span>
            <b>+{fixedHpBonus}</b>
          </div>
        )}
        <div className={styles.popRow}>
          <span>Temporário</span>
          {!readOnly ? (
            <NumericInput
              className={styles.maxInput}
              value={tempHp}
              onChange={setTempHp}
              min={0}
            />
          ) : (
            <b>{tempHp}</b>
          )}
        </div>
        <div className={styles.popHint}>
          Sobrevida: é consumida antes do PV e não é curada.
          {tempSources('hp') && ` Origem: ${tempSources('hp')}.`}
        </div>
        {!readOnly && (
          <>
            <button
              type="button"
              className={styles.healAllBtn}
              onClick={() => {
                setOpenPop(null);
                setDamageOpen(true);
              }}
            >
              💥 Tomar dano
            </button>
            <button type="button" className={styles.healAllBtn} onClick={healAll('hp')}>
              ✚ Curar tudo
            </button>
          </>
        )}
      </Popover>

      <Popover
        open={openPop === 'pm'}
        anchorRef={pmRef}
        onClose={() => setOpenPop(null)}
        align="center"
        className={styles.vitalPop}
      >
        <div className={styles.popH}>Pontos de Mana</div>
        {!readOnly ? (
          <Stepper value={mp.current} onChange={setMpCurrent} onStep={stepVital('mp')} min={0} max={effectiveMaxMp} barColor="#3b82f6" />
        ) : (
          <div className={styles.popRow}>
            <span>Atual</span>
            <b>{mp.current}</b>
          </div>
        )}
        <div className={styles.popRow}>
          <span>Máximo</span>
          {!readOnly ? (
            <NumericInput
              className={styles.maxInput}
              value={mp.max}
              onChange={setMpMax}
              min={0}
            />
          ) : (
            <b>{mp.max}</b>
          )}
        </div>
        {fixedMpBonus > 0 && (
          <div className={styles.popRow}>
            <span>Bônus fixo (poderes)</span>
            <b>+{fixedMpBonus}</b>
          </div>
        )}
        <div className={styles.popRow}>
          <span>Temporário</span>
          {!readOnly ? (
            <NumericInput
              className={styles.maxInput}
              value={tempMp}
              onChange={setTempMp}
              min={0}
            />
          ) : (
            <b>{tempMp}</b>
          )}
        </div>
        <div className={styles.popHint}>
          Sobrevida: é consumida antes do PM e não é curada.
          {tempSources('mp') && ` Origem: ${tempSources('mp')}.`}
        </div>
        {!readOnly && (
          <button type="button" className={styles.healAllBtn} onClick={healAll('mp')}>
            ✚ Curar tudo
          </button>
        )}
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
        open={openPop === 'level'}
        anchorRef={lvlRef}
        onClose={() => setOpenPop(null)}
        align="end"
      >
        <ClassesBreakdown />
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
            onClick={() => { setMenuOpen(false); setInfoOpen(true); }}
          >
            📋 Dados do Personagem
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => { setMenuOpen(false); setNotesOpen(true); }}
          >
            📝 Anotações
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => { setMenuOpen(false); setEffectsOpen(true); }}
          >
            ⏳ Efeitos Temporários
          </button>
          {!readOnly && (
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => { setMenuOpen(false); setNewDayOpen(true); }}
            >
              🌅 Novo dia
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => { setMenuOpen(false); setProgressionOpen(true); }}
          >
            📈 Progressão
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => { setMenuOpen(false); setLogsOpen(true); }}
          >
            🕘 Histórico
          </button>
        </div>
      </Popover>

      <NotesSheet open={notesOpen} onClose={() => setNotesOpen(false)} />
      <InfoSheet open={infoOpen} onClose={() => setInfoOpen(false)} />
      <TemporaryEffectsSheet open={effectsOpen} onClose={() => setEffectsOpen(false)} />
      <ProgressionSheet open={progressionOpen} onClose={() => setProgressionOpen(false)} />
      <LogsSheet open={logsOpen} onClose={() => setLogsOpen(false)} />
      <TakeDamageSheet open={damageOpen} onClose={() => setDamageOpen(false)} />
      <ConfirmModal
        open={newDayOpen}
        onClose={() => setNewDayOpen(false)}
        onConfirm={confirmNewDay}
        icon="🌅"
        title="Novo dia"
        message={newDayMessage}
        confirmLabel="Virar o dia"
      />
    </header>
  );
}

VitalBar.displayName = 'VitalBar';

export default VitalBar;
