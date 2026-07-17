// Helpers partagés (formatage des montants, devises et nombres selon la locale).
// Tout montant affiché passe par ces helpers centralisés — jamais d'interpolation
// manuelle. Voir `src/money` pour l'implémentation.
export * from '../money';
export * from './rates';
