const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const API_KEY = process.env.GEMINI_API_KEY;

app.get('/receita/:produto', async (req, res) => {
    const produto = req.params.produto;
    // URL usando v1 e o modelo flash direto
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const data = {
        contents: [{ parts: [{ text: `Sugira uma receita com ${produto}. Responda apenas um JSON: {"nome": "string", "ingredientes": [], "preparo": []}` }] }]
    };

    try {
        const response = await axios.post(url, data);
        const textoIA = response.data.candidates[0].content.parts[0].text;
        const cleanJson = textoIA.replace(/```json|```/g, "").trim();
        res.json(JSON.parse(cleanJson));
    } catch (error) {
        console.error("ERRO:", error.response ? error.response.data : error.message);
        res.status(500).json({ erro: "Erro na API", detalhe: "Verifique se a nova chave está ativa." });
    }
});

app.listen(3000, () => console.log("Servidor rodando na 3000"));