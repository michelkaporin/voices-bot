import fs from 'fs';
import { TelegramVoiceMap } from './types';

export class TelegramVoices {
    private readonly voiceMapFilepath = './assets/telegram_voice_map.json';

    private voiceMap?: TelegramVoiceMap;

    get(): TelegramVoiceMap {
        if (this.voiceMap) {
            return this.voiceMap;
        }

        // todo: use async
        const voiceMapFile = fs.readFileSync(this.voiceMapFilepath, 'utf-8');
        const voiceMap: TelegramVoiceMap = JSON.parse(voiceMapFile);
        this.voiceMap = voiceMap;

        return this.voiceMap;
    }

    write(newVoiceMap: TelegramVoiceMap) {
        fs.writeFileSync(this.voiceMapFilepath, JSON.stringify(newVoiceMap), { encoding: 'utf-8' });

        this.voiceMap = newVoiceMap;
    }
}