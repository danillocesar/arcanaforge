import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { CombateData, CombateJogador, CombateRow, Inimigo } from '../types/combate';
import {
  apiLoadCombate,
  apiSaveCombate,
  apiFetchFichasResumo,
  apiLoadFicha,
  apiSaveFicha,
  apiAvatarSemFundo,
} from '../api/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../components/ui/Toast/Toast';

interface CombateContextValue {
  mestreData: CombateData;
  jogadores: CombateJogador[];
  turnoIdx: number;
  ordenado: CombateRow[];
  ordenadoAtivo: boolean;
  modoMestre: boolean;

  setModoMestre: (v: boolean) => void;
  adicionarInimigo: (nome: string, pvMax: number) => void;
  removerInimigo: (idx: number) => void;
  updateIniciativa: (id: string, tipo: string, val: number | string) => void;
  updateInimigoNome: (idx: number, nome: string) => void;
  updateInimigoPvMax: (idx: number, pvMax: number) => void;
  ordenarIniciativa: () => void;
  proximoTurno: () => void;
  resetTurno: () => void;
  aplicarHpChange: (tipo: string, nome: string, inimigoIdx: number | undefined, delta: number) => Promise<void>;
  loadCombate: () => Promise<void>;
}

const DEFAULT_COMBATE: CombateData = {
  inimigos: [],
  iniciativas: {},
  turnoIdx: -1,
  ordenado: false,
  rodada: 1,
};

const CombateContext = createContext<CombateContextValue | null>(null);

