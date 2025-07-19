const server = require("./server");
const { v4: uuidv4 } = require("uuid");
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
  socket.on("message", (msg) => {
    const parsedData = JSON.parse(msg);
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
      case "selection":
        const { name } = data;
        const player = {
          name,
          id: socket?.clientId,
        };
        if (selectionStack.length) {
          const opponent = selectionStack.pop();
          const oppSocket = clients.get(opponent.id);
          if (oppSocket) {
            const roomId = uuidv4();
            gameRooms.set(roomId, [player, opponent]);

            const turn = Math.round(Math.random());
            socket.send(
              JSON.stringify({
                type: "gameFound",
                data: {
                  name: opponent.name,
                  sessionId: roomId,
                },
              })
            );
            socket.send(
              JSON.stringify({
                type: "turn",
                data: turn === 0 ? 0 : 1,
              })
            );
            oppSocket.send(
              JSON.stringify({
                type: "turn",
                data: turn === 1 ? 0 : 1,
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
          }
        } else {
          selectionStack.push(player);
        }

        break;
      case "closeRoom":
        const { roomId } = data;
        if (gameRooms.has(roomId)) {
          const players = gameRooms.get(roomId);
          for (const player of players) {
            if (player.id !== socket.clientId) {
              const playerSocket = clients.get(player.id);
              if (playerSocket) {
                playerSocket.send(
                  JSON.stringify({
                    type: "roomClosed",
                    data: null,
                  })
                );
              }
            }
          }
          gameRooms.delete(data);
        }
        break;
      case "check":
        const { sessionId, coordinates } = data;
        if (gameRooms.has(sessionId)) {
          const players = gameRooms.get(sessionId);
          for (const player of players) {
            if (player.id !== socket.clientId) {
              const playerSocket = clients.get(player.id);
              if (playerSocket) {
                playerSocket.send(
                  JSON.stringify({
                    type: "check",
                    data: { coordinates },
                  })
                );
              }
            }
          }
        }
        break;
      case "status":
        const room = data.roomId;
        const dataCoordinates = data.coordinates;
        const status = data.status;

        const players = gameRooms.get(room);
        if (players) {
          for (const player of players) {
            if (player.id !== socket.clientId) {
              const playerSocket = clients.get(player.id);
              if (playerSocket) {
                const msg = {
                  type: "status",
                  data: {
                    status,
                    coordinates: dataCoordinates,
                  },
                };
                if (status === "destroy") msg.data["range"] = data.range;
                playerSocket.send(JSON.stringify(msg));
                if (status === "lose") {
                  gameRooms.delete(room);
                } else {
                  playerSocket.send(
                    JSON.stringify({
                      type: "turn",
                      data: status === "hit" || status === "destroy" ? 1 : 0,
                    })
                  );
                }
              }
            } else {
              const playerSocket = clients.get(player.id);
              if (status === "lose") {
                gameRooms.delete(room);
                playerSocket.send(
                  JSON.stringify({
                    type: "lose",
                    data: null,
                  })
                );
              } else {
                playerSocket.send(
                  JSON.stringify({
                    type: "turn",
                    data: status === "hit" || status === "destroy" ? 0 : 1,
                  })
                );
              }
            }
          }
        }
        break;
      case "invite":
        const { key } = data;
        if (gameRooms.has(key)) {
          const players = gameRooms.get(key);
          players.push({
            name: "",
            id: socket.clientId,
          });
          const [firstPlayer, _] = players;
          const opponent = clients.get(firstPlayer.id);
          const turn = Math.round(Math.random());
          socket.send(
            JSON.stringify({
              type: "gameFound",
              data: {
                name: firstPlayer.name,
                sessionId: key,
              },
            })
          );
          socket.send(
            JSON.stringify({
              type: "turn",
              data: turn === 0 ? 0 : 1,
            })
          );
          opponent.send(
            JSON.stringify({
              type: "turn",
              data: turn === 1 ? 0 : 1,
            })
          );
          opponent.send(
            JSON.stringify({
              type: "gameFound",
              data: {
                name: "",
                sessionId: key,
              },
            })
          );
        } else {
          gameRooms.set(key, [
            {
              name: "",
              id: socket.clientId,
            },
          ]);
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
