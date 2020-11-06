# Telegram Bot for Inline Voice Message Sending

This bot produces Telegram inline query results based on loaded voice messages.

**Features**:
- Load predefined set of your .OGG voice messages
- Add voice messages during bot's runtime through bot interaction
    - Limited to configured username list of admins

## Setup and Configuration
### Pre-requisites
- Node.js 13.7.0+

### Configuration
Consult _sample_ folder for bot configuration example.

1. Add _.env_ file to the root of the project with your Telegram HTTP API Token
```
TELEGRAM_BOT_TOKEN=your_telegram_token
```
2. Add _.config_ file  to the _assets_ folder with Telegram list of usernames for admins and botChatId for ID of bot's own chat. This will be used for saving voice messages upload from your bot's machine.
3. Add _telegram_voice_map.json_ and _local_voice_map.json_ to the _assets_ folder. Populate _local_voice_map.json_, if you have any voices to be uploaded (add .OGG files under _assets/voices_ folder).

## Start Bot
```
yarn && yarn start
```