export function CombateProvider({ children }: { children: React.ReactNode }) {
  const [mestreData, setMestreData] = useState<CombateData>({ ...DEFAULT_COMBATE });
  const [jogadores, setJogadores] = useState<CombateJogador[]>([]);
  const [turnoIdx, setTurnoIdx] = useState(-1);
  const [ordenadoList, setOrdenadoList] = useState<CombateRow[]>([]);
  const [ordenadoAtivo, setOrdenadoAtivo] = useState(false);
  const [modoMestre, setModoMestre] = useState(false);

  const mestreDataRef = useRef(mestreData);
  mestreDataRef.current = mestreData;
  const jogadoresRef = useRef(jogadores);
  jogadoresRef.current = jogadores;

  const { showToast } = useToast();

  const buildOrdenado = useCallback((data: CombateData, jogs: CombateJogador[]) => {
    const rows: CombateRow[] = [];

    jogs.forEach((j) => {
      rows.push({
        tipo: 'jogador',
        id: `jogador_${j.nome}`,
        nome: j.nome,
        iniciativa: Number(data.iniciativas[`jogador_${j.nome}`]) || 0,
        pvMax: j.pvMax,
        pvAtual: j.pvAtual,
        pmMax: j.pmMax,
        pmAtual: j.pmAtual,
        avatar: j.avatar,
        classes: j.classes,
      });
    });

    data.inimigos.forEach((ini, idx) => {
      rows.push({
        tipo: 'inimigo',
        id: `inimigo_${idx}`,
        nome: ini.nome,
        iniciativa: ini.iniciativa,
        pvMax: ini.pvMax,
        pvAtual: ini.pvAtual,
        limiarAlerta: ini.limiarAlerta,
        limiarCritico: ini.limiarCritico,
      });
    });

    rows.sort((a, b) => b.iniciativa - a.iniciativa);
    setOrdenadoList(rows);
    setOrdenadoAtivo(true);
  }, []);

  const { send } = useWebSocket(
    useCallback(
      (msg) => {
        if (msg.type === 'combate_sync' && msg.data) {
          const d = msg.data as CombateData;
          setMestreData({ ...d, rodada: d.rodada ?? 1 });
          if (d.turnoIdx !== undefined) setTurnoIdx(d.turnoIdx);
          if (d.ordenado) {
            buildOrdenado(d, jogadoresRef.current);
          } else {
            setOrdenadoAtivo(false);
            setOrdenadoList([]);
          }
        }
        if (msg.type === 'ficha_hp_sync' && msg.nome) {
          setJogadores((prev) => {
            const next = prev.map((j) =>
              j.nome === msg.nome
                ? {
                    ...j,
                    pvAtual: msg.pv?.atual ?? j.pvAtual,
                    pmAtual: msg.pm?.atual ?? j.pmAtual,
                  }
                : j,
            );
            queueMicrotask(() => {
              if (mestreDataRef.current.ordenado) {
                buildOrdenado(mestreDataRef.current, next);
              }
            });
            return next;
          });
          showToast(`PV/PM de ${msg.nome} atualizado`, 'sync');
        }
        if (msg.type === 'mestre_hp_sync' && msg.nome) {
          setJogadores((prev) => {
            const next = prev.map((j) =>
              j.nome === msg.nome ? { ...j, pvAtual: msg.pvAtual } : j,
            );
            queueMicrotask(() => {
              if (mestreDataRef.current.ordenado) {
                buildOrdenado(mestreDataRef.current, next);
              }
            });
            return next;
          });
          showToast(`PV de ${msg.nome} atualizado pelo Mestre`, 'info');
        }
      },
      [buildOrdenado, showToast],
    ),
  );

  const broadcastMestreData = useCallback(
    (data: CombateData) => {
      send({ type: 'combate_update', data });
      apiSaveCombate(data);
    },
    [send],
  );

  const loadCombate = useCallback(async () => {
    const data = await apiLoadCombate();
    const normalized = { ...data, rodada: data.rodada ?? 1 };
    setMestreData(normalized);
    if (normalized.turnoIdx !== undefined) setTurnoIdx(normalized.turnoIdx);

    const resumos = await apiFetchFichasResumo();
    const jogsPromises = resumos.map(async (r) => {
      const ficha = await apiLoadFicha(r.nome);
      let avatar = r.avatar || '';
      try {
        const semFundo = await apiAvatarSemFundo(r.nome);
        if (semFundo) avatar = semFundo;
      } catch { /* keep original */ }

      return {
        nome: r.nome,
        avatar,
        classes: r.classes,
        pvMax: ficha?.pv.maximo ?? 0,
        pvAtual: ficha?.pv.atual ?? 0,
        pmMax: ficha?.pm.maximo ?? 0,
        pmAtual: ficha?.pm.atual ?? 0,
      } satisfies CombateJogador;
    });

    const jogs = await Promise.all(jogsPromises);
    setJogadores(jogs);

    if (normalized.ordenado) {
      buildOrdenado(normalized, jogs);
    } else {
      setOrdenadoAtivo(false);
      setOrdenadoList([]);
    }
  }, [buildOrdenado]);

  const adicionarInimigo = useCallback((nome: string, pvMax: number) => {
    const max = Math.max(1, Math.floor(Number(pvMax)) || 1);
    const label = nome.trim() || `Inimigo ${mestreDataRef.current.inimigos.length + 1}`;
    const newInimigo: Inimigo = {
      id: `inimigo_${Date.now()}`,
      nome: label,
      pvMax: max,
      pvAtual: max,
      iniciativa: 0,
      limiarAlerta: 76,
      limiarCritico: 28,
    };
    const updated = {
      ...mestreDataRef.current,
      inimigos: [...mestreDataRef.current.inimigos, newInimigo],
    };
    setMestreData(updated);
    broadcastMestreData(updated);
  }, [broadcastMestreData]);

  const removerInimigo = useCallback(
    (idx: number) => {
      const updated = {
        ...mestreDataRef.current,
        inimigos: mestreDataRef.current.inimigos.filter((_, i) => i !== idx),
      };
      setMestreData(updated);
      broadcastMestreData(updated);
    },
    [broadcastMestreData],
  );

  const updateIniciativa = useCallback(
    (id: string, tipo: string, val: number | string) => {
      if (tipo === 'inimigo') {
        const parts = id.split('_');
        const idx = parseInt(parts[parts.length - 1], 10);
        const inimigos = mestreDataRef.current.inimigos.map((ini, i) =>
          i === idx ? { ...ini, iniciativa: Number(val) || 0 } : ini,
        );
        const updated = { ...mestreDataRef.current, inimigos };
        setMestreData(updated);
        broadcastMestreData(updated);
      } else {
        const iniciativas = { ...mestreDataRef.current.iniciativas, [id]: Number(val) || 0 };
        const updated = { ...mestreDataRef.current, iniciativas };
        setMestreData(updated);
        broadcastMestreData(updated);
      }
    },
    [broadcastMestreData],
  );

  const updateInimigoNome = useCallback(
    (idx: number, nome: string) => {
      const inimigos = mestreDataRef.current.inimigos.map((ini, i) =>
        i === idx ? { ...ini, nome } : ini,
      );
      const updated = { ...mestreDataRef.current, inimigos };
      setMestreData(updated);
      broadcastMestreData(updated);
    },
    [broadcastMestreData],
  );

  const updateInimigoPvMax = useCallback(
    (idx: number, pvMax: number) => {
      const max = Math.max(1, Math.floor(Number(pvMax)) || 1);
      const inimigos = mestreDataRef.current.inimigos.map((ini, i) => {
        if (i !== idx) return ini;
        return {
          ...ini,
          pvMax: max,
          pvAtual: Math.min(ini.pvAtual, max),
        };
      });
      const updated = { ...mestreDataRef.current, inimigos };
      setMestreData(updated);
      broadcastMestreData(updated);
      if (updated.ordenado) {
        buildOrdenado(updated, jogadoresRef.current);
      }
    },
    [broadcastMestreData, buildOrdenado],
  );

  const ordenarIniciativa = useCallback(() => {
    const updated = { ...mestreDataRef.current, ordenado: true, turnoIdx: 0, rodada: 1 };
    setMestreData(updated);
    setTurnoIdx(0);
    broadcastMestreData(updated);
    buildOrdenado(updated, jogadoresRef.current);
  }, [broadcastMestreData, buildOrdenado]);

  const proximoTurno = useCallback(() => {
    const total = jogadoresRef.current.length + mestreDataRef.current.inimigos.length;
    if (total === 0) return;
    let next: number;
    if (turnoIdx < 0) {
      next = 0;
    } else {
      next = (turnoIdx + 1) % total;
    }
    let rodada = mestreDataRef.current.rodada ?? 1;
    if (turnoIdx >= 0 && turnoIdx === total - 1 && next === 0) {
      rodada += 1;
    }
    setTurnoIdx(next);
    const updated = { ...mestreDataRef.current, turnoIdx: next, rodada };
    setMestreData(updated);
    broadcastMestreData(updated);
  }, [turnoIdx, broadcastMestreData]);

  const resetTurno = useCallback(() => {
    const updated = {
      ...mestreDataRef.current,
      ordenado: false,
      turnoIdx: -1,
      rodada: 1,
    };
    setMestreData(updated);
    setTurnoIdx(-1);
    setOrdenadoList([]);
    setOrdenadoAtivo(false);
    broadcastMestreData(updated);
  }, [broadcastMestreData]);

  const aplicarHpChange = useCallback(
    async (tipo: string, nome: string, inimigoIdx: number | undefined, delta: number) => {
      if (tipo === 'jogador') {
        const ficha = await apiLoadFicha(nome);
        if (!ficha) return;
        ficha.pv.atual = Math.max(0, Math.min(ficha.pv.maximo, ficha.pv.atual + delta));
        await apiSaveFicha(nome, ficha);
        send({
          type: 'mestre_hp_update',
          nome,
          pvAtual: ficha.pv.atual,
        });
        setJogadores((prev) => {
          const next = prev.map((j) =>
            j.nome === nome ? { ...j, pvAtual: ficha.pv.atual } : j,
          );
          queueMicrotask(() => {
            if (mestreDataRef.current.ordenado) {
              buildOrdenado(mestreDataRef.current, next);
            }
          });
          return next;
        });
      } else if (tipo === 'inimigo' && inimigoIdx !== undefined) {
        const inimigos = mestreDataRef.current.inimigos.map((ini, i) => {
          if (i !== inimigoIdx) return ini;
          return {
            ...ini,
            pvAtual: Math.max(0, Math.min(ini.pvMax, ini.pvAtual + delta)),
          };
        });
        const updated = { ...mestreDataRef.current, inimigos };
        setMestreData(updated);
        broadcastMestreData(updated);
        if (updated.ordenado) {
          buildOrdenado(updated, jogadoresRef.current);
        }
      }
    },
    [send, broadcastMestreData, buildOrdenado],
  );

  const value: CombateContextValue = {
    mestreData,
    jogadores,
    turnoIdx,
    ordenado: ordenadoList,
    ordenadoAtivo,
    modoMestre,
    setModoMestre,
    adicionarInimigo,
    removerInimigo,
    updateIniciativa,
    updateInimigoNome,
    updateInimigoPvMax,
    ordenarIniciativa,
    proximoTurno,
    resetTurno,
    aplicarHpChange,
    loadCombate,
  };

  return <CombateContext.Provider value={value}>{children}</CombateContext.Provider>;
}

export function useCombateContext(): CombateContextValue {
  const ctx = useContext(CombateContext);
  if (!ctx) throw new Error('useCombateContext must be used within CombateProvider');
  return ctx;
}
