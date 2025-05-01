import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import Command from "../Command";
import MindClient from "../../SongClient";
import { Callback } from "../../type/Callback";
import { AudioPlayer } from '@discordjs/voice';
import { playCurrentGuildQueue } from "../../util/PlaybackUtil";
import similarityPercentage from "../../util/ComparingUtil";
import path from 'path';

export default class Find extends Command {

  constructor() {
    super({
      name: "find",
      description: "Skips to the desired song in the radio.",
      aliases: [],
      category: 4,
      arguments: new SlashCommandBuilder()
        .addStringOption((o) =>
          o.setName("name").setDescription("The song's name").setRequired(true).setAutocomplete(true)
        ) as SlashCommandBuilder,
      exec: null as any,
    });
  }

  async exec(
    client: MindClient,
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<Callback> {

    if (!interaction.guild)
      return { output: false };

    const songName = interaction.options.get("name", true).value as string;

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

    const desiredSong = queue.get(interaction.guild.id)?.queue.find(songPath => {
      const [, song] = path.basename(songPath, path.extname(songPath)).split(" - ");
      return (songName.length > 0 && (song.toLowerCase().startsWith(songName.toLowerCase()) || song.toLowerCase() == songName.toLowerCase())) || similarityPercentage(song.toLowerCase(), songName.toLowerCase()) >= 50
    });

    if (desiredSong == null) {
      await interaction.reply({
        "ephemeral": true,
        "content": "The song you requested doesn't seem to exist in our Radio!"
      }).catch(() => null);
      return { output: false };
    }

    (queue.get(interaction.guild.id) as any).index = Math.max(0, ((queue.get(interaction.guild.id)?.queue.indexOf(desiredSong) || 0)));
    playCurrentGuildQueue(interaction.guild.id, queue.get(interaction.guild.id)?.audioPlayer as AudioPlayer);

    await interaction.reply({
      "ephemeral": true,
      "content": `Skipping to ${songName}`
    }).catch(() => null);
    return { output: true };
  }
}
