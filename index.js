const qrcode = require("qrcode-terminal");
const fs = require("fs");
require("dotenv").config();

const SESSION_PATH = "./session.json";
const BLACKLIST_PATH = "./blacklist.json";
const ACCEPTED_MEDIA_TYPES = ["image","video", "gif"];
const PATH_TO_CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ARGUMENTS = process.argv.slice(2);

const { Client , LocalAuth } = require('whatsapp-web.js');
const { env } = require("process");

const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

//Read sessionData file
if(fs.existsSync(SESSION_PATH) && fs.readFileSync(SESSION_PATH)){
    sessionData = JSON.parse(fs.readFileSync(SESSION_PATH));
}

//Creates new Client and appends session data
const client = new Client ({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: !ARGUMENTS.includes("-headful"),
        executablePath: ARGUMENTS.includes("-chrome") ? PATH_TO_CHROME : ""
    },
    ffmpegPath: env.FFMPEG_PATH
});

client.initialize();
console.log("Initializing...");

//When no session is logged generate QR to create it
client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true})
});

client.on('ready', async () => {
    console.log('Client is ready!');
    client.sendMessage(env.WPP_SELF, "🤖  *BEEP BOOP*  🤖\n_Bot iniciado!_");
})


client.on('message_create', async message => {
    //HANDLE LIBRARY ERROR
    if(!message.hasMedia && ACCEPTED_MEDIA_TYPES.includes(message.type)){
        console.log("\nError in library");
        return;
    } 
    
    //SETUP
    let blacklist = JSON.parse(fs.readFileSync(BLACKLIST_PATH));
    let author = (await message.getContact());
    let name = author.name;
    let receiver = message.to;
    if(message.fromMe) name = "YO";

    //IGNORE IF BLACKLISTED
    if (blacklist.users.includes(author.id._serialized)){
        console.log(`\nMessage from ${author.id._serialized} blocked`)
        return;
    }

    //LOG
    let body = message.body;
    console.log("\n--"+(name||author.id._serialized)+"--");
    console.log(body);

    //SEND MEDIA AS STICKER
    if(ACCEPTED_MEDIA_TYPES.includes(message.type) && (body.startsWith("!sticker") || body.startsWith("! sticker"))){
        sendSticker(message);                                       //IN MESSAGE
    }

    if(message.hasQuotedMsg && (body.startsWith("!sticker") || body.startsWith("! sticker"))){
        let quoted = await message.getQuotedMessage();
        sendSticker(quoted, message.from);                          //IN QUOTED MESSAGE
    }

    //BLACKLIST CONTACT
    if(body === "!blacklist" && message.fromMe){
        if(!blacklist.users.includes(receiver)){
            blacklist.users.push(receiver);
            console.log(`${author.id._serialized} added to blacklist`);
        } else {
            console.log("This user is already blacklisted");
        }

        fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(blacklist))
    }

    //WHITELIST CONTACT
    if(body === "!whitelist" && message.fromMe){
        if(blacklist.users.includes(receiver)){
            blacklist.users.splice(blacklist.users.indexOf(receiver));
            console.log(`${author.id._serialized} removed from blacklist`);
        } else {
            console.log("This user is not blacklisted");
        }

        fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(blacklist))
    }

    return;
});

async function sendSticker(message, replier=undefined){
    if(message.fromMe) message.from = message.to;

    console.log("Downloading media...");
    client.sendMessage(replier||message.from, "🤖  *BEEP BOOP*  🤖\n_Enviando sticker..._");

    let media = (await message.downloadMedia());
    let name = message.body.slice(9).trim();                 //"! sticker".length = 9, "!sticker ".length = 9

    console.log("Sending sticker...");
    client.sendMessage(replier||message.from, media,{sendMediaAsSticker: true, stickerName: name, stickerAuthor: "Bot de JLannoo"});

    console.log("Sticker sent back!");
}

client.on("disconnected", () => {
    console.log("Client disconnected");

    rl.question('Restart? (y/n): ', resp => {
        if(resp.toLowerCase() === "y"){
            console.clear();
            client.initialize();
            console.log("Initializing...");
            rl.close();
        }
        rl.close();
    });
});