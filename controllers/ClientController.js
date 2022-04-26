const qrcode = require("qrcode-terminal");
const fs = require("fs");
const dotenv = require('dotenv');
dotenv.config();

const WPP_SELF = process.env.WPP_SELF;

const Messenger = require("../models/Messenger");
const Blacklist = require("../models/Blacklist");

function generateQR(qr) {
    qrcode.generate(qr, { small: true });
}

function sendReadyAlert(client) {
    console.log("Client initialized");
    client.sendMessage(WPP_SELF, "🤖  *BEEP BOOP*  🤖\n_Bot iniciado!_");
}

async function messageHandler(message) {
    const author = (await message.getContact());
    const authorName = message.fromMe ? "YO" : author.name;

    if (Blacklist.checkBlacklisted(author.id._serialized)) {
        console.log(`\nMessage from ${author.id._serialized} blocked`);
        return;
    }

    Messenger.log(authorName||author.id._serialized, message.body);

    if (Messenger.validate.isCommand(message.body)) {
        if(Messenger.validate.isMedia(message)){
            Messenger.sendSticker(message);
            return;
        }

        const quoted = await message.getQuotedMessage();
        if (quoted && Messenger.validate.isMedia(quoted)) {
            Messenger.sendSticker(quoted);
            return;
        }
    }

    if(message.fromMe){
        if(message.body === "!blacklist"){
            if(!Blacklist.checkBlacklisted(message.to)){
                Blacklist.add(message.to);
                Messenger.sendBlacklistMessage(message.to);
                return;
            } else {
                console.log(`\nUser ${message.to} already blacklisted`);
                return;
            }
        }

        if(message.body === "!whitelist"){
            if(Blacklist.checkBlacklisted(message.to)){
                Blacklist.remove(message.to);
                Messenger.sendWhitelistMessage(message.to);
                return;
            } else {
                console.log(`\nUser ${message.to} not blacklisted`);
                return;
            }
        }
    }
}

function disconnect(client) {
    console.log("Client disconnected");
    client.sendMessage(WPP_SELF, "🤖  *BEEP BOOP*  🤖\n_Bot desconectado!_");
}

module.exports = {
    generateQR,
    sendReadyAlert,
    messageHandler,
    disconnect
};

