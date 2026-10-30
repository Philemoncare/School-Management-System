/**
 * Deterministic class ordering.
 *
 * Schools configure the progression order in `Class.level` (1 = first class a
 * student takes). When a school has not configured levels yet, we fall back to
 * the stage named in the class (Nursery → KG → Primary → JHS → SHS → Year) and
 * then the number in the name. This keeps dropdowns in curriculum order without
 * hardcoding any single school's structure.
 */

type ClassLike = {
  name: string;
  level?: number | null;
  code?: string | null;
};

const STAGE_RANK: Array<{ pattern: RegExp; rank: number }> = [
  { pattern: /\b(creche|cr[eè]che|nursery|pre-?k|pre-?school|reception|playgroup|kindergarten prep)\b/i, rank: 100 },
  { pattern: /\b(kg|kinder|kindergarten)\b/i, rank: 200 },
  { pattern: /\b(primary|basic|elementary|grade|standard|pry)\b/i, rank: 300 },
  { pattern: /\b(jhs|junior|middle|intermediate)\b/i, rank: 400 },
  { pattern: /\b(shs|senior|high|secondary|form)\b/i, rank: 500 },
  { pattern: /\b(year|level|tertiary|college|university|tvet)\b/i, rank: 600 },
];

function stageRank(name: string): number {
  const normalised = name.trim();
  for (const entry of STAGE_RANK) {
    if (entry.pattern.test(normalised)) return entry.rank;
  }
  return 700;
}

function firstNumber(value: string): number {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function compareClasses(a: ClassLike, b: ClassLike): number {
  const aLevel = a.level ?? 0;
  const bLevel = b.level ?? 0;
  if (aLevel > 0 && bLevel > 0 && aLevel !== bLevel) return aLevel - bLevel;

  const rankDiff = stageRank(a.name) - stageRank(b.name);
  if (rankDiff !== 0) return rankDiff;

  const numberDiff = firstNumber(a.name) - firstNumber(b.name);
  if (numberDiff !== 0) return numberDiff;

  const nameDiff = naturalCompare(a.name, b.name);
  if (nameDiff !== 0) return nameDiff;

  return naturalCompare(a.code ?? '', b.code ?? '');
}

export function sortClasses<T extends ClassLike>(classes: T[]): T[] {
  const configured = classes.some((clazz) => (clazz.level ?? 0) > 0);
  if (configured) {
    return [...classes].sort((a, b) => {
      const aLevel = a.level ?? 0;
      const bLevel = b.level ?? 0;
      // Classes with a configured order come first, in that order.
      if (aLevel > 0 && bLevel > 0) return aLevel - bLevel;
      if (aLevel > 0) return -1;
      if (bLevel > 0) return 1;
      return compareClasses(a, b);
    });
  }
  return [...classes].sort(compareClasses);
}

/** Next progression value to suggest when a new class is created. */
export function nextClassLevel(classes: Array<{ level?: number | null }>): number {
  const highest = classes.reduce((max, clazz) => Math.max(max, clazz.level ?? 0), 0);
  return highest + 1;
}
