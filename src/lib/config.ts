/**
 * Configuração ÚNICA do suporte (WhatsApp do Super Admin).
 * Troque o número aqui: é usado no login e na tela de acesso suspenso.
 */
export const SUPORTE_WHATSAPP = "5511900000000";
export const SUPORTE_MENSAGEM = "Olá! Preciso de ajuda com o OrçaJá.";

export function linkSuporte(): string {
  return `https://wa.me/${SUPORTE_WHATSAPP}?text=${encodeURIComponent(SUPORTE_MENSAGEM)}`;
}
