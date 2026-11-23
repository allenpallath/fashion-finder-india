export const GENDERS = ['Women', 'Men'] as const;
export type Gender = (typeof GENDERS)[number];

/** What the shopper asked for. Empty arrays mean "any". */
export interface SearchFormData {
  gender: Gender;
  dressType: string;
  colour: string;
  styles: string[];
  occasions: string[];
  /** Lowest price in ₹; 0 means no lower limit. */
  minPrice: number;
  /** Highest price in ₹; null means no upper limit. */
  maxPrice: number | null;
}

/** Dress type suggestions and placeholder for each gender. */
export const DRESS_TYPES: Record<Gender, { placeholder: string; suggestions: string[] }> = {
  Women: {
    placeholder: 'Satin maxi, kurti, lehenga, saree…',
    suggestions: [
      'Kurti', 'Kurta Set', 'Anarkali Kurta', 'Straight Kurta', 'A-Line Kurta',
      'Saree', 'Silk Saree', 'Banarasi Saree', 'Chiffon Saree', 'Lehenga', 'Lehenga Choli',
      'Salwar Suit', 'Sharara Set', 'Palazzo Set', 'Ethnic Gown', 'Dupatta',
      'Maxi Dress', 'Midi Dress', 'Mini Dress', 'Bodycon Dress', 'Shirt Dress', 'Wrap Dress',
      'Slip Dress', 'Satin Dress', 'Party Dress', 'Gown', 'Jumpsuit', 'Co-ord Set', 'Kaftan',
      'Top', 'Crop Top', 'Tunic', 'Blouse', 'T-Shirt', 'Oversized T-Shirt', 'Shirt',
      'Jeans', 'Trousers', 'Palazzo', 'Skirt', 'Shorts', 'Blazer', 'Jacket', 'Hoodie', 'Sweatshirt',
    ],
  },
  Men: {
    placeholder: 'Linen shirt, kurta, sherwani, chinos…',
    suggestions: [
      'Kurta', 'Kurta Pyjama Set', 'Pathani Suit', 'Sherwani', 'Nehru Jacket', 'Dhoti Kurta',
      'Indo-Western Set', 'Bandhgala', 'Shirt', 'Linen Shirt', 'Formal Shirt', 'Casual Shirt',
      'T-Shirt', 'Polo T-Shirt', 'Oversized T-Shirt', 'Henley', 'Jeans', 'Chinos', 'Trousers',
      'Formal Trousers', 'Cargo Pants', 'Joggers', 'Shorts', 'Blazer', 'Suit', 'Waistcoat',
      'Jacket', 'Denim Jacket', 'Bomber Jacket', 'Hoodie', 'Sweatshirt', 'Sweater', 'Co-ord Set',
    ],
  },
};

export const STYLE_OPTIONS = ['Slim Fit', 'Regular Fit', 'Relaxed Fit', 'Loose Fit', 'Oversized'];

export const OCCASION_OPTIONS = ['Casual', 'Office/Workwear', 'Party', 'Wedding', 'Festival', 'Date Night', 'Beach', 'Bridal'];

/** Right end of the price slider; dragging the max knob there means "no upper limit". */
export const PRICE_SLIDER_MAX = 10000;

/** "₹2,000". */
export const formatPrice = (value: number) => `₹${value.toLocaleString('en-IN')}`;

/** "₹500 – ₹2,000", "under ₹2,000", "over ₹500", or '' when there are no limits. */
export function priceLabel(min: number, max: number | null): string {
  if (min > 0 && max != null) return `${formatPrice(min)} – ${formatPrice(max)}`;
  if (max != null) return `under ${formatPrice(max)}`;
  if (min > 0) return `over ${formatPrice(min)}`;
  return '';
}

/** Swatch colours for the colour field preview. */
export const COLOR_MAP: Record<string, string> = {
  red: '#EF4444', blue: '#3B82F6', green: '#22C55E', black: '#1A1A2E', white: '#FFFFFF',
  pink: '#EC4899', yellow: '#EAB308', purple: '#A855F7', orange: '#F97316', beige: '#D4A574',
  ivory: '#FFFFF0', maroon: '#800000', navy: '#000080', teal: '#008080', coral: '#FF7F50',
  gold: '#FFD700', silver: '#C0C0C0', 'emerald green': '#50C878', 'dusty rose': '#DCAE96',
  'dusty pink': '#D4A5A5', 'baby pink': '#F4C2C2', lavender: '#E6E6FA', peach: '#FFDAB9',
  mint: '#98FF98', burgundy: '#800020', mauve: '#E0B0FF', sage: '#BCB88A', rust: '#B7410E',
  cream: '#FFFDD0', charcoal: '#36454F', wine: '#722F37',
};
