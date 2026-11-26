# Administration

L'espace `/admin` consulte les demandes sans les modifier. Les donnees sont chargees uniquement apres connexion, par pages de 20 (+1 pour detecter la page suivante). Le filtre de statut porte sur toute la collection ; la recherche nom/telephone/email/prestation porte uniquement sur la page courante. Les documents sans `createdAt` ne sont pas retournes par le tri Firestore : verifier les anciens imports avant mise en service.

## Configuration Firebase et Vercel

1. Dans Firebase Authentication, activer Email/Password et la protection contre l'enumeration des emails. Ne pas ajouter d'inscription au site.
2. Dans Authentication > Users, creer le compte administrateur avec un mot de passe fort et copier son UID. Configurer le modele de reinitialisation du mot de passe et les domaines autorises (domaine Vercel et domaine definitif).
3. Installer les dependances avec `npm ci`. Configurer des Application Default Credentials autorisees pour ce projet, idealement avec `gcloud auth application-default login`. Si un fichier de compte de service est necessaire, le stocker HORS du depot et pointer `GOOGLE_APPLICATION_CREDENTIALS` vers ce fichier. Ne jamais placer ces credentials dans les variables `VITE_*`, `NEXT_PUBLIC_*`, le client ou Git.
4. Depuis un poste de confiance, executer `node scripts/admin-role.mjs PROJECT_ID UID grant`. Ce script preserve les autres claims. Verifier le projet et l'UID avant execution. Aucun endpoint public d'attribution de role n'existe.
5. Publier les regles et index : `npx firebase deploy --only firestore:rules,firestore:indexes --project PROJECT_ID`. Attendre la construction de l'index status/createdAt.
6. Conserver les variables Firebase `VITE_FIREBASE_*` existantes dans Vercel, puis redeployer le site. Aucune nouvelle cle serveur n'est necessaire a l'application.
7. Se connecter a `/admin`. Si le role vient de changer, se deconnecter puis se reconnecter.

L'absence de formulaire d'inscription ne suffit pas a empecher des creations de comptes via les API Firebase : un compte sans claim admin reste sans acces aux reservations.

## Session et retrait des droits

Session limitee a l'onglet/session navigateur via browserSessionPersistence. Aucune persistance disque Firestore n'est activee. La deconnexion demonte la liste et son abonnement. Une erreur de permission vide la liste.

Pour retirer le role : `node scripts/admin-role.mjs PROJECT_ID UID revoke`. Cela retire la claim et revoque les jetons de renouvellement. Un jeton ID deja emis peut rester utilisable jusqu'a expiration (environ une heure) ; ceci n'est pas une revocation immediate. Pour une urgence, bloquer temporairement les lectures dans les regles Firestore. Les donnees deja consultees ne peuvent pas etre rappelees a distance.

## Verification locale

`npx firebase emulators:exec --only firestore --project demo-mh-admin "node tests/firestore-rules.mjs"`

Le projet demo isole les tests de la production. Les tests couvrent visiteurs, comptes ordinaires, administrateurs, creation valide/invalide, ajout de role, modification et suppression. Utiliser Java 21 ou superieur avec le CLI Firebase actuel. La premiere verification a aussi ete executee avec le CLI 13 et Java 19.

Executer aussi `npm run build`, puis tester `/admin` sur mobile et ordinateur. En production, verifier connexion, acces refuse avec compte sans role, lecture autorisee, filtre, pagination, details, reinitialisation du mot de passe et deconnexion. Ne jamais utiliser de vraies demandes pour les tests automatises ni envoyer d'emails clients de test.

Reference : https://firebase.google.com/docs/auth/admin/custom-claims
