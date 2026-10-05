import { useSyncExternalStore } from "react";

/** Empresa que o Super Admin está visualizando ("Abrir"). Guardada só no navegador. */
const CHAVE = "orcaja_empresa_ativa";
const ouvintes = new Set<() => void>();

function ler(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CHAVE);
}

export function definirEmpresaAtiva(id: string | null): void {
  if (id) window.localStorage.setItem(CHAVE, id);
  else window.localStorage.removeItem(CHAVE);
  ouvintes.forEach((f) => f());
}

export function useEmpresaAtiva(): string | null {
  return useSyncExternalStore(
    (cb) => {
      ouvintes.add(cb);
      return () => ouvintes.delete(cb);
    },
    ler,
    () => null,
  );
}
