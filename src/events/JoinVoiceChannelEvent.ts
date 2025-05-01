import { VoiceState } from "discord.js";
import Event from "../Event";
import SongClient from "../SongClient";
import { createAudioPlayer, entersState, joinVoiceChannel, NoSubscriberBehavior, VoiceConnectionStatus } from "@discordjs/voice";
import { incrementCurrentGuildIndex, playCurrentGuildQueue } from "../util/PlaybackUtil";
import { fetchRadioInformation } from "../util/MP3Util";
import { shuffleArray } from "../util/ArrayUtil";
import path from "path";
import { capitalizeFirstLetter } from "../util/GeneralUtil";

export default class JoinVoiceChannelEvent extends Event {
    constructor(type: string) {
        super(type);
    }

    public async emit(
        client: SongClient,
        oldState: VoiceState,
        newState: VoiceState
    ): Promise<void> {
        const newChannel = newState.channel;
        const member = newState.member;
        const guild = newState.guild;

        // User joined a voice channel
        if (newChannel && member && member.user.id !== client.user?.id) {
            const channelName = newChannel.name;

            // Check if the channel name ends with "Radio"
            if (channelName.endsWith("Radio")) {
                // Remove the "Radio" suffix and trim any whitespace
                const artistName = channelName.slice(0, -"Radio".length).trim();
                console.log(`${newState.member?.user.tag} joined: ${artistName}`);

                const voiceChannel = member.voice.channel;
                if (voiceChannel == null) return;

                const connection = joinVoiceChannel({
                    "adapterCreator": newChannel.guild.voiceAdapterCreator,
                    "channelId": voiceChannel.id,
                    "selfDeaf": true,
                    "selfMute": false,
                    "guildId": newChannel.guild.id
                });

                const audioPlayer = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Play,
                        maxMissedFrames: Math.round(5000 / 20),
                    },
                });

                audioPlayer.on('stateChange', async (oldState, newState) => {
                    if (guild == null) return;

                    if (voiceChannel.members.size == 1 && voiceChannel.members.has(client.user?.id as string)) {
                        connection.destroy();
                        console.log("[DEBUG] Destroyed connection due to no user timeout.");
                        return;
                    }

                    if (newState.status === 'idle') {
                        incrementCurrentGuildIndex(guild.id);
                        await playCurrentGuildQueue(guild.id, audioPlayer);
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

                const artistSongFolder = path.join(__dirname, '..', '..', 'songs', artistName);
                const radioInfo = fetchRadioInformation(artistSongFolder, artistName);
                const allFiles = radioInfo.queue;

                const guildRadioCache = { radio: capitalizeFirstLetter(artistName), queue: shuffleArray(allFiles) as string[], index: 0, voiceChannel, radioInfo, audioPlayer };
                queue.set(guild.id, guildRadioCache);

                if (allFiles.length > 0) {
                    await playCurrentGuildQueue(guild.id, audioPlayer);
                } else {
                    console.log(`[DEBUG] No songs found in the radio folder for ${artistName}.`);
                    await newState.channel.send(`No songs found in the radio folder for ${artistName}.`).catch(() => null);
                }
            }
        }
    }
}
