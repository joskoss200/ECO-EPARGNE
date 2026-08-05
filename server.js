const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

const pool = new Pool({
    connectionString: 'postgresql://postgres:Lavezzi200%40db.crbscttsxjsyimhxmjht.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ROUTE D'INSCRIPTION (Enregistre dans Supabase)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nom, téléphone, codePIN } = req.body;

        const utilisateurExiste = await pool.query('SELECT * FROM users WHERE phone = $1', [téléphone]);
        if (utilisateurExiste.rows.length > 0) {
            return res.status(400).json({ erreur: 'Ce numéro de téléphone est déjà utilisé.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(codePIN, salt);

        await pool.query('INSERT INTO users (name, phone, pin) VALUES ($1, $2, $3)', [nom, téléphone, hashedPin]);

        res.status(201).json({ message: 'Inscription réussie' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur lors de l’inscription' });
    }
});

// ROUTE DE CONNEXION (Vérifie dans Supabase)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { téléphone, codePIN } = req.body;

        const resultat = await pool.query('SELECT * FROM users WHERE phone = $1', [téléphone]);
        if (resultat.rows.length === 0) {
            return res.status(400).json({ erreur: 'Utilisateur introuvable.' });
        }

        const utilisateur = resultat.rows[0];

        // Comparaison du code PIN crypté
        const motDePasseCorrect = await bcrypt.compare(codePIN, utilisateur.pin);
        if (!motDePasseCorrect) {
            return res.status(400).json({ erreur: 'Code PIN incorrect.' });
        }

        res.status(200).json({ 
            message: 'Connexion réussie', 
            nom: utilisateur.name 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erreur: 'Erreur serveur lors de la connexion' });
    }
});

module.exports = app;
