import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, FileText, Trash2 } from 'lucide-react';
import { apiFetchParties, apiFetchPartyFiles, apiDeletePartyFile } from '../../api';
import type { Party } from '../../types/party';
import { PartyFileKind, type PartyFile } from '../../types/partyFile';
import { formatFileSize, splitPartyFiles, uploadErrorMessage } from '../../utils/partyFiles';
import { useAuth } from '../../features/auth';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { WsMessage } from '../../hooks/useWebSocket';
import { showToast } from '../../services/toastService';
import Topbar from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import Skeleton from '../../components/ui/Skeleton/Skeleton';
import SegmentedControl from '../../components/ui/SegmentedControl/SegmentedControl';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal/ConfirmModal';
import PartyFileUploadButton from '../../components/party/PartyFileUploadButton/PartyFileUploadButton';
import ImageLightbox from '../../components/party/ImageLightbox/ImageLightbox';
import { buildPartyNavItems, PartySection } from '../../components/party/partyNav';
import styles from './PartyFilesPage.module.css';

const FilesTab = {
  GALLERY: 'gallery',
  DOCUMENTS: 'documents',
} as const;

type FilesTab = (typeof FilesTab)[keyof typeof FilesTab];

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : dateFormat.format(d);
}

/**
 * Aba Arquivos do grupo: o que o mestre compartilhou, em Galeria (imagens, abrem
 * no sistema) e Documentos (PDFs, baixados). Só o mestre envia e apaga.
 */
