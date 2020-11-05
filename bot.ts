import TelegramBot, { InlineQueryResultCachedVoice } from "node-telegram-bot-api";
import { TelegramVoiceMap, VoiceMessageSaveState } from "./types";
import * as stream from "stream";
import { TelegramVoices } from "./telegram-voices";

export class BotWrapper {

    private bot?: TelegramBot;
    private readonly token: string;

    private adminUsernames?: string[];

    // <username, VoiceMessageSaveState> map
    private addedVoiceMap: Map<string, VoiceMessageSaveState> = new Map();

    // <username, telegram_file_id>
    private lastAddedVoiceMap: Map<string, string> = new Map();

    constructor(private telegramVoices: TelegramVoices) {
        this.token = process.env.TELEGRAM_BOT_TOKEN as string;
    }

    init(): BotWrapper {
        // Create a bot that uses 'polling' to fetch new updates
        this.bot = new TelegramBot(this.token, { polling: true });
        return this;
    }

    sendVoice(chatId: number, data: string | stream.Stream | Buffer): Promise<TelegramBot.Message> {
        if (!this.bot) {
            throw Error('Bot was not initialised');
        }

        return this.bot.sendVoice(chatId, data)
    }

    async bind() {
        if (!this.bot) {
            throw Error('Bot was not initialised');
        }

        const map = await this.telegramVoices.get();

        this.bindInlineQuery(map);

        this.bindAddVoiceCommand();
        this.bindVoiceWaitState();
        this.bindVoiceReceivedState(map);
    }

    private bindVoiceReceivedState(map: TelegramVoiceMap) {
        this.bot?.on('text', (msg, metadata) => {
            const username = msg.chat.username;
            if (!username || !this.isAdmin(username)) {
                // Not an admin
                return;
            }

            if (this.addedVoiceMap.get(username) !== VoiceMessageSaveState.VoiceReceived) {
                return;
            }

            if (!msg.text) {
                return;
            }

            if (map.voices.find(v => v.title.toLowerCase() === msg.text?.toLowerCase())) {
                this.bot?.sendMessage(msg.chat.id, 'This message text already exists. Try another one.', { reply_to_message_id: msg.message_id });
                return;
            }

            const voiceFileId = this.lastAddedVoiceMap.get(username);
            if (!voiceFileId) {
                throw new Error('Last added voice was not stored for some reason, exiting.');
            }

            // persist new voice
            map.voices.push({
                id: msg.message_id.toString(),
                file_id: voiceFileId,
                title: msg.text
            });
            this.telegramVoices.write(map);

            // tidy up the state
            this.addedVoiceMap.delete(username);

            this.bot?.sendMessage(msg.chat.id, 'Your voice was successfully added to the list.', { reply_to_message_id: msg.message_id });
        });
    }

    private bindVoiceWaitState() {
        this.bot?.on('voice', (msg, metadata) => {
            const username = msg.chat.username;
            if (!username || !this.isAdmin(username)) {
                // Not an admin
                return;
            }

            if (this.addedVoiceMap.get(username) !== VoiceMessageSaveState.VoiceWait) {
                return;
            }

            if (!msg.voice) {
                this.bot?.sendMessage(msg.chat.id, 'Did not get an expected file_id from Telegram.');
                return;
            }

            this.lastAddedVoiceMap.set(username, msg.voice.file_id);
            this.bot?.sendMessage(msg.chat.id, 'Now send me the text corresponding to the voice message.', { reply_to_message_id: msg.message_id });
            this.addedVoiceMap.set(username, VoiceMessageSaveState.VoiceReceived);
        });
    }

    private bindAddVoiceCommand() {
        this.bot?.onText(/\/addvoice/, (msg, match) => {
            if (!msg.chat.username || !this.isAdmin(msg.chat.username)) {
                return;
            }

            this.bot?.sendMessage(msg.chat.id, 'Send me the voice message to save.');
            this.addedVoiceMap.set(msg.chat.username, VoiceMessageSaveState.VoiceWait);
        });
    }

    private bindInlineQuery(map: TelegramVoiceMap) {
        this.bot?.on('inline_query', async (query) => {
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

    private isAdmin(username: string) {
        if (!this.adminUsernames) {
            this.adminUsernames = ['michelkaporin', 'artsheff'];
        }

        if (this.adminUsernames.findIndex(u => u === username) > -1) {
            return true;
        }

        return false;
    }
}