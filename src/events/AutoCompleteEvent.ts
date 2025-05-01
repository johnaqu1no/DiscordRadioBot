import { AutocompleteInteraction } from "discord.js";
import Event from "../Event";
import MindClient from "../SongClient";
import { readdirSync } from 'fs';
import path from 'path';
import similarityPercentage from "../util/ComparingUtil";
import { fetchRadioInformation } from "../util/MP3Util";
export default class AutoCompleteEvent extends Event {
    constructor(type: string) {
        super(type);
    }

    public async emit(
        client: MindClient,
        interaction: AutocompleteInteraction
    ): Promise<void> {
        if (!interaction.isAutocomplete()) return;

        const command = client.commands.find(c => c.name === interaction.commandName) ?? null;
        if (command == null) return;

        try {
            const focusedValue = interaction.options.getFocused();
            if (command.name == "play") {
                await interaction.respond([{ name: "Random", value: "" }, ...readdirSync(path.join(__dirname, '..', '..', 'songs')).filter(n => focusedValue.length == 0 || n.toLowerCase().startsWith(focusedValue.toLowerCase()) || similarityPercentage(n.toLowerCase(), focusedValue.toLowerCase()) >= 50).map(n => ({ name: n, value: n }))]);
            } else if (command.name == "find") {
                const radio = queue.get(interaction.guild?.id as string)?.radio;
                if (!radio) return await interaction.respond([]);

                const artistSongFolder = path.join(__dirname, '..', '..', 'songs', radio);
                const radioInfo = fetchRadioInformation(artistSongFolder, radio);
                const allFiles = radioInfo.queue as string[];

                console.log(focusedValue);

                await interaction.respond(
                    allFiles
                        .map(songPath => {
                            const [, songName] = path.basename(songPath, path.extname(songPath)).split(" - ");
                            return songName;
                        })
                        .filter(n => focusedValue.length == 0 || (n.toLowerCase() == focusedValue.toLowerCase() || n.toLowerCase().startsWith(focusedValue.toLowerCase())) || similarityPercentage(n.toLowerCase(), focusedValue.toLowerCase()) >= 50)
                        .map(songName => ({ name: songName.slice(0, 100), value: songName.slice(0, 100) })).slice(0, 25));
            }
        } catch (error) {
            console.error(error);
        }

    }
}
