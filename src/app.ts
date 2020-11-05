import dotenv from 'dotenv';
import { BotWrapper } from './bot';
import { TelegramVoices } from './telegram-voices';
import { VoicesLoader } from './voices-loader';

dotenv.config();

const telegramVoices = new TelegramVoices();
const bot = new BotWrapper(telegramVoices);
bot.init();

const loader = new VoicesLoader(bot, telegramVoices);
loader.load().then(_ => bot.bind());