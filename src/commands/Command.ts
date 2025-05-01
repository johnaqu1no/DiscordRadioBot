import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { CommandCategory } from "../type/CommandCategory";
import MindClient from "../SongClient";
import { Callback } from "../type/Callback";

export default interface Command {
  name: string;
  description: string;
  aliases: string[];
  category: CommandCategory;
  arguments?: SlashCommandBuilder;
  cooldown?: number;
}

export default class Command {
  constructor(options: Command) {
    this.name = options.name;
    this.description = options.description;
    this.aliases = options.aliases;
    this.arguments = options.arguments ?? new SlashCommandBuilder();
    this.cooldown = options.cooldown ?? 0;
  }
  async exec(
    client: MindClient,
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<Callback> {
    throw new Error("Method not implemented.");
  }
}
