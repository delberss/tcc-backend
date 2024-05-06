const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./database");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const sinon = require("sinon");
const app = express();
const { format } = require('date-fns');

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


function getDataLocal() {
  const dataAtual = new Date();
  const fusoHorario = 'America/Sao_Paulo'; // Fuso horário para São Paulo
  const offset = new Date().getTimezoneOffset(); // Obtém o offset em minutos

  const offsetMillisegundos = offset * 60 * 1000;
  const dataLocal = new Date(dataAtual.getTime() - offsetMillisegundos);

  return dataLocal;
}


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

//const mockDate = new Date("2024-04-15");
async function updateLoginHistoryAndScore(userId) {
  const dataDeHoje = getDataLocal().toISOString().split("T")[0];
  const dataOntem = new Date(dataDeHoje);
  dataOntem.setDate(dataOntem.getDate() - 1);

  // Verifica último login
  const pegaUltimoLogin = await pool.query(
    "SELECT login_date, dias_seguidos FROM login_history WHERE user_id = $1",
    [userId]
  );

  let qtdDiasSeguidos = pegaUltimoLogin.rows[0]?.dias_seguidos || 0;

  if (pegaUltimoLogin.rows.length != 0) {
    const ultimoLoginFormatado = pegaUltimoLogin.rows[0]?.login_date.toISOString()?.split('T')[0];
    const diasSeguidos = pegaUltimoLogin.rows[0].dias_seguidos;

    const ultimoAcessoOntem = (ultimoLoginFormatado === dataOntem.toISOString().split('T')[0]);

    if (ultimoAcessoOntem) {
      qtdDiasSeguidos++;
      await pool.query(
        "UPDATE login_history SET login_date = $1, dias_seguidos = $2 WHERE user_id = $3",
        [dataDeHoje, diasSeguidos + 1, userId]
      );
    } else {
      if(ultimoLoginFormatado !== dataDeHoje){
        qtdDiasSeguidos = 1;
        await pool.query(
          "UPDATE login_history SET login_date = $1, dias_seguidos = $2 WHERE user_id = $3",
          [dataDeHoje, 1, userId]
        );
      }
    }
  } else {
    qtdDiasSeguidos = 1;
    await pool.query(
      "INSERT INTO login_history (user_id, login_date, dias_seguidos) VALUES ($1, $2, $3)",
      [userId, dataDeHoje, 1]
    );
  }

  // Atualizar pontuação geral do usuário com base nos dias seguidos
  if (qtdDiasSeguidos === 3) {
    await pool.query(
      "UPDATE users SET pontuacao_geral = pontuacao_geral + 300 WHERE user_id = $1",
      [userId]
    );
  } else if (qtdDiasSeguidos === 6) {
    await pool.query(
      "UPDATE users SET pontuacao_geral = pontuacao_geral + 600 WHERE user_id = $1",
      [userId]
    );
  } else if (qtdDiasSeguidos === 10) {
    await pool.query(
      "UPDATE users SET pontuacao_geral = pontuacao_geral + 1000 WHERE user_id = $1",
      [userId]
    );
  }
}


