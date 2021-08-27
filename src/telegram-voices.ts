import { promises as fsPromises } from "fs";
import path from "path";
import {
  TelegramVoiceMap,
  UserToTelegramVoiceMap,
  VoiceMessage,
} from "./types";

export class TelegramVoices {
  private readonly voiceMapFilepath = path.resolve(
    "./assets/telegram_voice_map.json"
  );

  private masterVoiceMap?: TelegramVoiceMap;
  private userVoiceMap: UserToTelegramVoiceMap = {};

  async get(userId: number | undefined = undefined): Promise<TelegramVoiceMap> {
    if (!userId && this.masterVoiceMap) {
      return this.masterVoiceMap;
    }

    if (userId && this.userVoiceMap[userId]) {
      return this.userVoiceMap[userId];
    }

    const voiceMapFile = fsPromises.readFile(this.voiceMapFilepath, {
      encoding: "utf-8",
    });
    const voiceMap: TelegramVoiceMap = JSON.parse(await voiceMapFile);
    if (userId) {
      this.userVoiceMap[userId] = voiceMap;
      return this.userVoiceMap[userId];
    }

    this.masterVoiceMap = voiceMap;
    return this.masterVoiceMap;
  }

  add(newVoice: VoiceMessage) {
    this.masterVoiceMap?.voices.push(newVoice);

    fsPromises.writeFile(
      this.voiceMapFilepath,
      JSON.stringify(this.masterVoiceMap),
      {
        encoding: "utf-8",
      }
    );

    for (const user in Object.keys(this.userVoiceMap)) {
      this.userVoiceMap[user].voices.push(newVoice);
    }
  }

  increaseSelectedCount(userId: number, voiceId: string) {
    const voice = this.userVoiceMap[userId].voices.find((v) => v.id == voiceId);
    if (voice) {
      voice.selectedTimes++;
    }

    this.userVoiceMap[userId].voices = this.userVoiceMap[userId].voices.sort(
      (v1, v2) => {
        if (v1.selectedTimes > v2.selectedTimes) return 1;
        else if (v1.selectedTimes < v2.selectedTimes) return -1;
        return 0;
      }
    );
  }
}
