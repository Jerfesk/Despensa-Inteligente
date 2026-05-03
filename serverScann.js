const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = './estoque.json';

app.use(express.static('public'));
app.use(express.json());

// Função auxiliar para ler o estoque do arquivo JSON
const lerEstoque = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
};

// Função auxiliar para salvar no arquivo JSON
const salvarNoArquivo = (dados) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2));
};

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

// ROTA 2: Salvar novo produto no estoque
app.post('/api/estoque', (req, res) => {
    const novoProduto = req.body;
    const estoque = lerEstoque();
    
    // Adiciona um ID único usando o timestamp
    novoProduto.id = Date.now();
    estoque.push(novoProduto);
    
    salvarNoArquivo(estoque);
    res.json({ sucesso: true, mensagem: "Produto salvo!" });
});

// ROTA 3: Listar todo o estoque
app.get('/api/estoque', (req, res) => {
    const estoque = lerEstoque();
    res.json(estoque);
});

// ROTA 4: Deletar um produto
app.delete('/api/estoque/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let estoque = lerEstoque();
    estoque = estoque.filter(p => p.id !== id);
    salvarNoArquivo(estoque);
    res.json({ sucesso: true });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);
});