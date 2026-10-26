export function safeNext(value: string | null | undefined) {
  if (!value || !/^\/(viagens|convites|conta)(\/|\?|$)/.test(value) || /[\\\r\n]/.test(value)) {
    return "/viagens";
  }
  return value;
}

