import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import type { Ficha } from '../types/ficha';
import { criarFichaVazia } from '../utils/calculations';
import {
  apiFetchFichas,
  apiLoadFicha,
  apiSaveFicha,
  apiDeleteFicha,
} from '../api';
import { useAutoSave } from '../hooks/useAutoSave';
import { useWebSocket } from '../hooks/useWebSocket';
import type { ToastVariant } from '../components/ui/Toast/Toast';

interface FichaContextValue {
  ficha: Ficha | null;
  fichaOriginalId: string;
  fichasList: string[];
  saveStatus: 'saved' | 'saving' | 'error';

  updateFicha: (updater: (prev: Ficha) => Ficha) => void;
  loadFicha: (id: string) => Promise<void>;
  novoPersonagem: (ficha: Ficha) => Promise<void>;
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
  const [fichaOriginalId, setFichaOriginalId] = useState('');
  const [fichasList, setFichasList] = useState<string[]>([]);
  const fichaRef = useRef<Ficha | null>(null);
  fichaRef.current = ficha;

  const skipHpBroadcastAfterSaveRef = useRef(false);

  const { send } = useWebSocket((msg) => {
    if (!fichaRef.current) return;

    if (msg.type === 'ficha_hp_sync' && msg.fichaId === fichaRef.current._id) {
      skipHpBroadcastAfterSaveRef.current = true;
      const pv = msg.pv as { atual?: number; maximo?: number } | undefined;
      const pm = msg.pm as { atual?: number; maximo?: number } | undefined;
      setFicha((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (pv) {
          next.pv = {
            ...prev.pv,
            atual: pv.atual ?? prev.pv.atual,
            maximo: pv.maximo ?? prev.pv.maximo,
          };
        }
        if (pm) {
          next.pm = {
            ...prev.pm,
            atual: pm.atual ?? prev.pm.atual,
            maximo: pm.maximo ?? prev.pm.maximo,
          };
        }
        return next;
      });
      showToast?.('PV/PM sincronizados de outra aba', 'sync');
    }

    if (msg.type === 'mestre_hp_sync' && msg.fichaId === fichaRef.current._id) {
      skipHpBroadcastAfterSaveRef.current = true;
      const pvAtual = msg.pvAtual as number;
      setFicha((prev) => {
        if (!prev) return prev;
        return { ...prev, pv: { ...prev.pv, atual: pvAtual } };
      });
      showToast?.(`PV atualizado pelo mestre: ${pvAtual}`, 'info');
    }
  });

  const sendHpUpdate = useCallback(() => {
    const f = fichaRef.current;
    if (!f) return;
    send({
      type: 'ficha_hp_update',
      fichaId: f._id,
      nome: f.nome,
      pv: f.pv,
      pm: f.pm,
    });
  }, [send]);

  const sendHpUpdateRef = useRef(sendHpUpdate);
  sendHpUpdateRef.current = sendHpUpdate;

  const { status: saveStatus } = useAutoSave(ficha, fichaOriginalId, () => {
    if (fichaRef.current) {
      setFichaOriginalId(fichaRef.current._id);
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

  const loadFicha = useCallback(async (id: string) => {
    const data = await apiLoadFicha(id);
    if (data) {
      setFicha(data);
      setFichaOriginalId(data._id);
      history.replaceState(null, '', `?id=${encodeURIComponent(data._id)}`);
    }
  }, []);

  const novoPersonagem = useCallback(async (nova: Ficha) => {
    await apiSaveFicha(nova._id, nova);
    setFicha(nova);
    setFichaOriginalId(nova._id);
    history.replaceState(null, '', `?id=${encodeURIComponent(nova._id)}`);
    await refreshList();
  }, [refreshList]);

  const excluirPersonagem = useCallback(async () => {
    if (!fichaRef.current) return;
    await apiDeleteFicha(fichaRef.current._id);
    const list = await apiFetchFichas();
    setFichasList(list);

    if (list.length > 0) {
      await loadFicha(list[0]);
    } else {
      const nova = criarFichaVazia('Novo Personagem');
      await apiSaveFicha(nova._id, nova);
      setFicha(nova);
      setFichaOriginalId(nova._id);
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
    fichaOriginalId,
    fichasList,
    saveStatus,
    updateFicha,
    loadFicha,
    novoPersonagem,
    excluirPersonagem,
    refreshList,
    sendHpUpdate,
  }), [ficha, fichaOriginalId, fichasList, saveStatus, updateFicha, loadFicha, novoPersonagem, excluirPersonagem, refreshList, sendHpUpdate]);

  return <FichaContext.Provider value={value}>{children}</FichaContext.Provider>;
}

export function useFichaContext(): FichaContextValue {
  const ctx = useContext(FichaContext);
  if (!ctx) throw new Error('useFichaContext must be used within FichaProvider');
  return ctx;
}

export function useFichaContextOptional(): FichaContextValue | null {
  return useContext(FichaContext);
}
