import mysql from "mysql2/promise";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import dbConfig from "../app/config/db.config.js";

const ensureTestDatabase = async () => {
  const connection = await mysql.createConnection({
    host: dbConfig.HOST,
    user: dbConfig.USER,
    password: dbConfig.PASSWORD,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.DB}\``);
  await connection.end();
};

export const syncTestDatabase = async () => {
  await ensureTestDatabase();
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  await db.sequelize.query("DROP TABLE IF EXISTS todos");
  await db.sequelize.query("DROP TABLE IF EXISTS lists");
  await db.sequelize.sync({ force: true });
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
};

export const resetTestDatabase = async () => {
  await db.session.destroy({ where: {} });
  await db.user.destroy({ where: {} });
};

export const registerUser = async (overrides = {}) => {
  const payload = {
    fName: "Test",
    lName: "User",
    email: "test@example.com",
    username: "testuser",
    password: "password123",
    ...overrides,
  };

  const response = await request(app).post("/todo/register").send(payload);

  return {
    response,
    user: response.body,
    token: response.body.token,
    authHeader: { Authorization: `Bearer ${response.body.token}` },
  };
};
