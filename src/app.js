// Load config
const config = require('./config.json')
// Sets up
const log = console.log
// Impout
const chalk = require('chalk');
const Discord = require('discord.js');
const TwitchApi = require('twitch-api');
const bot = new Discord.Client({
    autoReconnect: true
});
const TwitchMonitor = require('./TwitchMonitor.js');

// Events to happen on when the bot is ready
bot.on('ready', async () => {
    // Teels you the bot is ready.
    log(chalk.green.bold('[Discord]', `Bot has started, with ${bot.users.size} users, in ${bot.channels.size} channels of ${bot.guilds.size} guild.`));
    bot.user.setActivity("Being MrDemonWolf's Slave", {
        url: "https://www.mrdemonwolf.me",
        type: "STREAMING"
    });
    // Gives link to connect bot to server 
    try {
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        log(`[Discord] Please use the following link to invite the discord bot to your server ${link}`);
    } catch (error) {
        log(error.stack);
    }
    syncServerList(true);
    TwitchMonitor.start();
    return;
});

bot.on("guildCreate", guild => {
    log(`[Discord]`, `Joined new server: ${guild.name}`);

    syncServerList(false);
});

bot.on("guildDelete", guild => {
    log(`[Discord]`, `Removed from a server: ${guild.name}`);

    syncServerList(false);
});

// Events to happen when a new member joins
bot.on('guildMemberAdd', member => {
    let embed = new Discord.RichEmbed()
        .setTitle(`Welcome to SERVER_NAME Official Discord server!`)
        .setDescription(`Make sure you read up on the rules in the rules.  If you want to learn more about DemonWolfDev Community you can read the welcome channel or checkout our website www.demonwolfdev.com`)
        .setFooter(`Copyright © 2018 MrDemonWolf Powered by ${bot.user.username}`, bot.user.avatarURL)
        .setColor(config.MAIN_COLOR);
    // Sents a welcomeing message to a users DM when they join.
    member.send((embed));
    // Add user to member group
    member.addRole(member.guild.roles.find("name", "Member"));
    log(`${member.user.username} has joined ${config.SERVER_NAME}`);
    return;
});
// Setup Messages and commands
bot.on('message', async message => {
    if (message.author.equals(bot.user)) return;
    // // Setups prefix and not case
    let messageArray = message.content.split(" ");
    let command = messageArray[0];
    let args = messageArray.slice(1);


    if (!command.startsWith(config.COMMAND_PREFIX)) return;

    // Testing Command
    if (command === config.COMMAND_PREFIX + "ping") {
        try {
            message.channel.send("Pong")
            log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}ping`);
        } catch (e) {
            log(`[Discord] ${messagae.author.username} tryed to use ${config.COMMAND_PREFIX} but had a error.`)
        }
    }
    // Testing Command
    if (command === config.COMMAND_PREFIX + "test") {
        try {
            message.author.send("Pong")
            log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}test`);
        } catch (e) {
            log(`[Discord] ${messagae.author.username} tryed to use ${config.COMMAND_PREFIX} but had a error.`)
        }
    }
    // Ember command
    if (command === config.COMMAND_PREFIX + "embed") {
        let permission = message.member.roles.some(r => ["Member"].includes(r.name));
        let admin = message.member.hasPermission(`ADMINISTRATOR`);
        let owner = message.member.user.id === message.member.guild.owner.user.id
        log(owner)
        if (owner === true || admin === true || permission == true) {
            message.channel.send(`You have permissions`);
        } else {
            message.channel.send(`Your not allowed! #Banned`)
        }
    }
    // ServerInfo Command
    if (command == config.COMMAND_PREFIX + "serverinfo") {
        let embed = new Discord.RichEmbed()
            // .setAuthor(config.SERVER_OWNER)
            .setColor(config.MAIN_COLOR);
        message.channel.send(embed)
        message.delete(2)
    }
    // Userinfo Command
    if (command === config.COMMAND_PREFIX + "userinfo") {
        let embed = new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .addField(`Your account was created`, message.author.createdAt)
            .addField(`Your account ID is`, message.author.id, true)
            .setColor(config.MAIN_COLOR);
        message.channel.send(embed);
        log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}userinfo`)
        message.delete(2)
        return;
    }

    return;
});

// Alerts people whne twitch channel goes live.
let targetChannels = [];

let syncServerList = (logMembership) => {
    let nextTargetChannels = [];

    bot.guilds.forEach((guild) => {
        let targetChannel = guild.channels.find("name", config.TWITCH_LIVE_CHANNEL);

        if (!targetChannel) {
            log('[Discord]', 'Configuration problem /!\\', `Guild ${guild.name} does not have a #${config.discord_announce_channel} channel!`);
        } else {
            let permissions = targetChannel.permissionsFor(guild.me);

            if (logMembership) {
                log('[Discord]', ' --> ', `Member of server ${guild.name}, target channel is #${targetChannel.name}`);
            }
            nextTargetChannels.push(targetChannel);
        }
    });

    log('[Discord]', `Discovered ${nextTargetChannels.length} channels to announce to.`);
    targetChannels = nextTargetChannels;
};
let oldMsgs = {};

