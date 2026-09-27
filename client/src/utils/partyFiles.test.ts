import { describe, it, expect } from 'vitest';
import { ApiError } from '../api/http';
import { PartyFileKind, type PartyFile } from '../types/partyFile';
import { formatFileSize, rejectReason, splitPartyFiles, uploadErrorMessage } from './partyFiles';

function file(overrides: Partial<PartyFile> = {}): PartyFile {
  return {
    id: 'f1',
    kind: PartyFileKind.IMAGE,
    name: 'mapa.png',
    url: 'https://cdn/mapa.png',
    contentType: 'image/png',
    size: 1000,
    uploadedAt: '2026-09-27T12:00:00.000Z',
    ...overrides,
  };
}

describe('formatFileSize', () => {
  it('mostra KB abaixo de 1 MB, com mínimo de 1 KB', () => {
    expect(formatFileSize(200)).toBe('1 KB');
    expect(formatFileSize(812 * 1024)).toBe('812 KB');
  });

  it('mostra MB com vírgula decimal', () => {
    expect(formatFileSize(3.4 * 1024 * 1024)).toBe('3,4 MB');
  });
});

describe('splitPartyFiles', () => {
  it('separa imagens de documentos sem mudar a ordem', () => {
    const a = file({ id: 'a' });
    const b = file({ id: 'b', kind: PartyFileKind.DOCUMENT, contentType: 'application/pdf' });
    const c = file({ id: 'c' });
    const { images, documents } = splitPartyFiles([a, b, c]);
    expect(images.map((f) => f.id)).toEqual(['a', 'c']);
    expect(documents.map((f) => f.id)).toEqual(['b']);
  });
});

describe('rejectReason', () => {
  it('aceita imagem e PDF dentro do limite', () => {
    expect(rejectReason({ name: 'a.png', type: 'image/png', size: 10 })).toBeNull();
    expect(rejectReason({ name: 'a.pdf', type: 'application/pdf', size: 10 })).toBeNull();
  });

  it('recusa outros tipos', () => {
    expect(rejectReason({ name: 'a.docx', type: 'application/msword', size: 10 })).toMatch(/só imagens/);
  });

  it('recusa acima de 100 MB', () => {
    expect(rejectReason({ name: 'a.pdf', type: 'application/pdf', size: 101 * 1024 * 1024 })).toMatch(/100 MB/);
  });
});

describe('uploadErrorMessage', () => {
  it('extrai o campo error do JSON do server', () => {
    expect(uploadErrorMessage(new Error('{"error":"Só o mestre do grupo pode enviar arquivos"}'))).toBe(
      'Só o mestre do grupo pode enviar arquivos',
    );
  });

  it('troca o 413 (HTML do Cloudflare) por uma mensagem legível', () => {
    expect(uploadErrorMessage(new ApiError(413, '<html>413 Request Entity Too Large</html>'))).toMatch(/100 MB/);
  });

  it('usa o texto cru quando não é JSON', () => {
    expect(uploadErrorMessage(new Error('HTTP 500'))).toBe('HTTP 500');
  });
});
