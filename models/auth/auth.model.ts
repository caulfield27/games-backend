// import { pool } from "../../db";
// import { CustomError } from "../../types/globals";

// export async function findUser(username: string) {
//   try {
//     const query = `SELECT * FROM users WHERE username = $1`;
//     const result = await pool.query(query, [username]);
//     if (!result?.rowCount) {
//       const error: CustomError = new Error("Пользователь не найден");
//       error.status = 404;
//       throw error;
//     } else {
//       return result.rows[0];
//     }
//   } catch (e) {
//     throw e;
//   }
// }

// export async function createUser(username: string, email: string, password: string) {
//   try {
//     const now = new Date();
//     const findQuery = `SELECT * FROM users WHERE username = $1 OR email = $2`;
    
//     const findResult = await pool.query(findQuery, [username, email]);

//     if (findResult.rowCount) {
//       const error: CustomError = new Error("Пользователь с таким именем или почтой уже существует");
//       error.status = 400;
//       throw error;
//     } else {
//       const createQuery = `INSERT INTO users (username, email, password, created_at, updated_at)
//         VALUES ($1,$2,$3,$4,$5)`;
//       await pool.query(createQuery, [username, email, password, now, now]);
//     }
//   } catch (e) {
//     throw e;
//   }
// }
