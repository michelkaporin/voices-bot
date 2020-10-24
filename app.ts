import TelegramBot, { InlineQueryResultCachedVoice } from 'node-telegram-bot-api';
import fs from 'fs';
import { LocalVoiceMap, TelegramVoiceMap } from './types';
import lodash from 'lodash';
const { isEqual } = lodash;
import dotenv from 'dotenv';

dotenv.config();
const token = process.env.TELEGRAM_BOT_TOKEN as string;

const localVoicesFilepath = './assets/local_voice_map.json';
const localVoicesFile = fs.readFileSync(localVoicesFilepath, 'utf-8');
const files: LocalVoiceMap = JSON.parse(localVoicesFile);

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

const voiceMapFilepath = './assets/telegram_voice_map.json';
const voiceMapFile = fs.readFileSync(voiceMapFilepath, 'utf-8');
const voiceMap: TelegramVoiceMap = JSON.parse(voiceMapFile);
const latestVoiceMap: TelegramVoiceMap = JSON.parse(voiceMapFile);

for (const file of files.voices) {
    const voice = voiceMap.voices.find(v => v.id === file.id);

    // Upload if voice doesn't exist
    if (!voice) {
        const data = fs.createReadStream(file.path);
        const msg = await bot.sendVoice(459393176, data); // send to my chat id

        if (!msg.voice) {
            throw Error("Did not get an expected file_id from Telegram");
        }

        latestVoiceMap.voices.push({
            id: file.id,
            file_id: msg.voice.file_id,
            title: file.title,
        });
    }
}
if (!isEqual(voiceMap, latestVoiceMap)) {
    fs.writeFileSync(voiceMapFilepath, JSON.stringify(latestVoiceMap), { encoding: 'utf-8' });
}

latestVoiceMap.voices = latestVoiceMap.voices.sort((a, b) => {
    if (a.title > b.title) {
        return 1;
    } else if (a.title < b.title) {
        return -1;
    }
    return 0;
})

bot.on('inline_query', async query => {
    const inlineMsg = query.query.toLowerCase();
    let results = latestVoiceMap.voices;

    if (inlineMsg.length > 1) {
        results = latestVoiceMap.voices.filter(v => v.title.toLowerCase().includes(inlineMsg));
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

    bot.answerInlineQuery(query.id, voices);
});