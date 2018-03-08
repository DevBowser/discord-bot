// Load config
const config = require('./config.json')
// Sets up
const discordToken = config.TOKEN
const commandPrefix = config.COMMAND_PREFIX
const botActivity = config.BOT_ACTIVITY
const TwitchClientID = config.TWITCH_CLIENT_ID
const TwitchChannelName = config.TWITCH_CHANNEL_NAME
const serverID = config.SERVER_ID
const log = console.log

// Impout`
const chalk = require('chalk');
const Discord = require('discord.js');
const bot = new Discord.Client({
    autoReconnect: true
});

// Events to happen on when the bot is ready
bot.on('ready', async () => {
    // Teels you the bot is ready.
    log(chalk.green.bold(`${bot.user.username} is ready!`));
    // Sets the discord Status
    bot.user.setActivity("Checkout my master", {
        url: "https://www.twitch.tv/mrdemonwolf",
        type: "STREAMING"
    });
    // Gives link to connect bot to server 
    try {
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        log(`Please use the following link to invite the discord bot to your server ${link}`);
    } catch (error) {
        log(error.stack);
    }
});
// Events to happen when a new member joins
bot.on('guildMemberAdd', member => {
    let embed = new Discord.RichEmbed()
        .setTitle("Welcome to StreamKings' Official Discord server!")
        .setFooter(bot.user.username, bot.user.avatarURL)
        .setColor("#fad411");
    // Sents a welcomeing message to a users DM when they join.
    member.send((embed));
    // Add user to member group
    member.addRole(member.guild.roles.find('name', 'Member'))
    return;
});
// Setup Messages and commands
bot.on('message', async message => {
    const dm = message.channel.type === "dm";
    // // Setups prefix and not case
    let messageArray = message.content.split(" ");
    let command = messageArray[0];
    let args = messageArray.slice(1);


    if (!command.startsWith(commandPrefix)) return;

    // Testing Command
    if (command === commandPrefix + "ping") {
        message.channel.send("Pong");
        return;
    }
    // Userinfo Command
    if (command === commandPrefix + "userinfo") {
        let embed = new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription("Set Infos");
        message.channel.send(embed);
        return;
    }
    TwitchAPI.streams

    TwitchStream = twitchAPI.request(`/streams/45335452`, function (err, data) {
        if (err) {
            log(err)
        } else {
            log(data)
        }
    });

    return;
});
bot.login(discordToken);

// process.on("exit", exitHandler.bind(null, {
//     save: true
// }));
// process.on("SIGINT", exitHandler.bind(null, {
//     exit: true
// }));
// process.on("SIGTERM", exitHandler.bind(null, {
//     exit: true
// }));
// process.on("uncaughtException", exitHandler.bind(null, {
//     exit: true
// }));