const { Client , LocalAuth } = require('whatsapp-web.js');

const { env } = require("process");
const ARGUMENTS = process.argv.slice(2);

const WppClient = new Client ({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: !ARGUMENTS.includes("-headful"),
        executablePath: ARGUMENTS.includes("-chrome") ? env.CHROME_PATH : ""
    },
    ffmpegPath: env.FFMPEG_PATH
});

module.exports = WppClient;