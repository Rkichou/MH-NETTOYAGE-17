# MH Nettoyage 17

Site Next.js 16 / React / TypeScript : storytelling GSAP ScrollTrigger, scroll Lenis, micro-interactions Motion et demandes de rendez-vous via Resend.

## Installation

```powershell
npm.cmd ci
npm.cmd run dev
```

Le site est disponible sur `http://localhost:3000`.

## Envoi des rendez-vous

Copier `.env.example` vers `.env.local`, puis renseigner les trois variables Resend. L’adresse d’expédition doit utiliser un domaine vérifié. Sans ces variables, le site fonctionne mais l’API affiche un message de configuration lors de l’envoi.

Avant publication, compléter et faire valider l’identité légale, les coordonnées, l’hébergeur et les informations de confidentialité dans `components/footer.tsx`. Les informations non fournies ne sont pas inventées. Les visuels d’illustration ne constituent pas un portfolio ni un avant/après.

Renseigner `SITE_URL` avec l’origine HTTPS publique pour le canonical, le sitemap et les médias sociaux. Configurer HTTPS chez l’hébergeur. Sans les variables Resend, une demande valide reçoit 503 : aucun faux succès. Vérifier un envoi réel après configuration. Le formulaire demande un rendez-vous à confirmer, il ne consulte pas un agenda de disponibilités.

## Limitation des demandes

Le limiteur autorise cinq tentatives par IP sur quinze minutes dans la mémoire d’un processus. `TRUST_PROXY=true` nécessite un proxy qui remplace et sécurise X-Forwarded-For. Sans proxy de confiance, un compteur commun est utilisé pour ne pas accepter une IP falsifiée.

Pour plusieurs instances ou du serverless, utiliser un compteur atomique partagé (Redis, par exemple) ou une protection équivalente à l’entrée du service. Le compteur actuel est perdu au redémarrage. Ne pas activer TRUST_PROXY sur un serveur directement exposé. Les headers ne remplacent pas un audit de sécurité ou une validation juridique.

## Vérification

Node.js 22.13 ou plus récent recommandé. Chrome doit être installé pour les tests.

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e
```

Playwright lance un serveur de production temporaire sur le port 3107. Les tests couvrent cinq viewports, les images, les débordements, les animations réversibles, Motion On/Off, reduced-motion, le clavier, le menu, les modales, la loupe, le formulaire et les refus API. Aucun e-mail réel n’est envoyé : les réponses succès/erreur du formulaire sont simulées et les appels API directs sont invalides.

Les captures sont dans `test-results/`. `TEST_URL` permet de tester un serveur existant ; les tests de limitation nécessitent un compteur neuf.

## Organisation

- `components/site.tsx` : assemblage des sections dans l’ordre du brief.
- `components/motion-provider.tsx` : préférence locale, Lenis et ticker GSAP.
- `hooks/use-scroll-scene.ts` : contexte responsive et nettoyage ScrollTrigger.
- `components/` : hero, services, méthode, expansion, loupe, panneaux et formulaire.
- `app/experience.css` : mise en scène et adaptations responsive.
- `lib/appointments.ts` : validation partagée entre navigateur et serveur.
- `app/api/appointments/route.ts` : validation, anti-spam et Resend.
- `next.config.ts` : CSP et autres headers de sécurité.

Les scènes pinned sont réservées aux grands écrans. Motion Off supprime Lenis, pinning, parallaxe et tilt ; le contenu reste en flux normal. La préférence est mémorisée dans localStorage, avec reduced-motion respecté à l’ouverture. Le logo et les médias fournis sont conservés sans modification.
