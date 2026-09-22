# MH Nettoyage 17

Site Next.js 16 / React / TypeScript : storytelling GSAP ScrollTrigger, scroll Lenis, micro-interactions Motion et demandes de rendez-vous via Firebase Firestore.

## Hero photographique

La hero reprend la composition editoriale de la reference fournie : grand mot
italique dore, voiture detouree au premier plan et typographie grise en arriere-plan.
`components/hero.tsx` et `app/hero-editorial.css` isolent cette mise en page du reste
du site. Aucun canvas, modele GLB ou module Three.js n'est charge par la hero.
Les anciens fichiers 3D restent dans le depot mais ne sont plus importes par le site.

`public/images/hero-golf-detouree.webp` (1536 x 1024, environ 184 Ko) est une
adaptation retouchee par IA de la photo Golf fournie. Le fichier original est intact.
Next/Image fournit les tailles adaptees et charge la hero en priorite.
Voir `docs/hero-image.md` pour la provenance et le prompt de detourage.

Les apparitions se terminent en moins de deux secondes, sans animation continue.
Motion Off et prefers-reduced-motion desactivent animations et transitions.
`tests/hero-photo.spec.ts` verifie huit formats, le cadrage, les boutons,
les preferences de mouvement et l'absence de chargement de la scene 3D.

## Pourquoi nous choisir

`components/why-choose-us.tsx` ajoute un comparateur apres la presentation de
l'entreprise, accompagne de quatre benefices et d'un lien vers le rendez-vous.
Les paires Audi (habitacle passager) et BMW (coffre) utilisent les photos fournies,
sans retouche ni generation. Les angles differents sont signales sous les images.
Les photographies ne sont pas alignees artificiellement.

Le scroll deplace le separateur avec GSAP ; toute action sur le curseur ou les
boutons donne ensuite la priorite au controle manuel. Le slider natif fonctionne
au clavier et au toucher. Les onglets acceptent les fleches, Home et End.
Motion Off / reduced-motion desactive l'animation automatique sans desactiver
la comparaison. Les images sont optimisees par Next/Image et chargees a la demande.
Les tests dedies sont dans `tests/why-choose-us.spec.ts`.

## Galerie

`components/gallery.tsx` et `app/gallery.css` ajoutent un carrousel en eventail
apres les services. Les huit photos proviennent de `public/images`, sans retouche.
Les categories filtrent la selection ; les fleches, les points et le balayage
tactile permettent de naviguer. La photo centrale ouvre une visionneuse native
avec navigation au clavier, fermeture Echap et retour du focus.

Next/Image sert des images redimensionnees et chargees a la demande. Le reveal
GSAP est nettoye au changement de categorie ; Motion Off et reduced-motion
suppriment le reveal, les transitions et le zoom au survol. Aucun defilement
automatique ni blocage du scroll mobile. `tests/gallery.spec.ts` couvre sept
formats, les filtres, le clavier, la visionneuse, le toucher et les animations.

## Lancement local

```powershell
npm.cmd ci
npm.cmd run dev
```

Le site est disponible sur `http://localhost:3000`.

## Envoi des rendez-vous

Le formulaire enregistre les demandes directement dans Firestore, collection `reservations`, sans API route ni backend Node/Express. Copier `.env.example` vers `.env.local`, puis renseigner les variables Firebase `VITE_FIREBASE_*`.

Avant publication, compléter et faire valider l’identité légale, les coordonnées, l’hébergeur et les informations de confidentialité dans `components/footer.tsx`. Les informations non fournies ne sont pas inventées. Les visuels d’illustration ne constituent pas un portfolio ni un avant/après.

Dans Vercel, ajouter ces variables dans `Project Settings` > `Environment Variables` pour `Production`, et aussi `Preview` si les branches de preview doivent envoyer de vraies demandes. Redéployer après ajout des variables.

Publier les règles `firestore.rules` dans Firebase Console > Firestore Database > Rules. Elles autorisent uniquement la création de documents `reservations`, interdisent la lecture publique, la modification et la suppression. Pour une protection plus forte contre les abus, activer Firebase App Check sur le domaine de production.

Renseigner `SITE_URL` avec l’origine HTTPS publique pour le canonical, le sitemap et les médias sociaux. Configurer HTTPS chez l’hébergeur. Vérifier un envoi réel après configuration Firebase. Le formulaire demande un rendez-vous à confirmer, il ne consulte pas un agenda de disponibilités.

## Sécurité Firestore

`firestore.rules` valide les champs attendus, impose `status: "pending"` et `createdAt: request.time`, puis bloque toute lecture, modification et suppression publiques. Le formulaire garde aussi la validation côté client, le honeypot invisible et un délai minimal avant envoi pour limiter le spam basique. Les règles Firestore ne remplacent pas un audit de sécurité ou une validation juridique.

## Vérification

Node.js 22.13 ou plus récent recommandé. Chrome doit être installé pour les tests.

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e
```

Playwright lance un serveur de production temporaire sur le port 3107. Les tests couvrent cinq viewports, les images, les débordements, les animations réversibles, Motion On/Off, reduced-motion, le clavier, le menu, les modales, la loupe et le formulaire. Vérifier un envoi Firestore réel avec les variables Firebase configurées.

Les captures sont dans `test-results/`. `TEST_URL` permet de tester un serveur existant ; les tests de limitation nécessitent un compteur neuf.

## Organisation

- `components/site.tsx` : assemblage des sections dans l’ordre du brief.
- `components/motion-provider.tsx` : préférence locale, Lenis et ticker GSAP.
- `hooks/use-scroll-scene.ts` : contexte responsive et nettoyage ScrollTrigger.
- `components/` : hero, services, méthode, expansion, loupe, panneaux et formulaire.
- `app/experience.css` : mise en scène et adaptations responsive.
- `lib/appointments.ts` : validation du formulaire côté navigateur.
- `lib/firebase.ts` et `lib/reservations.ts` : configuration Firebase et création Firestore.
- `firestore.rules` : règles minimales de création des réservations.
- `next.config.ts` : CSP et autres headers de sécurité.

Les scènes pinned sont réservées aux grands écrans. Motion Off supprime Lenis, pinning, parallaxe et tilt ; le contenu reste en flux normal. La préférence est mémorisée dans localStorage, avec reduced-motion respecté à l’ouverture. Le logo et les médias fournis sont conservés sans modification. Les photos réelles du dossier `public/images` remplacent les visuels génériques dans les sections du site ; les visuels génériques inutilisés restent dans le dossier pour référence.
