require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});

app.post("/save-game", async (req, res) => {
  const { uuid, state, player, level } = req.body;
  try {
    // 使用 INSERT ... ON CONFLICT 语句来处理重复的 game_id
    const upsertGameQuery = `
      INSERT INTO games (game_id, player_name, game_state, game_level, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (game_id)
      DO UPDATE SET game_state = $3, game_level = $4, updated_at = NOW()
      RETURNING *;
    `;
    const result = await pool.query(upsertGameQuery, [
      uuid,
      player,
      state,
      level,
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send(`Server error: ${error.message}`);
  }
});

app.get("/load-game/:uuid", async (req, res) => {
  const { uuid } = req.params;
  try {
    // 新增：从数据库检索游戏状态的 SQL 命令
    const selectGameQuery = `
      SELECT * FROM games WHERE game_id = $1;`;
    const result = await pool.query(selectGameQuery, [uuid]); // 新增：执行 SQL 命令
    if (result.rows.length > 0) {
      res.json(result.rows[0]); // 新增：返回检索到的游戏状态
    } else {
      res.status(404).send("Game not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(`Server error: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
