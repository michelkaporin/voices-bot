import { promises as fsPromises } from 'fs';
import path from 'path';
import { TelegramVoiceMap } from './types';

export class TelegramVoices {
    private readonly voiceMapFilepath = path.resolve('./assets/telegram_voice_map.json');

    private voiceMap?: TelegramVoiceMap;

    async get(): Promise<TelegramVoiceMap> {
        if (this.voiceMap) {
            return this.voiceMap;
        }

        const voiceMapFile = fsPromises.readFile(this.voiceMapFilepath, { encoding: 'utf-8' });
        const voiceMap: TelegramVoiceMap = JSON.parse(await voiceMapFile);
        this.voiceMap = voiceMap;

        return this.voiceMap;
    }

    write(newVoiceMap: TelegramVoiceMap) {
        fsPromises.writeFile(this.voiceMapFilepath, JSON.stringify(newVoiceMap), { encoding: 'utf-8' });

        this.voiceMap = newVoiceMap;
    }
}