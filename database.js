const { Pool } = require("pg");


const pool = new Pool({
    user: "postgres",
    password: "pKwKvZWjRjNYWwlAhOFwycCItXEtsGMp",
    host: "junction.proxy.rlwy.net",
    port: 42944,
    database: "railway"
});

// const pool = new Pool({
//     user: "postgres",
//     password: "admin",
//     host: "localhost",
//     port: 5432,
//     database: "tcc-local"
// });


// const createTableQuery = `CREATE TABLE users (...
// const insertEstudoQuery = `INSERT ...


// CREATE TABLE login_history (
//     login_id SERIAL PRIMARY KEY,
//     user_id INTEGER REFERENCES users(user_id),
//     login_date DATE NOT NULL,
//     dias_seguidos INTEGER DEFAULT 1,
//     CONSTRAINT unique_user_login_date UNIQUE (user_id, login_date)
// );



// 1 - TABELA users
// CREATE TABLE users (
//     user_id SERIAL PRIMARY KEY,
//     name VARCHAR(50) NOT NULL,
//     email VARCHAR(50) UNIQUE NOT NULL,
//     password V'ARCHAR(255) NOT NULL,
//     profile_image_url VARCHAR(255),
//     pontuacao_geral INTEGER,
//     preferencias_estudo VARCHAR(255),
//     tipo_usuario VARCHAR(10) NOT NULL DEFAULT 'estudante',
//     username VARCHAR(50) UNIQUE
// );
// CREATE EXTENSION IF NOT EXISTS pgcrypto;
// INSERT INTO users (name, email, password, pontuacao_geral, tipo_usuario, username)
// VALUES ('Admin', 'admin@admin', crypt('admin', gen_salt('bf')), 0, 'admin', 'admin')



// 2 - TABELA conquistas
// CREATE TABLE conquistas (
//     id SERIAL PRIMARY KEY,
//     nome_conquista VARCHAR(255),
//     descricao VARCHAR(255)
// );

// INSERT INTO conquistas (nome_conquista, descricao) VALUES
//     ('Medalha', 'Parabéns! Você já conquistou medalha de top 3.'),
//     ('Primeiro conteúdo concluído', 'Parabéns! Primeiro conteúdo concluído.'),
//     ('5 conteúdos concluídos', 'Parabéns! Você chegou a conclusão de 5 conteúdos.'),
//     ('10 conteúdos concluídos', 'Parabéns! Você chegou a conclusão de 10 conteúdos.'),
//      ('Estudo Backend', 'Incrível! Você completou o estudo de Backend.'),
//     ('Estudo Frontend', 'Incrível! Você completou o estudo de Frontend.'),
//     ('Estudo Database', 'Incrível! Você completou o estudo de Database.'),
//     ('Estudo Devops', 'Incrível! Você completou o estudo de Devops.'),
//     ('Estudo Mobile', 'Incrível! Você completou o estudo de Mobile.'),
//     ('Estudo UX e Design', 'Incrível! Você completou o estudo de UX e Design.'),
//      ('Estudo Algoritmos', 'Incrível! Você completou o estudo de Algoritmos.')
// ===============================================

// 3 - TABELA usuarios_conquistas 
// CREATE TABLE usuarios_conquistas (
//     user_id INTEGER REFERENCES users(user_id),
//     conquista_id INTEGER REFERENCES conquistas(id),
//     PRIMARY KEY (user_id, conquista_id)
// );


// ==================== 4 - TABELA estudos =============================

// ======== NOVO ==========
// CREATE TABLE estudos (
//     id SERIAL PRIMARY KEY,
//     nome VARCHAR(255) NOT NULL,
//     descricao TEXT,
//     link VARCHAR(255),
//     linguagens VARCHAR(255)[] DEFAULT '{}'::VARCHAR[]
// );


