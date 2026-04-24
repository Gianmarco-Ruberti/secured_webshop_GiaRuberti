require('dotenv').config({ path: '../.env' });

const express = require("express");
const path = require("path");

const app = express();

// Middleware pour parser le corps des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (CSS, images, uploads...)
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------
// Routes API (retournent du JSON)
// ---------------------------------------------------------------
const authRoute    = require("./routes/Auth");
const profileRoute = require("./routes/Profile");
const adminRoute   = require("./routes/Admin");

app.use("/api/auth",    authRoute);
app.use("/api/profile", profileRoute);
app.use("/api/admin",   adminRoute);

// ---------------------------------------------------------------
// Routes pages (retournent du HTML)
// ---------------------------------------------------------------
const homeRoute = require("./routes/Home");
const userRoute = require("./routes/User");

app.use("/", homeRoute);
app.use("/user", userRoute);

app.get("/login",    (_req, res) => res.sendFile(path.join(__dirname, "views", "login.html")));
app.get("/register", (_req, res) => res.sendFile(path.join(__dirname, "views", "register.html")));
app.get("/profile",  (_req, res) => res.sendFile(path.join(__dirname, "views", "profile.html")));
app.get("/admin",    (_req, res) => res.sendFile(path.join(__dirname, "views", "admin.html")));

// ---------------------------------------------------------------
// Démarrage du serveur
// ---------------------------------------------------------------

const fs = require('fs');
const https = require('https');
const http = require('http');

// Ports
const HTTP_PORT = 8080;
const HTTPS_PORT = 8443;

// Chemins des certificats SSL (à créer manuellement dans ./certs/)
const SSL_KEY = '../certs/ssl_key.pem';
const SSL_CERT = '../certs/ssl_cert.pem';

// Chercher les certificats
const keyExists = fs.existsSync(path.resolve(__dirname, SSL_KEY));
const certExists = fs.existsSync(path.resolve(__dirname, SSL_CERT));

if (keyExists && certExists) {
    // HTTPS activé : charger les certificats et démarrer en HTTPS
    const key = fs.readFileSync(path.resolve(__dirname, SSL_KEY));
    const cert = fs.readFileSync(path.resolve(__dirname, SSL_CERT));

    https.createServer({ key, cert }, app).listen(HTTPS_PORT, () => {
        console.log(`Serveur HTTPS sur https://localhost:${HTTPS_PORT}`);
    });

    // Redirection HTTP vers HTTPS
    http.createServer((req, res) => {
        res.writeHead(301, { Location: `https://localhost:${HTTPS_PORT}${req.url}` });
        res.end();
    }).listen(HTTP_PORT, () => {
        console.log(`Redirection HTTP (${HTTP_PORT}) → HTTPS (${HTTPS_PORT})`);
    });
} else {
    // HTTPS désactivé : démarrer en HTTP uniquement
    app.listen(HTTP_PORT, () => {
        console.log(`Serveur HTTP sur http://localhost:${HTTP_PORT}`);
        console.log(`Pour activer HTTPS, ajoutez les certificats dans ./certs/`);
    });
}
