// Pure helpers that turn the form into search queries and rank the results.
// Google Shopping results have no colour or style fields, so ranking uses titles.

import { Product } from '../models/product.model';
import { Gender, MAX_BUDGET, SearchFormData } from '../models/search-form.model';

/** Titles meant only for the other gender ("women" doesn't match \bmen\b). Unisex titles pass. */
const OTHER_GENDER: Record<Gender, RegExp> = {
  Women: /\b(men|men's|mens|boys?|male|gents)\b/,
  Men: /\b(women|women's|womens|ladies|girls?|female)\b/,
};

/** Colour words grouped into families, so a search for "red" also accepts maroon or wine. */
const COLOUR_FAMILIES = [
  ['red', 'maroon', 'burgundy', 'wine', 'crimson', 'scarlet', 'cherry'],
  ['pink', 'rose', 'blush', 'fuchsia', 'magenta', 'peach'],
  ['orange', 'rust', 'coral', 'tangerine'],
  ['yellow', 'mustard', 'lemon'],
  ['gold', 'golden'],
  ['green', 'olive', 'mint', 'emerald', 'sage', 'lime', 'bottle'],
  ['teal', 'turquoise', 'aqua'],
  ['blue', 'navy', 'sky', 'indigo', 'cobalt', 'denim'],
  ['purple', 'lavender', 'lilac', 'violet', 'mauve', 'plum'],
  ['brown', 'beige', 'tan', 'khaki', 'coffee', 'camel', 'chocolate'],
  ['white', 'ivory', 'cream', 'offwhite'],
  ['black'],
  ['grey', 'gray', 'silver', 'charcoal'],
];
const COLOUR_WORDS = new Set(COLOUR_FAMILIES.flat());

/** Title patterns for each style and occasion option. */
const PREFERENCE_TERMS: Record<string, RegExp> = {
  'Slim Fit': /\bslim\b/,
  'Regular Fit': /\bregular\b/,
  Flared: /\bflared?\b/,
  'A-Line': /\ba[\s-]?line\b/,
  Bodycon: /\bbody[\s-]?con\b/,
  Wrap: /\bwrap\b/,
  Oversized: /\bover[\s-]?sized?\b/,
  Peplum: /\bpeplum\b/,
  Casual: /\bcasual\b/,
  'Office/Workwear': /\b(office|work[\s-]?wear|formal)\b/,
  Party: /\bparty\b/,
  Wedding: /\b(wedding|bridal|festive)\b/,
  Festival: /\b(festive|festival|ethnic)\b/,
  'Date Night': /\b(date|evening|party)\b/,
  Beach: /\b(beach|resort|summer)\b/,
  Bridal: /\b(bridal|bride|wedding)\b/,
};

const words = (text: string) => text.toLowerCase().replace(/off[\s-]white/g, 'offwhite').match(/[a-z]+/g) ?? [];
const join = (...parts: string[]) => parts.map((p) => p.trim()).filter(Boolean).join(' ');

/**
 * Queries to try, most specific first; later ones are used by "Find more" so
 * Google returns different items. One picked style or occasion goes into the
 * query; when several are picked they're only used for ranking.
 */
export function queryVariants(form: SearchFormData): string[] {
  const style = form.styles.length === 1 ? form.styles[0] : '';
  const occasion = form.occasions.length === 1 ? `for ${form.occasions[0].replace('/', ' ')}` : '';
  const base = join(form.gender, form.colour, style, form.dressType, occasion);
  const broad = join(form.gender, form.colour, form.dressType);
  return [...new Set([base, join(base, 'new arrivals'), join(base, 'best seller'), broad, join(broad, 'trending'), join(broad, 'online')])];
}

/**
 * Keeps items within budget whose title doesn't name a different colour or
 * the other gender. Order: titles naming the wanted colour, then ones
 * mentioning a picked style/occasion, otherwise Google's order.
 */
export function filterAndRank(products: Product[], form: SearchFormData): Product[] {
  const wanted = colourFamily(form.colour);
  const prefs = [...form.styles, ...form.occasions].map((name) => PREFERENCE_TERMS[name]).filter(Boolean);
  return products
    .filter((p) => withinBudget(p, form.budgetRange) && !OTHER_GENDER[form.gender].test(p.productName.toLowerCase()))
    .map((p, index) => ({ p, index, ...score(p.productName.toLowerCase(), wanted, prefs) }))
    .filter((x) => x.keep)
    .sort((a, b) => b.points - a.points || a.index - b.index)
    .map((x) => x.p);
}

/** The top budget step has no upper limit; items with no readable price are kept. */
const withinBudget = (p: Product, budget: number) =>
  budget >= MAX_BUDGET || p.priceValue == null || p.priceValue <= budget;

/** Every colour word in the families the shopper's colour belongs to ("red" → red, maroon, wine…). */
const colourFamily = (colour: string) =>
  new Set(COLOUR_FAMILIES.filter((family) => words(colour).some((w) => family.includes(w))).flat());

/** Drops titles naming only other colours; 2 points for the wanted colour, 1 for a picked style/occasion. */
function score(title: string, wanted: Set<string>, prefs: RegExp[]) {
  const named = words(title).filter((w) => COLOUR_WORDS.has(w));
  const colourMatch = named.some((w) => wanted.has(w));
  return {
    keep: wanted.size === 0 || named.length === 0 || colourMatch,
    points: (colourMatch ? 2 : 0) + (prefs.some((re) => re.test(title)) ? 1 : 0),
  };
}
