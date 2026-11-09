/** Pixelify's "~" is nearly flat (it reads as "-400"): set tildes in Silkscreen. Returns safe HTML. */
export function withTilde(text: string) {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(/~/g, '<span style="font-family:var(--f-silkscreen);font-weight:400">~</span>');
}
