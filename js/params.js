/**
 * PARAMÈTRES FISCAUX — Revenus 2025 (Déclaration 2026)
 * Sources : BOFiP, brochure IR 2026, service-public.gouv.fr
 */

const PARAMS = {
  // --- BARÈME PROGRESSIF (BOI-IR-LIQ-20-10 du 07/04/2026) ---
  bareme: [
    { limite: 11600,  taux: 0.00 },
    { limite: 29579,  taux: 0.11 },
    { limite: 84577,  taux: 0.30 },
    { limite: 181917, taux: 0.41 },
    { limite: Infinity, taux: 0.45 },
  ],

  // --- QUOTIENT FAMILIAL (BOI-IR-LIQ-20-20-20 du 07/04/2026) ---
  qf: {
    plafondDemiPart:    1807,
    parentIsole1er:     4262,
    parentIsoleDemi:    2131,
    veufPartSupp:       2011,
  },

  // --- DÉCOTE (BOI-IR-LIQ-20-20-30 du 07/04/2026) ---
  decote: {
    plafondCelibataire: 897,
    plafondCouple:      1483,
    seuilCelibataire:   1982,
    seuilCouple:        3277,
    taux:               0.4525,
  },

  // --- ABATTEMENTS ---
  abat: {
    sal:    { taux: 0.10, min: 509,   max: 14555 },
    pen:    { taux: 0.10, min: 454,   maxFoyer: 4439 },
    bncMicro: { taux: 0.34, min: 305 },
    microFoncier: { taux: 0.30, plafond: 15000 },
    meubleClasse:    { taux: 0.50, plafond: 77700 },
    meubleNonClasse: { taux: 0.30, plafond: 15000 },
    dividendes: 0.40,
  },

  // --- PRÉLÈVEMENTS SOCIAUX ---
  ps: {
    mobilier: 0.186,  // dividendes, intérêts, PV mob — CSG 10.6% + CRDS 0.5% + sol. 7.5%
    foncier:  0.172,  // foncier, PV immo, AV — CSG 9.2% + CRDS 0.5% + sol. 7.5%
    pfuIr:    0.128,  // PFU — part IR
    csgDeductible: 0.068,
  },

  // --- NICHES FISCALES ---
  niches: {
    plafond:       10000,
    plafondMajore: 18000,
    girardinPdQuotePart: 0.44,  // rétrocession 56% → 44% dans le plafond (art. 200-0 A, 4° CGI)
    girardinAgQuotePart: 0.34,  // rétrocession 66% → 34% dans le plafond (art. 200-0 A, 4° CGI)
  },

  // --- PLAFONDS RÉDUCTIONS / CRÉDITS ---
  plafonds: {
    dons75Plafond:        2000,
    emploiDomTaux:        0.50,
    emploiDomMax:         12000,
    gardeEnfantsTaux:     0.50,
    gardeEnfantsMax:      3500,
  },
};
