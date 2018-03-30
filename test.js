const config = require('./config.json');
// Sets up
const log = console.log
// Imput Stuff
const chalk = require('chalk');
const TwitchApi = require('twitch-api');
const Discord = require('discord.js');

const bot = new Discord.Client({
    autoReconnect: true
});
// Events to happen when the bot is ready
bot.on('ready', async () => {
    // log(chalk.green.bold('[Discord]', `Bot has started, with ${bot.users.size} users, in ${bot.channels.size} channels of ${bot.guilds.size} guilds.`));
    // Gives link to connect bot to server 
    try {
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        log(`[Discord] Please use the following link to invite the discord bot to your server ${link}`);
    } catch (error) {
        log(error);
    }
});

bot.on('message', async message => {
    // // Setups prefix and not case
    let messageArray = message.content.split(" ");
    let command = messageArray[0];
    let args = messageArray.slice(1);

    if (!command.startsWith(config.COMMAND_PREFIX)) return;

    // Testing Command
    if (command === config.COMMAND_PREFIX + "ping") {
        message.member.send("Pong")
    } else {
        log(error)
    }
});


bot.login(config.TOKEN)


/* example */

// Require Packages
const db = require('quick.db')

exports.run = (bot, message, args, func) => {

    // Return statements

    /* This returns if it CANT find the owner role on them. It then uses the function to send to message.channel
     * and deletes the message after 120000 milliseconds (2minutes)
     */
    if (!message.member.roles.find('name', 'Owner')) return func.embed(message.channel, '** This command requires the Owner role**', 120000)
    /* This returns if they don't message a channel, but we also want it to continue running if they want to disable the log */
    if (!args.join(" ") && args.join(" ").toUpperCase() !== 'NONE') return func.embed(message.channel, '**Please mention a channel**\n > *~setwelcome message*')

    // Fetch the new channel that has been mentioned
    let newMessage;
    // If they wrote the word none, it sets newMessage as empty.
    if (args.join(" ").toUpperCase() === 'NONE') newMessage = '';
    // If they didn't write none, set what they wrote as the message
    else newMessage = args.join(" ").trim();

    // This will update the .text of the joinMessageDM_guildID object.
    db.updateText(`joinMessage_${message.guild.id}`, newMessage).then(i => {
        // Finally, send in chat that they updated the channel.
        func.embed(message.channel, `**Succesfully updated welcome text to:**\n > *${args.join(" ").trim()}*`)
    })
}