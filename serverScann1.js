const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose(); // Importa o SQLite
const path = require('path');

const app = express();

app.use(express.static('public'));
app.use(express.json());

// ---------------------------------------------------------
// CONFIGURAÇÃO DO BANCO DE DADOS SQLITE
// ---------------------------------------------------------
// Isso cria um arquivo chamado estoque.db automaticamente
const db = new sqlite3.Database('./estoque.db', (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
    } else {
        console.log("📦 Conectado ao banco de dados SQLite.");
        
        // Cria a tabela de produtos caso ela não exista
        db.run(`CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT,
            nome TEXT,
            quantidade INTEGER,
            validade TEXT
        )`);
    }
});

// ---------------------------------------------------------
// ROTAS DO SERVIDOR
// ---------------------------------------------------------

// ROTA 1: Buscar produto na API externa (OpenFoodFacts)
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

// ROTA 2: Salvar novo produto no banco (INSERT)
app.post('/api/estoque', (req, res) => {
    const { codigo, nome, quantidade, validade } = req.body;
    
    const sql = `INSERT INTO produtos (codigo, nome, quantidade, validade) VALUES (?, ?, ?, ?)`;
    
    // O SQLite substitui os "?" pelos valores da array para evitar invasões (SQL Injection)
    db.run(sql, [codigo, nome, quantidade, validade], function(err) {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        res.json({ sucesso: true, id: this.lastID, mensagem: "Produto salvo no banco SQL!" });
    });
});

// ROTA 3: Listar todo o estoque (SELECT)
app.get('/api/estoque', (req, res) => {
    const sql = `SELECT * FROM produtos`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        res.json(rows); // Devolve as linhas da tabela em formato JSON para o HTML
    });
});

// ROTA 4: Deletar um produto (DELETE)
app.delete('/api/estoque/:id', (req, res) => {
    const id = req.params.id;
    const sql = `DELETE FROM produtos WHERE id = ?`;
    
    db.run(sql, id, function(err) {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        res.json({ sucesso: true });
    });
});

// ROTA 5: Atualizar um produto (UPDATE)
app.put('/api/estoque/:id', (req, res) => {
    const id = req.params.id;
    const { quantidade, validade } = req.body;
    
    const sql = `UPDATE produtos SET quantidade = ?, validade = ? WHERE id = ?`;
    
    db.run(sql, [quantidade, validade, id], function(err) {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        res.json({ sucesso: true, mensagem: "Produto atualizado!" });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);
});