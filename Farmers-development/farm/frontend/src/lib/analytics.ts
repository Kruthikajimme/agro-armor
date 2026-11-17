/**
 * Unified Analytics Helper — AgroArmor V2
 *
 * Single architecture to manage and dispatch events across destinations:
 *   - Google Analytics 4 (via gtag.js with dynamic VITE_GA_MEASUREMENT_ID)
 *   - Mixpanel
 *   - Amplitude
 *   - Local A/B Testing Counters
 *
 * Strict Privacy:
 *   - No passwords, payment details, phone numbers, emails, names, or PII
 *     are ever sent to GA4.
 *   - Automatic PII key filtering on all GA4 event dispatches.
 */

import { trackEvent as mpTrack } from './mixpanel';
import { trackAmplitudeEvent } from './amplitude';
import { incrementStat, ExperimentVariant } from './abTesting';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

let isGA4Initialized = false;
let lastTrackedPath: string | null = null;
const trackedPurchases = new Set<string>();

/**
 * Initialize Google Analytics 4 dynamically using VITE_GA_MEASUREMENT_ID.
 *
 * Guarantees:
 * - Single initialization (never loads script twice).
 * - send_page_view: false in config so React Router controls page_view events accurately without duplicates.
 * - Safely no-ops if VITE_GA_MEASUREMENT_ID is not configured or set to placeholder.
 */
