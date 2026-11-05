/**
 * SMS segment accounting (GSM-7 vs UCS-2), shared by the delivery processor
 * and the communication service so credit estimates are identical everywhere.
 */
const GSM7_SINGLE = 160;
const GSM7_MULTIPART = 153;
const UCS2_SINGLE = 70;
const UCS2_MULTIPART = 67;

/**
 * GSM-7 basic character set (plus the common extension/line-break chars). If a
 * message contains any character outside this set (accented letters, emoji,
 * non-Latin scripts, etc.) it must be sent as UCS-2, which segments at 70/67.
 */
const GSM7_ALLOWED = new Set<string>([
  ...'@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà',
  ...['|', '^', '€', '{', '}', '[', ']', '~', '\\'],
]);

export function isGsm7(message: string): boolean {
  for (const ch of message) {
    if (!GSM7_ALLOWED.has(ch)) return false;
  }
  return true;
}

export function smsSegmentCount(message: string): { segments: number; encoding: 'GSM7' | 'UCS2' } {
  const gsm = isGsm7(message);
  const single = gsm ? GSM7_SINGLE : UCS2_SINGLE;
  const multi = gsm ? GSM7_MULTIPART : UCS2_MULTIPART;
  const len = message.length;
  const segments = len <= single ? 1 : Math.ceil(len / multi);
  return { segments, encoding: gsm ? 'GSM7' : 'UCS2' };
}
