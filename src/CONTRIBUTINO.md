# 🤝 Guide de Contribution — OptiStock 3D

Merci de votre intérêt pour **OptiStock 3D** ! Ce document décrit les normes de développement, l'architecture du projet et la procédure pour soumettre des contributions au dépôt.

---

## 📑 Sommaire
1. [Code de Conduite](#1-code-de-conduite)
2. [Stack Technique](#2-stack-technique)
3. [Installation & Démarrage Local](#3-installation--démarrage-local)
4. [Architecture du Projet](#4-architecture-du-projet)
5. [Règles de Développement & Typage](#5-règles-de-développement--typage)
6. [Workflow Git & Branches](#6-workflow-git--branches)
7. [Format des Messages de Commit](#7-format-des-messages-de-commit)
8. [Soumettre une Pull Request (PR)](#8-soumettre-une-pull-request-pr)

---

## 1. Code de Conduite
En participant à ce projet, vous vous engagez à maintenir un environnement respectueux, collaboratif et bienveillant pour l'ensemble des contributeurs.

---

## 2. Stack Technique
Le projet est conçu pour fonctionner en **Single Page Application (SPA)** autonome :

* **Runtime & Build :** [Vite](https://vitejs.dev/) + [Node.js](https://nodejs.org/) (v20+)
* **Frontend :** [React](https://react.dev/) (v18+) avec [TypeScript](https://www.typescriptlang.org/) strict
* **Moteur 3D :** [Three.js](https://threejs.org/) (WebGL 2.0)
* **Design & Styles :** [Tailwind CSS](https://tailwindcss.com/)
* **Gestion Excel :** [SheetJS (xlsx)](https://sheetjs.com/)
* **Iconographie :** [Lucide React](https://lucide.dev/)
* **Stockage :** `localStorage` (Architecture Local-First)
* **Tests :** Runner natif `node:test` + assertions `node:assert/strict`

---

## 3. Installation & Démarrage Local

### Prérequis
* Node.js version 20 ou supérieure.
* Gestionnaire de paquets `npm` (ou `bun`).

### Installation
```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-compte/OptiStock-3D.git
cd OptiStock-3D

# 2. Installer les dépendances
npm install --legacy-peer-deps

# 3. Démarrer le serveur de développement local
npm run dev 