import MindClient from "./SongClient";

export default class Event {
  public type: string;

  constructor(type: string) {
    this.type = type;
  }

  public emit(client: MindClient, ...args: any[]): void {}
  public getType = (): string => this.type;
}
