import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import type { Ficha } from '../types/ficha';
import { criarFichaVazia } from '../utils/calculations';
import {
  apiFetchFichas,
  apiLoadFicha,
  apiSaveFicha,
  apiDeleteFicha,
  apiRenomear,
} from '../api/api';
import { useAutoSave } from '../hooks/useAutoSave';
import { useWebSocket } from '../hooks/useWebSocket';
import type { ToastVariant } from '../components/ui/Toast/Toast';

interface FichaContextValue {
  ficha: Ficha | null;
  fichaOriginalNome: string;
  fichasList: string[];
  saveStatus: 'saved' | 'saving' | 'error';

  updateFicha: (updater: (prev: Ficha) => Ficha) => void;
  loadFicha: (nome: string) => Promise<void>;
  novoPersonagem: (nome: string) => Promise<void>;
  excluirPersonagem: () => Promise<void>;
  refreshList: () => Promise<string[]>;
  sendHpUpdate: () => void;
}

const FichaContext = createContext<FichaContextValue | null>(null);

interface FichaProviderProps {
  children: React.ReactNode;
  showToast?: (msg: string, variant?: ToastVariant, pmCusto?: number) => void;
}

export function FichaProvider({ children, showToast }: FichaProviderProps) {
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [fichaOriginalNome, setFichaOriginalNome] = useState('');
  const [fichasList, setFichasList] = useState<string[]>([]);
  const fichaRef = useRef<Ficha | null>(null);
  fichaRef.current = ficha;

  /** Evita reenviar ficha_hp_update após auto-save causado só por sync WS (eco no mestre). */
  const skipHpBroadcastAfterSaveRef = useRef(false);

  const { send } = useWebSocket((msg) => {
    if (!fichaRef.current) return;

    if (msg.type === 'ficha_hp_sync' && msg.nome === fichaRef.current.nome) {
      skipHpBroadcastAfterSaveRef.current = true;
      setFicha((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (msg.pv) {
          next.pv = {
            ...prev.pv,
            atual: msg.pv.atual ?? prev.pv.atual,
            maximo: msg.pv.maximo ?? prev.pv.maximo,
          };
        }
        if (msg.pm) {
          next.pm = {
            ...prev.pm,
            atual: msg.pm.atual ?? prev.pm.atual,
            maximo: msg.pm.maximo ?? prev.pm.maximo,
          };
        }
        return next;
      });
      showToast?.('PV/PM sincronizados de outra aba', 'sync');
    }

    if (msg.type === 'mestre_hp_sync' && msg.nome === fichaRef.current.nome) {
      skipHpBroadcastAfterSaveRef.current = true;
      setFicha((prev) => {
        if (!prev) return prev;
        return { ...prev, pv: { ...prev.pv, atual: msg.pvAtual } };
      });
      showToast?.(`PV atualizado pelo mestre: ${msg.pvAtual}`, 'info');
    }
  });

  const sendHpUpdate = useCallback(() => {
    const f = fichaRef.current;
    if (!f) return;
    send({
      type: 'ficha_hp_update',
      nome: f.nome,
      pv: f.pv,
      pm: f.pm,
    });
  }, [send]);

  const sendHpUpdateRef = useRef(sendHpUpdate);
  sendHpUpdateRef.current = sendHpUpdate;

  const { status: saveStatus } = useAutoSave(ficha, fichaOriginalNome, () => {
    if (fichaRef.current) {
      setFichaOriginalNome(fichaRef.current.nome);
    }
    if (skipHpBroadcastAfterSaveRef.current) {
      skipHpBroadcastAfterSaveRef.current = false;
      return;
    }
    sendHpUpdateRef.current();
  });

  const refreshList = useCallback(async () => {
    const list = await apiFetchFichas();
    setFichasList(list);
    return list;
  }, []);

  const loadFicha = useCallback(async (nome: string) => {
    const data = await apiLoadFicha(nome);
    if (data) {
      setFicha(data);
      setFichaOriginalNome(data.nome);
      history.replaceState(null, '', `?char=${encodeURIComponent(data.nome)}`);
    }
  }, []);

  const novoPersonagem = useCallback(async (nome: string) => {
    const nova = criarFichaVazia(nome);
    await apiSaveFicha(nome, nova);
    setFicha(nova);
    setFichaOriginalNome(nome);
    history.replaceState(null, '', `?char=${encodeURIComponent(nome)}`);
    await refreshList();
  }, [refreshList]);

  const excluirPersonagem = useCallback(async () => {
    if (!fichaRef.current) return;
    const nomeAtual = fichaRef.current.nome;
    await apiDeleteFicha(nomeAtual);
    const list = await apiFetchFichas();
    setFichasList(list);

    if (list.length > 0) {
      await loadFicha(list[0]);
    } else {
      const nova = criarFichaVazia('Novo Personagem');
      await apiSaveFicha('Novo Personagem', nova);
      setFicha(nova);
      setFichaOriginalNome('Novo Personagem');
      const updatedList = await apiFetchFichas();
      setFichasList(updatedList);
    }
  }, [loadFicha]);

  const updateFicha = useCallback((updater: (prev: Ficha) => Ficha) => {
    skipHpBroadcastAfterSaveRef.current = false;
    setFicha((prev) => {
      if (!prev) return prev;
      return updater(prev);
    });
  }, []);

  const value = useMemo<FichaContextValue>(() => ({
    ficha,
    fichaOriginalNome,
    fichasList,
    saveStatus,
    updateFicha,
    loadFicha,
    novoPersonagem,
    excluirPersonagem,
    refreshList,
    sendHpUpdate,
  }), [ficha, fichaOriginalNome, fichasList, saveStatus, updateFicha, loadFicha, novoPersonagem, excluirPersonagem, refreshList, sendHpUpdate]);

  return <FichaContext.Provider value={value}>{children}</FichaContext.Provider>;
}

export function useFichaContext(): FichaContextValue {
  const ctx = useContext(FichaContext);
  if (!ctx) throw new Error('useFichaContext must be used within FichaProvider');
  return ctx;
}
