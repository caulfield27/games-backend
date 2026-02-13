import server from './server';
import { v4 as uuidv4 } from 'uuid';
import {WebSocket, WebSocketServer} from 'ws';
import { Player, WSMessage } from '../types';

interface CustomSocket extends WebSocket {
  clientId?: string;
}


const ws = new WebSocketServer({ server });
const clients = new Map<string, CustomSocket>();
const gameRooms = new Map<string, Player[]>();
const selectionStack: Player[] = [];

function sendToAll(msg: string) {
  for (const [_, socket] of clients) {
    sendMessage(socket, msg);
  }
}

function sendMessage(socket: CustomSocket | undefined, msg: string) {
  try {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(msg);
    }
  } catch (e) {
    console.error("Send failed:", e);
  }
}

ws.on("connection", (socket: CustomSocket) => {
  socket.on("message", (msg) => {
    try {
      const parsedData: WSMessage = JSON.parse(msg.toString());
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
          const player: Player = {
            name,
            id: socket.clientId!,
            isReady: false
          };
          if (selectionStack.length) {
            const opponent = selectionStack.pop()!;
            const oppSocket = clients.get(opponent.id);
            if (oppSocket) {
              const roomId = uuidv4();
              gameRooms.set(roomId, [player, opponent]);
              sendMessage(socket, JSON.stringify({
                type: "gameFound",
                data: {
                  name: opponent.name,
                  sessionId: roomId,
                },
              }));
              sendMessage(oppSocket, JSON.stringify({
                type: "gameFound",
                data: {
                  name: player.name,
                  sessionId: roomId,
                },
              }));
            }
          } else {
            selectionStack.push(player);
          }

          break;
        case "closeRoom":
          const { roomId } = data;
          if (gameRooms.has(roomId)) {
            const players = gameRooms.get(roomId)!;
            for (const player of players) {
              if (player.id !== socket.clientId) {
                const playerSocket = clients.get(player.id);
                if (playerSocket) {
                  sendMessage(playerSocket, JSON.stringify({
                    type: "roomClosed",
                    data: null,
                  }));
                }
              }
            }
            gameRooms.delete(roomId);
          }
          break;
        case "check":
          const { sessionId, coordinates } = data;
          if (gameRooms.has(sessionId)) {
            const players = gameRooms.get(sessionId)!;
            for (const player of players) {
              if (player.id !== socket.clientId) {
                const playerSocket = clients.get(player.id);
                if (playerSocket) {
                  sendMessage(playerSocket, JSON.stringify({
                    type: "check",
                    data: { coordinates },
                  }))
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
                  const msg: any = {
                    type: "status",
                    data: {
                      status,
                      coordinates: dataCoordinates,
                    },
                  };
                  if (status === "destroy") msg.data["range"] = data.range;
                  sendMessage(playerSocket, JSON.stringify(msg));
                  if (status === "lose") {
                    gameRooms.delete(room);
                  } else {
                    sendMessage(playerSocket, JSON.stringify({
                      type: "turn",
                      data: status === "hit" || status === "destroy" ? 1 : 0,
                    }));
                  }
                }
              } else {
                const playerSocket = clients.get(player.id);
                if (status === "lose") {
                  gameRooms.delete(room);
                  sendMessage(playerSocket, JSON.stringify({
                    type: "lose",
                    data: null,
                  }));
                } else {
                  sendMessage(playerSocket, JSON.stringify({
                    type: "turn",
                    data: status === "hit" || status === "destroy" ? 0 : 1,
                  }));
                }
              }
            }
          }
          break;
        case "invite":
          const { key } = data;
          if (gameRooms.has(key)) {
            const players = gameRooms.get(key)!;
            players.push({
              name: "",
              id: socket.clientId!,
            });
            const [firstPlayer, _] = players;
            const opponent = clients.get(firstPlayer.id);
            sendMessage(socket, JSON.stringify({
              type: "gameFound",
              data: {
                name: firstPlayer.name,
                sessionId: key,
              },
            }))
            sendMessage(opponent, JSON.stringify({
              type: "gameFound",
              data: {
                name: "player1337",
                sessionId: key,
              },
            }))
          } else {
            gameRooms.set(key, [
              {
                name: "player1337",
                id: socket.clientId!,
              },
            ]);
          }
          break;
        case "ready":
          const curRoom = gameRooms.get(data)
          if (curRoom) {
            const curPlayer = curRoom.find((elem) => elem.id === socket.clientId)!;
            const opPlayer = curRoom.find((elem) => elem.id !== socket.clientId)!;
            curPlayer.isReady = true;
            if (opPlayer) {
              const opSocket = clients.get(opPlayer.id)
              if (opPlayer.isReady) {
                const turn = Math.round(Math.random());
                if (opSocket) {
                  sendMessage(socket, JSON.stringify({ type: "turn", data: turn }));
                  sendMessage(socket, JSON.stringify({ type: "gameStart" }));
                  sendMessage(opSocket, JSON.stringify({ type: "turn", data: turn === 1 ? 0 : 1 }));
                  sendMessage(opSocket, JSON.stringify({ type: "gameStart", data: "" }))
                }
              } else {
                if (opSocket) {
                  sendMessage(opSocket, JSON.stringify({ type: "ready", data: "" }))
                }
              }
            }
          }
          break;
        case "message":
          const { value, curRoomId } = data;
          const curPlayers = gameRooms.get(curRoomId);
          if (curPlayers) {
            const op = curPlayers.find((player) => player.id !== socket.clientId)!;
            const opSocket = clients.get(op.id);
            if (opSocket) {
              sendMessage(opSocket, JSON.stringify({
                type: "message",
                data: value
              }));
            }
          };
          break;
      }
    } catch (e) {
      console.error(e);
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
