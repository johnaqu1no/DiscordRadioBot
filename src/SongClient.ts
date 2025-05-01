import {
  Client,
  ClientOptions,
  Events,
  SlashCommandBuilder,
  REST,
  Routes,
  GuildTextBasedChannel,
  EmbedBuilder,
  Collection,
} from "discord.js";
import Command from "./commands/Command";
import Eval from "./commands/developer/Eval";
import Play from "./commands/general/Play";
import Event from "./type/Event";
import ClientReadyEvent from "./events/ClientReadyEvent";
import CommandInteractionEvent from "./events/CommandInteractionEvent";
import { readFileSync } from 'fs';
import path from 'path';
import { Config } from "./type/Config";
import AutoCompleteEvent from "./events/AutoCompleteEvent";
import Skip from "./commands/general/Skip";
import Pause from "./commands/general/Pause";
import Previous from "./commands/general/Previous";
import Resume from "./commands/general/Resume";
import Help from "./commands/general/Help";
import Find from "./commands/general/Find";
import Stop from "./commands/general/Stop";
import JoinVoiceChannelEvent from "./events/JoinVoiceChannelEvent";

const config = JSON.parse(readFileSync(path.join(__dirname, "..", "config.json"), "utf-8")) as Config;

export default class SongClient extends Client {
  token: string;
  commands: Command[];
  events: Event[];
  id: string;

  constructor(token: string, id: string, options: ClientOptions) {
    super(options);
    this.token = token;
    this.commands = [];
    this.events = [];
    this.id = id;
    this.init();

    global.queue = new Collection();
  }

  private async init() {
    await this.registerAllEvents();
    await this.registerAllCommands();
  }

  private async registerAllEvents() {
    this.registerEvent(new ClientReadyEvent(Events.ClientReady));
    this.registerEvent(new CommandInteractionEvent(Events.InteractionCreate));
    this.registerEvent(new AutoCompleteEvent(Events.InteractionCreate));
    // this.registerEvent(new VoiceChannelEvent(Events.VoiceStateUpdate));
    this.registerEvent(new JoinVoiceChannelEvent(Events.VoiceStateUpdate));

    // This handles custom events.
    var c = 0;
    [...new Set(this.events.map((event) => event.type))].forEach(
      (
        type // filters out any duplicate events
      ) =>
        this.events
          .filter((event) => event.type == type)
          .forEach((event) => {
            // filter out the specific event and loop through it
            c++;
            this.on(type, (...args) => event.emit(this, ...args));
          })
    );
    console.log(`Successfully registered ${c} events!`);
  }

  private async registerAllCommands() {
    this.registerCommand(new Eval());
    this.registerCommand(new Pause());
    this.registerCommand(new Play());
    this.registerCommand(new Previous());
    this.registerCommand(new Find());
    this.registerCommand(new Resume());
    this.registerCommand(new Stop());
    this.registerCommand(new Skip());
    this.registerCommand(new Help());

    // This handles custom commands.
    const rest = new REST({ version: "10" }).setToken(this.token);
    var c = 0;
    const body = await Promise.all(
      this.commands.map(async (command) => {
        c++;
        return (command.arguments || new SlashCommandBuilder())
          .setName(command.name)
          .setDescription(command.description)
          .setDMPermission(false)
          .toJSON();
      })
    );
    // console.log(body);

    await rest
      .put(Routes.applicationCommands(this.id as string), {
        body
      });
  }

  private registerCommand(command: Command): void {
    this.commands.push(command);
  }

  private registerEvent(event: Event): void {
    this.events.push(event);
  }

  async start(): Promise<void> {
    if (this.token == null) throw new Error("Invalid Token Specified!");
    await this.login(this.token);

    this.guilds.fetch().then((guilds) => {
      console.log(`Connected to ${guilds.size} guilds!`);
      guilds.forEach(async (guild) => {
        console.log(`- ${guild.name} (${guild.id}) - ${(await guild.fetch()).memberCount} members`);
      });
    });
  }
}
