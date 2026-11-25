// Oznaka "18+ · Igraj odgovorno" (novogodišnja tema): u podnožju kalendara i pop-upa.
// RESPONSIBLE_GAMING_URL: stranica o odgovornom igranju na meridianbet.rs — dok je null,
// prikazuje se samo oznaka bez linka.
export const RESPONSIBLE_GAMING_URL = null;

export function responsibleGamingHtml() {
  const text = RESPONSIBLE_GAMING_URL
    ? `<a href="${RESPONSIBLE_GAMING_URL}" target="_blank" rel="noopener noreferrer">Igraj odgovorno</a>`
    : "Igraj odgovorno";
  return `<div class="ny-rg"><span class="ny-rg__badge" aria-label="Samo za punoletne">18+</span>${text}</div>`;
}
