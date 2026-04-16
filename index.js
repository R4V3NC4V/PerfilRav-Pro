require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const app = express();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PerfilRav Pro | Omni-Hub</title>
    <link href="https://googleapis.com" rel="stylesheet">
    <style>
        :root { --accent: #6366f1; --bg: #0f172a; --card: rgba(30, 41, 59, 0.7); --text: #f8fafc; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; display: flex; height: 100vh; background: var(--bg); color: var(--text); overflow: hidden; }
        
        /* Sidebar Moderna */
        .sidebar { width: 280px; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(10px); padding: 30px; display: flex; flex-direction: column; border-right: 1px solid rgba(255,255,255,0.1); }
        .nav-btn { padding: 14px; border-radius: 12px; border: none; cursor: pointer; background: transparent; color: white; text-align: left; font-weight: 600; transition: 0.3s; margin-bottom: 5px; }
        .nav-btn:hover, .nav-btn.active { background: var(--accent); box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3); }

        /* Contenido Principal */
        .main { flex: 1; padding: 40px; overflow-y: auto; background: radial-gradient(circle at top right, #1e1b4b, #0f172a); }
        .card { background: var(--card); backdrop-filter: blur(15px); padding: 25px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 25px; }
        
        .tab { display: none; animation: fadeIn 0.4s ease; }
        .tab.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        input, textarea, select { width: 100%; padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; margin-bottom: 15px; outline: none; }
    </style>
</head>
<body>
    <div class="sidebar">
        <h2 style="color:var(--accent); font-weight:800;">PERFILRAV PRO</h2>
        <nav style="margin-top:20px; flex:1;">
            <button class="nav-btn active" onclick="tab('t-search', this)">🔍 Explorador</button>
            <button class="nav-btn" onclick="tab('t-ai', this)">🤖 Brain IA</button>
            <button class="nav-btn" onclick="tab('t-social', this)">📱 Muro Social</button>
        </nav>
        <div id="clock" style="font-weight:600; opacity:0.6;">00:00:00</div>
    </div>

    <div class="main">
        <div id="t-search" class="tab active">
            <div class="card">
                <h1>Explorador de Identidad</h1>
                <input type="email" id="email" placeholder="Introduce un correo para analizar...">
                <button class="nav-btn" style="background:var(--accent); width:auto; padding:12px 30px;" onclick="buscar()">Analizar</button>
                <div id="res" style="margin-top:30px; text-align:center;"></div>
            </div>
        </div>
        <!-- (Otras pestañas se activan igual...) -->
    </div>

    <script>
        function tab(id, btn) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            btn.classList.add('active');
        }
        setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString(); }, 1000);
        
        async function buscar() {
            const e = document.getElementById('email').value;
            const res = await fetch('/api/v1/' + encodeURIComponent(e));
            const d = await res.json();
            const avatar = d.avatar_url || 'https://gravatar.com' + d.hash + '?d=identicon&s=200';
            document.getElementById('res').innerHTML = '<img src="'+avatar+'" style="border-radius:50%; width:150px; border:5px solid var(--accent)"><h2>'+(d.display_name || 'Perfil Privado')+'</h2>';
        }
    </script>
</body>
</html>
    `);
});

app.get('/api/v1/:email', async (req, res) => {
    const hash = crypto.createHash('sha256').update(req.params.email.trim().toLowerCase()).digest('hex');
    try {
        const response = await axios.get("https://gravatar.com" + hash, {
            headers: { 'Authorization': 'Bearer ' + process.env.GRAVATAR_KEY }
        });
        res.json(response.data);
    } catch (e) { res.json({ hash, status: 404 }); }
});

app.listen(process.env.PORT || 3000, () => console.log("Sistema Reiniciado"));