// INSERT INTO estudos (nome, descricao, link, linguagens) 
// VALUES 
//     ('Backend', 'Estudo sobre o desenvolvimento de servidores, APIs e lógica de aplicativos.', 'https://roadmap.sh/backend', ARRAY['Java', 'Python', 'C#', 'Ruby']),
//     ('Frontend', 'Estudo sobre o desenvolvimento da interface do usuário em aplicações web.', 'https://roadmap.sh/frontend', ARRAY['JavaScript', 'HTML', 'CSS']),
//     ('Database', 'Estudo sobre modelagem, otimização e administração de bancos de dados.', 'https://roadmap.sh/postgresql-dba', ARRAY['SQL']),
//     ('Devops E Automação De Infraestrutura', 'Estudo sobre práticas DevOps, automação de infraestrutura e integração contínua/desenvolvimento contínuo (CI/CD).', 'https://roadmap.sh/devops', ARRAY['Bash', 'Python']),
//     ('Mobile', 'Estudo sobre desenvolvimento de aplicativos móveis para dispositivos iOS e Android.', 'https://roadmap.sh/android', ARRAY['Java', 'Kotlin', 'Swift']),
//     ('UX e Design', 'Estudo sobre design de experiência do usuário (UX), interfaces de usuário (UI) e princípios de design.', 'https://roadmap.sh/ux-design', ARRAY['UI/UX Design', 'Adobe XD']);


// PARA O ESTUDO DE CASO - ALGORITOMOS:

// INSERT INTO estudos (nome, descricao, link, linguagens) 
// VALUES 
//     ('Algoritmos', 'Estudo sobre algoritmos básicos, incluindo conceitos e implementações fundamentais.', 'https://www.dio.me/articles/roadmap-de-logica-de-programacao-navegando-pelo-caminho-para-dominar-os-fundamentos', ARRAY['Python', 'Java', 'C++', 'JavaScript']);

// ====================================================================

// =======================5 - TABELA conteudos=========================
// CREATE TABLE conteudos (
//     id SERIAL PRIMARY KEY,
//     titulo VARCHAR(255) NOT NULL,
//     descricao TEXT,
//     estudo_id INTEGER REFERENCES estudos(id),
//     pontos INTEGER,
//     materiais JSON,
//     videoConteudo VARCHAR(255),
//     tempoMaximo INTEGER
// );

// BACKEND 

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos, materiais) VALUES
//     ('Introdução ao Node.js', 'Aprenda sobre o ambiente de execução JavaScript server-side.', 1, 100, '["https://developer.mozilla.org/pt-BR/docs/Learn/Server-side/Express_Nodejs/Introduction", "https://learn.microsoft.com/pt-br/training/modules/intro-to-nodejs/", "https://dev.to/gabrielhsilvestre/introducao-ao-nodejs-14l1"]');

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos) VALUES
//     ('Express.js para iniciantes', 'Construa aplicativos web com o framework Express.js.', 1, 200);

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos) VALUES
//     ('RESTful APIs com Node.js', 'Desenvolva APIs utilizando padrões REST com Node.js.', 1, 300);

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos) VALUES
//     ('Node.js Avançado', 'Explore recursos avançados do Node.js.', 1, 400);

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos) VALUES
//     ('APIs RESTful com Express', 'Aprofunde-se na criação de APIs REST com Express.js.', 1, 500);

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos) VALUES
//     ('Segurança em Aplicações Node.js', 'Práticas de segurança para aplicações Node.js.', 1, 600);

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos) VALUES
//     ('Testes em Node.js', 'Estratégias e ferramentas para testar aplicações Node.js.', 1, 700);

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos) VALUES
//     ('Arquitetura de Microservices', 'Princípios e práticas de arquitetura de microservices.', 1, 800);