// 1 - FAZER LOGIN
app.post("/login", async (req, res) => {
  let { emailOrUsername, password, userType } = req.body;
  userType = userType?.toLowerCase();

  try {
    // Verificar se o emailOrUsername é um email ou um nome de usuário
    const isEmail = emailOrUsername.includes('@');
    let userQuery;

    if (isEmail) {
      userQuery = {
        text: "SELECT user_id, name, email, password, profile_image_url, pontuacao_geral, preferencias_estudo, tipo_usuario, username FROM users WHERE email = $1 AND tipo_usuario = $2",
        values: [emailOrUsername.toLowerCase(), userType]
      };
    } else {
      userQuery = {
        text: "SELECT user_id, name, email, password, profile_image_url, pontuacao_geral, preferencias_estudo, tipo_usuario, username FROM users WHERE username = $1 AND tipo_usuario = $2",
        values: [emailOrUsername.toLowerCase(), userType]
      };
    }

    const result = await pool.query(userQuery);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        const token = generateJWT(user.user_id);

        // Verificar e atualizar o número de dias seguidos e a pontuação geral
        await updateLoginHistoryAndScore(user.user_id);

        res.status(200).json({
          success: true,
          message: "Login efetuado com sucesso",
          user: {
            id: user.user_id,
            name: user.name,
            email: user.email,
            username: user.username,
            profileImageUrl: user.profile_image_url,
            preferenciaEstudo: user.preferencias_estudo,
            pontuacaoGeral: user.pontuacao_geral,
            tipo_usuario: user.tipo_usuario,
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
        .json({ success: false, message: "E-mail ou nome de usuário não cadastrado." });
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

    // Extrair o username do email
    const username = email.split("@")[0];

    // Formatar o nome com as primeiras letras maiúsculas
    const formattedName = name.replace(/\b\w/g, (char) => char.toUpperCase());

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Utilizar transação para garantir operações atômicas
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertSTMT =
        "INSERT INTO users (name, email, password, pontuacao_geral, tipo_usuario, username) VALUES ($1, $2, $3, $4, $5, $6)";
      const values = [
        formattedName,
        email.toLowerCase(),
        hashedPassword,
        0,
        "estudante",
        username,
      ]; // Definindo 'estudante' como tipo padrão

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
      "SELECT u.user_id, u.name, u.email, u.profile_image_url, u.pontuacao_geral, u.tipo_usuario, lh.dias_seguidos, " +
      "COUNT(c.conteudo_id) AS conclusoes " +
      "FROM users u " +
      "LEFT JOIN login_history lh ON u.user_id = lh.user_id " +
      "LEFT JOIN conclusoes c ON u.user_id = c.user_id " +
      "GROUP BY u.user_id, u.name, u.email, u.profile_image_url, u.pontuacao_geral, u.tipo_usuario, lh.dias_seguidos"
    );
    const users = result.rows;

    const sanitizedUsers = users.map((user) => ({
      name: user.name,
      email: user.email,
      profile_image_url: user.profile_image_url,
      pontuacao_geral: user.pontuacao_geral,
      tipo_usuario: user.tipo_usuario,
      dias_seguidos: user.dias_seguidos,
      conclusoes: user.conclusoes
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
    const result = await pool.query("SELECT * FROM estudos ORDER BY id");
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
      "SELECT id, titulo, descricao, pontos, tempomaximo FROM conteudos WHERE estudo_id = $1 ORDER BY id",
      [estudoIdAsInt]
    );

    const conteudos = result.rows.map(({ id, titulo, descricao, pontos, tempomaximo }) => ({
      id,
      titulo,
      descricao,
      pontos,
      tempomaximo
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
    minutagemPergunta, // Adicionado
  } = req.body;

  try {
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
      "INSERT INTO perguntas (conteudo_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta, minutagemPergunta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
      [
        conteudo_id,
        pergunta,
        opcao_a,
        opcao_b,
        opcao_c,
        opcao_d,
        resposta_correta,
        minutagemPergunta, // Adicionado
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
      "SELECT id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, minutagemPergunta FROM perguntas WHERE conteudo_id = $1",
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

// 10- ADICIONA RESPOSTA e ATUALIZA se cada pergunta respondida tá certo ou não
app.post("/respostas", verifyToken, async (req, res) => {
  const { respostas } = req.body;
  const user_id = req.user.userId;

  try {
    const conclusoes = {}; // Armazenar conclusões para evitar pontuações duplicadas
    let todasCorretas = true; // Flag para verificar se todas as respostas estão corretas
    let respostasCorretas = 0; // Contador de respostas corretas

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
          const acertou =
            resposta_do_usuario.toUpperCase() ===
            resposta_correta.toUpperCase();

          todasCorretas = todasCorretas && acertou; // Atualiza a flag com o resultado da pergunta

          // Se a resposta estiver correta, incrementa o contador
          if (acertou) {
            respostasCorretas++;
          }

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

    res.status(200).json({ success: true, respostasCorretas }); // Retorna a quantidade de respostas corretas
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
    res.status(200).json({
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

// 19 - API para xxxx
app.get("/estudos/:nome", async (req, res) => {
  const { nome } = req.params;
  try {
    const result = await pool.query(
      "SELECT descricao, link  FROM estudos WHERE UPPER(nome) = $1 ",
      [nome.toUpperCase()]
    );
    const resultado = result.rows;

    res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// 20 - Excluir pergunta
app.delete("/pergunta/:id", verifyToken, async (req, res) => {
  const perguntaId = req.params.id;

  try {
    // Verificar se a pergunta existe
    const perguntaResult = await pool.query(
      "SELECT * FROM perguntas WHERE id = $1",
      [perguntaId]
    );
    if (perguntaResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Pergunta não encontrada" });
    }

    // Excluir respostas associadas à pergunta
    await pool.query(
      "DELETE FROM respostas WHERE pergunta_id = $1",
      [perguntaId]
    );

    // Excluir a pergunta
    await pool.query(
      "DELETE FROM perguntas WHERE id = $1",
      [perguntaId]
    );

    res.status(200).json({
      success: true,
      message: "Pergunta e respostas associadas excluídas com sucesso",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// 21 - Atualizar pergunta
app.put("/pergunta/:id", verifyToken, async (req, res) => {
  const perguntaId = req.params.id;
  const {
    pergunta,
    opcao_a,
    opcao_b,
    opcao_c,
    opcao_d,
    resposta_correta,
    minutagemPergunta,
  } = req.body;

  try {
    // Verificar se a pergunta existe
    const perguntaResult = await pool.query(
      "SELECT * FROM perguntas WHERE id = $1",
      [perguntaId]
    );
    if (perguntaResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Pergunta não encontrada" });
    }

    // Atualizar os detalhes da pergunta
    if(resposta_correta){
      await pool.query(
        "UPDATE perguntas SET pergunta = $1, opcao_a = $2, opcao_b = $3, opcao_c = $4, opcao_d = $5, resposta_correta = $6, minutagemPergunta = $7 WHERE id = $8",
        [
          pergunta,
          opcao_a,
          opcao_b,
          opcao_c,
          opcao_d,
          resposta_correta,
          minutagemPergunta,
          perguntaId,
        ]
      );
    } else{
      await pool.query(
        "UPDATE perguntas SET pergunta = $1, opcao_a = $2, opcao_b = $3, opcao_c = $4, opcao_d = $5, minutagemPergunta = $6 WHERE id = $7",
        [
          pergunta,
          opcao_a,
          opcao_b,
          opcao_c,
          opcao_d,
          minutagemPergunta,
          perguntaId,
        ]
      );
    }
   

    res.status(200).json({
      success: true,
      message: "Pergunta atualizada com sucesso",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});

// 22 - EDITAR MINUTAGEM DE PERGUNTA
app.put("/edit/pergunta/:id", verifyToken, async (req, res) => {
  const perguntaId = req.params.id;
  const { minutagemPergunta } = req.body;

  try {
    // Verifica se a pergunta existe
    const perguntaResult = await pool.query(
      "SELECT * FROM perguntas WHERE id = $1",
      [perguntaId]
    );

    if (perguntaResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Pergunta não encontrada" });
    }

    // Atualiza a minutagemPergunta da pergunta
    await pool.query(
      "UPDATE perguntas SET minutagemPergunta = $1 WHERE id = $2",
      [minutagemPergunta, perguntaId]
    );

    res.status(200).json({ success: true, message: "Minutagem da pergunta atualizada com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erro interno do servidor" });
  }
});


// 23 - EDITAR VIDEO LINK DE UM CONTEUDO
app.put("/conteudos/:id/video", async (req, res) => {
  const { id } = req.params;
  const { videoConteudo } = req.body;

  try {
    const result = await pool.query(
      "UPDATE conteudos SET videoConteudo = $1 WHERE id = $2 RETURNING *",
      [videoConteudo, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Conteúdo não encontrado" });
    }

    const updatedConteudo = result.rows[0];

    res.status(200).json({ success: true, conteudo: updatedConteudo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erro interno do servidor" });
  }
});

// 23 - QUESTIONARIO DE PERFIL
app.post("/questionnaire-responses", async (req, res) => {
  const { respostas, userData } = req.body;
  const { email, username } = userData;

  try {
    // Verificar se 'respostas' é um array com 3 elementos
    if (!Array.isArray(respostas) || respostas.length !== 3) {
      return res.status(400).json({
        success: false,
        message: "O array 'respostas' deve ter exatamente 3 elementos",
      });
    }

    // Determinar o estudo indicado
    const estudoIndicadoId = determinarEstudoIndicado(respostas);

    // Verificar se o estudo indicado é válido
    if (estudoIndicadoId < 1 || estudoIndicadoId > 8) {
      return res
        .status(400)
        .json({ success: false, message: "ID de estudo indicado inválido" });
    }

    let userResult;

    if (email) {
      userResult = await pool.query(
        "SELECT user_id FROM users WHERE email = $1",
        [email.toLowerCase()]
      );
    } else {
      userResult = await pool.query(
        "SELECT user_id FROM users WHERE username = $1",
        [username.toLowerCase()]
      );
    }
    

    if (userResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Usuário não encontrado" });
    }

    const user_id = userResult.rows[0].user_id;

    // Atualizar a coluna 'preferencia_estudo' no banco de dados
    const updatedUser = await pool.query(
      "UPDATE users SET preferencias_estudo = $1 WHERE user_id = $2 RETURNING *",
      [estudoIndicadoId, user_id]
    );

    // Registra as respostas no banco de dados
    await Promise.all(
      respostas.map(async (resposta) => {
        const { pergunta_id, resposta_do_usuario } = resposta;

        await pool.query(
          "INSERT INTO questionnaire_responses (user_id, question1, question2, question3) VALUES ($1, $2, $3, $4)",
          [
            user_id,
            pergunta_id === 1 ? resposta_do_usuario : null,
            pergunta_id === 2 ? resposta_do_usuario : null,
            pergunta_id === 3 ? resposta_do_usuario.join(",") : null, // Converta o array para uma string CSV
          ]
        );
      })
    );

    res.status(200).json({
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

// 24 - PREFERENCIA DE ESTUDO
app.get("/user-preference-study/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    // Consulta a preferencias_estudo na tabela users
    const userResult = await pool.query(
      "SELECT preferencias_estudo FROM users WHERE user_id = $1",
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Usuário não encontrado" });
    }

    const preferenciasEstudoString = userResult.rows[0].preferencias_estudo;

    let preferenciaEstudoIds = [];
    if (preferenciasEstudoString) {
      preferenciaEstudoIds = preferenciasEstudoString.split(",").map(Number);
    }

    // Consulta os dados correspondentes na tabela estudos
    const estudoResult = await pool.query(
      "SELECT * FROM estudos WHERE id = ANY($1)",
      [preferenciaEstudoIds]
    );

    if (estudoResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Estudo não encontrado" });
    }

    const preferenciaEstudos = estudoResult.rows;

    res.status(200).json({ success: true, preferenciaEstudos });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor" });
  }
});


// 25 - MATERIAIS de um CONTEUDO - manda videoConteudo se tiver
app.get("/materiais/:conteudo_id", async (req, res) => {
  const { conteudo_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT materiais, videoconteudo FROM conteudos WHERE id = $1",
      [conteudo_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Conteúdo não encontrado" });
    }

    const { materiais, videoconteudo } = result.rows[0];

    res.status(200).json({ materiais, videoconteudo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erro interno do servidor" });
  }
});

// 26 - ADICIONAR NOVO ESTUDO
app.post("/adicionarEstudo", async (req, res) => {
  const { nome, descricao, linguagens, link } = req.body;
  try {
    if (!nome) {
      return res
        .status(400)
        .json({ success: false, message: "Nome do estudo é obrigatório" });
    }

    const existingEstudo = await pool.query(
      "SELECT * FROM estudos WHERE LOWER(nome) = LOWER($1)",
      [nome]
    );

    // Se o estudo já existir, retorne um erro
    if (existingEstudo.rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Este nome de estudo já existe" });
    }

    // Insira o novo estudo na tabela estudos
    const result = await pool.query(
      "INSERT INTO estudos (nome, descricao, link, linguagens) VALUES ($1, $2, $3, $4) RETURNING *",
      [nome, descricao, link, linguagens]
    );

    // Envie a resposta com os dados do novo estudo inserido
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao inserir novo estudo:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 27 - DIAS SEGUIDOS LOGADOS
app.get("/user/:userId/days", async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(
      "SELECT dias_seguidos FROM login_history WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length > 0) {
      const diasSeguidos = result.rows[0].dias_seguidos;
      res.status(200).json({ success: true, diasSeguidos: diasSeguidos });
    } else {
      res.status(404).json({ success: false, message: "User not found or no login history available." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// 28 - ADICIONAR NOVO CONTEUDO
app.post("/adicionarConteudo", async (req, res) => {
  const { titulo, descricao, estudo_id, pontos, materiais, linkVideo  } = req.body;

  try {
    if (!titulo || !estudo_id) {
      return res.status(400).json({
        success: false,
        message: "Título e ID do estudo do questionário são obrigatórios",
      });
    }

    // Verifique se o estudo associado ao conteúdo existe
    const existingEstudo = await pool.query(
      "SELECT * FROM estudos WHERE id = $1",
      [estudo_id]
    );
    if (existingEstudo.rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "O estudo associado não existe" });
    }

    // Insira o novo conteúdo na tabela conteudos
    const result = await pool.query(
      "INSERT INTO conteudos (titulo, descricao, estudo_id, pontos, materiais, videoconteudo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [titulo, descricao, estudo_id, pontos, materiais, linkVideo]
    );

    // Envie a resposta com os dados do novo conteúdo inserido
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao inserir novo conteúdo:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 29 - PERGUNTAS ERRADAS
app.get("/perguntas-erradas/:user_id/:conteudo_id", async (req, res) => {
  const { user_id, conteudo_id } = req.params;

  try {
    // Consulta SQL para obter as perguntas que o usuário errou
    const query = `
      SELECT p.id, p.pergunta
      FROM perguntas p
      JOIN respostas r ON p.id = r.pergunta_id
      WHERE r.user_id = $1 
      AND p.conteudo_id = $2
      AND r.resposta_correta = FALSE
    `;
    
    const { rows } = await pool.query(query, [user_id, conteudo_id]);

    // Retornando as perguntas que o usuário errou
    res.status(200).json({ success: true, perguntas_erradas: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erro interno do servidor" });
  }
});

// ================================ FUNÇÃO PARA CONQUISTAS: ================================

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

function determinarEstudoIndicado(respostas) {
  // Verifica se a resposta da pergunta 2 (preferência) contém 'javascript'
  const preferenciaEstudo = respostas.find(
    (resposta) => resposta.pergunta_id === 2
  );

  if (
    preferenciaEstudo &&
    Array.isArray(preferenciaEstudo.resposta_do_usuario) &&
    preferenciaEstudo.resposta_do_usuario.length > 0
  ) {
    const respostaLowerCase = preferenciaEstudo.resposta_do_usuario.map(option => option.toLowerCase());

    // Verifica se a resposta inclui 'javascript'
    if (respostaLowerCase.includes("javascript")) {
      // Verifica se a resposta inclui outras linguagens backend
      if (["python", "java", "c#", "ruby", "php", "c++"].some(option => respostaLowerCase.includes(option))) {
        // Retorna o ID do estudo de frontend e backend
        return "1,2"; // IDs do estudo de backend e frontend
      } else {
        // Retorna apenas o ID do estudo de frontend
        return "2"; // ID do estudo de frontend
      }
    } else if (["python", "java", "c#", "ruby", "php", "c++"].some(option => respostaLowerCase.includes(option))) {
      // Retorna apenas o ID do estudo de backend
      return "1"; // ID do estudo de backend
    } else if (respostaLowerCase.includes("swift")) {
      // Retorna o ID do estudo de mobile
      return "5"; // ID do estudo de mobile
    }
  }

  // Fallback para a pergunta 1 se a pergunta 2 não fornecer uma resposta válida
  const experienciaEstudo = respostas.find(
    (resposta) =>
      resposta.pergunta_id === 1 &&
      resposta.resposta_do_usuario !== "N/A"
  );

  if (experienciaEstudo) {
    switch (experienciaEstudo.resposta_do_usuario.toLowerCase()) {
      case "javascript":
        // Verifica se a resposta da pergunta 1 inclui outras linguagens backend
        if (["python", "java", "c#", "ruby", "php", "c++"].some(option => respostaLowerCase.includes(option))) {
          // Retorna o ID do estudo de frontend e backend
          return "1,2"; // IDs do estudo de backend e frontend
        } else {
          // Retorna apenas o ID do estudo de frontend
          return "2"; // ID do estudo de frontend
        }
      case "python":
      case "java":
      case "c#":
      case "ruby":
      case "php":
      case "c++":
        // Retorna apenas o ID do estudo de backend
        return "1"; // ID do estudo de backend
      case "swift":
        // Retorna o ID do estudo de mobile
        return "5"; // ID do estudo de mobile
      default:
        // Se a resposta não corresponder a nenhuma opção conhecida, retorne um valor padrão
        break;
    }
  }

  // Se nenhuma resposta válida for encontrada nas perguntas 1 e 2, retorne um valor padrão
  return "2"; // Valor padrão: ID do estudo de frontend
}


// EXTRA PARA UPLOADS DE IMAGENS
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
