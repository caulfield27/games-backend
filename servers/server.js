const http = require("http");
const routes = require("../routes/routes");

const server = http.createServer((req, res) => {
  try {
    const { url } = req;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELET",
      "OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
    }

    if (!routes[url]) {
      res.writeHead(404);
      res.end();
    }

    routes[url](req, res);
  } catch (e) {
    res.writeHead(500);
    res.end("Ошибка сервера");
  }
});

server.listen(3000, () => {
  console.log("Сервер запущен на http://localhost:3000");
});

module.exports = server;
