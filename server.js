const http = require("http");   


const server = http.createServer((req,res)=>{
    console.log('запрос: ', req);

    res.writeHead(200,{'content-type': 'text/plain'});
    res.end("Мой первый сервер на Node.js");
});

server.listen(3000, ()=>{
    console.log('Сервер запущен на http://localhost:3000');
});
