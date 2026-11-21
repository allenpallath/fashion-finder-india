export const GENDERS = ['Women', 'Men'] as const;
export type Gender = (typeof GENDERS)[number];

/** What the shopper asked for. Empty arrays mean "any". */
export interface SearchFormData {
  gender: Gender;
  dressType: string;
  colour: string;
  styles: string[];
  occasions: string[];
  budgetRange: number;
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

export const STYLE_OPTIONS = ['Slim Fit', 'Regular Fit', 'Flared', 'A-Line', 'Bodycon', 'Wrap', 'Oversized', 'Peplum'];

export const OCCASION_OPTIONS = ['Casual', 'Office/Workwear', 'Party', 'Wedding', 'Festival', 'Date Night', 'Beach', 'Bridal'];

/** Budget slider stops. The last one means "no upper limit". */
export const BUDGET_STEPS = [500, 1000, 2000, 3000, 5000, 10000];
export const MAX_BUDGET = BUDGET_STEPS[BUDGET_STEPS.length - 1];

/** "₹2,000", or "₹10,000+" for the top step. */
export const formatBudget = (value: number) =>
  `₹${value.toLocaleString('en-IN')}${value >= MAX_BUDGET ? '+' : ''}`;

/** Compact label for the slider ticks: "₹500", "₹2k", "₹10k+". */
export const shortBudget = (value: number) =>
  value < 1000 ? `₹${value}` : `₹${value / 1000}k${value >= MAX_BUDGET ? '+' : ''}`;

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
