// Get env
const dotenv = require('dotenv');
// Loading Env
dotenv.load();
const Discord = require('discord.js')
const bot = new Discord.Client({
    autoReconnect: true
});
const discordToken = process.env.TOKEN
const discordClientID = process.env.CLIENT_ID
const commands = new Map();
const commandPrefix = process.env.COMMAND_PREFIX

bot.on('ready', () => {
    bot.user.setActivity('Being MrDemonWolfs Slave`');
    console.log('Bot is online');
    // Gives link to connect bot to server 
    console.log("Please use the following link to link the discord bot to discord server" + "https://discordapp.com/api/oauth2/authorize?client_id=" + discordClientID + "&scope=bot&permissions=0")
});

// Says Hello to the user 
bot.on('message', message => {
    if (message.author.equals(bot.user)){
        console.log("Stop talking to your self")
    }
    // Setups prefix and not case
    if (!message.content.startsWith(commandPrefix)) return; 

    var args = message.content.substring(commandPrefix.length).split(" ");
    
    switch

    // if (message.content === command + 'hello') {
    //     message.reply('Hello User');
    // }
})
bot.login(discordToken);