require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Claves de Entorno
const API_KEY = process.env.GRAVATAR_KEY;
const GEMINI_KEY = process.env.GEMINI_KEY;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Servir el Manifiesto para la App Móvil
app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "PerfilRav Omni-Hub Pro",
        "short_name": "PerfilRav",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#0f172a",
        "theme_color": "#2563eb",
        "icons": [{ "src": "https://flaticon.com", "sizes": "512x512", "type": "image/png" }]
    });
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PerfilRav Omni-Hub Ultra</title>
    <link rel="manifest" href="/manifest.json">
    <link href="https://googleapis.com" rel="stylesheet">
    <script src="https://jsdelivr.net"></script>
    <style>
        :root { --primary: #6366f1; --secondary: #a855f7; --bg: #0f172a; --card: rgba(30, 41, 59, 0.7); --text: #f1f5f9; --glass: rgba(255, 255, 255, 0.05); }
        body { font-family: 'Outfit', sans-serif; margin: 0; display: flex; height: 100vh; background: #0f172a; color: var(--text); overflow: hidden; }
        
        /* Panic Mode */
        #panic-screen { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; color: black; z-index: 20000; padding: 20px; font-family: sans-serif; }
        
        /* Login Overlay */
        #login-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; z-index: 10000; }

        .sidebar { width: 280px; background: rgba(15, 23, 42, 0.95); padding: 25px; display: flex; flex-direction: column; border-right: 1px solid var(--glass); }
        .nav-btn { padding: 12px 15px; border-radius: 12px; border: none; cursor: pointer; background: transparent; color: var(--text); width: 100%; text-align: left; margin-bottom: 5px; transition: 0.3s; display: flex; align-items: center; gap: 12px; }
        .nav-btn:hover, .nav-btn.active { background: var(--primary); }

        .main-container { flex: 1; padding: 30px; overflow-y: auto; background: radial-gradient(circle at top right, #1e1b4b, #0f172a); }
        .tab-page { display: none; animation: fadeIn 0.4s ease; }
        .tab-page.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .glass-card { background: var(--card); backdrop-filter: blur(12px); padding: 25px; border-radius: 24px; border: 1px solid var(--glass); margin-bottom: 20px; }
        input, textarea, select { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid var(--glass); background: rgba(0,0,0,0.3); color: white; margin-bottom: 10px; outline: none; }
        
        /* Calendario */
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; text-align: center; }
        .cal-day { padding: 10px; background: var(--glass); border-radius: 8px; cursor: pointer; }
        .today { background: var(--primary); font-weight: bold; }
    </style>
</head>
<body>

    <div id="panic-screen">
        <h3>Presupuesto_Trimestral.xlsx</h3>
        <table border="1" style="width:100%"><tr><td>ID</td><td>Gasto</td><td>Total</td></tr><tr><td>01</td><td>Cloud Hosting</td><td>$4,500</td></tr></table>
        <p>Presione ESC para volver</p>
    </div>

    <div id="login-overlay">
        <div class="glass-card" style="text-align:center">
            <h1>🛡️ PerfilRav Pro</h1>
            <p>Acceso Privado</p>
            <button onclick="login()" style="padding:15px 30px; border-radius:10px; cursor:pointer; font-weight:bold">Continuar con Google</button>
        </div>
    </div>

    <div class="sidebar">
        <div style="text-align:center; margin-bottom:20px">
            <img id="side-avatar" src="" style="width:60px; border-radius:50%">
            <h4 id="side-name">Raven</h4>
            <div id="clock" style="font-weight:bold">00:00</div>
        </div>
        <nav>
            <button class="nav-btn active" onclick="nav('p-dash', this)">📊 Dashboard</button>
            <button class="nav-btn" onclick="nav('p-ai', this)">🤖 Asistente IA</button>
            <button class="nav-btn" onclick="nav('p-feed', this)">📱 Muro Social</button>
            <button class="nav-btn" onclick="nav('p-cal', this)">📅 Calendario</button>
            <button class="nav-btn" onclick="nav('p-tools', this)">🛠️ Herramientas</button>
            <button class="nav-btn" style="margin-top:20px; background:#ef4444" onclick="logout()">🔒 Salir</button>
        </nav>
    </div>

    <div class="main-container">
        <!-- DASHBOARD -->
        <div id="p-dash" class="tab-page active">
            <div class="glass-card">
                <h1 id="greeting">Bienvenido</h1>
                <div id="weather">Cargando clima...</div>
            </div>
            <div class="glass-card">
                <h3>🚀 Buscador Inteligente</h3>
                <select id="engine"><option value="google">Google</option><option value="scholar">Académico</option></select>
                <input id="q" placeholder="Buscar..."><button class="nav-btn" onclick="search()">Ir</button>
            </div>
        </div>

        <!-- IA -->
        <div id="p-ai" class="tab-page">
            <div class="glass-card">
                <h3>🤖 AI Lab (Gemini)</h3>
                <div id="aiChat" style="height:200px; overflow-y:auto; background:rgba(0,0,0,0.2); padding:10px; border-radius:10px; margin-bottom:10px"></div>
                <input id="aiIn" placeholder="Pregunta algo..."><button class="nav-btn" onclick="ask()">Enviar</button>
            </div>
        </div>

        <!-- MURO -->
        <div id="p-feed" class="tab-page">
            <div class="glass-card">
                <h3>Nuevo Post</h3>
                <input id="p-t" placeholder="Título"><textarea id="p-c" placeholder="Contenido"></textarea>
                <button class="nav-btn" onclick="savePost()">Publicar</button>
            </div>
            <div id="feed-container"></div>
        </div>

        <!-- CALENDARIO -->
        <div id="p-cal" class="tab-page">
            <div class="glass-card"><div class="calendar-grid" id="calGrid"></div></div>
        </div>

        <!-- HERRAMIENTAS -->
        <div id="p-tools" class="tab-page">
            <div class="glass-card">
                <h3>Calculadora</h3>
                <input id="calc-in"><button class="nav-btn" onclick="document.getElementById('calc-in').value=eval(document.getElementById('calc-in').value)">=</button>
            </div>
        </div>
    </div>

    <script>
        const supabase = supabase.createClient('${process.env.SUPABASE_URL}', '${process.env.SUPABASE_KEY}');

        function nav(id, btn) {
            document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            btn.classList.add('active');
        }

        // --- SEGURIDAD ---
        async function login() { await supabase.auth.signInWithOAuth({ provider: 'google' }); }
        async function logout() { await supabase.auth.signOut(); location.reload(); }
        async function checkUser() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                document.getElementById('login-overlay').style.display = 'none';
                document.getElementById('side-avatar').src = session.user.user_metadata.avatar_url;
                document.getElementById('side-name').innerText = session.user.user_metadata.full_name;
                renderPosts();
            }
        }

        // --- FUNCIONES ---
        function search() {
            const engine = document.getElementById('engine').value;
            const q = document.getElementById('q').value;
            window.open(engine === 'google' ? 'https://google.com : 'https://google.com);
        }

        async function ask() {
            const p = document.getElementById('aiIn').value;
            const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt:p}) });
            const d = await res.json();
            document.getElementById('aiChat').innerHTML += "<div><b>IA:</b> "+d.r+"</div>";
        }

        async function savePost() {
            const titulo = document.getElementById('p-t').value;
            const contenido = document.getElementById('p-c').value;
            await supabase.from('publicaciones').insert([{ titulo, contenido }]);
            renderPosts();
        }

        async function renderPosts() {
            const { data } = await supabase.from('publicaciones').select('*').order('created_at', {ascending:false});
            document.getElementById('feed-container').innerHTML = data.map(p => '<div class="glass-card"><h4>'+p.titulo+'</h4><p>'+p.contenido+'</p></div>').join('');
        }

        // --- PÁNICO ---
        window.onkeydown = (e) => { if(e.key === 'Escape') document.getElementById('panic-screen').style.display = 'block'; };
        
        setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString(); }, 1000);
        window.onload = checkUser;
    </script>
</body>
</html>
    `);
});

// BACKEND APIS
app.post('/api/ai', async (req, res) => {
    try {
        const resp = await axios.post(\`https://googleapis.com\${GEMINI_KEY}\`, {
            contents: [{ parts: [{ text: req.body.prompt }] }]
        });
        res.json({ r: resp.data.candidates.content.parts.text });
    } catch (e) { res.json({ r: "Error IA" }); }
});

app.get('/api/v1/:email', async (req, res) => {
    const hash = crypto.createHash('sha256').update(req.params.email.trim().toLowerCase()).digest('hex');
    try {
        const response = await axios.get("https://gravatar.com" + hash, {
            headers: { 'Authorization': 'Bearer ' + API_KEY }
        });
        res.json(response.data);
    } catch (e) { res.json({ hash, status: 404 }); }
});

app.listen(process.env.PORT || 3000, () => console.log("🚀 Omni-Hub Final listo"));
