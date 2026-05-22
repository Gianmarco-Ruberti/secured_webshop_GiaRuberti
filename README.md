# Secured Webshop

|Nom|Prénom|Classe|Année|
|---|---|---|---|
|Ruberti|Gianmarco|CID2B|2026|

Projet pédagogique utilisé dans le cadre du cours **183 - Sécurité des applications** (ETML).

Cette application est un serveur web Node.js qui regroupe deux parties : un **backend** (API REST en Express qui communique avec la base de données MySQL) et un **frontend** (pages HTML servies directement par le même serveur). Les pages web appellent l'API via `fetch()` pour afficher et modifier les données.

---

## Démarrer le projet

### 1. Base de données (Docker)

```bash
docker-compose up
```

Lance MySQL sur le port **6033** et phpMyAdmin sur **8081**.
Le script `app/db/init/init.sql` est exécuté automatiquement au premier démarrage.

> **Note :** Si la base existe déjà (volume Docker), supprimer le volume pour réinitialiser :
> ```bash
> docker-compose down -v
> docker-compose up
> ```

### 2. Application Node.js (local)

```bash
cd app
npm install
npm start
```

L'application démarre sur **http://localhost:8080**

---

## Pages disponibles

| URL | Description |
|-----|-------------|
| http://localhost:8080/ | Page d'accueil |
| http://localhost:8080/login | Page de connexion (squelette) |
| http://localhost:8080/register | Page d'inscription (squelette) |
| http://localhost:8080/profile | Gestion du profil (adresse + photo) |
| http://localhost:8080/admin | Administration (liste des utilisateurs) |

---

## API REST

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/register` | Inscription |
| GET | `/api/profile` | Récupérer le profil |
| POST | `/api/profile` | Mettre à jour l'adresse |
| POST | `/api/profile/photo` | Uploader une photo de profil |
| GET | `/api/admin/users` | Liste des utilisateurs (admin) |

---

## Outils

| Service | URL | Identifiants |
|---------|-----|--------------|
| phpMyAdmin | http://localhost:8081 | user: `db_user` / pass: `db_password` |

---

## Comptes de départ

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@webshop.com | admin123 | admin |
| alice@webshop.com | password1 | user |

> ⚠️ Les mots de passe sont stockés en clair — c'est volontaire pour le démarrage du projet.
