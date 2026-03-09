// import { IncomingMessage, ServerResponse } from "http";
// import bcrypt from "bcryptjs";
// import { LoginPayload, RegisterPayload, User } from "../types";
// import { createUser, findUser } from "../models";
// import jwt from "jsonwebtoken";
// import { JWT_SECRET } from "../constants";
// import { apiRoutes } from "../routes/routes";

// type RouteHandler = (req: IncomingMessage, res: ServerResponse, body?: unknown) => void;
// const config = {
//   "content-type": "application/json",
// };

// export const controllers: Record<string, RouteHandler> = {
//   [apiRoutes.login]: async (_, res, body) => {
//     try {
//       if (!(body as any)?.username || !(body as any)?.password) {
//         res.writeHead(400, config);
//         res.end(JSON.stringify({ message: "Неверно сформирован запрос" }));
//         return;
//       }

//       const { username, password } = body as LoginPayload;
//       const user: User = await findUser(username);

//       const isMatch = bcrypt.compare(String(password), user.password);
//       if (!isMatch) {
//         res.writeHead(400, config);
//         res.end(JSON.stringify({ message: "Пароли не совпадают" }));
//         return;
//       }

//       const token = jwt.sign(
//         {
//           id: user.id,
//           username: user.username,
//           email: user.email,
//           avatar: user.avatar,
//         },
//         JWT_SECRET,
//       );
//       res.writeHead(200, config);
//       res.end(JSON.stringify({ data: token }));
//     } catch (e: any) {
//       console.error(e);
//       res.writeHead((e?.status as number | undefined) ?? 500, config);
//       res.end(JSON.stringify({ message: e?.message ?? "Неизвестная ошибка" }));
//     }
//   },
//   [apiRoutes.register]: async (_, res, body) => {
//     try {
//       if (!(body as any)?.username || !(body as any)?.password || !(body as any)?.email) {
//         res.writeHead(400, config);
//         res.end(JSON.stringify({ message: "Неверно сформирован запрос" }));
//         return;
//       }

//       const { username, email, password } = body as RegisterPayload;
//       const hashedPw = await bcrypt.hash(String(password), 10);

//       await createUser(username, email, hashedPw);
//       res.writeHead(201, config);
//       res.end(JSON.stringify({ message: "Пользователь успешно зарегистрирован" }));
//     } catch (e: any) {
//       const status = e?.status ?? 500;
//       const message = e?.message ?? "Ошибка сервера";
//       res.writeHead(status, config);
//       res.end(JSON.stringify({ message }));
//     }
//   },
//   [apiRoutes.me]: async (req, res) => {
//     try {
//       const token = req.headers.authorization;
//       if (!token) {
//         res.writeHead(401, config);
//         res.end(JSON.stringify({ message: "Пользователь не авторизован" }));
//         return;
//       }

//       const user = jwt.verify(token.startsWith("Bearer") ? token.split(" ")[1] : token, JWT_SECRET);
//       res.writeHead(200, config);
//       res.end(
//         JSON.stringify({
//           data: user,
//         }),
//       );
//     } catch (e) {
//       console.error(e);
//       res.writeHead(401, config);
//       res.end(JSON.stringify({ message: "Пользователь не авторизован" }));
//     }
//   },
// };