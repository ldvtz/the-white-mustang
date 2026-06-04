export interface RentalAgreementData {
  bookingId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAge: number | null
  startDate: string
  endDate: string
  totalPrice: number
  locale: string
  companyName: string
  companyAddress: string
  jurisdiction: string
  vehiclePlate: string
  vehicleVin: string
  depositChf: number
  selfRetentionChf: number
  includedKmPerDay: number
  extraKmChf: number
  minAge: number
  minLicenseYears: number
}

export type AgreementBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'li'; text: string }
  | { kind: 'kv'; label: string; value: string }
  | { kind: 'field'; label: string; name: string; width?: number }
  | { kind: 'spacer'; height: number }

function chf(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-CH' : 'de-CH', {
    style: 'currency',
    currency: 'CHF',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

function date(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-CH', { dateStyle: 'long' }).format(
    new Date(`${value}T00:00:00`),
  )
}

export function rentalAgreementTitle(locale: string): string {
  return locale === 'en'
    ? 'Rental Agreement — The White Mustang'
    : 'Mietvertrag — The White Mustang'
}

/**
 * Builds the ordered content blocks of the rental agreement, with all known
 * booking data pre-filled and customer-fillable AcroForm fields declared via
 * `kind: 'field'`.
 */
export function buildRentalAgreementBlocks(data: RentalAgreementData): AgreementBlock[] {
  return data.locale === 'en' ? buildEn(data) : buildDe(data)
}

