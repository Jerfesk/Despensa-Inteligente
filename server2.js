const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
// Lembre-se de trocar essa chave se ela for revogada por segurança
//const API_KEY =  process.env.GEMINI_API_KEY; 

app.get('/receita/:produto', async (req, res) => {
    const produto = req.params.produto;
    
    // ATUALIZADO: Usando o modelo gemini-2.5-flash encontrado na sua lista
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const data = {
        contents: [{
            parts: [{
                text: `Crie uma receita com ${produto}. Responda estritamente apenas um objeto JSON: {"nome": "string", "ingredientes": [], "preparo": []}`
            }]
        }],
        // Configuração extra para garantir que a IA responda em JSON puro
        generationConfig: {
            response_mime_type: "application/json"
        }
    };

    try {
        const response = await axios.post(url, data);
        
        // No Gemini 2.5+, a estrutura de resposta permanece similar
        if (response.data.candidates && response.data.candidates[0].content) {
            const textoIA = response.data.candidates[0].content.parts[0].text;
            
            // Como usamos response_mime_type, a resposta já vem como string JSON limpa
            res.json(JSON.parse(textoIA));
        } else {
            res.status(500).json({ erro: "IA não gerou conteúdo", detalhe: response.data });
        }

    } catch (error) {
        const mensagemErro = error.response ? error.response.data : error.message;
        console.error("ERRO DETALHADO:", mensagemErro);
        
        res.status(500).json({ 
            erro: "Falha na resposta do Google", 
            detalhe: mensagemErro 
        });
    }
});

app.listen(3000, () => {
    console.log("✅ Servidor rodando em: http://localhost:3000");
    console.log("🚀 Teste no Codespace: /receita/ovo (sem os dois pontos)");
});