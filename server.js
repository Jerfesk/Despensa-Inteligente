const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/receita/:produto', async (req, res) => {
    const produto = req.params.produto;

    try {
        // Mudamos para gemini-1.5-flash-latest ou apenas gemini-1.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `Aja como um chef. Sugira uma receita para: ${produto}. 
        Responda apenas em JSON:
        {
          "nome": "nome",
          "ingredientes": [],
          "preparo": []
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const cleanJson = text.replace(/```json|```/g, "").trim();
        res.json(JSON.parse(cleanJson));

    } catch (error) {
        console.error("ERRO:", error);
        res.status(500).json({ 
            erro: "Erro ao chamar a IA", 
            detalhe: "Tente novamente em alguns segundos ou verifique a chave." 
        });
    }
});

app.listen(3000, () => console.log("API rodando na porta 3000!"));