const server = require("./server");
const WebSocket = require("ws");

const ws = new WebSocket.Server({server});
const clients = new Map();

ws.on("connection", (socket,_)=>{
    socket.on("message", (data)=>{
        data = JSON.parse(data);
        const {type} = data;
        switch(type){
            case "init":
                socket.clientId = data;
                clients.set(data, socket);
                break;
            case "activeUsersCount":
                socket.send(JSON.stringify({
                    type,
                    data: clients.size
                }));
        }
        clients.set()
        console.log('data', data);
            
    });

    socket.on("close",()=>{
        const {clientId} = socket;
        if(clientId){
            clients.delete(clientId);
        };
    });
});
