# 1. Apresentação do Grupo

Contido em [README.md](README.md)

---

# 2. PADRÕES DE PROJETO (GoF)

## 2.1 Singleton

| Propriedade | Descrição |
|---|---|
| **Categoria** | Criacional |
| **Problema Resolvido** | Garantir uma única instância do banco de dados durante a execução do sistema |
| **Aplicação no Projeto** | O SQLite é inicializado apenas uma vez e reutilizado em todas as rotas da aplicação |

### Diagrama UML

```
+----------------------+
| Database             |
+----------------------+
| - instance           |
+----------------------+
| + getInstance()      |
+----------------------+
```

### Código do Projeto

```javascript
const db = new sqlite3.Database('./estoque.db', (err) => {
    if (err) console.error(err.message);
});
```

### Justificativa

A conexão com o banco é compartilhada globalmente no sistema, evitando múltiplas conexões desnecessárias.

---

## 2.2 Middleware (Chain of Responsibility)

| Propriedade | Descrição |
|---|---|
| **Categoria** | Comportamental |
| **Problema Resolvido** | Permitir processamento em cadeia antes da execução da rota principal |
| **Aplicação no Projeto** | O middleware `autenticarToken` intercepta requisições protegidas verificando autenticação JWT |

### Diagrama UML

```
Requisição
     ↓
Middleware JWT
     ↓
Endpoint Protegido
```

### Código do Projeto

```javascript
const autenticarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token)
        return res.status(401).json({ erro: "Acesso negado" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ erro: "Token inválido" });

        req.user = user;
        next();
    });
};
```

### Justificativa

O middleware funciona como uma cadeia de validação antes de permitir acesso às rotas protegidas.

---

## 2.3 Adapter

| Propriedade | Descrição |
|---|---|
| **Categoria** | Estrutural |
| **Problema Resolvido** | Adaptar APIs externas ao formato interno da aplicação |
| **Aplicação no Projeto** | A API do OpenFoodFacts retorna diversos dados, mas o sistema adapta apenas as informações necessárias |

### Diagrama UML

```
Sistema ---> Adapter ---> OpenFoodFacts API
```

### Código do Projeto

```javascript
const nomeProduto = 
    response.data.product.product_name_pt || 
    response.data.product.product_name;

res.json({
    encontrado: true,
    nome: nomeProduto
});
```

### Justificativa

O sistema converte os dados externos em um formato simples utilizado pela aplicação.

---

# 3. DOCUMENTAÇÃO DE APIs

## 3.1 Tecnologias Utilizadas

- **Backend:** Express.js
- **Banco de Dados:** SQLite
- **Autenticação:** JWT.io

## 3.2 Endpoints Documentados

| Método | Endpoint | Função |
|--------|----------|--------|
| POST | `/api/auth/registrar` | Cadastro |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/esqueci-senha` | Recuperação de Senha |
| POST | `/api/auth/redefinir-senha` | Nova Senha |
| GET | `/api/produto/:codigo` | Buscar Produto |
| GET | `/api/estoque` | Listar Estoque |
| POST | `/api/estoque` | Adicionar Produto |
| PUT | `/api/estoque/:id` | Atualizar Produto |
| DELETE | `/api/estoque/:id` | Remover Produto |
| GET | `/receita/:produto` | Gerar Receita (IA) |
| GET | `/api/sugestoes` | Sugestões (IA) |
| GET | `/api/usuario/meu-perfil` | Perfil do Usuário |

## 3.3 Exemplo: Endpoint de Login

### Endpoint
```http
POST /api/auth/login
```

### Request
```json
{
  "email": "usuario@email.com",
  "senha": "123456"
}
```

### Response (Sucesso)
```json
{
  "sucesso": true,
  "token": "jwt_token_aqui"
}
```

### Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Login realizado com sucesso |
| 401 | Usuário ou senha inválidos |
| 500 | Erro interno do servidor |

## 3.4 Documentação Swagger/OpenAPI

A documentação da API foi desenvolvida utilizando o padrão **OpenAPI/Swagger**, permitindo testes e visualização interativa dos endpoints da aplicação.

### Bibliotecas Recomendadas

- `swagger-ui-express`
- `swagger-jsdoc`

---

# 4. INTELIGÊNCIA ARTIFICIAL NA APLICAÇÃO

## 4.1 Objetivo da IA

A Inteligência Artificial foi utilizada para **gerar receitas culinárias automaticamente** com base nos produtos cadastrados no estoque da aplicação. O objetivo é auxiliar o usuário no aproveitamento de alimentos disponíveis na despensa.

## 4.2 Ferramenta Utilizada

**API da Groq** utilizando o modelo **Llama 3.3**

### Justificativa da Escolha

- ✅ Alta velocidade de resposta
- ✅ Compatibilidade com API OpenAI
- ✅ Fácil integração com Node.js
- ✅ Baixo custo operacional

## 4.3 Funcionamento da IA

### Fluxo da Funcionalidade

```
Usuário 
   ↓
Sistema 
   ↓
API IA (Groq/Llama) 
   ↓
Receita (JSON) 
   ↓
Usuário
```

### Passo a Passo

1. Usuário informa ingrediente desejado
2. Sistema envia prompt para API IA
3. IA gera receita em formato JSON
4. Sistema retorna resultado formatado

## 4.4 Prova de Conceito (PoC)

### Endpoint

```http
GET /receita/:produto
```

### Exemplo de Requisição

```http
GET /receita/arroz
```

### Resposta da IA

```json
{
  "nome": "Arroz Temperado",
  "ingredientes": [
    "arroz",
    "alho",
    "cebola"
  ],
  "preparo": [
    "Refogue os ingredientes",
    "Adicione o arroz",
    "Cozinhe por 20 minutos"
  ]
}
```

### Código da Integração IA

```javascript
const resposta = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
        {
            role: "user",
            content: "Crie uma receita simples com os ingredientes fornecidos"
        }
    ]
});
```

---

# 5. CHECKPOINT 2 — ESTADO ATUAL DO PROJETO

✅ **Demonstrado**