function buildDe(d: RentalAgreementData): AgreementBlock[] {
  const deposit = chf(d.depositChf, d.locale)
  const retention = chf(d.selfRetentionChf, d.locale)
  const extraKm = chf(d.extraKmChf, d.locale)
  return [
    { kind: 'title', text: 'Mietvertrag — The White Mustang' },
    { kind: 'subtitle', text: `Selbstfahrer-Mietvertrag · Ford Mustang GT 5.0 V8 Cabriolet · Ref. ${d.bookingId}` },

    { kind: 'h2', text: 'Vertragsparteien' },
    { kind: 'kv', label: 'Vermieter', value: `${d.companyName}, ${d.companyAddress}` },
    { kind: 'kv', label: 'Mieter', value: d.customerName },
    { kind: 'kv', label: 'E-Mail', value: d.customerEmail },
    { kind: 'kv', label: 'Telefon', value: d.customerPhone },
    { kind: 'kv', label: 'Alter', value: d.customerAge ? `${d.customerAge} Jahre` : '—' },
    { kind: 'field', label: 'Adresse des Mieters', name: 'mieter_adresse' },
    { kind: 'field', label: 'Geburtsdatum', name: 'mieter_geburtsdatum', width: 220 },
    { kind: 'field', label: 'Führerausweis-Nr. / Kategorie', name: 'mieter_ausweis', width: 260 },
    { kind: 'field', label: 'Ausstellungsdatum Führerausweis', name: 'mieter_ausweis_datum', width: 220 },

    { kind: 'h2', text: '§ 1 Mietgegenstand' },
    { kind: 'kv', label: 'Fahrzeug', value: 'Ford Mustang GT 5.0 V8 Cabriolet, Alpine White' },
    { kind: 'kv', label: 'Kennzeichen', value: d.vehiclePlate },
    { kind: 'kv', label: 'Fahrgestellnummer (FIN)', value: d.vehicleVin },
    { kind: 'field', label: 'Kilometerstand bei Übergabe', name: 'km_uebergabe', width: 180 },
    { kind: 'p', text: 'Das Fahrzeug wird in technisch einwandfreiem, sauberem und vollgetanktem Zustand übergeben. Vorschäden werden im Übergabeprotokoll festgehalten.' },

    { kind: 'h2', text: '§ 2 Mietdauer, Abholung und Rückgabe' },
    { kind: 'kv', label: 'Mietbeginn', value: date(d.startDate, d.locale) },
    { kind: 'kv', label: 'Mietende', value: date(d.endDate, d.locale) },
    { kind: 'p', text: 'Die Rückgabe erfolgt zur vereinbarten Zeit am vereinbarten Ort, vollgetankt und im übergebenen Zustand. Eine stillschweigende Verlängerung ist ausgeschlossen.' },

    { kind: 'h2', text: '§ 3 Mietpreis und Zahlung' },
    { kind: 'kv', label: 'Mietpreis (inkl. MwSt.)', value: chf(d.totalPrice, d.locale) },
    { kind: 'p', text: 'Inbegriffen sind Versicherung (§ 8), MwSt. und Freikilometer (§ 5). Nicht inbegriffen sind Treibstoff, Mehrkilometer, Bussen und optionale Zusatzleistungen. Zur definitiven Reservierung ist der Mietbetrag im Voraus per TWINT, Banküberweisung oder bar zu leisten.' },

    { kind: 'h2', text: '§ 4 Kaution und Selbstbehalt' },
    { kind: 'p', text: `Kaution: ${deposit} (per TWINT, Kreditkarte oder bar bei Übergabe). Selbstbehalt: ${retention} pro Schadenereignis. Die Kaution wird nach mängelfreier Rückgabe vollständig zurückerstattet; Mehrkilometer, fehlender Treibstoff, Reinigungs-/Schadenskosten, Bussen und Gebühren können verrechnet werden.` },

    { kind: 'h2', text: '§ 5 Kilometer' },
    { kind: 'p', text: `Im Mietpreis enthalten sind ${d.includedKmPerDay} km pro Miettag. Mehrkilometer werden mit ${extraKm} pro Kilometer verrechnet. Massgebend ist der im Übergabe- und Rücknahmeprotokoll festgehaltene Kilometerstand.` },

    { kind: 'h2', text: '§ 6 Treibstoff' },
    { kind: 'p', text: 'Das Fahrzeug fährt mit bleifreiem Benzin (mind. 95 ROZ, empfohlen 98 ROZ). Es gilt das «Voll-zu-Voll»-Prinzip. Fehlender Treibstoff wird zuzüglich Servicepauschale verrechnet.' },

    { kind: 'h2', text: '§ 7 Nutzung des Fahrzeugs' },
    { kind: 'li', text: 'Das Fahrzeug ist pfleglich, vorschriftsgemäss und schonend zu behandeln.' },
    { kind: 'li', text: 'Im Fahrzeug darf nicht geraucht werden; Tiere nur mit vorgängiger Zustimmung.' },
    { kind: 'li', text: 'Untersagt sind Rennen/Track-Days, Unter-/Weitervermietung sowie das Führen unter Alkohol-, Drogen- oder Medikamenteneinfluss.' },
    { kind: 'li', text: 'Fahrten ins Ausland nur mit vorgängiger schriftlicher Zustimmung des Vermieters.' },
    { kind: 'li', text: 'Bussen und Gebühren gehen vollständig zulasten des Mieters.' },

    { kind: 'h2', text: '§ 8 Fahrerkreis und Versicherung' },
    { kind: 'p', text: `Berechtigt sind nur Personen ab ${d.minAge} Jahren, die seit mindestens ${d.minLicenseYears} Jahren einen gültigen Führerausweis Kat. B besitzen. Das Fahrzeug ist haftpflicht- und vollkaskoversichert (inkl. Mietzusatz). Bei Grobfahrlässigkeit, Vorsatz oder Verstoss gegen §§ 7/8 entfällt die Haftungsbegrenzung und der Mieter haftet für den gesamten Schaden samt Folgekosten.` },

    { kind: 'h2', text: '§ 9 Schäden, Panne und Unfall' },
    { kind: 'p', text: 'Jeder Schaden, Defekt, Diebstahl oder Unfall ist unverzüglich zu melden. Bei Unfällen ist stets die Polizei beizuziehen. Der Mieter unterlässt jede Anerkennung von Ansprüchen Dritter und übermittelt umgehend einen vollständigen Bericht.' },

    { kind: 'h2', text: '§ 10 Übergabe / Rücknahme und verspätete Rückgabe' },
    { kind: 'p', text: 'Zustand, Tankfüllung und Kilometerstand werden bei Übergabe und Rücknahme protokolliert. Bei verspäteter Rückgabe wird je angefangene Stunde CHF 30 zuzüglich Mehrkilometer verrechnet.' },

    { kind: 'h2', text: '§ 11 Stornierung' },
    { kind: 'p', text: 'Bei Stornierung durch den Mieter sind geschuldet: > 14 Tage 25 %, 7–14 Tage 50 %, 3–6 Tage 70 %, 0–2 Tage / No-Show 100 % des Mietpreises. Witterung ist kein Stornierungs- oder Rückerstattungsgrund.' },

    { kind: 'h2', text: '§ 12 Datenschutz und Schlussbestimmungen' },
    { kind: 'p', text: `Die Datenbearbeitung richtet sich nach der Datenschutzerklärung des Vermieters (revDSG). Änderungen bedürfen der Schriftform. Es gilt Schweizer Recht; Gerichtsstand ist ${d.jurisdiction}, Schweiz.` },

    { kind: 'spacer', height: 14 },
    { kind: 'h2', text: 'Unterschriften' },
    { kind: 'field', label: 'Ort, Datum', name: 'sig_ort_datum', width: 260 },
    { kind: 'field', label: 'Unterschrift Mieter', name: 'sig_mieter', width: 260 },
    { kind: 'p', text: 'Mit der Unterschrift bestätigt der Mieter, diese Vereinbarung gelesen und akzeptiert zu haben.' },
  ]
}

