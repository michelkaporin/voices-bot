import { promises as fsPromises } from 'fs';
import { Config } from './types';

export class BotConfig {
    private readonly configFilepath = './assets/config.json';

    private config?: Config;

    fetch(): Promise<Config> {
        if (this.config) {
            return Promise.resolve(this.config);
        }

        const configFile = fsPromises.readFile(this.configFilepath, { encoding: 'utf-8' });

        return configFile.then(fileStr => this.config = JSON.parse(fileStr));
    }
}