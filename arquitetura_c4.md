Arquitetura do Sistema (Modelo C4) - mermaid.js

    title Diagrama de Contexto (C1) - App Despensa Inteligente

    %% Definindo os Atores e Sistemas
    Person(admin, "Usuário Administrador", "Gerencia o estoque e recebe alertas")
    Person(comum, "Usuário Comum", "Adiciona produtos via scanner")
    
    System(app, "App Despensa Inteligente", "Gerencia o estoque e monitora validades")
    
    System_Ext(api_codigo, "API de Código de Barras", "Fornece dados do produto")
    System_Ext(gemini, "API do Google Gemini", "Gera sugestões de receitas")
    System_Ext(email, "Serviço de E-mail", "Envia alertas de vencimento")

    %% Desenhando as Setas (Relacionamentos)
    Rel(admin, app, "Cadastra moradores e gerencia estoque")
    Rel(comum, app, "Adiciona/consome produtos")
    Rel(app, api_codigo, "Consulta dados a partir do código")
    Rel(app, gemini, "Envia produtos e solicita receitas")
    Rel(app, email, "Dispara avisos de validade")
    Rel(email, admin, "Entrega alertas e receitas")

    #################################################################
    
    title Diagrama de Contêineres (C2) - App Despensa Inteligente

    %% Atores (Pessoas) fora do sistema
    Person(admin, "Usuário Administrador", "Gerencia o estoque e recebe alertas")
    Person(comum, "Usuário Comum", "Acessa para adicionar produtos via scanner")

    %% Sistemas Externos
    System_Ext(api_codigo, "API de Código de Barras", "Converte o código lido nos dados do produto")
    System_Ext(gemini, "API do Google Gemini", "Gera sugestões de receitas personalizadas")
    System_Ext(email, "Serviço de E-mail", "Serviço SMTP para disparar os alertas")

    %% Fronteira do Sistema (A Caixa Tracejada)
    System_Boundary(sistema_despensa, "App Despensa Inteligente") {
        
        %% Contêineres Internos
        Container(web_app, "Aplicação Web (Front-end)", "React.js / HTML", "Interface do navegador onde o usuário bipa os produtos e gerencia a despensa.")
        
        Container(api, "API Principal (Back-end)", "Node.js / Express", "Camada lógica que recebe comandos do Front-end e aplica regras de negócio.")
        
        Container(worker, "Agendador de Tarefas", "Node.js (Cron Job)", "Processo em segundo plano que roda diariamente verificando as datas de validade.")
        
        ContainerDb(db, "Banco de Dados", "PostgreSQL", "Armazena informações de usuários, despensas, produtos e datas.")
    }

    %% Relacionamentos (As Setas)
    %% Note que agora podemos adicionar a tecnologia usada na seta
    Rel(admin, web_app, "Acessa e gerencia via", "HTTPS")
    Rel(comum, web_app, "Bipa produtos via", "HTTPS")
    
    Rel(web_app, api, "Faz requisições API", "JSON/HTTPS")
    
    Rel(api, db, "Lê e grava registros", "SQL")
    Rel(api, api_codigo, "Consulta o código", "HTTPS")
    
    Rel(worker, db, "Varre produtos próximos ao vencimento", "SQL")
    Rel(worker, gemini, "Solicita receita para ingredientes", "HTTPS/API")
    Rel(worker, email, "Comanda o envio do alerta", "HTTPS")
    
    Rel(email, admin, "Entrega o aviso de 7 dias e a receita", "E-mail")

    ##########################################################################

    title Diagrama de Componentes (C3) - API Principal (Back-end)

    %% Contêineres e Sistemas Externos que interagem com a API
    Container(web_app, "Aplicação Web (Front-end)", "React.js / HTML", "Interface que faz as requisições para a API")
    ContainerDb(db, "Banco de Dados", "PostgreSQL", "Armazenamento persistente")
    System_Ext(api_codigo, "API de Código de Barras", "Converte código em dados do produto")

    %% A Fronteira do Contêiner que estamos detalhando
    Container_Boundary(api_backend, "API Principal (Back-end)") {
        
        %% Camada de Controladores (Andar de cima)
        Component(auth_ctrl, "Controlador de Segurança", "Node.js / Express", "Gerencia login e validação de tokens JWT.")
        Component(pantry_ctrl, "Controlador de Despensa", "Node.js / Express", "Recebe requisições de adição/remoção de produtos no estoque.")
        
        %% Camada de Serviços (Andar do meio)
        Component(scanner_svc, "Serviço de Código de Barras", "Node.js", "Formata a requisição e abstrai a comunicação com a API externa.")
        
        %% Camada de Repositórios (Andar de baixo)
        Component(user_repo, "Repositório de Usuários", "Node.js / SQL", "Instruções exclusivas de acesso à tabela de usuários.")
        Component(product_repo, "Repositório de Produtos", "Node.js / SQL", "Instruções exclusivas de acesso à tabela de produtos e estoque.")
    }

    %% Relacionamentos (O fluxo de dados de cima para baixo)
    Rel(web_app, auth_ctrl, "Faz requisição de login", "JSON/HTTPS")
    Rel(web_app, pantry_ctrl, "Envia itens bipados pelo scanner", "JSON/HTTPS")
    
    Rel(auth_ctrl, user_repo, "Usa para validar credenciais")
    
    Rel(pantry_ctrl, scanner_svc, "Delega a busca do código de barras")
    Rel(pantry_ctrl, product_repo, "Usa para salvar novo item no estoque")
    
    Rel(scanner_svc, api_codigo, "Faz requisição GET para", "HTTPS")
    
    Rel(user_repo, db, "Lê e grava dados de perfis", "SQL")
    Rel(product_repo, db, "Lê e grava itens e validades", "SQL")
