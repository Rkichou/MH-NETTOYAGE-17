# MH Nettoyage 17

Site Next.js 16 pour MH Nettoyage 17, avec animations Motion et formulaire de rendez-vous sécurisé.

## Installation

```powershell
npm.cmd install
npm.cmd run dev
```

Le site est disponible sur `http://localhost:3000`.

## Envoi des rendez-vous

Copier `.env.example` vers `.env.local`, puis renseigner les trois variables Resend. L’adresse d’expédition doit utiliser un domaine vérifié. Sans ces variables, le site fonctionne mais l’API affiche un message de configuration lors de l’envoi.

Avant publication, compléter les coordonnées, le SIRET et les mentions légales dans `components/site.tsx`.
