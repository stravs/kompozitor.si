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
