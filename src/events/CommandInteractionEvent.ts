import { Interaction } from "discord.js";
import Event from "../Event";
import SongClient from "../SongClient";
import { Callback } from "../type/Callback";

export default class CommandInteractionEvent extends Event {
  constructor(type: string) {
    super(type);
  }

  public async emit(
    client: SongClient,
    interaction: Interaction
  ): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    const { channel, guild } = interaction;
    if (channel == null || guild == null) return;

    const command = client.commands.find(
      (c) => c.name == interaction.commandName
    );
    if (command == null) return;

    command
      .exec(client, interaction)
      .then((res: Callback = { output: false }) => {
        console.log(interaction.user.tag, "has executed", command.name);
      });
  }
}
