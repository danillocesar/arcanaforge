import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { apiUploadPartyFile } from '../../../api';
import type { PartyFile } from '../../../types/partyFile';
import { PARTY_FILE_ACCEPT } from '../../../types/partyFile';
import { rejectReason, uploadErrorMessage } from '../../../utils/partyFiles';
import { showToast } from '../../../services/toastService';
import Button from '../../ui/Button/Button';
import styles from './PartyFileUploadButton.module.css';

interface PartyFileUploadButtonProps {
  partyId: string;
  /** Chamado a cada arquivo aceito pelo server. */
  onUploaded?: (file: PartyFile) => void;
  className?: string;
}

/**
 * Botão do mestre para enviar imagens e PDFs ao grupo. Aceita vários de uma vez
 * e envia um por um; o que o server recusar vira toast e não trava os demais.
 */
function PartyFileUploadButton({ partyId, onUploaded, className }: PartyFileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const handleFiles = async (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (inputRef.current) inputRef.current.value = '';
    if (files.length === 0) return;

    const accepted = files.filter((f) => {
      const reason = rejectReason(f);
      if (reason) showToast(reason, 'info');
      return !reason;
    });
    if (accepted.length === 0) return;

    let sent = 0;
    setProgress({ done: 0, total: accepted.length });
    for (const f of accepted) {
      try {
        const uploaded = await apiUploadPartyFile(partyId, f);
        sent += 1;
        onUploaded?.(uploaded);
      } catch (err) {
        showToast(`${f.name}: ${uploadErrorMessage(err)}`, 'info');
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }
    setProgress(null);
    if (sent > 0) showToast(sent === 1 ? 'Arquivo enviado ao grupo' : `${sent} arquivos enviados ao grupo`);
  };

  const busy = progress !== null;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={PARTY_FILE_ACCEPT}
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="primary"
        className={className}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        title="Enviar imagens ou PDFs para o grupo"
      >
        <span className={styles.icon}><Upload size={16} aria-hidden="true" /></span>
        {busy ? `Enviando ${Math.min(progress.done + 1, progress.total)}/${progress.total}…` : 'Enviar arquivos'}
      </Button>
    </>
  );
}

PartyFileUploadButton.displayName = 'PartyFileUploadButton';

export default PartyFileUploadButton;
