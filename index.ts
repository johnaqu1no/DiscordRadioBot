import { IntentsBitField, Partials } from "discord.js";
import SongClient from "./src/SongClient";
import path from 'path';
import { readFileSync } from 'fs';
import { Config } from "./src/type/Config";

const config = JSON.parse(readFileSync(path.join(__dirname, "config.json"), "utf-8")) as Config;

config.instances.forEach(instance => {
  const client = new SongClient(
    instance.token, instance.id,
    {
      intents: [
        IntentsBitField.Flags.DirectMessageReactions,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageTyping,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Reaction,
        Partials.User,
      ],
    }
  );
  
  global.client = client;
  client.start();
});
