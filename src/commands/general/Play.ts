import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import Command from "../Command";
import MindClient from "../../SongClient";
import { Callback } from "../../type/Callback";
import { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import path from 'path';
import { statSync, readdirSync } from 'fs';
import { shuffleArray } from "../../util/ArrayUtil";
import { playCurrentGuildQueue, incrementCurrentGuildIndex } from "../../util/PlaybackUtil";
import { fetchRadioInformation } from "../../util/MP3Util";

export default class Play extends Command {

  constructor() {
    super({
      name: "play",
      description: "Tunes into a specific artist's radio",
      aliases: ["playradio"],
      category: 4,
      arguments: new SlashCommandBuilder()
        .addStringOption((o) =>
          o
            .setName("radio")
            .setDescription("The radio to tune into!")
            .setAutocomplete(true)
            .setRequired(true)
        ) as SlashCommandBuilder,
      exec: null as any,
    });
  }

  async exec(
    client: MindClient,
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<Callback> {

    const radio = interaction.options.getString("radio", true);
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
        "content": "You are not in a voice channel! Join one to bind the bot to!"
      }).catch(() => null);
      return { output: false };
    }

    const voiceChannel = member.voice.channel;

    const connection = joinVoiceChannel({
      "adapterCreator": interaction.guild.voiceAdapterCreator,
      "channelId": voiceChannel.id,
      "selfDeaf": true,
      "selfMute": false,
      "guildId": interaction.guild.id
    });

    const audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
        maxMissedFrames: Math.round(5000 / 20),
      },
    });

    audioPlayer.on('stateChange', async (oldState, newState) => {
      if (interaction.guild == null) return;

      if (newState.status === 'idle') {
        if (voiceChannel.members.size == 1 && voiceChannel.members.has(client.user?.id as string)) {
          connection.destroy();
          console.log("[DEBUG] Destroyed connection due to no user timeout.");
          return;
        }

        incrementCurrentGuildIndex(interaction.guild.id);
        await playCurrentGuildQueue(interaction.guild.id, audioPlayer);
      }
    })

    audioPlayer.on('error', error => {
      console.error('Error:', error.message);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
        // Seems to be reconnecting to a new channel - ignore disconnect
      } catch (error) {
        // Seems to be a real disconnect which SHOULDN'T be recovered from
        connection.destroy();
        console.log("[DEBUG] Destroyed connection due to disconnect.");
      }
    });

    connection.subscribe(audioPlayer);

    const artistSongFolder = path.join(__dirname, '..', '..', '..', 'songs', radio);
    const radioInfo = fetchRadioInformation(artistSongFolder, radio);
    const allFiles = radioInfo.queue;

    const guildRadioCache = { radio: capitalizeFirstLetter(radio), queue: shuffleArray(allFiles) as string[], index: 0, voiceChannel, radioInfo, audioPlayer };
    queue.set(interaction.guild.id, guildRadioCache);

    if (allFiles.length > 0) {
      await playCurrentGuildQueue(interaction.guild.id, audioPlayer);
    } else {
      await interaction.reply({
        ephemeral: true,
        content: "Uh oh... Looks like that artist doesn't seem to be in our database just yet!"
      }).catch(() => null);
    }

    // axios.put(`https://discord.com/api/v9/channels/${member.voice.channel.id}/voice-status`, { "status": `Now Playing: ${radio}` }, {
    //   headers: {
    //     'accept': '*/*',
    //     'accept-language': 'en-US,en;q=0.9',
    //     'content-type': 'application/json',
    //     'origin': 'https://discord.com',
    //     "Authorization": client.token,
    //     'sec-ch-ua': '"Brave";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    //     'sec-ch-ua-mobile': '?0',
    //     'sec-ch-ua-platform': '"Windows"',
    //     'sec-fetch-dest': 'empty',
    //     'sec-fetch-mode': 'cors',
    //     'sec-fetch-site': 'same-origin',
    //     'sec-gpc': '1',
    //     'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    //     'x-debug-options': 'bugReporterEnabled',
    //     'x-discord-locale': 'en-US',
    //     'x-discord-timezone': 'America/Phoenix',
    //     'x-super-properties': 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMy4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTIzLjAuMC4wIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiIiLCJyZWZlcnJpbmdfZG9tYWluIjoiIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjI4Mjk5NSwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbH0='
    //   }
    // }).catch((e: any) => console.log(e));

    await interaction.reply({
      "ephemeral": true,
      "content": `Now tuned into \`${radio || "Random Songs"}\`.`
    }).catch(() => null);
    return { output: true };

    function capitalizeFirstLetter(str: string) {
      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

  }
}
