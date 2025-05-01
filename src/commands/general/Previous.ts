import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import Command from "../Command";
import MindClient from "../../SongClient";
import { Callback } from "../../type/Callback";
import { AudioPlayer } from '@discordjs/voice';
import { playCurrentGuildQueue, decrementCurrentGuildIndex } from "../../util/PlaybackUtil";

export default class Previous extends Command {

  constructor() {
    super({
      name: "previous",
      description: "Back tracks the song that was playing",
      aliases: [],
      category: 4,
      arguments: new SlashCommandBuilder() as SlashCommandBuilder,
      exec: null as any,
    });
  }

  async exec(
    client: MindClient,
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<Callback> {

    if (!interaction.guild)
      return { output: false };

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has("MuteMembers") && member.id != "247431169757413378") {
      await interaction.reply({
        "ephemeral": true,
        "content": "You do not have the required permissions to run this command."
      }).catch(() => null);
      return { output: false };
    }

    if (!member.voice.channel) {
      await interaction.reply({
        "ephemeral": true,
        "content": "You are not in a voice channel! Join one!"
      }).catch(() => null);
      return { output: false };
    }

    if (!queue.has(interaction.guild.id)) {
      await interaction.reply({
        "ephemeral": true,
        "content": "A radio isn't bound to this server! Use `/playradio` first!"
      }).catch(() => null);
      return { output: false };
    }

    decrementCurrentGuildIndex(interaction.guild.id);
    playCurrentGuildQueue(interaction.guild.id, queue.get(interaction.guild.id)?.audioPlayer as AudioPlayer);

    await interaction.reply({
      "ephemeral": true,
      "content": "Playing the previous played song!"
    }).catch(() => null);
    return { output: true };
  }
}
