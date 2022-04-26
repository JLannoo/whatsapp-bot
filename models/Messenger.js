const ACCEPTED_MEDIA_TYPES = require("../config/supportedTypes");
const Client = require("../config/Client");

const Messenger = {};

Messenger.log = (authorName, body) => {
    console.log("\n--"+authorName+"--");
    console.log(body);
}

Messenger.validate = {};
Messenger.validate.isCommand = (body) => {
    return body.startsWith("!sticker") || body.startsWith("! sticker");
}

Messenger.validate.isMedia = (message) => {
    return (ACCEPTED_MEDIA_TYPES.includes(message.type));
}

Messenger.validate.isQuotedMedia = async (message) => {
    if(message.hasQuotedMsg){
        const quoted = await message.getQuotedMessage();
        return ACCEPTED_MEDIA_TYPES.includes(quoted.type);
    } else {
        return false;
    }
}

Messenger.sendSticker = async (message) => {
    const sendTo = message.fromMe ? message.to : message.from;

    console.log("Downloading media...");
    Client.sendMessage(sendTo, "🤖  *BEEP BOOP*  🤖\n_Enviando sticker..._");

    const media = (await message.downloadMedia());
    const name = message.body.slice(9).trim();                 //"! sticker".length = 9, "!sticker ".length = 9

    console.log("Sending sticker...");
    Client.sendMessage(sendTo, media,{sendMediaAsSticker: true, stickerName: name, stickerAuthor: "Bot de JLannoo"});

    console.log("Sticker sent back!");
}

Messenger.sendBlacklistMessage = (receiver) => {
    console.log(`${receiver} added to blacklist`);
    Client.sendMessage(receiver, "🤖  *BEEP BOOP*  🤖\n_Usuario bloqueado!_");
}

Messenger.sendWhitelistMessage = (receiver) => {
    console.log(`${receiver} removed from blacklist`);
    Client.sendMessage(receiver, "🤖  *BEEP BOOP*  🤖\n_Usuario desbloqueado!_");
}

module.exports = Messenger;