// Load config
const config = require('./config.json')

// Impout
const dotenv = require('dotenv');
const chalk = require('chalk');
const Discord = require('discord.js')
const bot = new Discord.Client({
    autoReconnect: true
});
const discordToken = config.TOKEN
const commandPrefix = config.COMMAND_PREFIX
const botActivity = config.BOT_ACTIVITY
const log = console.log
const error = console.error

bot.on('ready', async () => {
    bot.user.setActivity(botActivity);

    log(chalk.green.bold('Bot is ready!' + bot.user.username));
    // Gives link to connect bot to server 
    try {
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        log("Please use the following link to invite the discord bot to your server " + link);
    } catch (e) {
        error(e.stack);
    }
});

// Says Hello to the user 
bot.on('message', message => {
    if (message.author.equals(bot.user)) return;
    // Setups prefix and not case
    if (!message.content.startsWith(commandPrefix)) return;

    // TODO: Does this actually fetch the args correctly?
    const args = message.content.slice(commandPrefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();


    // Ping Command works but its not fetching any args.
    if (command === 'ping') {
        message.channel.send('Pong!');
    } else
    if (command === 'blah') {
        message.channel.send('Meh.');
    }

    // For the future you can change this to grab from a database so you can change the allowed roles
    // in the future without having to do a code change
    const ALLOWED_ROLES = ['streamer', 'youtuber'];
    if (command === "addRole") {
        let role = args[0]; // Remember arrays are 0-based!.
        log(role);
        const canAdd = ALLOWED_ROLES.includes(role.toLowerCase());

        if (canAdd) {
            message.member.addRole(message.guild.roles.find("name", role));
        } else {
            log("Fail to update role.")
        }
    }
})
bot.login(discordToken);