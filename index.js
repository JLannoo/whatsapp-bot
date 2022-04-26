const Client = require("./config/Client");
const ClientController = require("./controllers/ClientController");

Client.initialize();
console.log("Initializing...");

Client.on("qr", (qr) => {
    ClientController.generateQR(qr);
});

Client.on("ready", () => {
    ClientController.sendReadyAlert(Client);
});

Client.on("message_create", (message) => {
    ClientController.messageHandler(message);
});

Client.on("disconnect", () => {
    ClientController.disconnect(Client);
});