const server = require("./server");
const nanoid = require("nanoid");
const WebSocket = require("ws");

const ws = new WebSocket.Server({ server });
const clients = new Map();
const gameRooms = new Map();
const selectionStack = [];

function sendToAll(msg) {
  for (const [_, socket] of clients) {
    socket.send(msg);
  }
}

ws.on("connection", (socket, _) => {
  socket.on("message", (data) => {
    const parsedData = JSON.parse(data);
    const { type, data } = parsedData;
    switch (type) {
      case "init":
        socket.clientId = data;
        clients.set(data, socket);
        sendToAll(
          JSON.stringify({
            type: "activeUsersCount",
            data: clients.size - 1,
          })
        );
        break;
      case "activeUsersCount":
        socket.send(
          JSON.stringify({
            type,
            data: clients.size - 1,
          })
        );
        break;
      case "selection":
        const { name } = data;
        const player = {
          name,
          id: socket?.clientId,
        };
        if (selectionStack.length) {
          const opponent = selectionStack.pop();
          const roomId = nanoid();
          gameRooms.set(roomId, [player, opponent]);
          const oppSocket = clients.get(opponent.id);
          socket.send(
            JSON.stringify({
              type: "gameFound",
              data: {
                name: opponent.name,
                sessionId: roomId,
              },
            })
          );
          oppSocket.send(
            JSON.stringify({
              type: "gameFound",
              data: {
                name: player.name,
                sessionId: roomId,
              },
            })
          );
        } else {
          selectionStack.push(player);
        }
    }
  });

  socket.on("close", () => {
    const { clientId } = socket;
    if (clientId) {
      clients.delete(clientId);
      sendToAll(
        JSON.stringify({
          type: "activeUsersCount",
          data: clients.size - 1,
        })
      );
    }
  });
});