// ========= FRONTEND

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos) VALUES
//     ('Introdução ao HTML', 'Aprenda os conceitos básicos do HyperText Markup Language (HTML).', 2, 100);

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos) VALUES
//     ('CSS para Iniciantes', 'Explore os fundamentos do Cascading Style Sheets (CSS) para estilizar páginas web.', 2, 200);

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos) VALUES
//     ('JavaScript Básico', 'Introdução aos conceitos básicos da linguagem de programação JavaScript.', 2, 300);

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos) VALUES
//     ('React.js Fundamentos', 'Aprenda os fundamentos da biblioteca React.js para construir interfaces de usuário interativas.', 2, 400);

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos) VALUES
//     ('Consumindo APIs RESTful com Fetch API', 'Como consumir dados de APIs RESTful utilizando a Fetch API do JavaScript.', 2, 500);



// PARA ESTUDO DE CASOS SOBRE ALGORITMOS:

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos, materiais) VALUES
//     ('Introdução a Algoritmos', 'Aprenda os conceitos básicos de algoritmos, incluindo definição, importância e exemplos simples.', 7, 50, '["https://example.com/introducao-algoritmos"]');

// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos, materiais) VALUES
//     ('Expressões e Operadores em C++', 'Explore as expressões aritméticas e lógicas em C++, aprendendo a avaliar e entender o funcionamento dos operadores.', 7, 100, '["https://docente.ifrn.edu.br/brunogurgel/disciplinas/2012/fprog/aulas/cpp/aula3-operadores_e_expressoes.pdf"]');


// INSERT INTO conteudos (titulo, descricao, estudo_id, pontos, materiais, videoConteudo) VALUES
//     ('Estruturas de Controle em Algoritmos', 'Aprenda sobre as estruturas de controle essenciais em algoritmos, incluindo estruturas de decisão (if, else) e estruturas de repetição (for, while).', 7, 100, '["http://wiki.icmc.usp.br/images/e/e7/SCC0120_Rosane-04-algoritmos_controle_2014.pdf"]', 'https://www.youtube.com/watch?v=uCryhRKDg2w&feature=youtu.be');







// ====================================================================


// 6 - TABELA conclusoes
// CREATE TABLE conclusoes (
//     user_id INTEGER REFERENCES users(user_id),
//     conteudo_id INTEGER REFERENCES conteudos(id),
//     PRIMARY KEY (user_id, conteudo_id)
// );


// =======================7 - TABELA perguntas=========================
// CREATE TABLE perguntas (
//     id SERIAL PRIMARY KEY,
//     pergunta TEXT,
//     conteudo_id INTEGER REFERENCES conteudos(id),
//     opcao_a VARCHAR(255),
//     opcao_b VARCHAR(255),
//     opcao_c VARCHAR(255),
//     opcao_d VARCHAR(255),
//     resposta_correta CHAR(1),
//     minutagemPergunta INTEGER
// );

// PERGUNTA OFICIAL - BACKEND:

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) 
// VALUES ('O Node.js é um ambiente para execução de códigos de qual linguagem?', 1, 'Python', 'C++', 'Ruby', 'JavaScript', 'D');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) 
// VALUES ('Qual desses utilitários é desenvolvido em Node.js?', 1, 'npm', 'Pip', 'Maven', 'NuGet', 'A');

// UPDATE perguntas 
// SET pergunta = 'Qual desses utilitários é desenvolvido em Node.js?',
//     opcao_a = 'npm',
//     opcao_b = 'Pip',
//     opcao_c = 'Maven',
//     opcao_d = 'NuGet',
//     resposta_correta = 'A'
// WHERE conteudo_id = 1 and id=2;

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) 
// VALUES ('Qual dessas é responsável por compilar o código JavaScript para o formato nativo de máquina antes de executá-lo?', 1, 'WebAssembly', 'TypeScript', 'Máquina Virtual V8', 'Babel', 'C');

