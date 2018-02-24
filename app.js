// Impout
const dotenv = require('dotenv');
const chalk = require('chalk');
const Discord = require('discord.js')
const bot = new Discord.Client({
    autoReconnect: true
});
// Loading Env
dotenv.load();
const discordToken = process.env.TOKEN
const discordClientID = process.env.CLIENT_ID
const commandPrefix = process.env.COMMAND_PREFIX
const botActivity = process.env.BOT_ACTIVITY
const log = console.log
const error = console.error

bot.on('ready', () => {
    bot.user.setActivity(botActivity);
    ``
    log(chalk.green.bold('Bot is online'));
    // Gives link to connect bot to server 
    log("Please use the following link to link the discord bot to discord server" + "https://discordapp.com/api/oauth2/authorize?client_id=" + discordClientID + "&scope=bot&permissions=0")
});

// Says Hello to the user 
bot.on('message', message => {
    if (message.author.equals(bot.user)) return;
    // Setups prefix and not case
    if (!message.content.startsWith(commandPrefix)) return;

    var args = message.content.substring(commandPrefix.length).split(" ");

    switch (args[0].toLowerCase()) {
        case "ping":
            message.channel.send("Pong!");
            break;
        case "streamer":
            message.member.addRole(message.guild.roles.find("name", "Streamer"));
            error()
            break;
    }

    // if (message.content === command + 'hello') {
    //     message.reply('Hello User');
    // }
})
bot.login(discordToken);