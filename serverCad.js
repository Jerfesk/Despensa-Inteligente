const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.use(express.static('public'));
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : undefined;
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui';

if (!API_KEY) {
    console.error("❌ ERRO: GEMINI_API_KEY não encontrada!");
}

// --- BANCO DE DADOS ---
const db = new sqlite3.Database('./estoque.db', (err) => {
    if (err) console.error("Erro no banco:", err.message);
    else {
        console.log("📦 Conectado ao banco de dados SQLite.");
        // Tabela de Produtos
        db.run(`CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT,
            nome TEXT,
            quantidade INTEGER,
            validade TEXT
        )`);
        // Tabela de Usuários
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            senha TEXT,
            resetToken TEXT
        )`);
    }
});

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
// Protege as rotas da API para que apenas usuários logados acessem
const autenticarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ erro: "Acesso negado. Faça login." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ erro: "Token inválido ou expirado." });
        req.user = user;
        next();
    });
};

// --- ROTAS DE USUÁRIO (LOGIN/CADASTRO/RESET) ---

// Rota para criar o primeiro usuário (ou novos)
app.post('/api/auth/registrar', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const senhaHash = await bcrypt.hash(senha, 10);
        db.run(`INSERT INTO usuarios (email, senha) VALUES (?, ?)`, [email, senhaHash], (err) => {
            if (err) return res.status(400).json({ erro: "E-mail já cadastrado." });
            res.json({ sucesso: true, mensagem: "Usuário criado!" });
        });
    } catch (e) {
        res.status(500).json({ erro: "Erro ao processar cadastro." });
    }
});

// Rota de Login
app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;
    db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], async (err, user) => {
        if (err) return res.status(500).json({ erro: "Erro no servidor." });
        if (!user) return res.status(401).json({ erro: "Usuário não encontrado." });

        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) return res.status(401).json({ erro: "Senha incorreta." });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ sucesso: true, token });
    });
});

// Esqueci a Senha (Gera token e enviaria e-mail)
app.post('/api/auth/esqueci-senha', (req, res) => {
    const { email } = req.body;
    const tokenReset = Math.random().toString(36).substring(2, 10); // Token simples para exemplo

    db.run(`UPDATE usuarios SET resetToken = ? WHERE email = ?`, [tokenReset, email], function(err) {
        if (err || this.changes === 0) return res.status(404).json({ erro: "E-mail não encontrado." });

        // Configuração do Transportador de E-mail (Exemplo com Gmail)
        // Nota: Requer "Senha de App" configurada no Google
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperação de Senha - Despensa Inteligente',
            text: `Seu código de recuperação é: ${tokenReset}. Use-o para redefinir sua senha.`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error("Erro e-mail:", error);
                return res.status(500).json({ erro: "Erro ao enviar e-mail.", detalhe: error.message });
            }
            res.json({ sucesso: true, mensagem: "E-mail enviado com sucesso!" });
        });
    });
});

// --- ROTA PARA DEFINIR A NOVA SENHA (PASSO FINAL) ---
app.post('/api/auth/redefinir-senha', async (req, res) => {
    const { email, token, novaSenha } = req.body;

    if (!email || !token || !novaSenha) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
    }

    // Verifica se o e-mail e o código (token) batem com o que está no banco
    db.get(`SELECT * FROM usuarios WHERE email = ? AND resetToken = ?`, [email, token], async (err, user) => {
        if (err) {
            return res.status(500).json({ erro: "Erro ao consultar o banco de dados." });
        }
        
        if (!user) {
            return res.status(400).json({ erro: "E-mail ou código de recuperação inválido." });
        }

        try {
            // Cria o hash da nova senha
            const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

            // Atualiza a senha e limpa o token de reset para que não seja usado de novo
            db.run(`UPDATE usuarios SET senha = ?, resetToken = NULL WHERE email = ?`, [novaSenhaHash, email], function(err) {
                if (err) {
                    return res.status(500).json({ erro: "Erro ao atualizar a senha no banco." });
                }
                res.json({ sucesso: true, mensagem: "Senha alterada com sucesso!" });
            });
        } catch (e) {
            res.status(500).json({ erro: "Erro ao processar a nova senha." });
        }
    });
});

// --- ROTAS DE PRODUTOS (PROTEGIDAS) ---

app.get('/api/produto/:codigo', autenticarToken, async (req, res) => {
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
        res.status(500).json({ erro: "Erro na API externa" });
    }
});

app.get('/api/estoque', autenticarToken, (req, res) => {
    db.all(`SELECT * FROM produtos`, [], (err, rows) => {
        if (err) res.status(500).json({ erro: err.message });
        else res.json(rows);
    });
});

app.post('/api/estoque', autenticarToken, (req, res) => {
    const { codigo, nome, quantidade, validade } = req.body;
    db.run(`INSERT INTO produtos (codigo, nome, quantidade, validade) VALUES (?, ?, ?, ?)`, 
    [codigo, nome, quantidade, validade], function(err) {
        if (err) res.status(500).json({ erro: err.message });
        else res.json({ sucesso: true, id: this.lastID });
    });
});

app.put('/api/estoque/:id', autenticarToken, (req, res) => {
    const { quantidade, validade } = req.body;
    db.run(`UPDATE produtos SET quantidade = ?, validade = ? WHERE id = ?`, 
    [quantidade, validade, req.params.id], (err) => {
        if (err) res.status(500).json({ erro: err.message });
        else res.json({ sucesso: true });
    });
});

app.delete('/api/estoque/:id', autenticarToken, (req, res) => {
    db.run(`DELETE FROM produtos WHERE id = ?`, req.params.id, (err) => {
        if (err) res.status(500).json({ erro: err.message });
        else res.json({ sucesso: true });
    });
});

// --- GERAÇÃO DE RECEITA COM IA ---
app.get('/receita/:produto', autenticarToken, async (req, res) => {
    const produto = req.params.produto;

    if (!API_KEY || API_KEY === 'undefined') {
        return res.status(500).json({ erro: "Chave Gemini não configurada." });
    }

    // ALTERAÇÃO: Usando a versão v1beta (que suporta o flash) e o sufixo -latest
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const data = {
        contents: [{
            parts: [{ text: `Crie uma receita simples com ${produto}. Responda apenas o JSON puro, sem markdown: {"nome": "string", "ingredientes": [], "preparo": []}.` }]
        }]
    };

    try {
        const response = await axios.post(url, data);
        
        if (response.data.candidates && response.data.candidates[0].content) {
            let textoIA = response.data.candidates[0].content.parts[0].text;
            
            // Limpa o texto caso a IA envie marcações de bloco de código markdown
            textoIA = textoIA.replace(/```json/g, "").replace(/```/g, "").trim();
            
            res.json(JSON.parse(textoIA));
        } else {
            throw new Error("Resposta da IA vazia ou malformada");
        }

    } catch (error) {
        // Log detalhado no terminal para você ver o que está acontecendo
        if (error.response) {
            console.error("Erro da API Google:", error.response.data);
        } else {
            console.error("Erro de conexão:", error.message);
        }

        res.status(500).json({ 
            erro: "Erro na IA", 
            detalhe: "O modelo solicitado não respondeu. Verifique sua cota ou chave API." 
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);
});