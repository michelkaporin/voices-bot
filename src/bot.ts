import TelegramBot, {
  InlineQueryResultCachedVoice,
} from "node-telegram-bot-api";
import {
  Config,
  TelegramVoiceMap,
  VoiceMessage,
  VoiceMessageSaveState,
} from "./types";
import * as stream from "stream";
import { TelegramVoices } from "./telegram-voices";
import { BotConfig } from "./config";

export class BotWrapper {
  private bot?: TelegramBot;
  private readonly token: string;

  // <username, VoiceMessageSaveState> map
  private addedVoiceMap: Map<string, VoiceMessageSaveState> = new Map();

  // <username, telegram_file_id>
  private lastAddedVoiceMap: Map<string, string> = new Map();

  private config?: Config;

  constructor(
    private botConfig: BotConfig,
    private telegramVoices: TelegramVoices
  ) {
    this.token = process.env.TELEGRAM_BOT_TOKEN as string;
  }

  init(): BotWrapper {
    // Create a bot that uses 'polling' to fetch new updates
    this.bot = new TelegramBot(this.token, { polling: true });

    return this;
  }

  async getConfig(): Promise<Config> {
    if (!this.config) {
      this.config = await this.botConfig.fetch();
    }

    return this.config;
  }

  sendVoice(
    chatId: number,
    data: string | stream.Stream | Buffer
  ): Promise<TelegramBot.Message> {
    if (!this.bot) {
      throw Error("Bot was not initialised");
    }

    return this.bot.sendVoice(chatId, data);
  }

  async bind() {
    if (!this.bot) {
      throw Error("Bot was not initialised");
    }

    this.bindInlineQuery();
    this.bindInlineQueryResult();

    this.bindAddVoiceCommand();
    this.bindVoiceWaitState();
    this.bindVoiceReceivedState();

    this.bindPollingError();
  }

  private bindVoiceReceivedState() {
    this.bot?.on("text", async (msg, metadata) => {
      const username = msg.chat.username;
      if (!username || !this.isAdmin(username)) {
        // Not an admin
        return;
      }

      if (
        this.addedVoiceMap.get(username) !== VoiceMessageSaveState.VoiceReceived
      ) {
        return;
      }

      if (!msg.text) {
        return;
      }

      if (
        (await this.telegramVoices.get()).voices.find(
          (v) => v.title.toLowerCase() === msg.text?.toLowerCase()
        )
      ) {
        this.bot?.sendMessage(
          msg.chat.id,
          "This message text already exists. Try another one.",
          { reply_to_message_id: msg.message_id }
        );
        return;
      }

      const voiceFileId = this.lastAddedVoiceMap.get(username);
      if (!voiceFileId) {
        throw new Error(
          "Last added voice was not stored for some reason, exiting."
        );
      }

      // persist new voice
      const newVoice: VoiceMessage = {
        id: msg.message_id.toString(),
        file_id: voiceFileId,
        title: msg.text,
      };

      this.telegramVoices.add(newVoice);

      // tidy up the state
      this.addedVoiceMap.delete(username);

      this.bot?.sendMessage(
        msg.chat.id,
        "Your voice was successfully added to the list.",
        { reply_to_message_id: msg.message_id }
      );
    });
  }

  private bindVoiceWaitState() {
    this.bot?.on("voice", (msg, metadata) => {
      const username = msg.chat.username;
      if (!username || !this.isAdmin(username)) {
        // Not an admin
        return;
      }

      if (
        this.addedVoiceMap.get(username) !== VoiceMessageSaveState.VoiceWait
      ) {
        return;
      }

      if (!msg.voice) {
        this.bot?.sendMessage(
          msg.chat.id,
          "Did not get an expected file_id from Telegram."
        );
        return;
      }

      this.lastAddedVoiceMap.set(username, msg.voice.file_id);
      this.bot?.sendMessage(
        msg.chat.id,
        "Now send me the text corresponding to the voice message.",
        { reply_to_message_id: msg.message_id }
      );
      this.addedVoiceMap.set(username, VoiceMessageSaveState.VoiceReceived);
    });
  }

  private bindAddVoiceCommand() {
    this.bot?.onText(/\/addvoice/, (msg, match) => {
      if (!msg.chat.username || !this.isAdmin(msg.chat.username)) {
        return;
      }

      this.bot?.sendMessage(msg.chat.id, "Send me the voice message to save.");
      this.addedVoiceMap.set(
        msg.chat.username,
        VoiceMessageSaveState.VoiceWait
      );
    });
  }

  private bindInlineQuery() {
    this.bot?.on("inline_query", async (query) => {
      const inlineMsg = query.query.toLowerCase();

      let results = (await this.telegramVoices.get(query.from.id)).voices;

      if (inlineMsg.length > 1) {
        results = results.filter((v) =>
          v.title.toLowerCase().includes(inlineMsg)
        );
      }

      let nextOffset;
      if (results.length > 50) {
        const offset = query.offset ? +query.offset : 0;
        nextOffset = offset + 49;
        results = results.slice(offset, nextOffset);
      }

      const voices = results.map(
        (v) =>
          ({
            id: v.id,
            title: v.title,
            voice_file_id: v.file_id,
            type: "voice",
          } as InlineQueryResultCachedVoice)
      );

      this.bot?.answerInlineQuery(query.id, voices, {
        next_offset: nextOffset?.toString(),
      });
    });
  }

  private bindInlineQueryResult() {
    this.bot?.on("chosen_inline_result", (selected) => {
      if (!selected.from.id || !selected.result_id) {
        return;
      }

      this.telegramVoices.increaseSelectedCount(
        selected.from.id,
        selected.result_id
      );
    });
  }

  private bindPollingError() {
    this.bot?.on("polling_error", (err) => console.error(err));
  }

  private async isAdmin(username: string) {
    if (!this.config) {
      throw new Error("The config has not been initialised");
    }

    const admins = this.config.admins;

    if (admins.findIndex((u) => u === username) > -1) {
      return true;
    }

    return false;
  }
}
