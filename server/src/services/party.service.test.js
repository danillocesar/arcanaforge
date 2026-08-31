const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Por que isto roda sem banco de dados:
// os guards de `date`/`time`/`timezone` em `proposeSession` rodam ANTES do
// primeiro `await` (a chamada a `partyRepository.findMemberParty`). Uma
// proposta inválida rejeita de forma síncrona, antes de qualquer acesso ao
// Mongo — então dá pra testar essa fatia (validação de entrada) sem
// conexão nenhuma. Não apague nem pule este arquivo achando que ele precisa
// de um harness com Mongo: ele deliberadamente não usa um.
//
// Para os casos "válido até aqui" (que passam pelos guards e só então
// tentam a query real), desligamos o buffering do Mongoose
// (`bufferCommands: false`) para que a falta de conexão rejeite na hora
// (poucos ms) em vez de ficar pendurada até o timeout de buffer (10s) —
// isso é só para o teste ficar rápido e determinístico, e serve também
// para provar que a rejeição desses casos NÃO veio do guard de validação.
mongoose.set('bufferCommands', false);

const { createPartyService } = require('./party.service');

// Nenhum destes casos chega perto de `party.save()`/broadcast — a proposta
// sempre rejeita antes disso —, então o refs de verdade nunca é chamado.
const refs = { broadcastPartyRoster: () => {} };
const service = createPartyService(refs);
const req = { user: { uid: 'u1' } };

function proposeSession(body) {
  return service.proposeSession('fakePartyId', body, req);
}

describe('party.service — proposeSession (validação de entrada, sem banco)', () => {
  it('rejeita horário com hora fora do intervalo (25:00) — regressão do evento no Google Calendar em hora impossível', async () => {
    await assert.rejects(
      () => proposeSession({ date: '2026-09-03', time: '25:00' }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.message, 'Horário inválido (esperado HH:mm)');
        return true;
      },
    );
  });

  it('rejeita horário com minuto fora do intervalo (12:60)', async () => {
    await assert.rejects(
      () => proposeSession({ date: '2026-09-03', time: '12:60' }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.message, 'Horário inválido (esperado HH:mm)');
        return true;
      },
    );
  });

  it('rejeita horário sem dois dígitos na hora (7:00)', async () => {
    await assert.rejects(
      () => proposeSession({ date: '2026-09-03', time: '7:00' }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.message, 'Horário inválido (esperado HH:mm)');
        return true;
      },
    );
  });

  it('NÃO rejeita um horário válido (23:59) pelo guard de horário — falha depois, na chamada ao banco', async () => {
    await assert.rejects(
      () => proposeSession({ date: '2026-09-03', time: '23:59' }),
      (err) => {
        assert.notEqual(err.message, 'Horário inválido (esperado HH:mm)');
        return true;
      },
    );
  });

  it('rejeita data em formato errado (03/09/2026)', async () => {
    await assert.rejects(
      () => proposeSession({ date: '03/09/2026', time: '' }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.message, 'Data inválida (esperado YYYY-MM-DD)');
        return true;
      },
    );
  });

  it('rejeita timezone com espaço (não é um nome IANA válido)', async () => {
    await assert.rejects(
      () => proposeSession({ date: '2026-09-03', time: '19:00', timezone: 'America/Sao Paulo' }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.message, 'timezone inválido');
        return true;
      },
    );
  });

  it('NÃO rejeita um timezone válido com sinal (Etc/GMT+5) pelo guard de timezone — falha depois, na chamada ao banco', async () => {
    await assert.rejects(
      () => proposeSession({ date: '2026-09-03', time: '19:00', timezone: 'Etc/GMT+5' }),
      (err) => {
        assert.notEqual(err.message, 'timezone inválido');
        return true;
      },
    );
  });

  it('rejeita timezone não-string (0) mesmo sendo falsy', async () => {
    await assert.rejects(
      () => proposeSession({ date: '2026-09-03', time: '19:00', timezone: 0 }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.message, 'timezone inválido');
        return true;
      },
    );
  });
});
