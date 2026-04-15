require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

const API_KEY = process.env.GRAVATAR_KEY;

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PerfilRav Pro | Enterprise Edition</title>
    <style>
        :root { --bg: #f8fafc; --card: #ffffff; --text: #1e293b; --accent: #2563eb; --sidebar: #0f172a; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); margin: 0; display: flex; height: 100vh; overflow: hidden; }
        .sidebar { width: 260px; background: var(--sidebar); color: white; padding: 25px; display: flex; flex-direction: column; gap: 10px; }
        .main { flex: 1; padding: 40px; overflow-y: auto; }
        .card { background: var(--card); padding: 25px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); margin-bottom: 25px; }
        .btn { padding: 12px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; background: var(--accent); color: white; transition: 0.3s; width: 100%; text-align: left; }
        .btn:hover { background: #3b82f6; }
        .tab-content { display: none; } .active { display: block; }
        .ai-chat { background: #f1f5f9; padding: 15px; border-radius: 15px; height: 300px; overflow-y: auto; margin-bottom: 10px; border: 1px solid #e2e8f0; font-size: 14px; }
        input, select, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 10px; box-sizing: border-box; }
    </style>
</head>
<body>
    <div class="sidebar">
        <h2 style="color:var(--accent)">PerfilRav Pro</h2>
        <nav style="display:flex; flex-direction:column; gap:10px;">
            <button class="btn" onclick="showTab('tab-search')">🔍 Buscador</button>
            <button class="btn" onclick="showTab('tab-ai')">🤖 Asistente IA Multi</button>
            <button class="btn" onclick="showTab('tab-notes')">📝 Bloc de Notas</button>
            <button class="btn" onclick="showTab('tab-forum')">💬 Foro Abierto</button>
        </nav>
    </div>

    <div class="main">
        <!-- BUSCADOR -->
        <div id="tab-search" class="tab-content active">
            <div class="card">
                <h1>Buscador de Identidad</h1>
                <input type="email" id="email" placeholder="correo@ejemplo.com">
                <button class="btn" style="text-align:center" onclick="buscar()">Buscar Perfil</button>
                <div id="resultado" style="margin-top:20px"></div>
            </div>
        </div>

        <!-- ASISTENTE IA -->
        <div id="tab-ai" class="tab-content">
            <div class="card">
                <h1>Asistente IA Inteligente</h1>
                <select id="aiModel">
                    <option value="gemini">Google Gemini (Gratis)</option>
                    <option value="groq">Groq / Llama 3 (Veloz)</option>
                    <option value="deepseek">DeepSeek (Avanzado)</option>
                </select>
                <div id="aiChat" class="ai-chat">Hola. Elige un modelo y pregúntame lo que quieras.</div>
                <div style="display:flex; gap:10px">
                    <input id="aiInput" placeholder="Escribe tu duda..." onkeypress="if(event.key==='Enter') preguntarIA()">
                    <button class="btn" style="width:auto" onclick="preguntarIA()">Enviar</button>
                </div>
            </div>
        </div>

        <!-- BLOC DE NOTAS -->
        <div id="tab-notes" class="tab-content">
            <div class="card">
                <h1>Mi Bloc Personal</h1>
                <textarea id="myNotes" style="height:200px" oninput="localStorage.setItem('pNotes', this.value)"></textarea>
            </div>
        </div>

        <!-- FORO -->
        <div id="tab-forum" class="tab-content">
            <div class="card">
                <h1>Foro Abierto</h1>
                <div id="forumList"></div>
            </div>
        </div>
    </div>

    <script>
        function showTab(id) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(id).classList.add('active');
        }

        async function preguntarIA() {
            const prompt = document.getElementById('aiInput').value;
            const model = document.getElementById('aiModel').value;
            const chat = document.getElementById('aiChat');
            if(!prompt) return;

            chat.innerHTML += "<div><b>Tú:</b> " + prompt + "</div>";
            document.getElementById('aiInput').value = "";
            
            try {
                const res = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ prompt, model })
                });
                const data = await res.json();
                chat.innerHTML += "<div style='color:var(--accent)'><b>IA ("+model+"):</b> " + data.respuesta + "</div>";
                chat.scrollTop = chat.scrollHeight;
            } catch(e) { chat.innerHTML += "<div>Error conectando con la IA</div>"; }
        }

        async function buscar() {
            const email = document.getElementById('email').value;
            const div = document.getElementById('resultado');
            const res = await fetch('/api/v1/' + encodeURIComponent(email));
            const data = await res.json();
            let img = data.avatar_url || 'https://gravatar.com' + data.hash + '?d=identicon';
            div.innerHTML = '<img src="'+img+'" style="border-radius:50%; width:120px; border:4px solid var(--accent)"><h2>'+(data.display_name || 'Invitado')+'</h2>';
        }

        document.getElementById('myNotes').value = localStorage.getItem('pNotes') || "";
    </script>
</body>
</html>
    `);
});

// --- BACKEND IA ---
app.post('/api/ai/chat', express.json(), async (req, res) => {
    const { prompt, model } = req.body;
    try {
        if (model === 'gemini') {
            const resp = await axios.post(\`https://googleapis.com\${process.env.GEMINI_KEY}\`, {
                contents: [{ parts: [{ text: prompt }] }]
            });
            return res.json({ respuesta: resp.data.candidates[0].content.parts[0].text });
        }
        // ... (Aquí puedes añadir los bloques de Groq o DeepSeek iguales al anterior)
        res.json({ respuesta: "Modelo seleccionado: " + model + ". (Configura las llaves en Render)" });
    } catch (e) { res.status(500).json({ respuesta: "Error al consultar la IA." }); }
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

app.listen(process.env.PORT || 3000, () => console.log("🚀 PerfilRav Pro Actualizado"));

