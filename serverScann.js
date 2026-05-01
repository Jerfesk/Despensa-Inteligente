const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

// Serve os arquivos da pasta public (onde estão seus HTMLs)
app.use(express.static('public')); 
// Permite que o servidor entenda JSON (útil para quando formos salvar no estoque)
app.use(express.json());

// Rota focada APENAS em buscar a descrição do produto
app.get('/api/produto/:codigo', async (req, res) => {
    const codigo = req.params.codigo;
    
    try {
        // Consulta o banco de dados global de produtos alimentícios
        const url = `https://br.openfoodfacts.org/api/v0/product/${codigo}.json`;
        const response = await axios.get(url);
        
        if (response.data.status === 1) {
            // Produto encontrado! Pega o nome em português ou o nome padrão
            const nomeProduto = response.data.product.product_name_pt || response.data.product.product_name;
            res.json({ encontrado: true, nome: nomeProduto });
        } else {
            // Produto não cadastrado na base deles
            res.json({ encontrado: false, nome: "" });
        }
    } catch (error) {
        console.error("Erro na API de produtos:", error.message);
        res.status(500).json({ erro: "Falha na comunicação com o banco de produtos" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);
    console.log(`📂 Servindo arquivos da pasta /public`);
});