# Rapport d'Implémentation - Sécurité du WebShop
---

## Table des matières

1. [Page de Login en Frontend](#1-page-de-login-en-frontend)
2. [Page d'Inscription en Frontend](#2-page-dinscription-en-frontend)
3. [Hash des Mots de Passe](#3-remplacer-les-mots-de-passe-en-clair-par-un-hash)
4. [Ajout d'un Sel (Salt)](#4-ajouter-un-sel)
5. [Ajout d'un Poivre (Pepper)](#5-ajouter-un-poivre)
6. [Prévention de l'Injection SQL](#6-corriger-les-requêtes-pour-prévenir-linjection-sql)
7. [Token JWT](#7-implémenter-lutilisation-dun-token-jwt)
8. [Rôles et Protection des Routes Admin](#8-ajouter-les-rôles-et-protéger-les-routes-admin)
9. [HTTPS](#9-mettre-en-place-le-https)

---

## 1. Page de Login en Frontend

### Description
Une page de connexion (`login.html`) permet aux utilisateurs de s'authentifier avec leur email et mot de passe.

### Fichiers impliqués
- **Frontend** : `app/views/login.html`
- **Backend API** : `POST /api/auth/login`
- **Controller** : `app/controllers/AuthController.js`

### Implémentation

#### Frontend (login.html)
```html
<form id="loginForm">
    <input type="email" name="email" placeholder="Email" required>
    <input type="password" name="password" placeholder="Mot de passe" required>
    <button type="submit">Se connecter</button>
</form>

<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem('token', data.token);
        window.location.href = '/';
    } else {
        alert(data.error);
    }
});
</script>
```

#### Backend (AuthController.js - login)
- Récupère l'email et le mot de passe du corps de la requête
- Utilise une **requête paramétrée** pour éviter l'injection SQL
- Compare le mot de passe fourni avec le hash stocké en base
- Génère un **JWT** si la comparaison est valide
- Retourne le token au frontend

**Avantages** :
- Sécurisé (requête paramétrée)
- Token JWT pour les sessions
- Mots de passe jamais transmis en clair

---

## 2. Page d'Inscription en Frontend

### Description
Une page d'inscription (`register.html`) permet aux nouveaux utilisateurs de créer un compte.

### Fichiers impliqués
- **Frontend** : `app/views/register.html`
- **Backend API** : `POST /api/auth/register`
- **Controller** : `app/controllers/AuthController.js`

### Implémentation

#### Frontend (register.html)
```html
<form id="registerForm">
    <input type="text" name="username" placeholder="Nom d'utilisateur" required>
    <input type="email" name="email" placeholder="Email" required>
    <input type="password" name="password" placeholder="Mot de passe" required>
    <input type="password" name="passwordConfirm" placeholder="Confirmer le mot de passe" required>
    <input type="text" name="address" placeholder="Adresse (optionnel)">
    <button type="submit">S'inscrire</button>
</form>

<script>
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok) {
        localStorage.setItem('token', result.token);
        window.location.href = '/';
    } else {
        alert(result.error);
    }
});
</script>
```

#### Backend (AuthController.js - register)
- Valide tous les champs requis
- Vérifie que les deux mots de passe correspondent
- Vérifie que le mot de passe a au moins 6 caractères
- Cherche si l'email existe déjà (prévention de doublons)
- **Hash le mot de passe** avec bcrypt
- Insère l'utilisateur en base avec rôle par défaut "user"
- Génère un JWT et retourne le token

**Validations** :
- Email unique
- Mots de passe identiques
- Longueur minimale du mot de passe
- Tous les champs obligatoires

---

## 3. Remplacer les Mots de Passe en Clair par un Hash

### Description
Les mots de passe ne sont jamais stockés en clair en base de données. Ils sont hashés avec **bcrypt**.

### Fichiers impliqués
- **Utilitaire** : `app/utils/security.js` (fonction `hashPassword`)
- **Controller** : `app/controllers/AuthController.js`
- **Base de données** : Table `users`, colonne `password`

### Implémentation

#### Code (security.js)
```javascript
hashPassword: async (password) => {
    const peppered = password + security.pepper;
    const hashed = await bcrypt.hash(peppered, security.bcrypt.saltRounds);
    return hashed;
}
```

#### Où est utilisé
1. **Inscription** : Lors de la création d'un compte, le mot de passe est hashé avant insertion
2. **Connexion** : Le mot de passe fourni est comparé au hash stocké (sans décryptage)

### Sécurité
- **Irréversible** : On ne peut pas retrouver le mot de passe original
- **Détection de compromission** : Les hashes sont différents même pour un même mot de passe
- **Protection contre les attaques brute-force** : Bcrypt est volontairement lent

### Configuration
```javascript
// app/config/security.js
bcrypt: {
    saltRounds: 10  // Plus la valeur est haute, plus c'est lent (sécurité vs performance)
}
```

---

## 4. Ajouter un Sel (Salt)

### Description
Un **sel** est une valeur aléatoire ajoutée au mot de passe avant le hash. Cela garantit que deux utilisateurs avec le même mot de passe auront des hashes différents.

### Comment ça marche

```
Mot de passe : "password123"
Sel généré par bcrypt : aléatoire

Hash final = HASH("password123" + sel aléatoire)
→ Résultat 1: $2b$10$aBcDeF... (unique)
→ Résultat 2: $2b$10$xYzAbC... (différent, même mot de passe)
```

### Implémentation dans bcrypt
Bcrypt **génère automatiquement** un sel aléatoire lors de chaque hash :
```javascript
const hashed = await bcrypt.hash(peppered, 10);
// Le paramètre 10 = saltRounds = nombre de fois que le sel est appliqué
```

### Avantages
- Même mot de passe = hashes différents
- Protège contre les **rainbow tables** (tables de hashes pré-calculées)
- Rend les attaques par dictionnaire beaucoup plus lentes

---

## 5. Ajouter un Poivre (Pepper)

### Description
Un **poivre** est une constante secrète ajoutée à **TOUS** les mots de passe avant le hash. Contrairement au sel (aléatoire), le poivre est fixe et secret.

### Différence Sel vs Poivre

| Aspect | Sel | Poivre |
|--------|-----|--------|
| **Généré** | Aléatoire | Fixe |
| **Stocké** | En base avec le hash | Secret dans le code/env |
| **Rôle** | Prévient les attaques rainbow tables | Ajoute une couche supplémentaire |

### Implémentation

#### Configuration (config/security.js)
```javascript
pepper: process.env.PASSWORD_PEPPER || 'default-pepper-change-in-production'
```

#### Utilisation (utils/security.js)
```javascript
hashPassword: async (password) => {
    const peppered = password + security.pepper;  // ← Ajout du poivre
    const hashed = await bcrypt.hash(peppered, security.bcrypt.saltRounds);
    return hashed;
},

comparePassword: async (password, hash) => {
    const peppered = password + security.pepper;  // ← Même poivre pour la comparaison
    return await bcrypt.compare(peppered, hash);
}
```

#### Flux complet
```
Utilisateur tape : "password123"

Inscription :
1. Ajouter poivre : "password123" + "mon-poivre-secret" = "password123mon-poivre-secret"
2. Générer sel : aléatoire
3. Hash : HASH("password123mon-poivre-secret" + sel aléatoire)
4. Stocker en base : $2b$10$... (hash)

Connexion :
1. Utilisateur tape : "password123"
2. Ajouter poivre : "password123mon-poivre-secret"
3. Comparer avec le hash stocké
```

### Sécurité
- Si la base est compromise, le hacker ne peut pas faire d'attaques rainbow tables sans connaître le poivre
- Le poivre doit être changé en production via `.env`

---

## 6. Corriger les Requêtes pour Prévenir l'Injection SQL

### Description
L'**injection SQL** est une vulnérabilité qui permet à un attaquant d'injecter du code SQL dans les requêtes.

### Exemple d'Injection SQL (DANGEREUX)

```javascript
// VULNÉRABLE
const email = "admin@test.com' OR '1'='1"; // Email spécialement crafté
const query = `SELECT * FROM users WHERE email = '${email}'`;
// Requête exécutée : SELECT * FROM users WHERE email = 'admin@test.com' OR '1'='1'
// Résultat : retourne TOUS les utilisateurs !
```

### Solution : Requêtes Paramétrées

```javascript
// SÉCURISÉ
const query = 'SELECT * FROM users WHERE email = ?';
db.query(query, [email], (err, results) => {
    // email est traité comme une donnée, pas du code SQL
});
```

### Implémentation dans le projet

#### Login (AuthController.js)
```javascript
// Paramètre : email
const query = 'SELECT id, username, email, password, role FROM users WHERE email = ?';
db.query(query, [email], async (err, results) => {
    // email est sécurisé
});
```

#### Register (AuthController.js)
```javascript
// Paramètres : email
const checkQuery = 'SELECT id FROM users WHERE email = ?';
db.query(checkQuery, [email], async (err, results) => {
    // email est sécurisé
});

// Paramètres : username, email, hashedPassword, role, address
const insertQuery = 'INSERT INTO users (username, email, password, role, address) VALUES (?, ?, ?, ?, ?)';
db.query(insertQuery, [username, email, hashedPassword, 'user', address || null], (err, result) => {
    // Tous les paramètres sont sécurisés
});
```

### Le `?` signifie quoi ?

```javascript
// ? = placeholder = emplacement réservé
// Les valeurs réelles sont passées dans un tableau

// Requête SQL : INSERT INTO users (...) VALUES (?, ?, ?)
// Données    : [username, email, password]
// Résultat   : Les données sont échappées et insérées de manière sûre
```

### Protection contre
- Injection SQL
- Affichage de données sensibles
- Suppression/Modification non-autorisée de données
- Authentification contournée

---

## 7. Implémenter l'Utilisation d'un Token JWT

### Description
Un **JWT (JSON Web Token)** est un token d'authentification stateless qui contient des informations sur l'utilisateur. Il remplace les sessions traditionnelles.

### Structure d'un JWT
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpZCI6MSwibmFtZSI6ImpvaG4iLCJpYXQiOjE1MTYyMzkwMjJ9.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

[Header].[Payload].[Signature]
```

### Génération du JWT

#### Code (utils/security.js)
```javascript
generateToken: (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role  // ← Rôle inclus dans le token
    };
    return jwt.sign(payload, security.jwt.secret, {
        expiresIn: security.jwt.expiresIn,  // Expire après 24h
        algorithm: security.jwt.algorithm
    });
}
```

#### Quand est généré le JWT ?
1. **Après une connexion réussie** : `POST /api/auth/login`
2. **Après une inscription réussie** : `POST /api/auth/register`

#### Réponse du serveur
```json
{
    "message": "Connexion réussie",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "username": "alice",
        "email": "alice@webshop.com",
        "role": "user"
    }
}
```

### Utilisation du JWT côté Frontend

```javascript
// Après connexion, stocker le token
localStorage.setItem('token', data.token);

// Pour les requêtes suivantes, inclure le token dans le header
const response = await fetch('/api/profile', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
});
```

### Vérification du JWT côté Backend

#### Code (middleware/auth.js)
```javascript
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token requis' });
    }
    
    try {
        const decoded = securityUtils.verifyToken(token);
        req.user = decoded;  // Ajouter les infos utilisateur à la requête
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token invalide' });
    }
};
```

### Configuration (config/security.js)
```javascript
jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '24h',
    algorithm: 'HS256'
}
```

### Avantages du JWT
- **Stateless** : Pas besoin de base de données pour les sessions
- **Secure** : Signé et vérifié
- **Portable** : Peut être utilisé dans les cookies ou les headers
- **Contient les infos utilisateur** : Rôle, ID, etc.

---

## 8. Ajouter les Rôles et Protéger les Routes Admin

### Description
Les utilisateurs ont des rôles (`user` ou `admin`). Les routes d'administration sont protégées : seuls les admins peuvent y accéder.

### Structure des Rôles

#### Base de données (init.sql)
```sql
CREATE TABLE users (
    ...
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    ...
);

-- Données de départ
INSERT INTO users (..., role) VALUES
    ('admin', ..., 'admin'),   -- L'administrateur
    ('alice', ..., 'user');    -- Utilisateur normal
```

### Middleware d'Authentification (middleware/auth.js)

#### Middleware `auth` : Vérifier le JWT
```javascript
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    
    try {
        const decoded = securityUtils.verifyToken(token);
        req.user = decoded;  // { id, username, email, role }
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token invalide' });
    }
};
```

#### Middleware `admin` : Vérifier le rôle
```javascript
const admin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès réservé aux admins' });
    }
    next();
};
```

### Protection des Routes (routes/Admin.js)

```javascript
const router = express.Router();

