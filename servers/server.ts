import http, { IncomingMessage, ServerResponse } from "http";
import { routes } from "../routes";

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    if (!pathname || !routes[pathname]) {
      res.writeHead(404);
      res.end();
      return;
    }

    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      const body: string[] = [];
      req.on("data", (chunk) => {
        body.push(chunk);
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body.join(""));
          routes[pathname](req, res, data);
        } catch (e: any) {
          console.error(e);
          res.writeHead(500, {
            "content-type": "application/json",
          });
          res.end(JSON.stringify({ message: e?.message ?? "" }));
          return;
        }
      });
    } else {
      routes[pathname](req, res);
    }
  } catch (e) {
    res.writeHead(500);
    res.end("Ошибка сервера");
  }
});

server.listen(3000, () => {
  console.log(`Сервер запущен на ${process.env.ORIGIN_URL}`);
});

export default server;
