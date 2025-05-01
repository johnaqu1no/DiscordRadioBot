import {
    CacheType,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
} from "discord.js";
import Command from "../Command";
import MindClient from "../../SongClient";
import { Callback } from "../../type/Callback";

export default class Help extends Command {

    constructor() {
        super({
            name: "help",
            description: "Displays the list of commands",
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

        await interaction.reply({
            "ephemeral": true,
            "content": `
\`/help\` - Displays this command

**Remember these commands only work for users that are able to Mute, Kick, Defean users in VC.**
\`/play\` - Select a Radio to tune into!
\`/stop\` - Stops the Radio
\`/pause\` - Pauses the Radio
\`/resume\` - Resumes the Radio
\`/skip\` - Plays the next song in the Radio
\`/previous\` - Plays the previous song in the Radio.
\`/find [song]\` - Finds a specific song in the Radio.`
        }).catch(() => null);
        return { output: true };
    }
}