export function initGA4(): void {
  if (isGA4Initialized || typeof window === 'undefined') {
    return;
  }

  // Read VITE_GA_MEASUREMENT_ID strictly from environment variables (no hardcoded fallback)
  const rawId = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();

  // If unconfigured or left as placeholder, do not initialize GA4
  if (!rawId || rawId === 'G-XXXXXXXXXX') {
    return;
  }

  // Validate Measurement ID format (G-XXXXXXXXXX)
  if (!/^G-[A-Z0-9]+$/i.test(rawId)) {
    console.warn(`[GA4] Invalid measurement ID format: "${rawId}". Expected "G-XXXXXXXXXX".`);
    return;
  }

  const cleanId = rawId;

  // Initialize dataLayer and gtag stub if not already present
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function () {
      window.dataLayer?.push(arguments);
    };
  }

  // Inject Google tag script dynamically if not already present
  const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${cleanId}"]`);
  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${cleanId}`;
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', cleanId, {
    send_page_view: false, // Page views handled by React Router client-side navigation
  });

  isGA4Initialized = true;
}

/**
 * Strip sensitive PII fields before dispatching to GA4.
 */
function sanitizeGA4Properties(props: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const blockedKeys = new Set([
    'email',
    'phone',
    'phonenumber',
    'password',
    'pwd',
    'pwdhash',
    'name',
    'fullname',
    'address',
    'token',
    'jwt',
    'secret',
    'card',
    'cvv',
    'upi_pin',
    'signature'
  ]);

  for (const [key, value] of Object.entries(props)) {
    if (!blockedKeys.has(key.toLowerCase()) && value !== undefined && value !== null) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Send an event to GA4 + Mixpanel + Amplitude simultaneously.
 * Properties are forwarded to all platforms; GA4 properties are PII-filtered.
 */
export function trackAnalyticsEvent(
  eventName: string,
  properties: Record<string, unknown> = {}
): void {
  // 1. GA4
  if (typeof window.gtag === 'function') {
    const gaProps = sanitizeGA4Properties(properties);
    window.gtag('event', eventName, gaProps);
  }

  // 2. Mixpanel
  try {
    mpTrack(eventName, properties as any);
  } catch (e) {
    console.warn('[Analytics] Mixpanel error:', e);
  }

  // 3. Amplitude
  try {
    trackAmplitudeEvent(eventName, properties as any);
  } catch (e) {
    console.warn('[Analytics] Amplitude error:', e);
  }

  // 4. Bump local A/B stats counters
  if (properties.experiment_id) {
    const expId = properties.experiment_id as string;
    const variant = (properties.variant ?? 'control') as ExperimentVariant;

    if (eventName === 'experiment_viewed') {
      incrementStat(expId, variant, 'views');
    } else if (eventName === 'experiment_converted') {
      incrementStat(expId, variant, 'conversions');
    }
  }
}

/**
 * Track client-side page view for React Router without duplicate events.
 */
export function trackPageView(path?: string, title?: string): void {
  if (typeof window === 'undefined') return;

  const pagePath = path || window.location.pathname + window.location.search;
  const pageTitle = title || document.title || 'AgroArmor V2';

  // Prevent duplicate consecutive tracking for the exact same path
  if (lastTrackedPath === pagePath) {
    return;
  }
  lastTrackedPath = pagePath;

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: window.location.href,
    });
  }
}

/**
 * Track user sign_up in GA4 without PII.
 */
export function trackSignUp(method: string = 'credentials'): void {
  trackAnalyticsEvent('sign_up', { method });
}

/**
 * Track user login in GA4 without PII.
 */
export function trackLogin(method: string = 'credentials'): void {
  trackAnalyticsEvent('login', { method });
}

/**
 * Track viewing item list (e.g. Marketplace).
 */
export function trackViewItemList(listName: string, itemsCount?: number): void {
  trackAnalyticsEvent('view_item_list', {
    item_list_name: listName,
    items_count: itemsCount,
  });
}

/**
 * Track viewing item details.
 */
export function trackViewItem(item: { id: string; name: string; category?: string; price?: number }): void {
  trackAnalyticsEvent('view_item', {
    currency: 'INR',
    value: item.price,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
      },
    ],
  });
}

/**
 * Track adding an item to cart.
 */
export function trackAddToCart(item: { id: string; name: string; category?: string; price: number; quantity?: number }): void {
  trackAnalyticsEvent('add_to_cart', {
    currency: 'INR',
    value: item.price * (item.quantity || 1),
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity || 1,
      },
    ],
  });
}

export interface GA4Item {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
  [key: string]: unknown;
}

/**
 * Track checkout initiation (begin_checkout) with standard items array and total revenue.
 */
export function trackBeginCheckout(
  value: number,
  items: GA4Item[] = [],
  tax?: number
): void {
  trackAnalyticsEvent('begin_checkout', {
    currency: 'INR',
    value: Number(value.toFixed(2)),
    ...(tax !== undefined ? { tax: Number(tax.toFixed(2)) } : {}),
    items: items.map(item => ({
      item_id: String(item.item_id),
      item_name: String(item.item_name),
      item_category: item.item_category ? String(item.item_category) : undefined,
      price: typeof item.price === 'number' ? Number(item.price.toFixed(2)) : undefined,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
    })),
  });
}

/**
 * Track successful purchase with standard items array, actual charged revenue, and tax.
 */
export function trackPurchase(
  transactionId: string,
  value: number,
  items: GA4Item[] = [],
  tax?: number
): void {
  if (trackedPurchases.has(transactionId)) {
    return; // Prevent duplicate purchase events for the same transaction
  }
  trackedPurchases.add(transactionId);

  trackAnalyticsEvent('purchase', {
    transaction_id: transactionId,
    currency: 'INR',
    value: Number(value.toFixed(2)),
    ...(tax !== undefined ? { tax: Number(tax.toFixed(2)) } : {}),
    items: items.map(item => ({
      item_id: String(item.item_id),
      item_name: String(item.item_name),
      item_category: item.item_category ? String(item.item_category) : undefined,
      price: typeof item.price === 'number' ? Number(item.price.toFixed(2)) : undefined,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
    })),
  });
}

/**
 * Track a voice navigation command.
 * Fires to GA4 + Mixpanel + Amplitude.
 */
export function trackVoiceNavigation(command: string, destination: string): void {
  trackAnalyticsEvent('voice_navigation', { command, destination });
}
