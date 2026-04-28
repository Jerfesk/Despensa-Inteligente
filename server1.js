const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
// COLE SUA CHAVE DIRETAMENTE AQUI ENTRE AS ASPAS PARA TESTAR:
const API_KEY = "AIzaSyCxZyuTVZv0po_AD7xL92sgmTkt5hu0UZw";

app.get('/receita/:produto', async (req, res) => {
    const produto = req.params.produto;
    // const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${API_KEY}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    const data = {
        contents: [{
            parts: [{
                text: `Crie uma receita com ${produto}. Responda apenas um JSON: {"nome": "string", "ingredientes": [], "preparo": []}`
            }]
        }]
    };

    try {
        const response = await axios.post(url, data);
        
        // Verifica se a estrutura da resposta existe antes de acessar
        if (response.data.candidates && response.data.candidates[0].content) {
            let textoIA = response.data.candidates[0].content.parts[0].text;
            const cleanJson = textoIA.replace(/```json|```/g, "").trim();
            res.json(JSON.parse(cleanJson));
        } else {
            res.status(500).json({ erro: "IA não gerou conteúdo", detalhe: response.data });
        }

    } catch (error) {
        // ESSA PARTE É A MAIS IMPORTANTE: Ver o erro real no terminal
        const mensagemErro = error.response ? error.response.data.error.message : error.message;
        console.error("ERRO DETALHADO NO TERMINAL:", mensagemErro);
        
        res.status(500).json({ 
            erro: "Falha na resposta do Google", 
            detalhe: mensagemErro 
        });
    }
});

app.listen(3000, () => console.log("Servidor ativo na porta 3000"));