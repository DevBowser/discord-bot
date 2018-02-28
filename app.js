// Load config
const config = require('./config.json')

// Impout
const chalk = require('chalk');
const Discord = require('discord.js')
const bot = new Discord.Client({
    autoReconnect: true
});

// Sets up
const discordToken = config.TOKEN
const commandPrefix = config.COMMAND_PREFIX
const botActivity = config.BOT_ACTIVITY
const log = console.log
const serverID = config.SERVER_ID
// Events to happen on when the bot is ready
bot.on('ready', async () => {
    // Teels you the bot is ready.
    log(chalk.green.bold(bot.user.username + ' is ready!'));
    // Sets the discord Status
    bot.user.setActivity("Checkout a random streamer", {
        url: "https://www.twitch.tv/streamkingshq",
        type: "STREAMING"
    });
    // Gives link to connect bot to server 
    try {
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        log("Please use the following link to invite the discord bot to your server " + link);
    } catch (error) {
        log(error.stack);
    }
});
// Events to happen when a new member joins
bot.on('guildMemberAdd', member => {
    let embed = new Discord.RichEmbed()
        .setTitle("Welcome to StreamKings' Official Discord server!")
        .setDescription("Thank you for joining the StreamKings' Official Discord server. We are glad that you finally arrived!  StreamKings is a community dedicated to you, our amazing streamers, youtubers, creators & more. /n We hope that you enjoy our server and please make sure to read the information below as well.  If you need any help then tag @Service Support and there should be someone with you as soon as possible.")
        .setFooter(bot.user.username, bot.user.avatarURL)
        .setColor("#fad411");
    // Sents a welcomeing message to a users DM when they join.
    member.send((embed));
    return;
});
// Setup Messages
bot.on('message', async message => {
    const dm = message.channel.type === "dm";
    // // Setups prefix and not case
    let messageArray = message.content.split(" ");
    let command = messageArray[0];
    let args = messageArray.slice(1);


    if (!command.startsWith(commandPrefix)) return;

    // Testing Command
    if (dm && command === commandPrefix + "ping") {
        message.channel.send("Pong");
        return;
    }
    // Userinfo Command
    if (dm && command === commandPrefix + "userinfo") {
        let embed = new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription("Set Infos");
        message.channel.send(embed);
        return;
    }
    // Roles
    const ALLOWED_ROLES = ["Streamer", "Youtuber"];
    // Add role to user
    if (dm && command === commandPrefix + "addRole") {
        let role = args[0]
        const canAdd = ALLOWED_ROLES.includes(role);

        if (message.member.some(r => ALLOWED_ROLES.includes(r.name))) {
            message.member.send(`You already have the role!`)
        } else {
            message.member.addRole(message.member.roles.find("name", role));
            message.member.send("You have been added to " + role);
        }
        if (canAdd === false) {
            message.member.send(`Please check if you spelled the role correctly.  (Roles names that are allowed are ${ALLOWED_ROLES}`)
        }
        return;
    }
    // List roles to user
    if (dm && command === commandPrefix + "listRoles") {
        message.channel.send("The available roles are " + ALLOWED_ROLES);
        return;
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