export default function PartyFilesPage() {
  const { system, partyId } = useParams<{ system: string; partyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.uid ?? '';

  const [party, setParty] = useState<Party | null>(null);
  const [files, setFiles] = useState<PartyFile[] | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [tab, setTab] = useState<FilesTab>(FilesTab.GALLERY);
  const [viewing, setViewing] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<PartyFile | null>(null);

  const reloadFiles = useCallback(async () => {
    if (!partyId) return;
    try {
      setFiles(await apiFetchPartyFiles(partyId));
    } catch (err) {
      console.error('Erro ao carregar arquivos:', err);
    }
  }, [partyId]);

  const reloadRef = useRef(reloadFiles);
  useEffect(() => {
    reloadRef.current = reloadFiles;
  }, [reloadFiles]);

  // Carga inicial inline (e não via reloadFiles) porque o setState precisa ficar
  // dentro do callback da promise, não no corpo do effect.
  useEffect(() => {
    if (!partyId) return;
    let cancelled = false;
    Promise.all([apiFetchParties(), apiFetchPartyFiles(partyId).catch(() => [] as PartyFile[])])
      .then(([parties, list]) => {
        if (cancelled) return;
        const found = parties.find((p) => p.id === partyId);
        if (!found) {
          setAccessDenied(true);
          return;
        }
        setParty(found);
        setFiles(list);
      })
      .catch((err) => console.error('Erro ao carregar arquivos:', err));
    return () => {
      cancelled = true;
    };
  }, [partyId]);

  // O server avisa o grupo a cada envio/remoção: quem está com a aba aberta vê na hora.
  useWebSocket(
    useCallback(
      (msg: WsMessage) => {
        if (msg.type === 'party_roster_sync' && msg.partyId === partyId) {
          reloadRef.current();
        }
      },
      [partyId],
    ),
  );

  if (accessDenied) return <AccessDeniedPage />;

  if (!party || !files || !system || !partyId) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.loadingGrid} role="status" aria-label="Carregando arquivos">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} height={160} radius={12} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isOwner = party.ownerUid === uid;
  const { images, documents } = splitPartyFiles(files);

  const handleUploaded = (file: PartyFile) => {
    setFiles((prev) => (prev && !prev.some((f) => f.id === file.id) ? [file, ...prev] : prev));
    setTab(file.kind === PartyFileKind.DOCUMENT ? FilesTab.DOCUMENTS : FilesTab.GALLERY);
  };

  const confirmDelete = async () => {
    const target = toDelete;
    setToDelete(null);
    if (!target) return;
    try {
      await apiDeletePartyFile(partyId, target.id);
      setFiles((prev) => prev?.filter((f) => f.id !== target.id) ?? prev);
      showToast('Arquivo removido');
    } catch (err) {
      showToast(uploadErrorMessage(err), 'info');
    }
  };

  const deleteButton = (file: PartyFile, className: string) =>
    isOwner && (
      <button
        type="button"
        className={className}
        title="Remover do grupo"
        aria-label={`Remover ${file.name}`}
        onClick={(e) => {
          e.stopPropagation();
          setToDelete(file);
        }}
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    );

  const tabs = (
    <SegmentedControl
      options={[
        { value: FilesTab.GALLERY, label: images.length ? `Galeria (${images.length})` : 'Galeria' },
        { value: FilesTab.DOCUMENTS, label: documents.length ? `Documentos (${documents.length})` : 'Documentos' },
      ]}
      value={tab}
      onChange={(v) => setTab(v as FilesTab)}
    />
  );

  return (
    <div className={styles.page}>
      <Topbar title={`Grupo - ${party.name}`} />
      <SectionNav items={buildPartyNavItems(system, partyId, PartySection.FILES, navigate)} />

      <div className={styles.content}>
        <div className={styles.header}>
          {tabs}
          {isOwner && <PartyFileUploadButton partyId={partyId} onUploaded={handleUploaded} />}
        </div>

        {tab === FilesTab.GALLERY &&
          (images.length === 0 ? (
            <EmptyState
              icon="🖼️"
              title="Nenhuma imagem ainda."
              hint={isOwner ? 'Envie mapas, retratos e ilustrações para o grupo ver.' : 'Quando o mestre enviar imagens, elas aparecem aqui.'}
            />
          ) : (
            <div className={styles.grid}>
              {images.map((img, i) => (
                <div key={img.id} className={styles.tile}>
                  <button type="button" className={styles.thumbBtn} onClick={() => setViewing(i)} title={img.name}>
                    <img className={styles.thumb} src={img.url} alt={img.name} loading="lazy" />
                    <span className={styles.tileName}>{img.name}</span>
                  </button>
                  {deleteButton(img, styles.tileDelete)}
                </div>
              ))}
            </div>
          ))}

        {tab === FilesTab.DOCUMENTS &&
          (documents.length === 0 ? (
            <EmptyState
              icon="📄"
              title="Nenhum documento ainda."
              hint={isOwner ? 'Envie PDFs (handouts, regras da casa, cartas) para o grupo baixar.' : 'Quando o mestre enviar documentos, eles aparecem aqui.'}
            />
          ) : (
            <ul className={styles.docList}>
              {documents.map((doc) => (
                <li key={doc.id} className={styles.docRow}>
                  <span className={styles.docIcon}><FileText size={20} aria-hidden="true" /></span>
                  <div className={styles.docInfo}>
                    <span className={styles.docName} title={doc.name}>{doc.name}</span>
                    <span className={styles.docMeta}>
                      {formatFileSize(doc.size)}
                      {formatDate(doc.uploadedAt) && ` · ${formatDate(doc.uploadedAt)}`}
                    </span>
                  </div>
                  <a className={styles.download} href={doc.url} download={doc.name} rel="noreferrer">
                    <Download size={15} aria-hidden="true" /> Baixar
                  </a>
                  {deleteButton(doc, styles.docDelete)}
                </li>
              ))}
            </ul>
          ))}
      </div>

      <ImageLightbox images={images} index={viewing} onChange={setViewing} />

      <ConfirmModal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Remover arquivo?"
        message={toDelete ? `"${toDelete.name}" sai do grupo para todos os jogadores.` : undefined}
        confirmLabel="Remover"
        variant="danger"
      />
    </div>
  );
}
