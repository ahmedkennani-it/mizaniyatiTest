// Logique métier par domaine. Point d'entrée conventionnel vers les features
// implémentées dans leurs dossiers de domaine respectifs. Les namespaces évitent
// les collisions de noms entre domaines.
export * as categories from '../categories';
export * as transactions from '../transactions';
export * as tontine from '../tontine';
export * as vaults from '../vaults';
export * as zakat from '../zakat';
export * as members from '../members';
export * as recurring from '../recurring';
export * as subscriptions from '../subscriptions';
export * as seasonalThemes from '../seasonalThemes';
