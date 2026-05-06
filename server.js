const express = require('express');               //framework cria servidor em Node.js
const axios = require('axios');                   //faz requisições HTTP p/ API externa
const sqlite3 = require('sqlite3').verbose();     //importa SQlite3 e .verbose (ativa logs detalhados)
const path = require('path');                     //modulo do node para encaminhar arquivos

// Força o servidor a procurar o arquivo .env exatamente na mesma pasta deste arquivo
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();                 //cria aplicação do express
app.use(express.static('public'));    //pastas public a serem acessadas pelo navegador
app.use(express.json());              //p/ que o servidor entenda o JASON no body (corpo)

const API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : undefined;
// Pega a variável GEMINI_API_KEY do .env.
// Se existir, remove espaços com .trim().
// Se não existir, define como undefined.

if (!API_KEY) {     //mostra se houver erro, se sim mostra parte da chave, p/ verificar a leitura correta 
    console.error("❌ ERRO CRÍTICO: O arquivo .env não foi lido ou a chave está vazia!");
} else {
    console.log(`🔑 Chave de API (GEMINI_API_KEY) lida com sucesso. (Inicia com: ${API_KEY.substring(0, 5)}...)`);
}

// --- BANCO DE DADOS ---
const db = new sqlite3.Database('./estoque.db', (err) => {      //cria um banco chamado estoque.db
    if (err) console.error("Erro no banco:", err.message);      //erro ao conectar mostra no console
    else {
        console.log("📦 Conectado ao banco de dados SQLite."); // esta tudo ok, cria a tabela abaixo
        db.run(`CREATE TABLE IF NOT EXISTS produtos (         
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT,
            nome TEXT,
            quantidade INTEGER,
            validade TEXT
        )`);
    }
});

// ### ROTAS DE API, PARA ESTOQUE ###
app.get('/api/produto/:codigo', async (req, res) => {     //cria uma rota get, c/ parânmetro codigo
    const codigo = req.params.codigo;                     // Pega o código da URL 
    try {
        const url = `https://br.openfoodfacts.org/api/v0/product/${codigo}.json`; //Monta a URL da API externa
        const response = await axios.get(url);                                    //Faz requisição HTTP
        if (response.data.status === 1) {                                      //Verifica se o produto foi encontrado
            const nomeProduto = response.data.product.product_name_pt || response.data.product.product_name;  //Pega o nome em português ou fallback em inglês
            res.json({ encontrado: true, nome: nomeProduto });                //Retorna o resultado
        } else {   
            res.json({ encontrado: false });                                  //Se não encontrou
        }
    } catch (error) {
        res.status(500).json({ erro: "Erro na API" });                       //Erro geral
    }
});

// ###  LISTANDO PRODUTOS  ###

app.get('/api/estoque', (req, res) => {                          //Rota GET para listar produtos
    db.all(`SELECT * FROM produtos`, [], (err, rows) => {        //Executa SELECT no banco
        if (err) res.status(500).json({ erro: err.message });    //Erro
        else res.json(rows);                                     //Retorna todos os produtos.
    });
});

// ###  ATUALIZANDO PRODUTOS  ###
app.put('/api/estoque/:id', (req, res) => {                 //Rota PUT com ID
    const { quantidade, validade } = req.body;              //Pega dados do corpo da requisição
    db.run(`UPDATE produtos SET quantidade = ?, validade = ? WHERE id = ?`, [quantidade, validade, req.params.id], (err) => { //Atualiza o produto
        if (err) res.status(500).json({ erro: err.message });  //Callback
        else res.json({ sucesso: true });
    });
});

// ###  DELETANDO PRODUTOS  ###

app.delete('/api/estoque/:id', (req, res) => {                               //Rota DELETE
    db.run(`DELETE FROM produtos WHERE id = ?`, req.params.id, (err) => {    //Remove pelo ID
        if (err) res.status(500).json({ erro: err.message });                //Callback
        else res.json({ sucesso: true });
    });
});

// ###  INSERINDO PRODUTOS  ###

app.post('/api/estoque', (req, res) => {                            //Rota POST               
    const { codigo, nome, quantidade, validade } = req.body;        //Pega dados enviados
    db.run(`INSERT INTO produtos (codigo, nome, quantidade, validade) VALUES (?, ?, ?, ?)`, [codigo, nome, quantidade, validade], function(err) {   //Insere no banco
        if (err) res.status(500).json({ erro: err.message });
        else res.json({ sucesso: true, id: this.lastID });         //Retorna o ID do novo produto
    });
});

// ## ROTA GERAÇÃO DE RECEITA (IA) ###
app.get('/receita/:produto', async (req, res) => {              //Rota GET com nome do produto
    if (!API_KEY || API_KEY === 'undefined') {                  //Verifica se a chave é válida
        console.error("Tentativa de gerar receita, mas a API_KEY está undefined.");
        return res.status(500).json({                           //Interrompe se não tiver chave 
            erro: "O Servidor não conseguiu ler a variável GEMINI_API_KEY.", 
            detalhe: "O valor da chave está chegando como 'undefined'." 
        });
    }

    const produto = req.params.produto;                         //Pega o produto.
    console.log(`🤖 Gerando receita para: ${produto}...`);      //URL abaixo é da API do Gemini.

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const data = {
        contents: [{
            parts: [{
                text: `Crie uma receita com ${produto}. Responda estritamente apenas um objeto JSON: {"nome": "string", "ingredientes": [], "preparo": []}. Não use blocos de código markdown, apenas o texto do JSON.`
            }]
        }],                                              //Prompt enviado para IA
        generationConfig: {
            response_mime_type: "application/json"       //Força resposta em JSON
        }
    };

    // ### CHAMADA DA IA ###

    try {
        const response = await axios.post(url, data);
        
        if (response.data.candidates && response.data.candidates[0].content) {       //Verifica se veio resposta válida
            let textoIA = response.data.candidates[0].content.parts[0].text;         //Extrai o texto
            console.log("✅ Resposta da IA recebida!");

            // Limpa crases que a IA possa enviar por engano
            textoIA = textoIA.replace(/```json/g, '').replace(/```/g, '').trim();   //Remove formatação Markdown

            res.json(JSON.parse(textoIA));                                          //Converte string → JSON e retorna

            //  abaixo verificação de erros
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

const PORT = 3000;                                                     //Definição da porta
app.listen(PORT, () => {                                               //Inicia o servidor
    console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);   
});

// ### Resumo do código: 
// Cria um servidor web com Express
// Gerencia um banco SQLite (CRUD de produtos)
// Consulta produtos via API externa (OpenFoodFacts)
// Usa IA (Gemini) para gerar receitas