// Ces routes nécessitent : authentification + rôle admin
router.get('/users', auth, admin, controller.getUsers);

module.exports = router;
```

### Flux d'une requête protégée

```
Client demande : GET /api/admin/users
Header : Authorization: Bearer eyJh...

Serveur :
1. Middleware `auth` : Vérifier le token valide → Extraire req.user
2. Middleware `admin` : Vérifier req.user.role === 'admin'
3. Si oui → Exécuter controller.getUsers
4.Si non → Retourner 403 Forbidden
```

### Exemple : Accès refusé

```javascript
// Token d'un utilisateur normal
// req.user = { id: 2, username: 'alice', email: 'alice@test.com', role: 'user' }

// Requête : GET /api/admin/users
// Middleware admin vérifie : role !== 'admin'
// Réponse : 403 { error: 'Accès réservé aux admins' }
```

### Statuts HTTP utilisés

| Code | Situation |
|------|-----------|
| **200** | Succès |
| **401** | Non authentifié (pas de token / token invalide) |
| **403** | Authentifié mais pas autorisé (rôle insuffisant) |

---

## 9. Mettre en Place le HTTPS

### Description
HTTPS chiffre la communication entre le client et le serveur. C'est essentiel pour sécuriser les données sensibles (tokens, mots de passe, etc.).

### Architecture HTTPS dans le projet

```
                    Client (navigateur)
                            |
                       HTTPS/TLS
                            |
        ┌─────────────────────────────────────┐
        |    Serveur Node.js (server.js)      |
        │                                     │
        │  Port 8443 (HTTPS) ←─ Certificats  │
        │  Port 8080 (HTTP)  ←─ Redirection  │
        └─────────────────────────────────────┘
