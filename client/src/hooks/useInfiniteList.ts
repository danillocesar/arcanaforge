import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_PAGE_SIZE, grownCount, initialCount } from '../utils/infiniteList';

interface InfiniteList<T> {
  /** A fatia a renderizar agora. */
  visible: T[];
  /** Ainda há itens além da fatia — controla se a sentinela é montada. */
  hasMore: boolean;
  /** `ref` do elemento sentinela, posto logo depois do último item da lista. */
  sentinelRef: (node: HTMLElement | null) => void;
}

/**
 * Renderiza uma lista longa aos poucos: só a primeira página entra no DOM, e o
 * resto é anexado conforme a sentinela do fim entra em tela.
 *
 * `resetKey` é a assinatura do filtro (busca + chips). Quando ela muda a contagem
 * volta pra uma página — sem isso, filtrar depois de rolar bastante deixaria a
 * lista nova renderizando centenas de itens de uma vez, que é justamente o
 * travamento que o componente tenta evitar.
 */
export function useInfiniteList<T>(
  items: T[],
  resetKey: unknown,
  pageSize = DEFAULT_PAGE_SIZE,
): InfiniteList<T> {
  const [count, setCount] = useState(() => initialCount(items.length, pageSize));
  const [lastKey, setLastKey] = useState(resetKey);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Padrão "adjust state while rendering" do React, já usado nos painéis da ficha:
  // reage à troca de filtro no próprio render, sem o round-trip de um efeito.
  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setCount(initialCount(items.length, pageSize));
  }

  const hasMore = count < items.length;

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      if (!node) return;
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setCount((c) => grownCount(c, items.length, pageSize));
        }
      });
      observer.observe(node);
      observerRef.current = observer;
    },
    [items.length, pageSize],
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { visible: items.slice(0, count), hasMore, sentinelRef };
}
