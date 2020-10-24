export interface LocalVoiceMap {
    voices: {
        id: string;
        path: string;
        title: string;
    }[];
}

export interface TelegramVoiceMap {
    voices: {
        id: string;
        title: string;
        file_id: string;
    }[];
}