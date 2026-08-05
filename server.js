const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path'); // <--- 1. Ajoute ceci en haut

const app = express();

app.use(express.json());
app.use(cors());

// <--- 2. Ajoute cette ligne pour dire à Express de lire le dossier actuel pour les fichiers HTML
app.use(express.static(path.join(__dirname)));

// CONNEXION À TA BASE DE DONNÉES SUPABASE
const pool = new Pool({
    connectionString: 'postgresql://postgres:Lavezzi200%40db.crbscttsxjsyimhxmjht.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

// ROUTE PRINCIPALE : Affiche ton fichier index.html au lieu du message JSON
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ROUTE D'INSCRIPTION
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nom, téléphone, codePIN } = req.body;

        // 1. Vérifier si l'utilisateur existe déjà
        const utilisateurExiste = await pool.query('SELECT * FROM users WHERE phone = $1', [téléphone]);
        if (utilisateurExiste.rows.length > 0) {
            return res.status(400).json({ erreur: 'Ce numéro de téléphone est déjà utilisé.' });
        }

        // 2. Sécuriser le code PIN en le cryptant
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(codePIN, salt);

        // Insérer dans la base de données (adapte selon le nom de tes colonnes si besoin)
        await pool.query('INSERT INTO users (name, phone, pin) VALUES ($1, $2, $3)', [nom, téléphone, hashedPin]);

        res.status(201).json({ message: 'Inscription réussie' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur lors de l’inscription' });
    }
});

// Export pour Vercel (important pour éviter les erreurs serverless)
module.exports = app;
