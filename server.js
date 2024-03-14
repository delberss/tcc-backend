const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./database");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(express.json());
app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads"); // Caminho relativo à pasta do projeto
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

// Gera token JWT
const generateJWT = (userId) => {
  const secretKey = "seuSegredo"; // Substitua com uma chave secreta forte na produção
  const expiresIn = "1h"; // Define a expiração do token (por exemplo, 1 hora)

  const token = jwt.sign({ userId }, secretKey, { expiresIn });
  return token;
};

const verifyToken = (req, res, next) => {
  const tokenHeader = req.header("Authorization");

  if (!tokenHeader) {
    return res
      .status(401)
      .json({ success: false, message: "Token não fornecido" });
  }

  // Remova o prefixo "Bearer " do token
  const token = tokenHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, "seuSegredo"); // Substitua com a sua chave secreta
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ success: false, message: "Token inválido" });
  }
};

// 1 - FAZER LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT user_id, name, email, password, profile_image_url, pontuacao_geral, preferencia_estudo FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        const token = generateJWT(user.user_id);

        res.status(200).json({
          success: true,
          message: "Login efetuado com sucesso",
          user: {
            id: user.user_id,
            name: user.name,
            email: user.email,
            profileImageUrl: user.profile_image_url,
            preferenciaEstudo: user.preferencia_estudo,
            pontuacaoGeral: user.pontuacao_geral,
          },
          token: token,
        });
      } else {
        // Atraso de 1 segundo para dificultar ataques de força bruta
        await new Promise((resolve) => setTimeout(resolve, 1000));

        res.status(401).json({
          success: false,
          message: "A senha inserida está incorreta.",
        });
      }
    } else {
      // Atraso de 1 segundo para dificultar ataques de força bruta
      await new Promise((resolve) => setTimeout(resolve, 1000));

      res
        .status(401)
        .json({ success: false, message: "E-mail não cadastrado." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 2 - REGISTRAR USER
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validar dados
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Todos os campos são obrigatórios" });
    }

    // Verificar se o e-mail já está em uso
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "E-mail já foi usado" });
    }

    // Formatar o nome com as primeiras letras maiúsculas
    const formattedName = name.replace(/\b\w/g, (char) => char.toUpperCase());

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Utilizar transação para garantir operações atômicas
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertSTMT =
        "INSERT INTO users (name, email, password, pontuacao_geral) VALUES ($1, $2, $3, $4)";
      const values = [formattedName, email.toLowerCase(), hashedPassword, 0];

      await client.query(insertSTMT, values);

      await client.query("COMMIT");
      res
        .status(201)
        .json({ success: true, message: "Usuário criado com sucesso!" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: "Erro ao processar a solicitação" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 3 - USERS DO SISTEMA
app.get("/users", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT user_id, name, email, profile_image_url, pontuacao_geral FROM users"
    );
    const users = result.rows;

    const sanitizedUsers = users.map((user) => ({
      name: user.name,
      email: user.email,
      profile_image_url: user.profile_image_url,
      pontuacao_geral: user.pontuacao_geral,
    }));

    res.status(200).json(sanitizedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 4 - SETAR FOTO DE PERFIL DO USER
app.post("/upload", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const userId = req.user.userId;

    // req.file contém informações sobre o arquivo enviado
    const imageName = req.file.filename;

    await pool.query(
      "UPDATE users SET profile_image_url = $1 WHERE user_id = $2",
      [imageName, userId]
    );

    // Consultar novamente os dados do usuário após a atualização
    const updatedUserResult = await pool.query(
      "SELECT user_id, name, email, profile_image_url FROM users WHERE user_id = $1",
      [userId]
    );

    const updatedUser = updatedUserResult.rows[0];

    res.status(200).json({
      success: true,
      message: "Foto de perfil adicionada com sucesso",
      profile_image_url: updatedUser.profile_image_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 5 - ESTUDOS DO SISTEMA
app.get("/estudos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM estudos");
    const estudos = result.rows;

    res.status(200).json(estudos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 6 - QUAL ID DE UM ESTUDO
app.get("/id/:estudo", async (req, res) => {
  const { estudo } = req.params;

  try {
    const result = await pool.query(
      "SELECT id FROM estudos WHERE UPPER(nome) = $1",
      [estudo.toUpperCase()]
    );

    if (result.rows.length > 0) {
      const id = parseInt(result.rows[0].id, 10); // Convertendo para inteiro

      if (!isNaN(id)) {
        res.status(200).json(id);
      } else {
        res
          .status(500)
          .json({ success: false, message: "Erro na conversão para inteiro" });
      }
    } else {
      res
        .status(404)
        .json({ success: false, message: "Estudo não encontrado" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// 7 - CONTEUDOS DE UM ESTUDO
app.get("/conteudos/:estudo_id", async (req, res) => {
  const { estudo_id } = req.params;

  const estudoIdAsInt = parseInt(estudo_id, 10);

  try {
    const result = await pool.query(
      "SELECT id, titulo, descricao FROM conteudos WHERE estudo_id = $1 ORDER BY id",
      [estudoIdAsInt]
    );

    const conteudos = result.rows.map(({ id, titulo, descricao }) => ({
      id,
      titulo,
      descricao,
    }));

    res.status(200).json(conteudos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 8 - ADICIONA PERGUNTA
app.post("/add/pergunta", verifyToken, async (req, res) => {
  const {
    conteudo_id,
    pergunta,
    opcao_a,
    opcao_b,
    opcao_c,
    opcao_d,
    resposta_correta,
  } = req.body;

  try {
    // Verificar se o usuário tem permissão para adicionar perguntas
    // (pode ser baseado em algum critério específico, por exemplo, um nível de permissão)
    // Aqui, estou assumindo que todos os usuários podem adicionar perguntas.

    // Verificar se o conteúdo_id pertence ao usuário (é uma proteção adicional)
    const conteudoResult = await pool.query(
      "SELECT estudo_id FROM conteudos WHERE id = $1",
      [conteudo_id]
    );
    if (conteudoResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Conteúdo não encontrado" });
    }

    // Adicionar a pergunta ao banco de dados
    const result = await pool.query(
      "INSERT INTO perguntas (conteudo_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [
        conteudo_id,
        pergunta,
        opcao_a,
        opcao_b,
        opcao_c,
        opcao_d,
        resposta_correta,
      ]
    );

    const novaPerguntaId = result.rows[0].id;

    res.status(201).json({
      success: true,
      message: "Pergunta adicionada com sucesso",
      pergunta_id: novaPerguntaId,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// 9 - PERGUNTAS DE UM CONTEUDO
app.get("/perguntas/:conteudo_id", async (req, res) => {
  const { conteudo_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d FROM perguntas WHERE conteudo_id = $1",
      [conteudo_id]
    );

    const perguntas = result.rows;

    res.status(200).json(perguntas);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// FUNÇÃO PARA CONQUISTAS:

// Verifica a quantidade de conclusões do usuário

const verificaConquistas = async (user_id) => {
  const resultConclusoes = await pool.query(
    "SELECT COUNT(*) as quantidade FROM conclusoes WHERE user_id = $1",
    [user_id]
  );
  const quantidadeConclusoes = resultConclusoes.rows[0].quantidade;

  if (quantidadeConclusoes > 0) {
    // Determina quais conquistas associar com base na quantidade de conclusões
    const conquistasParaAdicionar = [];

    if (quantidadeConclusoes >= 10) {
      conquistasParaAdicionar.push(3); // ID da conquista "10 conteúdos concluídos"
    }

    if (quantidadeConclusoes >= 5) {
      conquistasParaAdicionar.push(2); // ID da conquista "5 conteúdos concluídos"
    }

    if (quantidadeConclusoes >= 1) {
      conquistasParaAdicionar.push(1); // ID da conquista "Primeiro conteúdo concluído"
    }

    // Insere as conquistas na tabela usuarios_conquistas
    if (conquistasParaAdicionar.length > 0) {
      const values = conquistasParaAdicionar
        .map((conquistaId) => `(${user_id}, ${conquistaId})`)
        .join(",");
      await pool.query(
        `INSERT INTO usuarios_conquistas (user_id, conquista_id) VALUES ${values} ON CONFLICT DO NOTHING`
      );
    }
  }
};

// Restante do seu código para conceder pontos e conclusão

// 10- ADICIONA RESPOSTA e ATUALIZA se cada pergunta respondida tá certo ou não
app.post("/respostas", verifyToken, async (req, res) => {
  const { respostas } = req.body;
  const user_id = req.user.userId;

  try {
    const conclusoes = {}; // Armazenar conclusões para evitar pontuações duplicadas
    let todasCorretas = true; // Flag para verificar se todas as respostas estão corretas

    await Promise.all(
      respostas.map(async ({ pergunta_id, resposta_do_usuario }) => {
        const perguntaResult = await pool.query(
          "SELECT resposta_correta, conteudo_id FROM perguntas WHERE id = $1",
          [pergunta_id]
        );

        if (perguntaResult.rows.length === 0) {
          // Pergunta não encontrada, você pode lidar com isso se necessário
        } else {
          const { resposta_correta, conteudo_id } = perguntaResult.rows[0];
          const acertou = resposta_do_usuario === resposta_correta;

          todasCorretas = todasCorretas && acertou; // Atualiza a flag com o resultado da pergunta

          await pool.query(
            "INSERT INTO respostas (user_id, pergunta_id, resposta_do_usuario, resposta_correta) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, pergunta_id) DO UPDATE SET resposta_do_usuario = $3, resposta_correta = $4",
            [user_id, pergunta_id, resposta_do_usuario, acertou]
          );

          if (
            conteudo_id !== undefined &&
            conteudo_id !== null &&
            !conclusoes[conteudo_id]
          ) {
            conclusoes[conteudo_id] = true; // Marcamos como concluído para evitar pontuações duplicadas
          }
        }
      })
    );

    // Verifica se todas as respostas estão corretas antes de conceder pontos e conclusão
    if (todasCorretas) {
      await Promise.all(
        Object.keys(conclusoes).map(async (conteudo_id) => {
          // Atualiza a pontuação geral do usuário com os pontos do conteúdo, tratando null como 0
          await pool.query(
            "UPDATE users SET pontuacao_geral = pontuacao_geral + COALESCE((SELECT pontos FROM conteudos WHERE id = $1), 0) WHERE user_id = $2",
            [conteudo_id, user_id]
          );

          // Insere a conclusão se não existir
          await pool.query(
            "INSERT INTO conclusoes (user_id, conteudo_id) VALUES ($1, $2) ON CONFLICT (user_id, conteudo_id) DO NOTHING",
            [user_id, conteudo_id]
          );

          verificaConquistas(user_id);
        })
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// 11- OBTÉM QUANTIDADE DE PERGUNTAS e QUANTIDADE DE ACERTO EM UM CONTEUDO
app.get("/quantidade-acertos/:conteudo_id", verifyToken, async (req, res) => {
  const { conteudo_id } = req.params;
  const user_id = req.user.userId;

  try {
    // Consultar a quantidade de respostas corretas para o usuário
    const result = await pool.query(
      `
      SELECT 
        COALESCE(SUM(CASE WHEN respostas.resposta_do_usuario = perguntas.resposta_correta THEN 1 ELSE 0 END), 0) AS quantidade_acertos,
        COUNT(DISTINCT perguntas.id) AS quantidade_total_perguntas
      FROM perguntas
      LEFT JOIN respostas ON respostas.pergunta_id = perguntas.id
        AND respostas.user_id = $1
      WHERE conteudo_id = $2
      GROUP BY conteudo_id;
    `,
      [user_id, conteudo_id]
    );

    const quantidadeAcertos =
      parseInt(result.rows[0]?.quantidade_acertos, 10) || 0;
    const quantidadeTotalPerguntas =
      parseInt(result.rows[0]?.quantidade_total_perguntas, 10) || 0;

    // Retornar a resposta do servidor com a quantidade de acertos e total de perguntas
    res
      .status(200)
      .json({
        success: true,
        quantidade_acertos: quantidadeAcertos,
        quantidade_total_perguntas: quantidadeTotalPerguntas,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// 12- Histórico de Respostas de um Usuário
app.get("/historico-respostas", verifyToken, async (req, res) => {
  const user_id = req.user.userId;

  try {
    const result = await pool.query(
      "SELECT e.nome AS estudo, c.titulo AS conteudo_titulo, p.pergunta, r.resposta_do_usuario " +
        "FROM respostas r " +
        "JOIN perguntas p ON r.pergunta_id = p.id " +
        "JOIN conteudos c ON p.conteudo_id = c.id " +
        "JOIN estudos e ON c.estudo_id = e.id " +
        "WHERE r.user_id = $1",
      [user_id]
    );

    const historicoRespostas = result.rows;

    res.status(200).json(historicoRespostas);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// 13- VERIFICA CONTEUDO CONCLUIDO
app.get("/verificar-conclusao/:user_id/:conteudo_id", async (req, res) => {
  const { user_id, conteudo_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT r.user_id, p.conteudo_id
      FROM respostas r
      JOIN perguntas p ON r.pergunta_id = p.id
      WHERE r.user_id = $1 AND p.conteudo_id = $2 AND r.resposta_do_usuario = p.resposta_correta
      GROUP BY r.user_id, p.conteudo_id
      HAVING COUNT(p.id) = (SELECT COUNT(*) FROM perguntas p2 WHERE p2.conteudo_id = p.conteudo_id)`,
      [user_id, conteudo_id]
    );

    const conclusao = result.rows.length > 0;

    res.status(200).json({ conclusao });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// 14- OBTÉM PONTUAÇÃO DE UM USUÁRIO
app.get("/pontuacao-geral/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT pontuacao_geral FROM users WHERE user_id = $1",
      [user_id]
    );

    if (result.rows.length === 0) {
      // Usuário não encontrado, você pode lidar com isso se necessário
      res
        .status(404)
        .json({ success: false, message: "Usuário não encontrado" });
    } else {
      const pontuacao_geral = result.rows[0].pontuacao_geral;
      res.status(200).json({ success: true, pontuacao_geral });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// 15- VERIFICA QTD  DE CONTEUDOS COMPLETOS
app.get("/quantidade-conteudos/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT COUNT(*) as quantidade FROM conclusoes WHERE user_id = $1",
      [user_id]
    );
    const qtd_conteudos_completos = result.rows[0].quantidade;
    res.status(200).json({ success: true, qtd_conteudos_completos });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// 16- VERIFICA CONTEUDOS COMPLETOS
app.get("/conteudos-concluidos/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT conteudo_id FROM conclusoes WHERE user_id = $1",
      [user_id]
    );
    const conteudos_completos = result.rows.map((row) => row.conteudo_id);
    res.status(200).json({ success: true, conteudos_completos });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// 17- CONQUISTAS
app.get("/conquistas", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT nome_conquista, descricao FROM conquistas"
    );

    // Map the result rows to an array of achievements
    const conquistas = result.rows.map((row) => ({
      nome_conquista: row.nome_conquista,
      descricao: row.descricao,
    }));

    res.status(200).json({ success: true, conquistas });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// 17- CONQUISTAS
app.get("/conquistas", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT nome_conquista, descricao FROM conquistas"
    );

    // Map the result rows to an array of achievements
    const conquistas = result.rows.map((row) => ({
      nome_conquista: row.nome_conquista,
      descricao: row.descricao,
    }));

    res.status(200).json({ success: true, conquistas });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// 18 -  API para obter conquistas específicas de um usuário
app.get("/conquistas-usuario/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT c.nome_conquista, c.descricao " +
        "FROM usuarios_conquistas uc " +
        "JOIN conquistas c ON uc.conquista_id = c.id " +
        "WHERE uc.user_id = $1",
      [user_id]
    );

    // Mapeia as linhas de resultado para um array de conquistas do usuário
    const conquistasUsuario = result.rows.map((row) => ({
      nome_conquista: row.nome_conquista,
      descricao: row.descricao,
    }));

    res.status(200).json({ success: true, conquistasUsuario });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// // 13- VERIFICA CONTEUDO CONCLUIDO
// app.get("/verificar-conclusao/:user_id", async (req, res) => {
//   const { user_id } = req.params;

//   try {
//     const result = await pool.query(
//       `SELECT conteudo_id
//       FROM conclusoes
//       WHERE conclusoes.user_id = $1`,
//       [user_id]
//     );

//     const conclusao = result.rows[0];

//     res.status(200).json({ conclusao });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ success: false, message: "Erro interno do servidor" });
//   }
// });

// Esta função deve ser implementada no seu backend
const verificarRespostaCorreta = async (perguntaId, respostaUsuario) => {
  try {
    const result = await pool.query(
      "SELECT resposta_correta FROM perguntas WHERE id = $1",
      [perguntaId]
    );

    const respostaCorreta = result.rows[0].resposta_correta;
    return respostaUsuario === respostaCorreta;
  } catch (error) {
    console.error("Erro ao verificar resposta correta:", error);
    throw error;
  }
};

function determinarEstudoIndicado(respostas) {
  const preferenciaEstudo = respostas.find(
    (resposta) => resposta.pergunta_id === 2
  )?.resposta_do_usuario;

  if (preferenciaEstudo) {
    switch (preferenciaEstudo.toLowerCase()) {
      case "backend":
        return 1; // ID correspondente ao Backend
      case "frontend":
        return 2; // ID correspondente ao Frontend
      case "database":
        return 3; // ID correspondente ao Database
      case "devops e automação de infraestrutura":
        return 4; // ID correspondente ao DevOps e Automação de Infraestrutura
      case "mobile":
        return 5; // ID correspondente ao Mobile
      case "ux e design":
        return 6; // ID correspondente ao UX e Design
      default:
        return 2; // Valor padrão para caso de preferência desconhecida
    }
  }

  return 2;
}

app.post("/questionnaire-responses", async (req, res) => {
  const { respostas, userData } = req.body;
  const { email } = userData;

  try {
    // Verificar se 'respostas' é um array com 3 elementos
    if (!Array.isArray(respostas) || respostas.length !== 3) {
      return res
        .status(400)
        .json({
          success: false,
          message: "O array 'respostas' deve ter exatamente 3 elementos",
        });
    }

    // Determinar o estudo indicado
    const estudoIndicadoId = determinarEstudoIndicado(respostas);

    // Verificar se o estudo indicado é válido
    if (estudoIndicadoId < 1 || estudoIndicadoId > 6) {
      return res
        .status(400)
        .json({ success: false, message: "ID de estudo indicado inválido" });
    }

    // Consultar o banco de dados para obter o user_id com base no e-mail
    const userResult = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Usuário não encontrado" });
    }

    const user_id = userResult.rows[0].user_id;

    // Atualizar a coluna 'preferencia_estudo' no banco de dados
    const updatedUser = await pool.query(
      "UPDATE users SET preferencia_estudo = $1 WHERE user_id = $2 RETURNING *",
      [estudoIndicadoId, user_id]
    );

    // Registra as respostas no banco de dados
    await Promise.all(
      respostas.map(async (resposta) => {
        const { pergunta_id, resposta_do_usuario } = resposta;
        const respostaBoolean = resposta_do_usuario.toLowerCase() === "sim";

        await pool.query(
          "INSERT INTO questionnaire_responses (user_id, question1, question2, question3) VALUES ($1, $2, $3, $4)",
          [
            user_id,
            ...Array.from({ length: 3 }).map(
              (_, i) => respostaBoolean && i + 1 === pergunta_id
            ),
          ]
        );
      })
    );

    res
      .status(200)
      .json({
        success: true,
        message: "Respostas registradas com sucesso",
        updatedUser,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// Adicione a rota para obter a preferencia_estudo
app.get("/user-preference-study/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    // Consulta a preferencia_estudo na tabela users
    const userResult = await pool.query(
      "SELECT preferencia_estudo FROM users WHERE user_id = $1",
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Usuário não encontrado" });
    }

    const preferenciaEstudoId = userResult.rows[0].preferencia_estudo;

    // Consulta os dados correspondentes na tabela estudos
    const estudoResult = await pool.query(
      "SELECT * FROM estudos WHERE id = $1",
      [preferenciaEstudoId]
    );

    if (estudoResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Estudo não encontrado" });
    }

    const preferenciaEstudo = estudoResult.rows[0];

    res.status(200).json({ success: true, preferenciaEstudo });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// Rota para verificar se a preferência_estudo está preenchida
app.get("/preferencia-estudo/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    // Consulta a preferencia_estudo na tabela users
    const userResult = await pool.query(
      "SELECT preferencia_estudo FROM users WHERE user_id = $1",
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Usuário não encontrado" });
    }

    const preferenciaEstudoId = userResult.rows[0].preferencia_estudo;

    // Verifica se a preferencia_estudo está preenchida
    const preferenciaEstudoPreenchida = preferenciaEstudoId !== null;

    res.status(200).json({ success: true, preferenciaEstudoPreenchida });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// MATERIAIS
app.get("/materiais/:conteudo_id", async (req, res) => {
  const { conteudo_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT materiais FROM conteudos WHERE id = $1",
      [conteudo_id]
    );

    const materiais = result.rows;

    res.status(200).json(materiais);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// EXTRA PARA UPLOADS DE IMAGENS
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
