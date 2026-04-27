const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/receita/:produto', async (req, res) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const produto = req.params.produto;

    const prompt = `Sugira uma receita para usar o produto: ${produto}. 
    Responda em JSON: { "nome": "", "ingredientes": [], "preparo": [] }`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        // O Gemini às vezes coloca crases no JSON, este replace limpa isso:
        const cleanJson = response.text().replace(/```json|```/g, "");
        res.json(JSON.parse(cleanJson));
    } catch (error) {
        res.status(500).json({ erro: "Erro ao chamar a IA" });
    }
});

app.listen(3000, () => console.log("API rodando na porta 3000!"));