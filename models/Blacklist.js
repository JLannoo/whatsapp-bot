const fs = require("fs");
const dotenv = require('dotenv');
dotenv.config();
const BLACKLIST_PATH = process.env.BLACKLIST_PATH;

const Blacklist = {};
const blacklist = JSON.parse(fs.readFileSync(BLACKLIST_PATH));

Blacklist.checkBlacklisted = (user) => {
    return blacklist.users.includes(user);
}

Blacklist.clear = () => {
    blacklist.users = [];
    fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(blacklist));
}

Blacklist.add = (user) => {
    blacklist.users.push(user);
    fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(blacklist));
}

Blacklist.remove = (user) => {
    blacklist.users.splice(blacklist.users.indexOf(user));
    fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(blacklist));
}

module.exports = Blacklist;