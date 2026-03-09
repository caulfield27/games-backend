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

enum MessageType {
  SELECTION = "selection",
  CANCEL_SELECTION = "cancel_selection",
  MOVE = "move",
}

const ws = new WebSocketServer({ noServer: true });
let queue: CustomSocket[] = [];
const gameRooms = new Map<string, [CustomSocket, CustomSocket]>();

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
            socket.send(
              JSON.stringify({
                type: "gameFound",
                data: {
                  roomId,
                  name: `#${queue.length + 1}`,
                  opponent: `#${queue.length}`,
                  color: random === 1 ? "white" : "black",
                },
              }),
            );
            opponent.send(
              JSON.stringify({
                type: "gameFound",
                data: {
                  roomId,
                  name: `#${queue.length}`,
                  opponent: `#${queue.length + 1}`,
                  color: random === 1 ? "black" : "white",
                },
              }),
            );
          }
        }
        break;
      case MessageType.CANCEL_SELECTION:
        queue = queue.filter((s) => s.clientId !== socket.clientId);
        break;
      case MessageType.MOVE:
        const data = message.data as MoveData;
        const room = gameRooms.get(data.roomId);
        if (!room) return;
        const destination = room.find((r) => r.clientId !== socket.clientId);
        if (!destination) return;
        destination.send(
          JSON.stringify({
            type: "move",
            data: {
              from: data.from,
              to: data.to,
            },
          }),
        );
        break;
    }
  });
});

export default ws;
