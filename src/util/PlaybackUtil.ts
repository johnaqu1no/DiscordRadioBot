import { AudioPlayer, StreamType, createAudioResource } from "@discordjs/voice";
import { shuffleArray } from "./ArrayUtil";
import path from 'path';
import { extractEmbeddedImage } from "./MP3Util";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { updateVoiceStatus } from "./BotUtil";

export function incrementCurrentGuildIndex(id: string) {
    const guildRadioCache = queue.get(id);
    if (guildRadioCache == null) return;
    guildRadioCache.index++;
    queue.set(id, guildRadioCache);
}


export function decrementCurrentGuildIndex(id: string) {
    const guildRadioCache = queue.get(id);
    if (guildRadioCache == null) return;
    guildRadioCache.index--;
    queue.set(id, guildRadioCache);
}

export async function playCurrentGuildQueue(id: string, audioPlayer: AudioPlayer) {
    var guildRadioCache = queue.get(id);
    if (guildRadioCache == null) return;

    if (guildRadioCache.index >= guildRadioCache.queue.length) {
        const newGuildRadioCache = { ...guildRadioCache, queue: shuffleArray(guildRadioCache.queue) as string[], index: 0 };
        queue.set(id, guildRadioCache);
        guildRadioCache = newGuildRadioCache;
        console.log(`${id} has reached the end of the randomized playlist. Reshuffling and restarting from the top!`);
    }

    console.log(`Playing ${guildRadioCache.queue[guildRadioCache.index]} from ${guildRadioCache.radio}`);
    // console.log(`Current queue: ${guildRadioCache.queue}`);

    const songPath = guildRadioCache.queue[guildRadioCache.index];
    audioPlayer.play(createAudioResource(songPath, { inputType: StreamType.Arbitrary }));

    const [artist, songName] = path.basename(songPath, path.extname(songPath)).split(" - ");
    // await guildRadioCache.voiceChannel.sendTyping();

    updateVoiceStatus(client.token, guildRadioCache.voiceChannel.id, "<a:discspinning:1367399501433802762>  Now Playing: " + artist + " - " + songName);

    // const embed = new EmbedBuilder()
    //     .setAuthor({ name: "Now Playing", iconURL: "https://media.discordapp.net/attachments/1238305835021762662/1238339305831792771/MOSHED-2024-5-9-20-56-18.gif?ex=663eecd9&is=663d9b59&hm=886acb8b5415c9bd55ac85bac1bc215c6e249e4d6e44a4609644fc02ec744949&=&width=112&height=103" })
    //     .setColor('Grey')
    //     .setDescription(`**Artist**: ${artist}\n**Song Name**: ${songName}`);

    // const imgData = await extractEmbeddedImage(songPath);
    // if (imgData) {
    //     embed.setThumbnail("attachment://playlist.png");
    // }

    // if (guildRadioCache.radioInfo.playlists[songName])
    //     embed.setFooter({ text: `Playlist: ${guildRadioCache.radioInfo.playlists[songName]}` });
    // await guildRadioCache.voiceChannel.send({ embeds: [embed], "files": imgData ? [new AttachmentBuilder(imgData, { name: "playlist.png" })] : [] });
}