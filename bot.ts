import TelegramBot, { InlineQueryResultCachedVoice } from "node-telegram-bot-api";
import { TelegramVoiceMap } from "./types";
import * as stream from "stream";

export class BotWrapper {

    private bot?: TelegramBot;
    private readonly token: string;

    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN as string;
    }

    init(): BotWrapper {
        // Create a bot that uses 'polling' to fetch new updates
        this.bot = new TelegramBot(this.token, { polling: true });
        return this;
    }

    async bind(voiceMap: Promise<TelegramVoiceMap>) {
        const map = await voiceMap;

        this.bot?.on('inline_query', async query => {
            const inlineMsg = query.query.toLowerCase();
            let results = map.voices;

            if (inlineMsg.length > 1) {
                results = map.voices.filter(v => v.title.toLowerCase().includes(inlineMsg));
            }

            if (results.length > 50) {
                results = results.slice(0, 49);
            }

            const voices = results.map(v => ({
                id: v.id,
                title: v.title,
                voice_file_id: v.file_id,
                type: 'voice'
            }) as InlineQueryResultCachedVoice);

            this.bot?.answerInlineQuery(query.id, voices);
        });
    }

    sendVoice(chatId: number, data: string | stream.Stream | Buffer): Promise<TelegramBot.Message> {
        if (!this.bot) {
            throw Error('Bot was not initialised');
        }

        return this.bot.sendVoice(chatId, data)
    }
}