function buildEn(d: RentalAgreementData): AgreementBlock[] {
  const deposit = chf(d.depositChf, d.locale)
  const retention = chf(d.selfRetentionChf, d.locale)
  const extraKm = chf(d.extraKmChf, d.locale)
  return [
    { kind: 'title', text: 'Rental Agreement — The White Mustang' },
    { kind: 'subtitle', text: `Self-drive rental · Ford Mustang GT 5.0 V8 Convertible · Ref. ${d.bookingId}` },

    { kind: 'h2', text: 'Parties' },
    { kind: 'kv', label: 'Lessor', value: `${d.companyName}, ${d.companyAddress}` },
    { kind: 'kv', label: 'Renter', value: d.customerName },
    { kind: 'kv', label: 'Email', value: d.customerEmail },
    { kind: 'kv', label: 'Phone', value: d.customerPhone },
    { kind: 'kv', label: 'Age', value: d.customerAge ? `${d.customerAge} years` : '—' },
    { kind: 'field', label: 'Renter address', name: 'mieter_adresse' },
    { kind: 'field', label: 'Date of birth', name: 'mieter_geburtsdatum', width: 220 },
    { kind: 'field', label: 'Driving licence no. / category', name: 'mieter_ausweis', width: 260 },
    { kind: 'field', label: 'Licence issue date', name: 'mieter_ausweis_datum', width: 220 },

    { kind: 'h2', text: '§ 1 Rental Object' },
    { kind: 'kv', label: 'Vehicle', value: 'Ford Mustang GT 5.0 V8 Convertible, Alpine White' },
    { kind: 'kv', label: 'Plate', value: d.vehiclePlate },
    { kind: 'kv', label: 'VIN', value: d.vehicleVin },
    { kind: 'field', label: 'Mileage at handover', name: 'km_uebergabe', width: 180 },
    { kind: 'p', text: 'The vehicle is handed over in technically sound, clean and fully fuelled condition. Pre-existing damage is recorded in the handover protocol.' },

    { kind: 'h2', text: '§ 2 Rental Period, Pick-up and Return' },
    { kind: 'kv', label: 'Start', value: date(d.startDate, d.locale) },
    { kind: 'kv', label: 'End', value: date(d.endDate, d.locale) },
    { kind: 'p', text: 'The vehicle is returned at the agreed time and place, fully fuelled and in the condition handed over. Automatic extension is excluded.' },

    { kind: 'h2', text: '§ 3 Price and Payment' },
    { kind: 'kv', label: 'Rental price (incl. VAT)', value: chf(d.totalPrice, d.locale) },
    { kind: 'p', text: 'Included are insurance (§ 8), VAT and free kilometres (§ 5). Fuel, extra kilometres, fines and optional services are excluded. To finalise the reservation, the rental amount is payable in advance by TWINT, bank transfer or cash.' },

    { kind: 'h2', text: '§ 4 Deposit and Excess' },
    { kind: 'p', text: `Deposit: ${deposit} (by TWINT, credit card or cash at handover). Excess: ${retention} per damage event. The deposit is refunded in full after a fault-free return; extra kilometres, missing fuel, cleaning/damage costs, fines and fees may be offset.` },

    { kind: 'h2', text: '§ 5 Kilometres' },
    { kind: 'p', text: `${d.includedKmPerDay} km per rental day are included. Additional kilometres are charged at ${extraKm} per kilometre, based on the mileage recorded in the handover and return protocol.` },

    { kind: 'h2', text: '§ 6 Fuel' },
    { kind: 'p', text: 'The vehicle runs on unleaded petrol (min. 95 RON, 98 RON recommended). A full-to-full policy applies. Missing fuel is charged plus a service fee.' },

    { kind: 'h2', text: '§ 7 Use of the Vehicle' },
    { kind: 'li', text: 'The vehicle must be treated with care and used in accordance with regulations.' },
    { kind: 'li', text: 'Smoking is not permitted; animals only with prior consent.' },
    { kind: 'li', text: 'Races/track days, sub-letting and driving under the influence of alcohol, drugs or medication are prohibited.' },
    { kind: 'li', text: 'Trips abroad only with prior written consent of the lessor.' },
    { kind: 'li', text: 'Fines and fees are borne entirely by the renter.' },

    { kind: 'h2', text: '§ 8 Eligible Drivers and Insurance' },
    { kind: 'p', text: `Only persons aged ${d.minAge}+ who have held a valid category B licence for at least ${d.minLicenseYears} years are eligible. The vehicle is covered by liability and fully comprehensive insurance (incl. rental add-on). In cases of gross negligence, intent or breach of §§ 7/8, the limitation of liability lapses and the renter is liable for the entire damage including consequential costs.` },

    { kind: 'h2', text: '§ 9 Damage, Breakdown and Accident' },
    { kind: 'p', text: 'Any damage, defect, theft or accident must be reported immediately. In the event of an accident, the police must always be called. The renter refrains from acknowledging third-party claims and promptly submits a full report.' },

    { kind: 'h2', text: '§ 10 Handover / Return and Late Return' },
    { kind: 'p', text: 'Condition, fuel level and mileage are recorded at handover and return. For late return, CHF 30 per started hour plus extra kilometres is charged.' },

    { kind: 'h2', text: '§ 11 Cancellation' },
    { kind: 'p', text: 'On cancellation by the renter the following is due: > 14 days 25 %, 7–14 days 50 %, 3–6 days 70 %, 0–2 days / no-show 100 % of the rental price. Weather is not grounds for cancellation or refund.' },

    { kind: 'h2', text: '§ 12 Data Protection and Final Provisions' },
    { kind: 'p', text: `Data processing follows the lessor's privacy policy (revFADP). Amendments require written form. Swiss law applies; place of jurisdiction is ${d.jurisdiction}, Switzerland.` },

    { kind: 'spacer', height: 14 },
    { kind: 'h2', text: 'Signatures' },
    { kind: 'field', label: 'Place, date', name: 'sig_ort_datum', width: 260 },
    { kind: 'field', label: 'Renter signature', name: 'sig_mieter', width: 260 },
    { kind: 'p', text: 'By signing, the renter confirms having read and accepted this agreement.' },
  ]
}