```

### Certificats SSL/TLS

#### Création manuelle des certificats

**Avec OpenSSL**
```powershell
mkdir C:\Users\py13koy\Documents\GitHub\secured_webshop_GiaRuberti\certs
cd C:\Users\py13koy\Documents\GitHub\secured_webshop_GiaRuberti\certs

openssl req -x509 -newkey rsa:4096 -keyout ssl_key.pem -out ssl_cert.pem -days 365 -nodes -subj "/CN=localhost"
```

### Implémentation (server.js)

#### Code simplifié
```javascript
const fs = require('fs');
const https = require('https');
const http = require('http');

// Ports
const HTTP_PORT = 8080;
const HTTPS_PORT = 8443;

// Chemins des certificats
const SSL_KEY = '../certs/ssl_key.pem';
const SSL_CERT = '../certs/ssl_cert.pem';

// Vérifier la présence des certificats
const keyExists = fs.existsSync(path.resolve(__dirname, SSL_KEY));
const certExists = fs.existsSync(path.resolve(__dirname, SSL_CERT));

if (keyExists && certExists) {
    // Certificats trouvés → Démarrer HTTPS
    const key = fs.readFileSync(path.resolve(__dirname, SSL_KEY));
    const cert = fs.readFileSync(path.resolve(__dirname, SSL_CERT));

    https.createServer({ key, cert }, app).listen(HTTPS_PORT, () => {
        console.log(`🔒 Serveur HTTPS sur https://localhost:${HTTPS_PORT}`);
    });

    // Redirection HTTP → HTTPS
    http.createServer((req, res) => {
        res.writeHead(301, { Location: `https://localhost:${HTTPS_PORT}${req.url}` });
        res.end();
    }).listen(HTTP_PORT, () => {
        console.log(`🔄 Redirection HTTP (${HTTP_PORT}) → HTTPS (${HTTPS_PORT})`);
    });
} else {
    //Certificats manquants → Démarrer HTTP uniquement
    app.listen(HTTP_PORT, () => {
        console.log( Serveur HTTP sur http://localhost:${HTTP_PORT}`);
        console.log(`ℹ️  Pour HTTPS, ajoutez les certificats dans ./certs/`);
    });
}
```

### Redirection HTTP → HTTPS

Quand un utilisateur accède à `http://localhost:8080/login` :
```
Requête reçue sur port 8080
         ↓
Middleware de redirection
         ↓
Réponse : 301 Moved Permanently
Location: https://localhost:8443/login
         ↓
Navigateur suit la redirection
         ↓
Accès sécurisé sur HTTPS
```

### Certificats en Production

En production, utiliser des certificats **valides** :
- **Let's Encrypt** (gratuit, automatisé)
- **Certificats signés** par une autorité de confiance

```powershell
# Exemple avec Let's Encrypt (Certbot)
certbot certonly --standalone -d example.com
# Génère : /etc/letsencrypt/live/example.com/privkey.pem
#          /etc/letsencrypt/live/example.com/fullchain.pem
```

### Configuration .env pour la production

```env
SSL_KEY_PATH=/etc/letsencrypt/live/example.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/example.com/fullchain.pem
```

### Avantages du HTTPS
- **Chiffrement** : Les données ne peuvent pas être lues en transit
- **Authenticité** : Vérification que le serveur est légitime
- **Intégrité** : Les données ne peuvent pas être modifiées
- **Confiance navigateur** : Pas d'avertissement de sécurité
- **SEO** : Google privilégie les sites HTTPS

---

## Résumé Complet

### Flux de Sécurité d'une Inscription

```
1. Utilisateur remplir le formulaire
   ↓
2. Frontend valide les champs (email, password, passwordConfirm, etc.)
   ↓
3. Envoi HTTPS POST /api/auth/register
   { username, email, password, passwordConfirm, address }
   ↓
4. Backend valide à nouveau (longueur, correspondance, etc.)
   ↓
5. Vérifier si email existe (requête paramétrée)
   ↓
6. Hash du mot de passe
   a. Ajouter poivre (pepper)
   b. Générer sel aléatoire (bcrypt)
   c. Hash résultat
   ↓
7. Insertion en base (requête paramétrée)
   ↓
8. Génération JWT avec { id, email, username, role: 'user' }
   ↓
9. Réponse HTTPS avec token
   ↓
10. Frontend stocke token en localStorage
```

### Flux de Sécurité d'une Connexion

```
1. Utilisateur tape email + password
   ↓
2. Frontend envoie HTTPS POST /api/auth/login
   { email, password }
   ↓
3. Backend cherche l'utilisateur (requête paramétrée)
   ↓
4. Comparaison du mot de passe :
   a. Ajouter poivre
   b. Comparer avec le hash en base (bcrypt)
   ↓
5. Si valide → Générer JWT et retourner token
6. Si invalide → Retourner erreur 401
   ↓
7. Frontend stocke token pour les requêtes suivantes
```

### Flux d'une Requête Protégée (Admin)

```
1. Frontend envoie GET /api/admin/users
   Header: Authorization: Bearer {token}
   ↓
2. Middleware `auth` vérifie le token
   a. Extraire token du header
   b. Vérifier la signature (secret)
   c. Vérifier l'expiration (24h)
   d. Valide → Ajouter user à req
   ↓
3. Middleware `admin` vérifie le rôle
   a. Vérifier req.user.role === 'admin'
   b. Admin → Continuer
   b. User → Retourner 403
   ↓
4. Exécuter le contrôleur
   ↓
5. Retourner les données
```

---
### 10.	Vérifier la résistance de vos hash avec l’outil John The Ripper et aux rainbow tables, via un export de la BDD
## Conclusion