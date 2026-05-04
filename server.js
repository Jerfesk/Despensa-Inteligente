const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Força o servidor a procurar o arquivo .env exatamente na mesma pasta deste arquivo
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(express.static('public'));
app.use(express.json());

// --- CORREÇÃO APLICADA: Lendo a variável GEMINI_API_KEY ---
const API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : undefined;

if (!API_KEY) {
    console.error("❌ ERRO CRÍTICO: O arquivo .env não foi lido ou a chave está vazia!");
} else {
    console.log(`🔑 Chave de API (GEMINI_API_KEY) lida com sucesso. (Inicia com: ${API_KEY.substring(0, 5)}...)`);
}

// --- BANCO DE DADOS ---
const db = new sqlite3.Database('./estoque.db', (err) => {
    if (err) console.error("Erro no banco:", err.message);
    else {
        console.log("📦 Conectado ao banco de dados SQLite.");
        db.run(`CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT,
            nome TEXT,
            quantidade INTEGER,
            validade TEXT
        )`);
    }
});

// --- ROTAS DE ESTOQUE ---
app.get('/api/produto/:codigo', async (req, res) => {
    const codigo = req.params.codigo;
    try {
        const url = `https://br.openfoodfacts.org/api/v0/product/${codigo}.json`;
        const response = await axios.get(url);
        if (response.data.status === 1) {
            const nomeProduto = response.data.product.product_name_pt || response.data.product.product_name;
            res.json({ encontrado: true, nome: nomeProduto });
        } else {
            res.json({ encontrado: false });
        }
    } catch (error) {
        res.status(500).json({ erro: "Erro na API" });
    }
});

app.get('/api/estoque', (req, res) => {
    db.all(`SELECT * FROM produtos`, [], (err, rows) => {
        if (err) res.status(500).json({ erro: err.message });
        else res.json(rows);
    });
});

app.put('/api/estoque/:id', (req, res) => {
    const { quantidade, validade } = req.body;
    db.run(`UPDATE produtos SET quantidade = ?, validade = ? WHERE id = ?`, [quantidade, validade, req.params.id], (err) => {
        if (err) res.status(500).json({ erro: err.message });
        else res.json({ sucesso: true });
    });
});

app.delete('/api/estoque/:id', (req, res) => {
    db.run(`DELETE FROM produtos WHERE id = ?`, req.params.id, (err) => {
        if (err) res.status(500).json({ erro: err.message });
        else res.json({ sucesso: true });
    });
});

app.post('/api/estoque', (req, res) => {
    const { codigo, nome, quantidade, validade } = req.body;
    db.run(`INSERT INTO produtos (codigo, nome, quantidade, validade) VALUES (?, ?, ?, ?)`, [codigo, nome, quantidade, validade], function(err) {
        if (err) res.status(500).json({ erro: err.message });
        else res.json({ sucesso: true, id: this.lastID });
    });
});

// --- ROTA DE RECEITA ---
app.get('/receita/:produto', async (req, res) => {
    if (!API_KEY || API_KEY === 'undefined') {
        console.error("Tentativa de gerar receita, mas a API_KEY está undefined.");
        return res.status(500).json({ 
            erro: "O Servidor não conseguiu ler a variável GEMINI_API_KEY.", 
            detalhe: "O valor da chave está chegando como 'undefined'." 
        });
    }

    const produto = req.params.produto;
    console.log(`🤖 Gerando receita para: ${produto}...`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const data = {
        contents: [{
            parts: [{
                text: `Crie uma receita com ${produto}. Responda estritamente apenas um objeto JSON: {"nome": "string", "ingredientes": [], "preparo": []}. Não use blocos de código markdown, apenas o texto do JSON.`
            }]
        }],
        generationConfig: {
            response_mime_type: "application/json"
        }
    };

    try {
        const response = await axios.post(url, data);
        
        if (response.data.candidates && response.data.candidates[0].content) {
            let textoIA = response.data.candidates[0].content.parts[0].text;
            console.log("✅ Resposta da IA recebida!");

            // Limpa crases que a IA possa enviar por engano
            textoIA = textoIA.replace(/```json/g, '').replace(/```/g, '').trim();

            res.json(JSON.parse(textoIA));
        } else {
            console.error("⚠️ Resposta da IA vazia ou inválida:", response.data);
            res.status(500).json({ erro: "IA não gerou conteúdo", detalhe: response.data });
        }
    } catch (error) {
        const erroDetalhado = error.response ? error.response.data : error.message;
        console.error("❌ ERRO NA CHAMADA DA IA:", erroDetalhado);
        res.status(500).json({ erro: "Falha na comunicação com o Google Gemini", detalhe: erroDetalhado });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);
});