// UPDATE perguntas 
// SET pergunta = 'Qual dessas é responsável por compilar o código JavaScript para o formato nativo de máquina antes de executá-lo?',
//     opcao_a = 'WebAssembly',
//     opcao_b = 'TypeScript',
//     opcao_c = 'Máquina Virtual V8',
//     opcao_d = 'Babel',
//     resposta_correta = 'C'
// WHERE conteudo_id = 1 and id = 3;

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) 
// VALUES ('A arquitetura JavaScript é dividida basicamente em 3 partes, qual dessas NÃO faz parte?', 1, 'Call Stack', 'Callback Queue', 'Event Loop', 'NPM', 'D');

// UPDATE perguntas 
// SET pergunta = 'A arquitetura JavaScript é dividida basicamente em 3 partes, qual dessas NÃO faz parte?',
//     opcao_a = 'Call Stack',
//     opcao_b = 'Callback Queue',
//     opcao_c = 'Event Loop',
//     opcao_d = 'NPM',
//     resposta_correta = 'D'
// WHERE conteudo_id = 1 and id=4;


// UPDATE perguntas 
// SET pergunta = 'O Node.js é um ambiente para execução de códigos de qual linguagem?',
//     opcao_a = 'Python',
//     opcao_b = 'C++',
//     opcao_c = 'Ruby',
//     opcao_d = 'JavaScript',
//     resposta_correta = 'D'
// WHERE conteudo_id = 1 and id= 1;


// ============ FRONTEND ===================

// // --------- Introdução ao HTML
// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual é a tag utilizada para criar um link em HTML?', (SELECT id FROM conteudos WHERE titulo = 'Introdução ao HTML'), '<a>', '<link>', '<href>', '<url>', 'A');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual elemento HTML é usado para definir o título de uma página?', (SELECT id FROM conteudos WHERE titulo = 'Introdução ao HTML'), '<header>', '<title>', '<h1>', '<caption>', 'B');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual é o atributo usado para adicionar uma imagem a uma página HTML?', (SELECT id FROM conteudos WHERE titulo = 'Introdução ao HTML'), 'src', 'href', 'img', 'link', 'A');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual é o elemento HTML usado para criar uma lista ordenada?', (SELECT id FROM conteudos WHERE titulo = 'Introdução ao HTML'), '<ol>', '<ul>', '<li>', '<list>', 'A');

// // ---------  CSS para Iniciantes
// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual propriedade do CSS é usada para definir a cor do texto?', (SELECT id FROM conteudos WHERE titulo = 'CSS para Iniciantes'), 'color', 'background-color', 'font-color', 'text-color', 'A');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Como selecionar um elemento pelo seu ID em CSS?', (SELECT id FROM conteudos WHERE titulo = 'CSS para Iniciantes'), '#id', '.id', 'id', 'element[id]', 'A');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual é a função do atributo float em CSS?', (SELECT id FROM conteudos WHERE titulo = 'CSS para Iniciantes'), 'Define a cor do plano de fundo.', 'Define a largura do elemento.', 'Define o posicionamento do elemento em relação aos seus vizinhos.', 'Define o espaçamento interno do elemento.', 'C');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual é a unidade de medida mais usada para largura e altura em CSS?', (SELECT id FROM conteudos WHERE titulo = 'CSS para Iniciantes'), 'Pixels (px)', 'Porcentagem (%)', 'Centímetros (cm)', 'Polegadas (in)', 'A');

// // --------- JavaScript Básico
// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual é a função do operador typeof em JavaScript?', (SELECT id FROM conteudos WHERE titulo = 'JavaScript Básico'), 'Retorna o tipo de uma variável.', 'Retorna o valor de uma variável.', 'Retorna a referência de uma variável.', 'Retorna o tamanho de uma variável.', 'A');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Como você declara uma variável em JavaScript?', (SELECT id FROM conteudos WHERE titulo = 'JavaScript Básico'), 'variable x;', 'var x;', 'int x;', 'let x;', 'B');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('O que é uma função anônima em JavaScript?', (SELECT id FROM conteudos WHERE titulo = 'JavaScript Básico'), 'Uma função sem parâmetros.', 'Uma função sem nome atribuído.', 'Uma função sem corpo.', 'Uma função sem retorno.', 'B');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual método é usado para adicionar um elemento ao final de um array em JavaScript?', (SELECT id FROM conteudos WHERE titulo = 'JavaScript Básico'), 'push()', 'append()', 'addToEnd()', 'insertLast()', 'A');


