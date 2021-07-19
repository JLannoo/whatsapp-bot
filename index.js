const qrcode = require("qrcode-terminal");
const fs = require("fs");
require("dotenv").config();

const SESSION_PATH = "./session.json";
const BLACKLIST_PATH = "./blacklist.json";
const ACCEPTED_MEDIA_TYPES = ["image","video", "gif"];

const { Client } = require('whatsapp-web.js');

//Read sessionData file
let sessionData;
if(fs.existsSync(SESSION_PATH) && fs.readFileSync(SESSION_PATH)){
    sessionData = JSON.parse(fs.readFileSync(SESSION_PATH));
}
//Creates new Client and appends session data
const client = new Client ({
    session: sessionData
});

client.initialize();
console.log("Initializing...");

//When no session is logged generate QR to create it
client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true})
});

//Write session when authorized
client.on('authenticated', session => {
    sessionData = session;

    fs.writeFile(SESSION_PATH, JSON.stringify(sessionData), (err) => {
        if(err) console.log(err)
        else console.log("Written succesfully!");
    })
});

client.on('ready', async () => {
    console.log('Client is ready!');
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

    //SEND MEDIA IN MESSAGE AS STICKER
    if(ACCEPTED_MEDIA_TYPES.includes(message.type) && (body === "!sticker" || body === "! sticker")){
        sendSticker(message);
    }

    //SEND MEDIA IN QUOTED MESSAGE AS STICKER
    if(message.hasQuotedMsg){
        let quoted = await message.getQuotedMessage();
        if(ACCEPTED_MEDIA_TYPES.includes(quoted.type) && (body === "!sticker" || body === "! sticker")){
            sendSticker(quoted, message.from);
        }
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
    console.log("Downloading media...");
    let media = (await message.downloadMedia());

    console.log("Sending sticker...");
    client.sendMessage(replier||message.from, media,{sendMediaAsSticker: true});

    console.log("Sticker sent back!");
}

client.on("disconnected", () => {
    console.log("Client disconnected");
});