import { describe, it, expect } from 'vitest';
import { parseGoogleReturnToast } from './googleReturnToast';

describe('parseGoogleReturnToast', () => {
  it('reconhece o retorno de sucesso (?google=ok)', () => {
    expect(parseGoogleReturnToast('?google=ok')).toEqual({
      message: 'Google Agenda conectada.',
      variant: 'info',
    });
  });

  it('monta a mensagem de erro com o motivo, quando presente', () => {
    expect(parseGoogleReturnToast('?google=error&reason=acesso+negado')).toEqual({
      message: 'Não foi possível conectar: acesso negado',
      variant: 'attack',
    });
  });

  it('cai no motivo genérico "erro" quando não há reason', () => {
    expect(parseGoogleReturnToast('?google=error')).toEqual({
      message: 'Não foi possível conectar: erro',
      variant: 'attack',
    });
  });

  it('não faz nada quando o parâmetro "google" está ausente', () => {
    expect(parseGoogleReturnToast('')).toBeNull();
    expect(parseGoogleReturnToast('?reason=acesso+negado')).toBeNull();
  });
});
