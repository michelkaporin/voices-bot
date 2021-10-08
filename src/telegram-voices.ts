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
  private readonly voiceMapBackupFilepath = path.resolve(
    "./assets/telegram_voice_map.json.bak"
  );

  private masterVoiceMap?: TelegramVoiceMap;
  private userVoiceMap: UserToTelegramVoiceMap = {}; // user's custom voice map with own order of appearance

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

  async add(newVoice: VoiceMessage) {
    this.masterVoiceMap?.voices.push(newVoice);

    // Backup
    await fsPromises.copyFile(
      this.voiceMapFilepath,
      this.voiceMapBackupFilepath
    );

    // Write new
    await fsPromises.writeFile(
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
    if (!this.userVoiceMap[userId]) return;

    const index = this.userVoiceMap[userId].voices.findIndex(
      (v) => v.id == voiceId
    );
    if (index > -1) {
      const voice = this.userVoiceMap[userId].voices[index];
      voice.selectedTimes = voice.selectedTimes ? voice.selectedTimes++ : 1;
    }

    this.userVoiceMap[userId].voices = this.userVoiceMap[userId].voices.sort(
      (v1, v2) => {
        v1.selectedTimes = v1.selectedTimes ?? 0;
        v2.selectedTimes = v2.selectedTimes ?? 0;
        if (v1.selectedTimes < v2.selectedTimes) return 1;
        else if (v1.selectedTimes > v2.selectedTimes) return -1;
        return 0;
      }
    );
  }
}
