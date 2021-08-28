export interface Config {
  botChatId: number;
  admins: string[];
}

export interface LocalVoiceMap {
  voices: {
    id: string;
    path: string;
    title: string;
  }[];
}

export interface VoiceMessage {
  id: string;
  title: string;
  file_id: string;
  selectedTimes?: number;
}

export interface TelegramVoiceMap {
  voices: VoiceMessage[];
}

export interface UserToTelegramVoiceMap {
  [userId: number]: TelegramVoiceMap;
}

export enum VoiceMessageSaveState {
  VoiceWait = 0,
  VoiceReceived = 1,
  TextReceived = 2,
}
