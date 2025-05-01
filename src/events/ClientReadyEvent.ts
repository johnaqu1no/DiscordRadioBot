import Event from "../Event";
import SongClient from "../SongClient";

export default class ClientReadyEvent extends Event {
    constructor(type: string) {
        super(type);
    }

    public async emit(
        client: SongClient
    ): Promise<void> {
        console.log(`${client.user?.tag} is now online!`);
    }
}
