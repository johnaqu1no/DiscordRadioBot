import axios, { AxiosResponse } from 'axios';

interface VoiceStatusPayload {
    status: string;
}

interface DiscordAPIResponse {
    [key: string]: any; // You can define a more specific type based on your API expectations
}

/**
 * Updates the voice status of a Discord channel using the HTTP API.
 * @param botToken - Your bot's token.
 * @param channelId - The ID of the channel to update.
 * @param status - The status string to send.
 * @returns A Promise resolving with the API response.
 */
export async function updateVoiceStatus(
    botToken: string,
    channelId: string,
    status: string
): Promise<DiscordAPIResponse> {
    const url = `https://discord.com/api/v10/channels/${channelId}/voice-status`;
    const payload: VoiceStatusPayload = { status };

    try {
        const response: AxiosResponse<DiscordAPIResponse> = await axios.put(url, payload, {
            headers: {
                Authorization: `Bot ${botToken}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            console.error(`Discord API error: ${error.response.status}`, error.response.data);
            throw new Error(`Failed to update voice status: ${error.response.status}`);
        } else {
            console.error('Request error:', error.message);
            throw error;
        }
    }
}
