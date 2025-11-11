export interface IMessage {
  priority: number;
  name: string;
  message: string;
}

export interface MessageContextProps extends IMessage {
  onChangeMessage: (msg: IMessage) => void;
  clearContext: () => void;
}
