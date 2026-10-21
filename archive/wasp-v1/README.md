# CinemaVerse v1 (Wasp) — archived

This folder holds the first version of CinemaVerse, built on Wasp 0.16 + Prisma
(an Open SaaS template with watchlist, episodes, forum, payments and OpenRouter
experiments). It is **not part of the current build** and is kept only for
reference and history.

The live app moved to a Vite + React SPA with Netlify Functions in June 2026.
The revamp (see the root `README.md`) carries the useful ideas forward —
the `WatchStatus` model, per-user unique watch entries, OpenRouter
recommendations with a fallback — into a Postgres-backed API that runs on
Netlify Functions and locally without Docker.

Nothing here was deleted; files were moved with `git mv`, so `git log --follow`
still shows their full history.
