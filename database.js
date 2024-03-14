const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    password: "senha",
    host: "localhost",
    port: 5432,
    database: "sistema_gamificado"
});


// const createTableQuery = `CREATE TABLE users (...
// const insertEstudoQuery = `INSERT ...

// 1 - TABELA users
// CREATE TABLE users (
//     user_id SERIAL PRIMARY KEY,
//     name VARCHAR(50) NOT NULL,
//     email VARCHAR(50) UNIQUE NOT NULL,
//     password VARCHAR(255) NOT NULL,
//     profile_image_url VARCHAR(255),
//     pontuacao_geral INTEGER,
//     preferencia_estudo INTEGER
// );


// 2 - TABELA conquistas
// CREATE TABLE conquistas (
//     id SERIAL PRIMARY KEY,
//     nome_conquista VARCHAR(255),
//     descricao VARCHAR(255)
// );

// INSERT INTO conquistas (nome_conquista, descricao) VALUES
//     ('Primeiro conteúdo concluído', 'Descrição inventada para o primeiro conteúdo concluído.'),
//     ('5 conteúdos concluídos', 'Descrição inventada para a conclusão de 5 conteúdos.'),
//     ('10 conteúdos concluídos', 'Descrição inventada para a conclusão de 10 conteúdos.'),
//     ('Estudo Backend', 'Descrição inventada para o estudo de Backend.'),
//     ('Estudo Frontend', 'Descrição inventada para o estudo de Frontend.'),
//     ('Estudo Database', 'Descrição inventada para o estudo de Database.'),
//     ('Estudo Devops', 'Descrição inventada para o estudo de Devops.'),
//     ('Estudo Mobile', 'Descrição inventada para o estudo de Mobile.'),
//     ('Estudo UX e Design', 'Descrição inventada para o estudo de UX e Design.');



// 3 - TABELA usuarios_conquistas 
// CREATE TABLE usuarios_conquistas (
//     user_id INTEGER REFERENCES users(user_id),
//     conquista_id INTEGER REFERENCES conquistas(id),
//     PRIMARY KEY (user_id, conquista_id)
// );


// ==================== 4 - TABELA estudos =============================
// CREATE TABLE estudos (
//     id SERIAL PRIMARY KEY,
//     nome VARCHAR(255) NOT NULL
// );


// INSERT INTO estudos (nome) VALUES
//     ('Backend'),
//     ('Frontend'),
//     ('Database'),
//     ('Devops E Automação De Infraestrutura'),
//     ('Mobile'),
//     ('UX e Design');
// ====================================================================

// =======================5 - TABELA conteudos=========================
// CREATE TABLE conteudos (
//     id SERIAL PRIMARY KEY,
//     titulo VARCHAR(255) NOT NULL,
//     descricao TEXT,
//     estudo_id INTEGER REFERENCES estudos(id),
//     pontos INTEGER,
//     materiais JSON
// );

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
//     resposta_correta CHAR(1)
// );

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual é a principal característica do Node.js?', 1, 'Assíncrono', 'Síncrono', 'Monolítico', 'Modular', 'A');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual módulo é utilizado para criar um servidor HTTP no Node.js?', 1, 'http', 'fs', 'express', 'path', 'C');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('O que é o npm?', 1, 'Node Package Manager', 'Node Project Manager', 'Node Package Module', 'Node Project Module', 'A');

// INSERT INTO perguntas (pergunta, conteudo_id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES
//     ('Qual método é usado para ler dados de um formulário em uma aplicação Express.js?', 1, 'GET', 'POST', 'PUT', 'DELETE', 'B');
// ====================================================================


// 8 - TABELA questionnaire_responses
// CREATE TABLE questionnaire_responses (
//     response_id SERIAL PRIMARY KEY,
//     user_id INTEGER REFERENCES users(user_id),
//     question1 BOOLEAN,
//     question2 BOOLEAN,
//     question3 BOOLEAN,
//     created_at TIMESTAMP
// );


// 9 - TABELA respostas
// CREATE TABLE respostas (
//     id SERIAL PRIMARY KEY,
//     user_id INTEGER REFERENCES users(user_id),
//     pergunta_id INTEGER REFERENCES perguntas(id),
//     resposta_do_usuario CHAR(1),
//     resposta_correta BOOLEAN
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
