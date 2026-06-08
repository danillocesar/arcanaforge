import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastProvider, useToast } from '../../components/ui/Toast/Toast';
import { CharacterProvider, useCharacterContext } from '../../contexts/CharacterContext';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import { getInitials } from '../../utils/formatters';
import { uploadJutsuImage } from '../../services/jutsuImageStorage';
import {
  NARUTO_ATTRIBUTE_IDS,
  NARUTO_ATTRIBUTE_LABELS,
} from '../../features/naruto/data/narutoAttributes';
import { NARUTO_SKILLS_CONFIG } from '../../features/naruto/data/narutoSkills';
import { getEvolutionRow } from '../../features/naruto/data/narutoConstants';
import {
  getNarutoAttr,
  calcCombatSkillTotal,
  getCombatSkillAttr,
  calcVitalidadeTotal,
  calcChakraTotal,
  calcNarutoSkillTotal,
} from '../../features/naruto/utils/narutoCalculations';
import type { Character } from '../../types/character';
import type {
  NarutoAttributeId,
  NarutoPower,
  NarutoAptitude,
  Jutsu,
  NarutoWeapon,
  NarutoWeaponAttack,
  NarutoItem,
} from '../../types/narutoCharacter';
import styles from './NarutoViewPage.module.css';

const ATTR_KANJI: Record<NarutoAttributeId, string> = {
  for: '力',
  des: '技',
  agi: '速',
  per: '察',
  int: '知',
  vig: '体',
  esp: '霊',
};

const COMBAT_LABELS: Record<'cc' | 'cd' | 'esq' | 'lm', string> = {
  cc: 'CC',
  cd: 'CD',
  esq: 'ESQ',
  lm: 'LM',
};

function NarutoViewInner() {
  const { character, loadCharacter } = useCharacterContext();
  const navigate = useNavigate();
  const [loadDone, setLoadDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (!idParam) {
      navigate('/characters', { replace: true });
      return;
    }
    (async () => {
      try { await loadCharacter(idParam); }
      catch (err) { console.error('Erro ao carregar personagem:', err); }
      finally { setLoadDone(true); }
    })();
  }, []);

  if (loadDone && !character) return <AccessDeniedPage />;
  if (!character) {
    return (
      <div className={styles.root}>
        <div className={styles.loading}>Carregando ficha...</div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={`${styles.kanjiBg} ${styles.kanjiBgLeft}`}>忍</div>
      <div className={`${styles.kanjiBg} ${styles.kanjiBgRight}`}>者</div>

      <div className={styles.ficha}>
        <SlimHeader character={character} />
        <Hero character={character} />
        <AptitudesAndSkills character={character} />
        <JutsusSection character={character} />
        <CombatAndInventory character={character} />
        <DatabookSection character={character} />
        <FooterSection character={character} />
      </div>
    </div>
  );
}

/* ─── Slim header ───────────────────────────────────────────────────────── */

