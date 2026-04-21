/**
 * MOTEUR DE CALCUL IR — Revenus 2025 (Déclaration 2026)
 */

/**
 * Calcule l'impôt selon le barème progressif pour un revenu par part donné.
 * @param {number} qf - Quotient familial (revenu / nombre de parts)
 * @returns {number} Impôt par part
 */
function calcBaremePart(qf) {
  let impot = 0;
  let borneInf = 0;
  for (const tranche of PARAMS.bareme) {
    if (qf <= borneInf) break;
    const base = Math.min(qf, tranche.limite) - borneInf;
    impot += base * tranche.taux;
    borneInf = tranche.limite;
  }
  return impot;
}

/**
 * Calcule le nombre de parts fiscales.
 */
function calcParts(situation, nbEnfants, gardeAlternee, parentIsole) {
  // Parts de base
  let partsBase = (situation === 'marie-pacse') ? 2 : 1;
  // Veuf avec enfants = 2 parts de base
  if (situation === 'veuf' && nbEnfants > 0) partsBase = 2;

  // Parts supplémentaires enfants
  let partsEnfants = 0;
  if (nbEnfants <= 2) {
    partsEnfants = nbEnfants * 0.5;
  } else {
    partsEnfants = 1 + (nbEnfants - 2); // 0.5+0.5 pour les 2 premiers, puis 1 par enfant
  }

  // Garde alternée
  let partsAlternee = 0;
  if (gardeAlternee <= 2) {
    partsAlternee = gardeAlternee * 0.25;
  } else {
    partsAlternee = 0.5 + (gardeAlternee - 2) * 0.5;
  }

  // Parent isolé
  const partsPI = parentIsole ? 0.5 : 0;

  return {
    total: partsBase + partsEnfants + partsAlternee + partsPI,
    base: partsBase,
  };
}

/**
 * Calcul complet de l'IR.
 * @param {Object} input - Toutes les données saisies
 * @returns {Object} Détail complet du calcul
 */
