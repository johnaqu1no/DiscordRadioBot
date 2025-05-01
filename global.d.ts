import { Collection, Document } from "mongodb";
import { Collection as DiscordCollection, VoiceBasedChannel } from 'discord.js';
import SongClient from "./src/SongClient";
import { AudioPlayer } from "@discordjs/voice";

declare global {
  var client: SongClient;
  var rest: any;
  var db: Collection<Document>;
  var queue: DiscordCollection<string, {
    radio: string,
    queue: string[],
    index: number,
    voiceChannel: VoiceBasedChannel,
    radioInfo: FilesInfo,
    audioPlayer: AudioPlayer
  }>;
}

export { };
