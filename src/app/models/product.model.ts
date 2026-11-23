/** A Google Shopping listing, as returned by the backend (server/index.mjs). */
export interface Product {
  id: string;
  productName: string;
  price: string;
  /** Numeric price, used for the price range filter (null if unreadable). */
  priceValue: number | null;
  /** Store name, e.g. "Myntra". */
  website: string;
  /** The item's Google Shopping page (lists every store selling it). */
  productLink: string;
  imageUrl: string;
  /** Smaller Google-hosted image, used if `imageUrl` fails to load. */
  thumbnailUrl: string;
  rating: string;
  reviewCount: string;
  /** Short labels from Google, e.g. delivery notes. */
  tags: string[];
  /** Token for looking up the stores selling this item (direct store links). */
  detailsToken: string;
}

/** Dot colour per store on product cards. */
export const STORE_COLOURS: Record<string, string> = {
  Myntra: '#FF3F6C',
  AJIO: '#E53935',
  Flipkart: '#2874F0',
  Amazon: '#FF9900',
  'Nykaa Fashion': '#E5E5E5',
  'Tata CLiQ': '#9B2FAE',
  Meesho: '#570741',
};