function SlimHeader({ character }: { character: Character }) {
  const clan = (character.clan || '').trim();
  const village = (character.villageActive || character.villageOrigin || '').trim();

  return (
    <header className={styles.header}>
      <div className={`${styles.headerSide} ${styles.headerSideLeft}`}>
        Clã <span className={styles.v}>{clan || '—'}</span>
      </div>
      <div className={styles.headerCenter}>Ficha de Personagem</div>
      <div className={styles.headerSide}>
        Vila <span className={styles.v}>{village || '—'}</span>
      </div>
    </header>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────────────── */

function Hero({ character }: { character: Character }) {
  const nc = character.campaignLevel ?? 4;
  const evo = getEvolutionRow(nc);
  const rank = (character.shinobiRank || evo.rank).trim();
  const clan = (character.clan || '').trim();

  const overlineParts = [rank, clan && `Clã ${clan}`].filter(Boolean) as string[];
  const overline = overlineParts.join(' · ') || 'Shinobi';

  const nameParts = (character.name || 'Sem Nome').trim().split(/\s+/);
  const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  const quickfactCandidates: { label: string; value: string }[] = [
    { label: 'Idade',     value: (character.age || '').trim() },
    { label: 'Posto',     value: rank },
    { label: 'NC',        value: String(nc) },
    { label: 'Tendência', value: (character.tendency || '').trim() },
    { label: 'Vila',      value: (character.villageActive || character.villageOrigin || '').trim() },
    { label: 'Gênero',    value: (character.gender || '').trim() },
  ];
  const quickfacts = quickfactCandidates.filter((q) => q.value).slice(0, 4);

  const motto = (character.motto || '').trim();

  return (
    <section className={styles.hero}>
      <div className={styles.heroImage}>
        <div className={styles.floorShadow} />
        {character.avatar ? (
          <img src={character.avatar} alt={character.name} />
        ) : (
          <HeroFallback name={character.name} />
        )}
        <div className={styles.sealCorner}>忍</div>
      </div>

      <div className={styles.heroInfo}>
        <div className={styles.titleBlock}>
          <div className={styles.titleText}>
            <div className={styles.titleOverline}>{overline}</div>
            <h1 className={styles.nameDisplay}>
              {firstName}
              {lastName && <> <span className={styles.em}>{lastName}</span></>}
            </h1>
          </div>
          {quickfacts.length > 0 && (
            <div className={styles.quickfacts}>
              {quickfacts.map((qf) => (
                <div key={qf.label}>
                  <div className={styles.qfLabel}>{qf.label}</div>
                  <div className={styles.qfValue}>{qf.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AttributesGrid character={character} />
        <StatsRow character={character} />

        {motto && <div className={styles.quoteLine}>{motto}</div>}
      </div>
    </section>
  );
}

function HeroFallback({ name }: { name: string }) {
  return (
    <div className={styles.heroFallback}>
      <div className={styles.heroFallbackKanji}>影</div>
      <div className={styles.heroFallbackInitials}>{getInitials(name)}</div>
      <div className={styles.heroFallbackLabel}>Sem retrato</div>
    </div>
  );
}

/* ─── Atributos ─── */

function AttributesGrid({ character }: { character: Character }) {
  const values = NARUTO_ATTRIBUTE_IDS.map((id) => ({
    id,
    value: getNarutoAttr(character, id),
  }));
  const max = Math.max(...values.map((v) => v.value));

  return (
    <div className={styles.attributes}>
      {values.map(({ id, value }) => (
        <div
          key={id}
          className={`${styles.attr} ${value === max && max > 0 ? styles.attrHighlight : ''}`}
        >
          <div className={styles.attrName}>{NARUTO_ATTRIBUTE_LABELS[id]}</div>
          <div className={styles.attrValue}>{value}</div>
          <div className={styles.attrJp}>{ATTR_KANJI[id]}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Stats row ─── */

function StatsRow({ character }: { character: Character }) {
  const vitMax = calcVitalidadeTotal(character);
  const chakraMax = calcChakraTotal(character);
  const vitCur = Math.min(character.hp.current, vitMax);
  const chakraCur = Math.min(character.mp.current, chakraMax);

  const carisma = character.social?.carisma ?? 0;
  const manipulacao = character.social?.manipulacao ?? 0;
  const socMax = Math.max(carisma, manipulacao, 1);

  const combatTiles = (['cc', 'cd', 'esq', 'lm'] as const).map((id) => {
    const total = calcCombatSkillTotal(character, id);
    const attr = getCombatSkillAttr(character, id);
    const entry = character.combatSkills?.[id];
    const base = entry?.base ?? 0;
    const attrVal = getNarutoAttr(character, attr);
    const formula = `base ${base} + ${NARUTO_ATTRIBUTE_LABELS[attr]} ${attrVal}`;
    return { id, label: COMBAT_LABELS[id], total, formula };
  });

  const signatureCombat = combatTiles.reduce(
    (max, t) => (t.total > max.total ? t : max),
    combatTiles[0],
  );

  return (
    <div className={styles.statsRow}>
      <div className={styles.statsBlock}>
        <div className={styles.blockLabel}>Energias</div>
        <EnergyRow label="Vit" current={vitCur} max={vitMax} />
        <EnergyRow label="Chk" current={chakraCur} max={chakraMax} />
      </div>

      <div className={styles.statsBlock}>
        <div className={styles.blockLabel}>Habilidades de Combate</div>
        <div className={styles.skillsGrid}>
          {combatTiles.map((t) => (
            <div
              key={t.id}
              className={`${styles.skill} ${t === signatureCombat && t.total > 0 ? styles.skillSignature : ''}`}
            >
              <div className={styles.skillInfo}>
                <span className={styles.skillName}>{t.label}</span>
                <span className={styles.skillFormula}>{t.formula}</span>
              </div>
              <div className={styles.skillValue}>{t.total}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.statsBlock}>
        <div className={styles.blockLabel}>Sociais</div>
        <EnergyRow label="Car" current={carisma} max={socMax} valueLabel={String(carisma)} />
        <EnergyRow label="Man" current={manipulacao} max={socMax} valueLabel={String(manipulacao)} />
      </div>
    </div>
  );
}

function EnergyRow({
  label, current, max, valueLabel,
}: { label: string; current: number; max: number; valueLabel?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return (
    <div className={styles.energyRow}>
      <span className={styles.energyLabel}>{label}</span>
      <div className={styles.energyBarWrap}>
        <div className={styles.energyBar} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.energyValue}>{valueLabel ?? `${current}/${max}`}</span>
    </div>
  );
}

/* ─── Aptidões + Perícias ─── */

function AptitudesAndSkills({ character }: { character: Character }) {
  const aptitudes = (character.aptitudes ?? []).filter((a) => (a.name || '').trim());
  const habilidadePowers = (character.powers ?? []).filter(
    (p) => p.powerType === 'habilidade' && (p.name || '').trim(),
  );

  const free = aptitudes.filter((a) => a.free);
  const paid = aptitudes.filter((a) => !a.free);

  const trainedSkills = useMemo(() => {
    return NARUTO_SKILLS_CONFIG
      .map((cfg) => {
        const skill = character.narpiSkills?.[cfg.id];
        const pontos = skill?.pontos ?? 0;
        if (pontos <= 0) return null;
        const total = calcNarutoSkillTotal(character, cfg.id);
        if (total < 0) return null;
        return { id: cfg.id, name: cfg.name, total, pontos };
      })
      .filter((x): x is { id: string; name: string; total: number; pontos: number } => !!x)
      .sort((a, b) => b.total - a.total);
  }, [character]);

  if (free.length === 0 && paid.length === 0 && habilidadePowers.length === 0 && trainedSkills.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className={styles.twoCols}>
        {(free.length > 0 || paid.length > 0 || habilidadePowers.length > 0) && (
          <div>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>01</span>
              <h2 className={styles.sectionTitle}>
                Aptidões<span className={styles.kanji}>才能</span>
              </h2>
            </div>
            <div className={styles.aptidoesGrid}>
              {free.length > 0 && (
                <div className={styles.aptidaoGroup}>
                  <h4>Gratuitas</h4>
                  {free.map((a) => <AptidaoItem key={a.id} item={a} />)}
                </div>
              )}
              {(paid.length > 0 || habilidadePowers.length > 0) && (
                <div className={styles.aptidaoGroup}>
                  <h4>{habilidadePowers.length > 0 ? 'Habilidades' : 'Compradas'}</h4>
                  {paid.map((a) => <AptidaoItem key={a.id} item={a} />)}
                  {habilidadePowers.map((p) => <PowerItem key={p.id} power={p} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {trainedSkills.length > 0 && (
          <div>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>02</span>
              <h2 className={styles.sectionTitle}>
                Perícias<span className={styles.kanji}>技能</span>
              </h2>
            </div>
            <div className={styles.pericias}>
              {trainedSkills.map((s) => (
                <div key={s.id} className={styles.pericia}>
                  <span className={styles.periciaName}>{s.name}</span>
                  <span className={styles.periciaValue}>{s.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AptidaoItem({ item }: { item: NarutoAptitude }) {
  return (
    <div className={styles.aptidao}>
      <div className={styles.aptidaoName}>
        {item.name}
        {item.cost > 0 && !item.free && <span className={styles.aptidaoTag}>— {item.cost} PP</span>}
      </div>
      {(item.description || '').trim() && (
        <div className={styles.aptidaoDesc}>{item.description}</div>
      )}
    </div>
  );
}

function PowerItem({ power }: { power: NarutoPower }) {
  return (
    <div className={styles.aptidao}>
      <div className={styles.aptidaoName}>
        {power.name}
        <span className={styles.aptidaoTag}>— Nv. {power.level}{power.cost > 0 ? ` · ${power.cost} PP` : ''}</span>
      </div>
      {(power.effects || '').trim() && (
        <div className={styles.aptidaoDesc}>{power.effects}</div>
      )}
    </div>
  );
}

/* ─── Jutsus ───────────────────────────────────────────────────────────── */

function JutsusSection({ character }: { character: Character }) {
  const list = (character.jutsus ?? []).filter((j) => (j.name || '').trim());
  if (list.length === 0) return null;

  const powersById = new Map<string, NarutoPower>();
  (character.powers ?? []).forEach((p) => powersById.set(p.id, p));

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionNum}>03</span>
        <h2 className={styles.sectionTitle}>
          Jutsus<span className={styles.kanji}>術</span>
        </h2>
        <span className={styles.sectionDesc}>{list.length} {list.length === 1 ? 'técnica' : 'técnicas'}</span>
      </div>
      <div className={styles.jutsus}>
        {list.map((j) => (
          <JutsuCard key={j.id} jutsu={j} power={powersById.get(j.powerId)} character={character} />
        ))}
      </div>
    </section>
  );
}

const JUTSU_KANJIS = ['術', '氷', '火', '雷', '風', '水', '土', '影'];

function pickJutsuKanji(jutsu: Jutsu, power?: NarutoPower): string {
  const haystack = `${power?.name || ''} ${jutsu.name || ''}`;
  if (/(hyou|gel|ice|氷)/i.test(haystack)) return '氷';
  if (/(katon|fogo|fire|火)/i.test(haystack)) return '火';
  if (/(suiton|ag(u|ú)a|water|水)/i.test(haystack)) return '水';
  if (/(raiton|rel(a|â)mpago|lightning|雷)/i.test(haystack)) return '雷';
  if (/(fuuton|fuuton|vento|wind|風)/i.test(haystack)) return '風';
  if (/(doton|terra|earth|土)/i.test(haystack)) return '土';
  if (/(yin|yang|kage|sombra|shadow|影)/i.test(haystack)) return '影';
  let hash = 0;
  for (let i = 0; i < (jutsu.name || '').length; i += 1) {
    hash = (hash * 31 + (jutsu.name || '').charCodeAt(i)) | 0;
  }
  return JUTSU_KANJIS[Math.abs(hash) % JUTSU_KANJIS.length];
}

function JutsuCard({
  jutsu, power, character,
}: { jutsu: Jutsu; power?: NarutoPower; character: Character }) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localImage, setLocalImage] = useState<string | undefined>(undefined);

  const technique = power?.techniques?.find((t) => t.id === jutsu.techniqueId);

  const elementParts = [power?.name, technique?.type].filter(Boolean) as string[];
  const elementLabel = elementParts.join(' · ') || 'Jutsu';

  const stats: { label: string; value: string }[] = [];

  if (technique?.hitAttr) {
    const hit = calcCombatSkillTotal(character, technique.hitAttr) + (jutsu.hitMod || 0);
    stats.push({ label: technique.hitAttr.toUpperCase(), value: String(hit) });
  }

  if (technique?.dealsDamage) {
    const damageBase = (jutsu.damageMod || 0);
    if (damageBase !== 0) stats.push({ label: 'Dano', value: String(damageBase) });
  }

  if (technique?.chakraFormula === 'fixed' && technique.chakraFixedCost) {
    stats.push({ label: 'Chk', value: String(technique.chakraFixedCost) });
  } else if (power?.cost) {
    stats.push({ label: 'PP', value: String(power.cost) });
  }

  if (technique?.range) {
    stats.push({ label: 'Alc.', value: technique.range });
  }

  const desc = (technique?.description || '').trim();
  const kanjiBadge = pickJutsuKanji(jutsu, power);
  const effectiveImage = localImage ?? jutsu.image;
  const hasImage = !!effectiveImage;

  const openFilePicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!character._id) return;

    setUploading(true);
    try {
      const url = await uploadJutsuImage(character._id, jutsu.id, file);
      setLocalImage(url);
      showToast?.('Imagem do jutsu actualizada', 'info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha no upload da imagem';
      showToast?.(msg, 'default');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`${styles.jutsu} ${hasImage ? styles.jutsuWithImage : styles.jutsuEmpty}`}
      role="button"
      tabIndex={0}
      onClick={openFilePicker}
      onKeyDown={handleKeyDown}
      aria-label={hasImage ? `Trocar imagem do jutsu ${jutsu.name}` : `Adicionar imagem ao jutsu ${jutsu.name}`}
      title={hasImage ? 'Clique para trocar a imagem' : 'Clique para adicionar uma imagem'}
    >
      <div className={styles.jutsuImg}>
        {hasImage ? (
          <img src={effectiveImage} alt={jutsu.name} />
        ) : (
          <div className={styles.jutsuImgPlaceholder}>
            <span className={styles.jutsuImgPlaceholderKanji}>{kanjiBadge}</span>
            <span className={styles.jutsuImgPlaceholderHint}>Clique para adicionar imagem</span>
          </div>
        )}
      </div>

      <span className={styles.jutsuRank}>{kanjiBadge}</span>

      {uploading && (
        <div className={styles.jutsuUploading}>
          <div className={styles.jutsuUploadingDot} />
          <span>Enviando…</span>
        </div>
      )}

      <div className={styles.jutsuBody}>
        <div className={styles.jutsuElement}>{elementLabel}</div>
        <div className={styles.jutsuName}>{jutsu.name}</div>
        {stats.length > 0 && (
          <div className={styles.jutsuStats}>
            {stats.slice(0, 3).map((s, idx) => (
              <div key={`${s.label}-${idx}`} className={styles.jutsuStat}>
                <div className={styles.ls}>{s.label}</div>
                <div className={styles.vs}>{s.value}</div>
              </div>
            ))}
          </div>
        )}
        {desc && <div className={styles.jutsuDesc}>{desc}</div>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className={styles.jutsuFileInput}
        onChange={handleFileChange}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/* ─── Combate Rápido + Inventário ───────────────────────────────────────── */

function CombatAndInventory({ character }: { character: Character }) {
  const attacks = (character.weaponAttacks ?? []).filter((a) => (a.name || '').trim());
  const weapons = (character.weapons ?? []).filter((w) => (w.name || '').trim());
  const items = (character.narpiItems ?? []).filter((i) => (i.name || '').trim());
  const armor = character.armor;
  const armorVisible = !!armor && !!(armor.name || '').trim();
  const ryos = character.ryos ?? 0;

  const showCombat = attacks.length > 0;
  const showInventory = weapons.length > 0 || items.length > 0 || armorVisible || ryos > 0;

  if (!showCombat && !showInventory) return null;

  const weaponsById = new Map<string, NarutoWeapon>();
  weapons.forEach((w) => weaponsById.set(w.id, w));

  return (
    <section className={styles.section}>
      <div className={styles.bottomRow}>
        {showCombat && (
          <div>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>04</span>
              <h2 className={styles.sectionTitle}>
                Combate Rápido<span className={styles.kanji}>戦</span>
              </h2>
            </div>
            <CombatTable attacks={attacks} weaponsById={weaponsById} character={character} />
          </div>
        )}

        {showInventory && (
          <div>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>05</span>
              <h2 className={styles.sectionTitle}>
                Inventário<span className={styles.kanji}>道具</span>
              </h2>
            </div>
            <InventoryStack
              weapons={weapons}
              items={items}
              armor={armorVisible ? armor! : null}
              ryos={ryos}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function CombatTable({
  attacks, weaponsById, character,
}: {
  attacks: NarutoWeaponAttack[];
  weaponsById: Map<string, NarutoWeapon>;
  character: Character;
}) {
  return (
    <div className={styles.ataquesTable}>
      <table>
        <thead>
          <tr>
            <th>Arma</th>
            <th className={styles.num}>Acerto</th>
            <th className={styles.num}>Dano</th>
            <th>Obs.</th>
          </tr>
        </thead>
        <tbody>
          {attacks.map((a) => {
            const weapon = weaponsById.get(a.weaponId);
            const hitAttr = weapon?.hitAttr || '';
            const hitTotal = hitAttr
              ? calcCombatSkillTotal(character, hitAttr) + (a.hitMod || 0)
              : null;
            const damageAttr = weapon?.damageAttr;
            const damageBase = (weapon?.damage ?? 0) + (a.damageMod || 0);
            const damageBonus = damageAttr ? Math.floor(getNarutoAttr(character, damageAttr) / 2) : 0;
            const damageTotal = damageBase + damageBonus;

            const noteParts: string[] = [];
            if (weapon?.type) noteParts.push(`Tipo ${weapon.type}`);
            if (weapon?.range) noteParts.push(weapon.range);
            if (weapon?.critical) noteParts.push(`Crít. ${weapon.critical}`);
            const note = noteParts.join(' · ');

            return (
              <tr key={a.id}>
                <td className={styles.arma}>{a.name}</td>
                <td className={`${styles.num} ${styles.precisao}`}>
                  {hitTotal !== null ? hitTotal : '—'}
                </td>
                <td className={`${styles.num} ${styles.dano}`}>{damageTotal}</td>
                <td className={styles.note}>{note || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InventoryStack({
  weapons, items, armor, ryos,
}: {
  weapons: NarutoWeapon[];
  items: NarutoItem[];
  armor: NonNullable<Character['armor']> | null;
  ryos: number;
}) {
  const armamento: { name: string; detail?: string; qty?: string }[] = [];
  weapons.forEach((w) => {
    const detailParts: string[] = [];
    if (w.damage > 0) detailParts.push(`dano ${w.damage}`);
    if (w.type) detailParts.push(w.type);
    armamento.push({
      name: w.name,
      detail: detailParts.join(' · ') || undefined,
      qty: w.quantity > 1 ? `×${w.quantity}` : '×1',
    });
  });
  if (armor) {
    armamento.push({
      name: armor.name,
      detail: `Abs ${armor.absorption} · Dur ${armor.hardness}`,
      qty: '',
    });
  }

  const suprimentos: { name: string; detail?: string; qty?: string }[] = [];
  items.forEach((i) => {
    suprimentos.push({
      name: i.name,
      detail: undefined,
      qty: i.quantity > 1 ? `×${i.quantity}` : '×1',
    });
  });
  if (ryos > 0) {
    suprimentos.push({ name: 'Ryos', detail: undefined, qty: String(ryos) });
  }

  return (
    <div className={styles.invStack}>
      {armamento.length > 0 && (
        <div className={styles.invBlock}>
          <h4>Armamento &amp; Armadura</h4>
          <ul className={styles.invList}>
            {armamento.map((it, idx) => (
              <li key={`${it.name}-${idx}`}>
                <span className={styles.itemName}>
                  {it.name}
                  {it.detail && <span className={styles.itemDetail}>{it.detail}</span>}
                </span>
                {it.qty !== undefined && <span className={styles.qty}>{it.qty}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {suprimentos.length > 0 && (
        <div className={styles.invBlock}>
          <h4>Suprimentos &amp; Ryos</h4>
          <ul className={styles.invList}>
            {suprimentos.map((it, idx) => (
              <li key={`${it.name}-${idx}`}>
                <span className={styles.itemName}>
                  {it.name}
                  {it.detail && <span className={styles.itemDetail}>{it.detail}</span>}
                </span>
                {it.qty !== undefined && <span className={styles.qty}>{it.qty}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Databook ──────────────────────────────────────────────────────────── */

function DatabookSection({ character }: { character: Character }) {
  const bio = (character.biography || '').trim();
  const cur = (character.curiosities || '').trim();
  if (!bio && !cur) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionNum}>06</span>
        <h2 className={styles.sectionTitle}>
          Databook<span className={styles.kanji}>録</span>
        </h2>
      </div>
      <div className={styles.databookBody}>
        {bio && (
          <div className={styles.databookBlock}>
            <h4>Biografia</h4>
            <p className={styles.databookText}>{bio}</p>
          </div>
        )}
        {cur && (
          <div className={styles.databookBlock}>
            <h4>Curiosidades</h4>
            <p className={styles.databookText}>{cur}</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────────────────── */

function FooterSection({ character }: { character: Character }) {
  const nc = character.campaignLevel ?? 4;
  const evo = getEvolutionRow(nc);
  const rank = (character.shinobiRank || evo.rank).trim();
  const village = (character.villageActive || character.villageOrigin || '').trim();

  const segments = ['Shinobi no Sho', rank, village ? `Vila ${village}` : ''].filter(Boolean);

  return (
    <footer className={styles.footer}>
      <div className={styles.kanjiEnd}>忍者書</div>
      <div>{segments.join(' · ')}</div>
    </footer>
  );
}

/* ─── Page wrapper ──────────────────────────────────────────────────────── */

export default function NarutoViewPage() {
  return (
    <ToastProvider>
      <NarutoViewProviderWrapper>
        <NarutoViewInner />
      </NarutoViewProviderWrapper>
    </ToastProvider>
  );
}

function NarutoViewProviderWrapper({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  return <CharacterProvider showToast={showToast} readOnly>{children}</CharacterProvider>;
}