function calculerIR(input) {
  const P = PARAMS;
  const det = {}; // détail du calcul (pour l'onglet calcul détaillé)

  // ============================================================
  // ÉTAPE 1 : REVENU BRUT GLOBAL
  // ============================================================

  // Salaires (avec protection si = 0)
  const abatSal1 = input.sal1 > 0
    ? Math.max(P.abat.sal.min, Math.min(input.sal1 * P.abat.sal.taux, P.abat.sal.max))
    : 0;
  const abatSal2 = input.sal2 > 0
    ? Math.max(P.abat.sal.min, Math.min(input.sal2 * P.abat.sal.taux, P.abat.sal.max))
    : 0;
  det.salaireNet = (input.sal1 - abatSal1) + (input.sal2 - abatSal2);

  // Pensions
  const abatPen1 = input.pen1 > 0
    ? Math.max(P.abat.pen.min, input.pen1 * P.abat.pen.taux)
    : 0;
  const abatPen2 = input.pen2 > 0
    ? Math.max(P.abat.pen.min, input.pen2 * P.abat.pen.taux)
    : 0;
  const abatPenTotal = Math.min(P.abat.pen.maxFoyer, abatPen1 + abatPen2);
  det.pensionNet = (input.pen1 + input.pen2) - abatPenTotal;

  // BNC micro
  const abatBNC1 = input.bncMicro1 > 0
    ? Math.max(P.abat.bncMicro.min, input.bncMicro1 * P.abat.bncMicro.taux)
    : 0;
  const abatBNC2 = input.bncMicro2 > 0
    ? Math.max(P.abat.bncMicro.min, input.bncMicro2 * P.abat.bncMicro.taux)
    : 0;
  det.bncMicroNet = (input.bncMicro1 - abatBNC1) + (input.bncMicro2 - abatBNC2);

  // BNC réel
  det.bncReel = input.bncReel1 + input.bncReel2;

  // Foncier
  det.microFoncierNet = input.microFoncier * (1 - P.abat.microFoncier.taux);
  det.foncierReel = input.foncierReel;

  // Meublé
  det.meubleClasseNet = input.meubleClasse * (1 - P.abat.meubleClasse.taux);
  det.meubleNonClasseNet = input.meubleNonClasse * (1 - P.abat.meubleNonClasse.taux);

  // Mobilier selon option
  const isPFU = input.optionPFU === 'pfu';
  det.dividendesBareme = isPFU ? 0 : input.dividendes * (1 - P.abat.dividendes);
  det.pvBareme = isPFU ? 0 : input.pv;

  // Autres
  det.autresRevenus = input.autresRevenus;

  det.revenuBrutGlobal = det.salaireNet + det.pensionNet + det.bncMicroNet + det.bncReel
    + det.microFoncierNet + det.foncierReel
    + det.meubleClasseNet + det.meubleNonClasseNet
    + det.dividendesBareme + det.pvBareme
    + det.autresRevenus;

  // ============================================================
  // ÉTAPE 2 : REVENU NET IMPOSABLE
  // ============================================================
  det.per = input.per;
  det.pensionsAlim = input.pensionsAlim;
  det.csgDeductible = input.csgDeductible;
  det.autresCharges = input.autresCharges;

  det.revenuNetImposable = Math.max(0,
    det.revenuBrutGlobal - det.per - det.pensionsAlim - det.csgDeductible - det.autresCharges
  );

  // ============================================================
  // ÉTAPE 3 : QUOTIENT FAMILIAL ET BARÈME
  // ============================================================
  const parts = calcParts(input.situation, input.nbEnfants, input.gardeAlternee, input.parentIsole);
  det.parts = parts.total;
  det.partsBase = parts.base;

  det.quotientFamilial = parts.total > 0 ? det.revenuNetImposable / parts.total : 0;
  det.impotParPart = calcBaremePart(det.quotientFamilial);
  det.impotBrut = Math.round(det.impotParPart * parts.total);

  // ============================================================
  // ÉTAPE 4 : PLAFONNEMENT DU QUOTIENT FAMILIAL
  // ============================================================
  det.qfBase = parts.base > 0 ? det.revenuNetImposable / parts.base : 0;
  det.impotParPartBase = calcBaremePart(det.qfBase);
  det.impotBrutBase = Math.round(det.impotParPartBase * parts.base);

  det.avantageQF = det.impotBrutBase - det.impotBrut;
  det.demiPartsSupp = (parts.total - parts.base) * 2;

  if (input.parentIsole && input.nbEnfants > 0) {
    det.plafondQF = P.qf.parentIsole1er + Math.max(0, det.demiPartsSupp - 2) * P.qf.plafondDemiPart;
  } else {
    det.plafondQF = det.demiPartsSupp * P.qf.plafondDemiPart;
  }

  det.supplementQF = Math.max(0, det.avantageQF - det.plafondQF);
  det.impotApresQF = det.impotBrut + det.supplementQF;

  // ============================================================
  // ÉTAPE 5 : DÉCOTE
  // ============================================================
  const isCouple = input.situation === 'marie-pacse';
  const seuilDecote = isCouple ? P.decote.seuilCouple : P.decote.seuilCelibataire;
  const plafondDecote = isCouple ? P.decote.plafondCouple : P.decote.plafondCelibataire;

  det.seuilDecote = seuilDecote;
  det.decote = det.impotApresQF < seuilDecote
    ? Math.max(0, plafondDecote - det.impotApresQF * P.decote.taux)
    : 0;
  det.impotApresDecote = Math.max(0, det.impotApresQF - det.decote);

  // ============================================================
  // ÉTAPE 6 : IR MOBILIER (PFU)
  // ============================================================
  det.irMobilier = isPFU ? (input.dividendes + input.pv) * P.ps.pfuIr : 0;

  // ============================================================
  // ÉTAPE 7 : PRÉLÈVEMENTS SOCIAUX
  // ============================================================
  det.psMobilier = (input.dividendes + input.pv) * P.ps.mobilier;
  const revenusFonciersNets = det.microFoncierNet + det.foncierReel + det.meubleClasseNet + det.meubleNonClasseNet;
  det.psFoncier = revenusFonciersNets * P.ps.foncier;
  det.totalPS = det.psMobilier + det.psFoncier;

  // ============================================================
  // ÉTAPE 8 : RÉDUCTIONS D'IMPÔT
  // ============================================================
  // Dons (HORS niche)
  det.redDons = Math.min(input.dons, P.plafonds.dons75Plafond) * 0.75
    + Math.max(0, input.dons - P.plafonds.dons75Plafond) * 0.66;

  // Réductions dans le plafond niches
  det.redPinel       = input.pinel;
  det.redGirardinPD  = input.girardinPD;
  det.redGirardinAG  = input.girardinAG;
  det.redFCPI        = input.fcpi;
  det.redSofica      = input.sofica;
  det.redAutres      = input.autresReductions;

  det.totalReductions = det.redDons + det.redPinel + det.redGirardinPD + det.redGirardinAG
    + det.redFCPI + det.redSofica + det.redAutres;

  // ============================================================
  // ÉTAPE 9 : CRÉDITS D'IMPÔT
  // ============================================================
  det.credDomicile = Math.min(input.emploiDomicile, P.plafonds.emploiDomMax) * P.plafonds.emploiDomTaux;
  det.credGarde    = Math.min(input.gardeEnfants, P.plafonds.gardeEnfantsMax) * P.plafonds.gardeEnfantsTaux;
  det.credAutres   = input.autresCredits;

  det.totalCredits = det.credDomicile + det.credGarde + det.credAutres;

  // ============================================================
  // ÉTAPE 10 : PLAFONNEMENT DES NICHES FISCALES
  // ============================================================
  det.nichesUtilisees = det.redPinel
    + det.redGirardinPD * P.niches.girardinPdQuotePart
    + det.redGirardinAG * P.niches.girardinAgQuotePart
    + det.redFCPI + det.redSofica + det.redAutres
    + det.credDomicile + det.credGarde + det.credAutres;

  const hasPlafondMajore = det.redGirardinPD > 0 || det.redGirardinAG > 0 || det.redSofica > 0;
  det.plafondNiches = hasPlafondMajore ? P.niches.plafondMajore : P.niches.plafond;
  det.depassementNiches = Math.max(0, det.nichesUtilisees - det.plafondNiches);

  // ============================================================
  // ÉTAPE 11 : IMPÔT NET FINAL
  // ============================================================
  // Application des réductions avec plafonnement niches
  const reductionsDansNiches = det.totalReductions - det.redDons;
  let reductionsDansNichesEffectives;
  if (det.depassementNiches > 0 && det.nichesUtilisees > 0) {
    reductionsDansNichesEffectives = det.plafondNiches
      * reductionsDansNiches / det.nichesUtilisees;
  } else {
    reductionsDansNichesEffectives = reductionsDansNiches;
  }
  det.reductionsAppliquees = Math.min(
    det.impotApresDecote + det.irMobilier,
    det.redDons + reductionsDansNichesEffectives
  );

  // Application des crédits avec plafonnement niches
  let creditsEffectifs;
  if (det.depassementNiches > 0 && det.nichesUtilisees > 0) {
    creditsEffectifs = det.plafondNiches * det.totalCredits / det.nichesUtilisees;
  } else {
    creditsEffectifs = det.totalCredits;
  }
  det.creditsAppliques = creditsEffectifs;

  det.impotNet = Math.max(0,
    det.impotApresDecote + det.irMobilier - det.reductionsAppliquees
  ) - det.creditsAppliques + det.totalPS;

  // Revenu de référence = somme des revenus bruts déclarés (avant abattements) moins les charges
  // C'est ce que l'administration utilise pour calculer le taux moyen affiché
  det.revenuReference = Math.max(0,
    input.sal1 + input.sal2
    + input.pen1 + input.pen2
    + input.bncMicro1 + input.bncMicro2
    + input.bncReel1 + input.bncReel2
    + input.microFoncier + input.foncierReel
    + input.meubleClasse + input.meubleNonClasse
    + input.dividendes + input.pv
    + input.autresRevenus
    - input.per - input.pensionsAlim - input.csgDeductible - input.autresCharges
  );

  det.tauxMoyen = det.revenuReference > 0
    ? det.impotNet / det.revenuReference
    : 0;

  // TMI : quand le plafonnement QF est actif (supplementQF > 0), le taux marginal
  // est déterminé par le QF de base (sans les demi-parts supplémentaires), car
  // d(impôt_final)/d(RNI) = d(impôt_base)/d(RNI) = taux_barème(QF_base)
  const qfTMI = det.supplementQF > 0 ? det.qfBase : det.quotientFamilial;
  let prevLimite = 0;
  det.tmi = 0;
  for (const t of PARAMS.bareme) {
    if (qfTMI > prevLimite) det.tmi = t.taux;
    prevLimite = t.limite;
    if (qfTMI <= t.limite) break;
  }

  return det;
}
