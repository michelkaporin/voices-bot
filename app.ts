import dotenv from 'dotenv';
import { BotWrapper } from './bot';
import { VoicesLoader } from './voices-loader';

dotenv.config();

// Create a bot that uses 'polling' to fetch new updates
const botWrapper = new BotWrapper();
const bot = botWrapper.init();
const loader = new VoicesLoader(bot);
const voiceMap = loader.load();

botWrapper.bind(voiceMap);