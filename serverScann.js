const express = require('express');
const axios = require('axios');
const path = require('path'); // Módulo nativo para lidar com caminhos
require('dotenv').config();

const app = express();

// --- O AJUSTE ESTÁ AQUI ---
// Esta linha diz ao Express: "Se alguém acessar a raiz (/), procure arquivos na pasta public"
app.use(express.static('public')); 
// --------------------------

const API_KEY = process.env.GEMINI_API_KEY || "SUA_CHAVE_AQUI";

app.get('/receita/:produto', async (req, res) => {
    const produto = req.params.produto;
    
    // URL do Gemini (ajustada para a v1beta)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const data = {
        contents: [{
            parts: [{
                text: `Crie uma receita com o produto/código ${produto}. Responda estritamente apenas um objeto JSON: {"nome": "string", "ingredientes": [], "preparo": []}`
            }]
        }],
        generationConfig: {
            response_mime_type: "application/json"
        }
    };

    try {
        const response = await axios.post(url, data);
        
        if (response.data.candidates && response.data.candidates[0].content) {
            const textoIA = response.data.candidates[0].content.parts[0].text;
            res.json(JSON.parse(textoIA));
        } else {
            res.status(500).json({ erro: "IA não gerou conteúdo" });
        }
    } catch (error) {
        console.error("Erro na API:", error.message);
        res.status(500).json({ erro: "Falha na comunicação com a IA" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);
    console.log(`📂 Servindo arquivos da pasta /public`);
});