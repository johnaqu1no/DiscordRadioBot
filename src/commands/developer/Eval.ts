import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import Command from "../Command";
import { EmbedBuilder } from "@discordjs/builders";
import axios from "axios";
import MindClient from "../../SongClient";
import { Callback } from "../../type/Callback";
const { joinVoiceChannel } = require('@discordjs/voice');

export default class Eval extends Command {
  constructor() {
    super({
      name: "eval",
      description: "Eval Command for MindOfBot (Developer Only)",
      aliases: [],
      category: 4,
      arguments: new SlashCommandBuilder()
        .addStringOption((o) =>
          o.setName("code").setDescription("Javascript Code").setRequired(true)
        )
        .addStringOption((o) =>
          o
            .setName("flags")
            .setDescription("Message Flags")
            .setRequired(false)
            .addChoices(
              {
                name: "Run Async",
                value: "async",
              },
              {
                name: "Run Silent",
                value: "silent",
              }
            )
        ) as SlashCommandBuilder,
      exec: null as any,
    });
  }

  async exec(
    client: MindClient,
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<Callback> {
    if (
      interaction.user.id !== "247431169757413378" &&
      interaction.user.id != "307970638901936138"
    )
      return { output: false };

    var timeToEval = Date.now();
    const embed = new EmbedBuilder();

    var code = interaction.options.get("code", true).value as string;
    const flags = interaction.options.get("flags", false)?.value ?? null;

    try {
      var depth = 0;

      if (!code) throw new TypeError("Invalid JavaScript code provided.");
      if (flags == "async") code = `(async () => { ${code} })()`;
      if (flags == "slient") return eval(code);

      var evaled = await eval(code);

      if (typeof evaled !== "string")
        evaled = require("util").inspect(evaled, { depth: depth });

      var evaledCode = clean(evaled);

      if (clean(evaled).length >= 2000) {
        let a = await axios
          .post("https://hastebin.com/documents", {
            body: clean(evaled),
            headers: { "Content-Type": "text/plain" },
          })
          .then((res) => res.data);
        await interaction
          .reply({
            ephemeral: true,
            content: `Evaluated in \`${
              Date.now() - timeToEval
            }ms\`\n\`\`\`js\n${evaledCode.slice(0, 1000)}\`\`\``,
            embeds: [
              embed.setDescription(
                `[Full Output](https://foodaio.cc/debug/${a.key}.js)`
              ),
            ],
          })
          .catch(() => {});
        return { output: true };
      } else {
        await interaction
          .reply({
            ephemeral: true,
            content: `Evaluated in \`${
              Date.now() - timeToEval
            }ms\`\n\`\`\`js\n${evaledCode}\`\`\``,
          })
          .catch(() => {});
        return { output: true };
      }
    } catch (err: any) {
      await interaction
        .reply({
          ephemeral: true,
          content: `Evaluated in \`${
            Date.now() - timeToEval
          }ms\`\n\nAn error occurred:\`\`\`diff\n- ${clean(err)}\`\`\``,
        })
        .catch(() => {});
      return { output: false, data: err.toString() };
    }

    function clean(text: string | any) {
      if (typeof text === "string")
        return text
          .replace(/`/g, "`" + String.fromCharCode(8203))
          .replace(/@/g, "@" + String.fromCharCode(8203));
      else return text;
    }
  }
}
