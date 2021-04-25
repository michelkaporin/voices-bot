import dotenv from 'dotenv';
import { BotWrapper } from './bot';
import { BotConfig } from './config';
import { TelegramVoices } from './telegram-voices';
import { VoicesLoader } from './voices-loader';

dotenv.config();

const config = new BotConfig();

const telegramVoices = new TelegramVoices();
const bot = new BotWrapper(config, telegramVoices);
bot.init();

const loader = new VoicesLoader(bot, telegramVoices);
// file deepcode ignore PromiseNotCaughtGeneral: there’s no way to recover from an error
loader.load().then(_ => bot.bind());