// // --------- React.js Fundamentos
// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('O que é JSX em React.js?', (SELECT id FROM conteudos WHERE titulo = 'React.js Fundamentos'), 'Uma biblioteca para consultas de banco de dados.', 'Uma extensão de sintaxe que permite escrever HTML dentro de JavaScript.', 'Um método para manipulação de strings em JavaScript.', 'Um formato de arquivo para armazenar componentes React.', 'B');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual é o ciclo de vida de um componente em React.js?', (SELECT id FROM conteudos WHERE titulo = 'React.js Fundamentos'), 'Montagem, Atualização, Desmontagem', 'Inicialização, Execução, Finalização', 'Criação, Edição, Remoção', 'Abertura, Manipulação, Fechamento', 'A');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('O que é um estado (state) em React.js?', (SELECT id FROM conteudos WHERE titulo = 'React.js Fundamentos'), 'Uma propriedade que pode ser passada de pai para filho.', 'Uma variável global acessível em todos os componentes.', 'Um objeto que representa a condição atual de um componente.', 'Um método para definir a estrutura de um componente.', 'C');
    
// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//         ('Como você renderiza um componente React dentro de outro componente?', (SELECT id FROM conteudos WHERE titulo = 'React.js Fundamentos'), 'Usando a função renderComponent().', 'Utilizando a tag do componente como se fosse uma tag HTML.', 'Importando o componente e chamando-o como uma função.', 'Usando o método displayComponent().', 'B');
    
// // --------- Consumindo APIs RESTful com Fetch API
    // INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
    //     ('Qual é a função da Fetch API em JavaScript?', (SELECT id FROM conteudos WHERE titulo = 'Consumindo APIs RESTful com Fetch API'), 'Manipular datas.', 'Consumir dados de APIs RESTful.', 'Manipular strings.', 'Criar elementos HTML dinamicamente.', 'B');
    
    // INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
    //     ('Como você faz uma requisição GET usando a Fetch API?', (SELECT id FROM conteudos WHERE titulo = 'Consumindo APIs RESTful com Fetch API'), 'fetch(url, { method: "GET" })', 'fetch.get(url)', 'fetch(url)', 'fetch.get(url, { method: "GET" })', 'C');
    
    // INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
    //     ('O que é uma promessa (Promise) em JavaScript?', (SELECT id FROM conteudos WHERE titulo = 'Consumindo APIs RESTful com Fetch API'), 'Uma função que retorna um valor de forma síncrona.', 'Uma função que encapsula um valor que pode estar disponível imediatamente ou no futuro.', 'Uma função que só pode ser executada uma vez.', 'Uma função que permite aguardar a resposta de uma requisição assíncrona.', 'B');
    
    // INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
    //     ('Como você lida com erros em uma requisição Fetch?', (SELECT id FROM conteudos WHERE titulo = 'Consumindo APIs RESTful com Fetch API'), 'Usando a instrução try...catch.', 'Utilizando o método catch() na promessa retornada pela requisição.', 'Passando uma função de callback para o parâmetro error na requisição.', 'Não é possível lidar com erros em requisições Fetch.', 'B');
    



// PARA ESTUDO DE CASO:

