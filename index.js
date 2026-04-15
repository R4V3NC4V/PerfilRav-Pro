require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

const API_KEY = process.env.GRAVATAR_KEY;

app.get('/', function(req, res) {
    res.send(`
<html>
<head>
    <title>PerfilRav Pro | Ultimate</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 0; display: flex; }
        .sidebar { width: 250px; background: #1e293b; color: white; height: 100vh; padding: 20px; position: fixed; }
        .main { margin-left: 290px; padding: 40px; width: 100%; }
        .card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
        .social-box { display: flex; justify-content: center; gap: 15px; margin-top: 20px; flex-wrap: wrap; }
        .social-icon { padding: 10px 15px; background: #f1f5f9; border-radius: 10px; text-decoration: none; color: #2563eb; font-weight: bold; font-size: 14px; border: 1px solid #cbd5e1; }
        .note-area { width: 100%; height: 100px; margin-top: 10px; border-radius: 10px; border: 1px solid #ddd; padding: 10px; }
        .tab-content { display: none; }
        .tab-active { display: block; }
        nav button { display: block; width: 100%; padding: 10px; margin-bottom: 10px; background: none; border: none; color: white; text-align: left; cursor: pointer; border-radius: 5px; }
        nav button:hover { background: #334155; }
        .forum-post { background: white; padding: 15px; border-radius: 10px; margin-bottom: 10px; border-left: 5px solid #2563eb; }
    </style>
</head>
<body>
    <div class="sidebar">
        <h2>PerfilRav Pro</h2>
        <nav>
            <button onclick="showTab('tab-search')">🔍 Buscador</button>
            <button onclick="showTab('tab-notes')">📝 Bloc de Notas</button>
            <button onclick="showTab('tab-forum')">💬 Foro Abierto</button>
            <button onclick="showTab('tab-options')">⚙️ Opciones Pro</button>
        </nav>
    </div>

    <div class="main">
        <!-- BUSCADOR -->
        <div id="tab-search" class="tab-content tab-active">
            <div class="card">
                <h1>Buscador de Identidad</h1>
                <input type="email" id="email" placeholder="correo@ejemplo.com" style="padding:12px; width:70%; border-radius:10px; border:1px solid #ddd">
                <button onclick="buscar()" style="padding:12px; background:#2563eb; color:white; border:none; border-radius:10px; cursor:pointer">Buscar</button>
                <div id="resultado" style="margin-top:20px"></div>
                <h4>Recientes</h4>
                <div id="historial"></div>
                <button onclick="localStorage.removeItem('recientes'); actualizarHistorial();" style="font-size:10px; margin-top:10px">Limpiar Historial</button>
            </div>
        </div>

        <!-- BLOC DE NOTAS -->
        <div id="tab-notes" class="tab-content">
            <div class="card">
                <h1>Mi Bloc Personal</h1>
                <textarea id="myNotes" class="note-area" oninput="saveNotes()" placeholder="Escribe tus ideas aquí..."></textarea>
                <p style="font-size:12px; color:gray">Se guarda automáticamente.</p>
            </div>
        </div>

        <!-- FORO -->
        <div id="tab-forum" class="tab-content">
            <div class="card" style="max-width:600px">
                <h1>Foro Comunitario</h1>
                <input id="forumUser" placeholder="Tu nombre" style="padding:5px; margin-bottom:5px"><br>
                <textarea id="forumMsg" style="width:100%; height:60px" placeholder="Comparte algo con todos..."></textarea>
                <button onclick="postForum()" style="width:100%; background:#059669; color:white; border:none; padding:10px; border-radius:5px">Publicar en el Foro</button>
                <div id="forumList" style="margin-top:20px; text-align:left"></div>
            </div>
        </div>

        <!-- OPCIONES -->
        <div id="tab-options" class="tab-content">
            <div class="card">
                <h1>Opciones Avanzadas</h1>
                <button onclick="alert('Modo Oscuro en desarrollo...')" style="width:100%; padding:10px; margin-bottom:10px">🌙 Activar Modo Oscuro</button>
                <button onclick="window.print()" style="width:100%; padding:10px">🖨️ Exportar Perfil a PDF</button>
            </div>
        </div>
    </div>

    <script>
        function showTab(id) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('tab-active'));
            document.getElementById(id).classList.add('tab-active');
        }

        // --- Lógica del Buscador ---
        async function buscar() {
            const email = document.getElementById('email').value.trim();
            const div = document.getElementById('resultado');
            if(!email.includes('@')) return alert('Email inválido');
            div.innerHTML = 'Cargando...';
            const res = await fetch('/api/v1/' + encodeURIComponent(email));
            const data = await res.json();
            
            // Guardar Historial
            let lista = JSON.parse(localStorage.getItem("recientes") || "[]");
            if(!lista.includes(email)) { lista.unshift(email); localStorage.setItem("recientes", JSON.stringify(lista.slice(0,5))); actualizarHistorial(); }

            let img = data.avatar_url || 'https://gravatar.com';
            let socialHTML = '';
            if(data.verified_accounts) {
                data.verified_accounts.forEach(s => {
                    socialHTML += '<a class="social-icon" href="'+s.url+'" target="_blank">'+s.service.toUpperCase()+'</a>';
                });
            }

            div.innerHTML = \`
                <img src="\${img}" style="width:120px; border-radius:50%; border:5px solid #2563eb">
                <h2>\${data.display_name || 'Invitado'}</h2>
                <p style="color:gray">\${data.location || ''}</p>
                <div class="social-box">\${socialHTML}</div>
            \`;
        }

        function actualizarHistorial() {
            const h = JSON.parse(localStorage.getItem("recientes") || "[]");
            document.getElementById('historial').innerHTML = h.map(e => '<span style="margin:5px; color:#2563eb; cursor:pointer" onclick="document.getElementById(\\'email\\').value=\\''+e+'\\'; buscar()">'+e+'</span>').join('');
        }

        // --- Lógica de Notas ---
        function saveNotes() { localStorage.setItem("perfilNotes", document.getElementById('myNotes').value); }
        document.getElementById('myNotes').value = localStorage.getItem("perfilNotes") || "";

        // --- Lógica de Foro ---
        function postForum() {
            const u = document.getElementById('forumUser').value || 'Anónimo';
            const m = document.getElementById('forumMsg').value;
            if(!m) return;
            let posts = JSON.parse(localStorage.getItem("forumPosts") || "[]");
            posts.unshift({u, m, t: new Date().toLocaleTimeString()});
            localStorage.setItem("forumPosts", JSON.stringify(posts));
            renderForum();
            document.getElementById('forumMsg').value = '';
        }
        function renderForum() {
            const posts = JSON.parse(localStorage.getItem("forumPosts") || "[]");
            document.getElementById('forumList').innerHTML = posts.map(p => '<div class="forum-post"><b>'+p.u+'</b> <small>'+p.t+'</small><br>'+p.m+'</div>').join('');
        }

        actualizarHistorial();
        renderForum();
    </script>
</body>
</html>
    `);
});

app.get('/api/v1/:email', async function(req, res) {
    const email = req.params.email.trim().toLowerCase();
    const hash = crypto.createHash('sha256').update(email).digest('hex');
    try {
        const response = await axios.get("https://gravatar.com" + hash, {
            headers: { 'Authorization': 'Bearer ' + API_KEY }, timeout: 5000
        });
        res.json(response.data);
    } catch (e) { res.json({ hash: hash, status: 404 }); }
});

app.listen(3000, () => console.log("🚀 PerfilRav Ultimate en http://localhost:3000"));
