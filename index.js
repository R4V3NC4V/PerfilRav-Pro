// --- ENDPOINT MULTI-IA ---
app.post('/api/ai/chat', express.json(), async (req, res) => {
    const { prompt, model } = req.body; // Recibimos la pregunta y cuál IA usar

    try {
        if (model === 'gemini') {
            const resp = await axios.post(`https://googleapis.com{process.env.GEMINI_KEY}`, {
                contents: [{ parts: [{ text: prompt }] }]
            });
            return res.json({ respuesta: resp.data.candidates[0].content.parts[0].text });
        }

        if (model === 'groq') {
            const resp = await axios.post('https://groq.com', {
                model: "llama3-8b-8192",
                messages: [{ role: "user", content: prompt }]
            }, { headers: { 'Authorization': `Bearer ${process.env.GROQ_KEY}` } });
            return res.json({ respuesta: resp.data.choices[0].message.content });
        }

        if (model === 'deepseek') {
            const resp = await axios.post('https://deepseek.com', {
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }]
            }, { headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_KEY}` } });
            return res.json({ respuesta: resp.data.choices[0].message.content });
        }

    } catch (error) {
        console.error("Error en IA:", error.message);
        res.status(500).json({ respuesta: "Error: Verifica tu API Key o saldo de la IA elegida." });
    }
});

<!-- En la pestaña de IA, añade este selector antes del input -->
<select id="aiModel" style="padding:10px; border-radius:10px; margin-bottom:10px; width:100%">
    <option value="gemini">Google Gemini (Gratis/Rápido)</option>
    <option value="groq">Groq / Llama 3 (Ultra Veloz)</option>
    <option value="deepseek">DeepSeek (Cerebro Avanzado)</option>
</select>

<script>
async function preguntarIA() {
    const prompt = document.getElementById('aiInput').value;
    const model = document.getElementById('aiModel').value; // Captura el modelo elegido
    const chat = document.getElementById('aiChat');
    if(!prompt) return;

    chat.innerHTML += "<div><b>Tú:</b> " + prompt + "</div>";
    const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ prompt, model }) // Enviamos ambos datos
    });
    const data = await res.json();
    chat.innerHTML += "<div style='color:#2563eb'><b>IA ("+model+"):</b> " + data.respuesta + "</div>";
}
</script>

