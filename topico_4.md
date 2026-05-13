1. Apresentação do grupo
   Contido em README.md

3. PADRÕES DE PROJETO (GoF)
2.1 Singleton
	Categoria
Criacional
	Problema resolvido
Garantir uma única instância do banco de dados durante a execução do sistema.
	Aplicação no projeto
O SQLite é inicializado apenas uma vez e reutilizado em todas as rotas da aplicação.
	UML
+----------------------+
| Database             |
+----------------------+
| - instance           |
+----------------------+
| + getInstance()      |
+----------------------+

	Código do projeto
const db = new sqlite3.Database('./estoque.db', (err) => {
    if (err) console.error(err.message);
});

	Justificativa
A conexão com o banco é compartilhada globalmente no sistema, evitando múltiplas conexões desnecessárias.

2.2 Middleware (Chain of Responsibility)

	Categoria
Comportamental

	Problema resolvido
Permitir processamento em cadeia antes da execução da rota principal.

	Aplicação no projeto
O middleware autenticarToken intercepta requisições protegidas verificando autenticação JWT.

	UML

Requisição
       ▼
Middleware JWT
       ▼
Endpoint Protegido

	Código do projeto
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

	Justificativa
O middleware funciona como uma cadeia de validação antes de permitir acesso às rotas protegidas.

2.3 Adapter

	Categoria
Estrutural

	Problema resolvido
Adaptar APIs externas ao formato interno da aplicação.

	Aplicação no projeto
A API do OpenFoodFacts retorna diversos dados, mas o sistema adapta apenas as informações necessárias.

	UML
Sistema ---> Adapter ---> OpenFoodFacts API

	Código do projeto
const nomeProduto =
response.data.product.product_name_pt
|| response.data.product.product_name;

res.json({
    encontrado: true,
    nome: nomeProduto
});

	Justificativa
O sistema converte os dados externos em um formato simples utilizado pela aplicação.

3. DOCUMENTAÇÃO DE APIs

3.1 Tecnologias utilizadas
•	Backend: Express.js 
•	Banco de dados: SQLite 
•	Autenticação: JWT.io 

3.2 Endpoints documentados

Método	            Endpoint	            Função
POST	      /api/auth/registrar	        Cadastro
POST	      /api/auth/login	            Login
POST	      /api/auth/esqueci-senha	    Recuperação
POST	      /api/auth/redefinir-senha	  Nova senha
GET	        /api/produto/:codigo	      Buscar produto
GET	        /api/estoque	              Listar estoque
POST	      /api/estoque	              Adicionar produto
PUT	        /api/estoque/:id	          Atualizar produto
DELETE	    /api/estoque/:id	          Remover produto
GET	        /receita/:produto	          Receita IA
GET	        /api/sugestoes	            Sugestões IA
GET	        /api/usuario/meu-perfil	    Perfil

3.3 Exemplo de documentação

Login

	Endpoint
POST /api/auth/login

	Request
{
  "email": "usuario@email.com",
  "senha": "123456"
}

	Response
{
  "sucesso": true,
  "token": "jwt_token"
}

	Status HTTP
Código	Descrição
200	Login realizado
401	Usuário inválido
500	Erro interno

3.4 Exemplo Swagger/OpenAPI

A documentação da API foi desenvolvida utilizando o padrão OpenAPI/Swagger, permitindo testes e visualização dos endpoints da aplicação.

Bibliotecas recomendadas
•	Swagger UI Express 
•	Swagger JSDoc

4. INTELIGÊNCIA ARTIFICIAL NA APLICAÇÃO

4.1 Objetivo da IA
A Inteligência Artificial foi utilizada para gerar receitas culinárias automaticamente com base nos produtos cadastrados no estoque da aplicação.
O objetivo é auxiliar o usuário no aproveitamento de alimentos disponíveis na despensa.

4.2 Ferramenta utilizada
Foi utilizada a API da Groq utilizando o modelo Llama 3.3.

	Justificativa
A ferramenta foi escolhida devido:
•	alta velocidade de resposta 
•	compatibilidade com API OpenAI 
•	facilidade de integração com Node.js 
•	baixo custo operacional

4.3 Funcionamento da IA
Fluxo da funcionalidade:
Usuário -> Sistema -> API IA -> Receita -> Usuário
1.	Usuário informa ingrediente 
2.	Sistema envia prompt para IA 
3.	IA gera receita em JSON 
4.	Sistema retorna resultado formatado

4.4 Prova de Conceito (PoC)
	Endpoint utilizado
GET /receita/:produto

	Exemplo de requisição:
GET /receita/arroz

	Resposta da IA
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

	Código da integração IA
const resposta = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
        {
            role: "user",
            content: "Crie uma receita simples"
        }
    ]
});

5. CHECKPOINT 2 — ESTADO ATUAL DO PROJETO
Demonstrado
