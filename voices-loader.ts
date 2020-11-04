import { LocalVoiceMap, TelegramVoiceMap } from "./types";
import fs from 'fs';
import TelegramBot from "node-telegram-bot-api";
import { isEqual } from "lodash";

export class VoicesLoader {
    private readonly localVoicesFilepath = './assets/local_voice_map.json';
    private readonly voiceMapFilepath = './assets/telegram_voice_map.json';
    private readonly myChatId = 459393176;

    private bot: TelegramBot;

    constructor(bot: TelegramBot) {
        this.bot = bot;
    }

    async load(): Promise<TelegramVoiceMap> {
        const localVoicesFile = fs.readFileSync(this.localVoicesFilepath, 'utf-8');
        const files: LocalVoiceMap = JSON.parse(localVoicesFile);

        const voiceMapFile = fs.readFileSync(this.voiceMapFilepath, 'utf-8');
        const voiceMap: TelegramVoiceMap = JSON.parse(voiceMapFile);
        const latestVoiceMap: TelegramVoiceMap = JSON.parse(voiceMapFile);

        await this.uploadNewVoices(files, voiceMap, latestVoiceMap);

        this.sortVoices(latestVoiceMap);

        return latestVoiceMap;
    }

    private async uploadNewVoices(files: LocalVoiceMap, voiceMap: TelegramVoiceMap, newVoiceMap: TelegramVoiceMap) {
        for (const file of files.voices) {
            const voice = voiceMap.voices.find(v => v.id === file.id);

            // Upload if voice doesn't exist
            if (!voice) {
                const data = fs.createReadStream(file.path);
                const msg = await this.bot.sendVoice(this.myChatId, data); // send to my chat id

                if (!msg.voice) {
                    throw Error("Did not get an expected file_id from Telegram");
                }

                newVoiceMap.voices.push({
                    id: file.id,
                    file_id: msg.voice.file_id,
                    title: file.title,
                });
            }
        }

        // Persist new voice map
        if (!isEqual(voiceMap, newVoiceMap)) {
            fs.writeFileSync(this.voiceMapFilepath, JSON.stringify(newVoiceMap), { encoding: 'utf-8' });
        }
    }

    private sortVoices(latestVoiceMap: TelegramVoiceMap) {
        latestVoiceMap.voices = latestVoiceMap.voices.sort((a, b) => {
            if (a.title > b.title) {
                return 1;
            } else if (a.title < b.title) {
                return -1;
            }
            return 0;
        });
    }
}