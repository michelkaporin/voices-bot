import dotenv from 'dotenv';
import { BotWrapper } from './bot';
import { VoicesLoader } from './voices-loader';

dotenv.config();

const bot = new BotWrapper();
bot.init();
const loader = new VoicesLoader(bot);
const voiceMap = loader.load();

bot.bind(voiceMap);