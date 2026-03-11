import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";

interface CustomSocket extends WebSocket {
  clientId: string;
}

interface Message {
  type: MessageType;
  data: unknown;
}

interface MoveData {
  roomId: string;
  from: number;
  to: number;
}

interface PromoteData {
  roomId: string;
  figure: string;
  idx: number;
  promoteIdx: number;
}

enum MessageType {
  SELECTION = "selection",
  CANCEL_SELECTION = "cancel_selection",
  MOVE = "move",
  PROMOTE = "promote",
}

const ws = new WebSocketServer({ noServer: true });
let queue: CustomSocket[] = [];
const gameRooms = new Map<string, [CustomSocket, CustomSocket]>();

function getDestination(roomId: string | null, socket: CustomSocket): CustomSocket | null {
  if (!roomId) return null;
  const room = gameRooms.get(roomId);
  if (!room) return null;
  const destination = room.find((r) => r.clientId !== socket.clientId);
  return destination ?? null;
}

function sendMessage(socket: CustomSocket, data: unknown) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

ws.on("connection", (socket: CustomSocket) => {
  socket.clientId = uuidv4();
  socket.on("message", (raw) => {
    const message = JSON.parse(raw.toString()) as Message;
    switch (message.type) {
      case MessageType.SELECTION:
        if (!queue.length) {
          queue.push(socket);
        } else {
          const opponent = queue.pop()!;
          if (opponent.readyState === WebSocket.OPEN) {
            const roomId = uuidv4();
            gameRooms.set(roomId, [socket, opponent]);
            const random = Math.round(Math.random());
            sendMessage(socket, {
              type: "gameFound",
              data: {
                roomId,
                name: `#${queue.length + 1}`,
                opponent: `#${queue.length}`,
                color: random === 1 ? "white" : "black",
              },
            });
            sendMessage(opponent, {
              type: "gameFound",
              data: {
                roomId,
                name: `#${queue.length}`,
                opponent: `#${queue.length + 1}`,
                color: random === 1 ? "black" : "white",
              },
            });
          }
        }
        break;
      case MessageType.CANCEL_SELECTION:
        queue = queue.filter((s) => s.clientId !== socket.clientId);
        break;
      case MessageType.MOVE:
        {
          const data = message.data as MoveData;
          const destination = getDestination(data.roomId, socket);
          if (!destination) return;
          sendMessage(destination, {
            type: MessageType.MOVE,
            data: {
              from: data.from,
              to: data.to,
            },
          });
        }
        break;
      case MessageType.PROMOTE: {
        const data = message.data as PromoteData;
        const destination = getDestination(data.roomId, socket);
        if (!destination) return;
        sendMessage(destination, {
          type: MessageType.PROMOTE,
          data: {
            figure: data.figure,
            idx: data.idx,
            promoteIdx: data.promoteIdx,
          },
        });
        break;
      }
    }
  });
});

export default ws;
