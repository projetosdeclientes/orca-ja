import { formatDistanceToNowStrict, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const num = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** R$ 1.234,56 */
export function moeda(v: number | string | null | undefined): string {
  return brl.format(Number(v ?? 0)).replace(/\u00a0/g, " ");
}

/** 1.234,56 (sem símbolo) */
export function numero(v: number | string | null | undefined, casas = 2): string {
  if (casas === 2) return num.format(Number(v ?? 0));
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas }).format(Number(v ?? 0));
}

/** Converte "1.234,56" ou "1234.56" em número; vazio/ inválido = NaN */
export function parseDecimal(texto: string): number {
  const t = (texto ?? "").trim();
  if (!t) return NaN;
  const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  const n = Number(normal);
  return Number.isFinite(n) ? n : NaN;
}

/** Converte um número para texto editável com vírgula ("12,5") */
export function paraCampo(v: number | string | null | undefined): string {
  if (v === null || v === undefined || v === "") return "";
  return String(v).replace(".", ",");
}

/** Data ISO (aaaa-mm-dd ou timestamp) -> dd/mm/aaaa */
export function data(iso: string | null | undefined): string {
  if (!iso) return "";
  const s = String(iso);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [a, m, d] = s.split("-");
    return `${d}/${m}/${a}`;
  }
  return new Date(s).toLocaleDateString("pt-BR");
}

/** Data local de hoje + N dias em aaaa-mm-dd */
export function hojeMaisDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function hojeISO(): string {
  return hojeMaisDias(0);
}

export function soDigitos(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

/** Garante o DDI 55 no início (apenas dígitos) */
export function whatsComDDI(v: string | null | undefined): string {
  const d = soDigitos(v);
  if (!d) return "";
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
}

/** Máscara (11) 91234-5678 a partir de dígitos (aceita com ou sem 55) */
export function mascaraTelefone(v: string | null | undefined): string {
  let d = soDigitos(v);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function numeroOrcamento(n: number | null | undefined): string {
  return String(n ?? 0).padStart(4, "0");
}

export function tempoRelativo(iso: string): string {
  const d = new Date(iso);
  if (isYesterday(d)) return "ontem";
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "agora mesmo";
  return formatDistanceToNowStrict(d, { locale: ptBR, addSuffix: true });
}

export function linkWhatsApp(numeroDestino: string, mensagem: string): string {
  return `https://wa.me/${whatsComDDI(numeroDestino)}?text=${encodeURIComponent(mensagem)}`;
}

export function slugify(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
