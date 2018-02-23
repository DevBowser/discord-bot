// Get env
const dotenv = require('dotenv');
// Loading Env
dotenv.load();
const Discord = require('discord.js')
const bot = new Discord.Client({ autoReconnect: true });
const discordToken = process.env.TOKEN
const discordClientID = process.env.CLIENT_ID
const commands = new Map();
const commandPrefix = process.env.COMMAND_PREFIX

bot.on('ready', () => {
    console.log('Bot is online');
});

bot.on('message', message => {
    if (message.content === 'ping') {
        message.reply('pong');
    }
});

// Says Hello to the user 
bot.on('message', message =>{
    if (message.content === command + 'hello') {
        message.reply('Hello User');
    }
})
// Gives link to connect bot to server 
console.log("Please use the following link to link the discord bot to discord server" + "https://discordapp.com/api/oauth2/authorize?client_id=" + discordClientID + "&scope=bot&permissions=0")
bot.login(discordToken);