const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { mergeBuffIntoCharacter } = require('./buffMerge');

const buff = (overrides = {}) => ({
  name: 'Bênção',
  effects: [{ type: 'temp_hp', value: '10' }],
  mp: 0,
  active: true,
  source: 'Bênção',
  ...overrides,
});

describe('mergeBuffIntoCharacter', () => {
  it('appends the buff and adds its temp pools when no same-name buff exists', () => {
    const next = mergeBuffIntoCharacter({ buffs: [], temporaryHp: 0, temporaryMp: 0 }, buff());
    assert.equal(next.buffs.length, 1);
    assert.equal(next.temporaryHp, 10);
    assert.equal(next.temporaryMp, 0);
  });

  it('replaces an active same-name buff in place instead of duplicating (recast = refresh)', () => {
    const existing = buff();
    const other = buff({ name: 'Fúria', effects: [{ type: 'attack_roll', value: '2' }] });
    const next = mergeBuffIntoCharacter(
      { buffs: [existing, other], temporaryHp: 10, temporaryMp: 0 },
      buff(),
    );
    assert.equal(next.buffs.length, 2);
    assert.equal(next.buffs[0].name, 'Bênção');
    assert.equal(next.buffs[1].name, 'Fúria');
    // recast do mesmo buff ativo: devolve os 10 antigos, soma os 10 novos — não empilha
    assert.equal(next.temporaryHp, 10);
  });

  it('matches by name alone, ignoring case/spaces and a different source', () => {
    const existing = buff({ name: ' bênção ', source: undefined, effects: [{ type: 'temp_hp', value: '5' }] });
    const next = mergeBuffIntoCharacter({ buffs: [existing], temporaryHp: 5, temporaryMp: 0 }, buff());
    assert.equal(next.buffs.length, 1);
    assert.equal(next.buffs[0].source, 'Bênção');
    assert.equal(next.temporaryHp, 10);
  });

  it('does not refund pools from an inactive same-name buff', () => {
    const existing = buff({ active: false });
    const next = mergeBuffIntoCharacter({ buffs: [existing], temporaryHp: 0, temporaryMp: 0 }, buff());
    assert.equal(next.buffs.length, 1);
    assert.equal(next.buffs[0].active, true);
    assert.equal(next.temporaryHp, 10);
  });

  it('collapses pre-existing duplicates into one entry, refunding each active copy', () => {
    // Dados já duplicados pelo bug antigo: aplicar de novo deve sanear a ficha.
    const next = mergeBuffIntoCharacter(
      { buffs: [buff(), buff(), buff({ name: 'Fúria', effects: [] })], temporaryHp: 20, temporaryMp: 0 },
      buff(),
    );
    assert.equal(next.buffs.filter((b) => b.name === 'Bênção').length, 1);
    assert.equal(next.temporaryHp, 10);
  });

  it('counts legacy hp/mp effect types as temp pools', () => {
    const existing = buff({ effects: [{ type: 'hp', value: '10' }, { type: 'mp', value: '3' }] });
    const incoming = buff({ effects: [{ type: 'temp_hp', value: '8' }, { type: 'temp_mp', value: '2' }] });
    const next = mergeBuffIntoCharacter({ buffs: [existing], temporaryHp: 10, temporaryMp: 3 }, incoming);
    assert.equal(next.temporaryHp, 8);
    assert.equal(next.temporaryMp, 2);
  });

  it('never merges unnamed buffs with each other', () => {
    const existing = buff({ name: '' });
    const next = mergeBuffIntoCharacter({ buffs: [existing], temporaryHp: 10, temporaryMp: 0 }, buff({ name: '' }));
    assert.equal(next.buffs.length, 2);
  });

  it('does NOT heal current HP/MP for temp_hp/temp_mp (the temp pool is separate); max_hp still heals', () => {
    const incoming = buff({ effects: [{ type: 'temp_hp', value: '10' }, { type: 'temp_mp', value: '4' }] });
    const next = mergeBuffIntoCharacter(
      { buffs: [], temporaryHp: 0, temporaryMp: 0, hp: { max: 30, current: 12 }, mp: { max: 10, current: 3 } },
      incoming,
    );
    assert.equal(next.temporaryHp, 10);
    assert.equal(next.temporaryMp, 4);
    assert.equal(next.hp.current, 12);
    assert.equal(next.mp.current, 3);

    const mixed = mergeBuffIntoCharacter(
      { buffs: [], temporaryHp: 0, temporaryMp: 0, hp: { max: 30, current: 12 }, mp: { max: 10, current: 3 } },
      buff({ effects: [{ type: 'temp_hp', value: '10' }, { type: 'max_hp', value: '5' }] }),
    );
    assert.equal(mixed.temporaryHp, 10);
    assert.equal(mixed.hp.current, 17); // só o max_hp cura (teto 30 + 5 = 35)
  });

  it('heals current HP by max_hp effects, clamped to a ceiling that excludes the temp pool', () => {
    // Recast de buff de temporário: o atual não muda.
    const incoming = buff({ effects: [{ type: 'temp_hp', value: '10' }] });
    const existing = buff({ effects: [{ type: 'temp_hp', value: '10' }] });
    const next = mergeBuffIntoCharacter(
      { buffs: [existing], temporaryHp: 10, temporaryMp: 0, hp: { max: 30, current: 25 }, mp: { max: 0, current: 0 } },
      incoming,
    );
    assert.equal(next.hp.current, 25);
    assert.equal(next.temporaryHp, 10);

    const maxHp = buff({ name: 'Vitalidade', effects: [{ type: 'max_hp', value: '5' }] });
    const withMax = mergeBuffIntoCharacter(
      { buffs: [], temporaryHp: 0, temporaryMp: 0, hp: { max: 30, current: 30 }, mp: { max: 0, current: 0 } },
      maxHp,
    );
    // max_hp ativo entra no teto (30 + 5) e cura os mesmos 5
    assert.equal(withMax.hp.current, 35);

    // Com temporário 10 o teto continua 35 — o temp não estica o máximo.
    const withTemp = mergeBuffIntoCharacter(
      { buffs: [], temporaryHp: 10, temporaryMp: 0, hp: { max: 30, current: 30 }, mp: { max: 0, current: 0 } },
      maxHp,
    );
    assert.equal(withTemp.hp.current, 35);
  });

  it('leaves hp/mp untouched when the buff has no pool effects', () => {
    const incoming = buff({ effects: [{ type: 'attack_roll', value: '2' }] });
    const next = mergeBuffIntoCharacter(
      { buffs: [], temporaryHp: 0, temporaryMp: 0, hp: { max: 30, current: 12 }, mp: { max: 10, current: 3 } },
      incoming,
    );
    assert.equal(next.hp.current, 12);
    assert.equal(next.mp.current, 3);
  });

  it('clamps pools at zero when the refund exceeds the current pool', () => {
    // Pool já consumido (dano comeu o PV temporário): devolver o buff antigo não pode negativar.
    const next = mergeBuffIntoCharacter(
      { buffs: [buff()], temporaryHp: 2, temporaryMp: 0 },
      buff({ effects: [{ type: 'attack_roll', value: '2' }] }),
    );
    assert.equal(next.temporaryHp, 0);
  });
});
