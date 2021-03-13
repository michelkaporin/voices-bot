import { LocalVoiceMap, TelegramVoiceMap } from "./types";
import { promises as fsPromises, createReadStream } from 'fs';
import { isEqual } from "lodash";
import { BotWrapper } from "./bot";
import { TelegramVoices } from "./telegram-voices";
import path from "path";

export class VoicesLoader {
    private readonly localVoicesFilepath = path.resolve('./assets/local_voice_map.json');

    constructor(
        private bot: BotWrapper,
        private telegramVoices: TelegramVoices) {
    }

    async load(): Promise<TelegramVoiceMap> {
        const localVoicesFile = fsPromises.readFile(this.localVoicesFilepath, { encoding: 'utf-8' });
        const files: LocalVoiceMap = JSON.parse(await localVoicesFile);

        const voiceMap = await this.telegramVoices.get();
        const latestVoiceMap = await this.telegramVoices.get();

        await this.uploadNewVoices(files, voiceMap, latestVoiceMap);

        latestVoiceMap.voices = this.sortVoices(latestVoiceMap);

        return latestVoiceMap;
    }

    private async uploadNewVoices(files: LocalVoiceMap, voiceMap: TelegramVoiceMap, newVoiceMap: TelegramVoiceMap) {
        const myChatId = (await this.bot.getConfig()).botChatId;

        for (const file of files.voices) {
            const voice = voiceMap.voices.find(v => v.id === file.id);

            // Upload if voice doesn't exist
            if (!voice) {
                const data = createReadStream(file.path);
                const msg = await this.bot.sendVoice(myChatId, data); // send to my chat id

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
            this.telegramVoices.write(newVoiceMap);
        }
    }

    private sortVoices(latestVoiceMap: TelegramVoiceMap) {
        return latestVoiceMap.voices.sort((a, b) => {
            if (a.title > b.title) {
                return 1;
            } else if (a.title < b.title) {
                return -1;
            }
            return 0;
        });
    }
}