// Load config
const config = require('./config.json')

// Impout
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
    log(chalk.green.bold('Bot is ready! ' + bot.user.username));
    bot.user.setActivity(botActivity);

    // Gives link to connect bot to server 
    try {
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        log("Please use the following link to invite the discord bot to your server " + link);
    } catch (e) {
        error(e.stack);
    }
});
// Setup Messages
bot.on('message', async message => {
    // Disable Bot replys
    if (message.author.bot) return;
    // Disabled DMs
    if (message.channel.type === "dm") return;

    // // Setups prefix and not case
    let messageArray = message.content.split(" ");
    let command = messageArray[0];
    let args = messageArray.slice(1);


    if (!command.startsWith(commandPrefix)) return;

    if (command === commandPrefix + "ping") {
        message.channel.send("Pong");
    }
    // Userinfo Command
    if (command === commandPrefix + "userinfo") {
        let embed = new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription("Set Infos");
        message.channel.send(embed);


    }
    // Roles
    const ALLOWED_ROLES = ['Streamer', 'Youtuber'];
    // Add role to user
    if (command === commandPrefix + "addRole") {
        let role = args[0];
        const canAdd = ALLOWED_ROLES.includes(role.toLowerCase());
        if (canAdd) {
            message.member.addRole(message.guild.roles.find("name", role));
        }
    }
    // List roles to user
    if (command === commandPrefix + "listRoles") {
        message.channel.send("The available roles are " + ALLOWED_ROLES);
    }
    return;
    // TODO: Does this actually fetch the args correctly?
    // const args = message.content.slice(commandPrefix.length).trim().split(/ +/g);
    // const command = args.shift().toLowerCase();


    // // Ping Command works but its not fetching any args.
    // if (command === 'ping') {
    //     message.channel.send('Pong!');
    // } else
    // if (command === 'blah') {
    //     message.channel.send('Meh.');
    // }

    // // For the future you can change this to grab from a database so you can change the allowed roles
    // // in the future without having to do a code change
    // const ALLOWED_ROLES = ['streamer', 'youtuber'];
    // if (command === "addRole") {
    //     let role = args[0]; // Remember arrays are 0-based!.
    //     log(role);
    //     const canAdd = ALLOWED_ROLES.includes(role.toLowerCase());

    //     if (canAdd) {
    //         message.member.addRole(message.guild.roles.find("name", role));
    //     } else {
    //         log("Fail to update role.")
    //     }
    // }
})
bot.login(discordToken);