TwitchMonitor.onChannelLiveUpdate((twitchChannel, twitchStream, twitchChannelIsLive) => {
    try {
        syncServerList(false);
    } catch (e) {}
    let msgFormatted = `${twitchChannel.display_name} went live on Twitch!`;

    let msgEmbed = new Discord.RichEmbed({
        description: `:red_circle: **${twitchChannel.display_name} is currently live on Twitch!**`,
        title: twitchChannel.url,
        url: twitchChannel.url
    });

    let cacheBustTs = (Date.now() / 1000).toFixed(0);

    msgEmbed.setColor(twitchChannelIsLive ? "RED" : "GREY");
    msgEmbed.setThumbnail(twitchStream.preview.medium + "?t=" + cacheBustTs);
    msgEmbed.addField("Game", twitchStream.game || "(No game)", true);
    msgEmbed.addField("Status", twitchChannelIsLive ? `Live for ${twitchStream.viewers} viewers` : 'Stream has now ended', true);
    msgEmbed.setFooter(`Title: ${twitchChannel.status}`, twitchChannel.logo);

    if (!twitchChannelIsLive) {
        msgEmbed.setDescription(`:white_circle:  ${twitchChannel.display_name} was live on Twitch.`);
    }

    let anySent = false;

    for (let i = 0; i < targetChannels.length; i++) {
        let targetChannel = targetChannels[i];

        if (targetChannel) {
            try {
                let messageDiscriminator = `${targetChannel.guild.id}_${targetChannel.name}_${twitchChannel.name}_${twitchStream.created_at}`;
                let existingMessage = oldMsgs[messageDiscriminator] || null;

                if (existingMessage) {
                    existingMessage.edit(msgFormatted, {
                        embed: msgEmbed
                    }).then((message) => {
                        log('[Discord]', `Updated announce msg in #${targetChannel.name} on ${targetChannel.guild.name}`);
                    });

                    if (!twitchChannelIsLive) {
                        delete oldMsgs[messageDiscriminator];
                    }
                } else {
                    if (!twitchChannelIsLive) {
                        continue;
                    }
                    let msgToSend = msgFormatted;

                    targetChannel.send(msgToSend, {
                            embed: msgEmbed
                        })
                        .then((message) => {
                            oldMsgs[messageDiscriminator] = message;
                            log('[Discord]', `Sent announce msg to #${targetChannel.name} on ${targetChannel.guild.name}`);
                        });
                }

                anySent = true;
            } catch (e) {
                log('[Discord]', 'Message send problem:', e);
            }
        }
    }

    return anySent;
});

bot.login(config.TOKEN);