export const pricing = { base: 349, perUnit: 50, maxUnits: 5, yearly: 60 };

/** Build price for a property with `units` units, or null when it needs a quote. */
export function setupPrice(units: number) {
  if (units > pricing.maxUnits) return null;
  return pricing.base + (units - 1) * pricing.perUnit;
}

export const euro = (value: number) => `${value.toLocaleString('sl-SI')} €`;

export const owner = 'Anže Štravs';
export const phone = '069 678 887';
export const tel = 'tel:+38669678887';
export const whatsapp = 'https://wa.me/38669678887';

export const origin = 'https://izba.kompozitor.si';
/** Page width and side gutters shared by every Izba page. */
export const shell = 'mx-auto max-w-[96rem] px-5 sm:px-10 xl:px-16';
