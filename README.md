# Cardbound

Site de collection de cartes, deployable sur Vercel avec une sauvegarde Supabase.

## 1. Creer la base Supabase

1. Creer un projet sur [supabase.com](https://supabase.com).
2. Dans `Authentication > Providers`, activer `Anonymous Sign-Ins`.
3. Dans `SQL Editor`, coller le contenu de `supabase-schema.sql` et l'executer.
4. Dans `Project Settings > API`, copier la `Project URL` et la cle `anon`.
5. Remplacer les deux valeurs dans `supabase-config.js`.

La cle `anon` peut etre exposee dans le navigateur. Ne jamais mettre la `service_role` key dans ce fichier.

## 2. Deployer sur Vercel

1. Pousser le dossier sur GitHub.
2. Dans Vercel, choisir `Add New Project` puis le depot GitHub.
3. Choisir `Other` comme framework, sans commande de build.
4. Cliquer sur `Deploy`.

Vercel servira directement `index.html`. La collection sera sauvegardee par joueur dans Supabase via une session anonyme.