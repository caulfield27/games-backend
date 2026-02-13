type Player = {
  id: string;
  name: string;
  isReady?: boolean;
};

type WSMessage = {
  type: string;
  data: any;
};

export {Player, WSMessage}