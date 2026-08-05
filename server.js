const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// ---------------------------------------------------------
// CONNEXION À TA BASE DE DONNÉES SUPABASE
// ---------------------------------------------------------
const pool = new Pool({
    connectionString: 'postgresql://postgres:Lavezzi200%40@db.crbscttsxjsyimhxmjht.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

// ---------------------------------------------------------
// ROUTE DE TEST
// ---------------------------------------------------------
app.get('/', (req, res) => {
    res.json({ message: 'Le serveur Éco-Épargne fonctionne parfaitement !' });
});

// ---------------------------------------------------------
// ROUTE D'INSCRIPTION (Enregistre l'utilisateur dans Supabase)
// ---------------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
    try {
        const { phone, full_name, pin_code } = req.body;

        // 1. Vérifier si l'utilisateur existe déjà
        const userExists = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé.' });
        }

        // 2. Sécuriser le code PIN en le cryptant
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin_code, salt);

        // 3. Insérer l'utilisateur dans ta table Supabase
        const newUser = await pool.query(
            'INSERT INTO users (phone, full_name, pin_code) VALUES ($1, $2, $3) RETURNING id, phone, full_name, balance, created_at',
            [phone, full_name, hashedPin]
        );

        res.status(201).json({
            message: 'Inscription réussie dans la base de données !',
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

// Exportation pour Vercel (et lancement local si besoin)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur le port ${PORT}`);
    });
}

module.exports = app;