// 1. Perguntas para o conteúdo "Introdução a Algoritmos"

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('O que é um algoritmo?', 9, 'Um conjunto de instruções para resolver um problema', 'Um tipo de dado', 'Uma linguagem de programação', 'Um compilador', 'A');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual é a principal característica de um algoritmo?', 9, 'Deve ser lento', 'Deve ser infinito', 'Deve ser bem definido e finito', 'Deve ser complicado', 'C');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual destas não é uma característica de um algoritmo?', 9, 'Claridade', 'Ambiguidade', 'Finito', 'Bem definido', 'B');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual das opções abaixo é um exemplo de algoritmo?', 9, 'Receita de bolo', 'Um livro de romance', 'Um filme', 'Uma pintura', 'A');


// ----------

// 2. Perguntas....

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
// ('Dadas as seguintes declarações: int a = 9, b = 4, c = -2; Qual o resultado da seguinte expressão em C++: (a + c) / (2 * b)', 9, '1', '1.75', '0.875', '0.5', 'C');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
// ('Dadas as seguintes declarações: int a = 9, b = 4, c = -2; Qual o resultado da seguinte expressão: a % b - c', 9, '3', '1', '-1', '0', 'A');


// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
// ('Dadas as seguintes declarações: int a = 9, b = 4, c = -2; float r = 3.5, s = 2.0, t = 0.5; Qual o resultado da seguinte expressão em C++: (a < b) || (r > s)', 9, 'true', 'false', '1', '0', 'A');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
// ('Dadas as seguintes declarações: int a = 9, b = 4, c = -2; float r = 3.5, s = 2.0, t = 0.5; Qual o resultado da seguinte expressão em C++: (b * t) == s && (a - b) < r', 9, 'true', 'false', '1', '0', 'B');


// 3. Perguntas para o conteúdo "Estruturas de Controle em Algoritmos"

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta, minutagemPergunta) VALUES
//     ('Qual das opções a seguir é uma estrutura de decisão em algoritmos?', 10, 'for', 'while', 'if', 'switch', 'C', 17);

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta, minutagemPergunta) VALUES
//     ('Qual estrutura de controle é usada para executar um bloco de código várias vezes?', 10, 'if', 'for', 'else', 'switch', 'B', 47);


// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta, minutagemPergunta) VALUES
//     ('O que a estrutura de controle "while" faz?', 10, 'Executa um bloco de código um número específico de vezes', 'Executa um bloco de código enquanto uma condição é verdadeira', 'Executa um bloco de código se uma condição for verdadeira', 'Para a execução do programa', 'B', 71);

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta, minutagemPergunta) VALUES
//     ('Qual das alternativas a seguir NÃO é uma estrutura de repetição?', 10, 'for', 'while', 'do-while', 'if', 'D', 101);

// MINUTAGENS:
// 17
// 47
// 71
// 102

// 3. 
// ====================================================================


// 8 - TABELA questionnaire_responses

// CREATE TABLE questionnaire_responses (
//     response_id SERIAL PRIMARY KEY,
//     user_id INTEGER REFERENCES users(user_id),
//     question1 TEXT,
//     question2 TEXT,
//     question3 TEXT,
//     created_at TIMESTAMP
// );


// 9 - TABELA respostas

// CREATE TABLE respostas (
//     id SERIAL PRIMARY KEY,
//     user_id INTEGER REFERENCES users(user_id),
//     pergunta_id INTEGER REFERENCES perguntas(id),
//     resposta_do_usuario CHAR(1),
//     resposta_correta BOOLEAN,
//     UNIQUE(user_id, pergunta_id)
// );




// pool.query(createTableQuery)
//     .then((Response) => {
//         console.log("Table Created");
//     })
//     .catch((err) => {
//         console.error(err);
//     });



// Promise.all([
//     pool.query(createTableConteudosConcluidos),
//   ])
//     .then(() => {
//       console.log("Dados inseridos com sucesso!");
//     })
//     .catch((err) => {
//       console.error("Erro ao inserir dados:", err);
//     })
//     .finally(() => {
//       pool.end(); // Fecha a conexão após a execução
//     });

module.exports = pool;
