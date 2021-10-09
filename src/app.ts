import dotenv from 'dotenv';
import { BotWrapper } from './bot';
import { BotConfig } from './config';
import { TelegramVoices } from './telegram-voices';
import { VoicesLoader } from './voices-loader';
import * as fs from 'fs';

dotenv.config();

function handleError(err: any) {
    fs.appendFileSync('voices-bot.log', `${new Date()}: ${err}`);
}

try {
    const config = new BotConfig();

    const telegramVoices = new TelegramVoices();
    const bot = new BotWrapper(config, telegramVoices);
    bot.init();

    const loader = new VoicesLoader(bot, telegramVoices);
    loader.load().then(_ => bot.bind()).catch(err => {
        handleError(err);
    });
} catch (err) {
    handleError(err);
}
