// Load config
const config = require('./config.json');
// Sets up
const log = console.log
// Imput Stuff
const chalk = require('chalk');
const Discord = require('discord.js');
const TwitchApi = require('twitch-api');
const bot = new Discord.Client({
    autoReconnect: true
});
// Does the Twitch Monitor for Alert in channels
class TwitchMonitor {
    static start() {
        this.Twitch = new TwitchApi({
            clientId: config.TWITCH_CLIENT_ID,
            // clientSecret: config.twitch_client_secret
        });
        let checkIntervalMs = parseInt(config.TWITCH_CHECK_INTERVAL_MS);

        if (isNaN(checkIntervalMs) || checkIntervalMs < TwitchMonitor.MIN_POLL_INTERVAL_MS) {
            checkIntervalMs = TwitchMonitor.MIN_POLL_INTERVAL_MS;
        }

        setInterval(() => {
            this.refresh();
        }, checkIntervalMs);
        log('[Discord]', `Configured stream status polling [${checkIntervalMs}ms] for channels [${config.TWITCH_CHANNELS_NAME}].`);
        this.refresh();
    }

    static refresh() {
        if (!config.TWITCH_CHANNELS_NAME) {
            log('[Discord]', 'No channels configured');
            return;
        }

        if (this.eventBufferStartTime) {
            let now = Date.now();
            let timeSinceMs = now - this.eventBufferStartTime;

            if (timeSinceMs >= TwitchMonitor.EVENT_BUFFER_MS) {
                this.eventBufferStartTime = null;
            } else {
                return;
            }
        }

        let params = {
            "channel": config.TWITCH_CHANNELS_NAME
        };

        this.Twitch.getStreams(params, (idk, data) => {
            if (data && data.streams) {
                this.handleStreamList(data);
            } else {
                log('[Discord]', 'Did not receive a response from the server with stream info.')
            }
        });
    }

    static handleStreamList(data) {
        let nextOnlineList = [];

        for (let i = 0; i < data.streams.length; i++) {
            let _stream = data.streams[i];
            let channelName = _stream.channel.name;

            this.channelData[channelName] = _stream.channel;
            this.streamData[channelName] = _stream;

            nextOnlineList.push(_stream.channel.name);
        }


        let notifyFailed = false;
        let anyChanges = false;

        for (let i = 0; i < nextOnlineList.length; i++) {
            let _chanName = nextOnlineList[i];

            if (this.activeStreams.indexOf(_chanName) === -1) {
                log('[Discord]', 'Stream channel has gone online:', _chanName);
                anyChanges = true;
            }

            if (!this.handleChannelLiveUpdate(this.channelData[_chanName], this.streamData[_chanName], true)) {
                notifyFailed = true;
            }
        }
        for (let i = 0; i < this.activeStreams.length; i++) {
            let _chanName = this.activeStreams[i];

            if (nextOnlineList.indexOf(_chanName) === -1) {
                log('[Discord]', 'Stream channel has gone offline:', _chanName);
                this.handleChannelOffline(this.channelData[_chanName], this.streamData[_chanName]);
                anyChanges = true;
            }
        }

        if (!notifyFailed) {
            this.activeStreams = nextOnlineList;

            if (anyChanges) {
                this.eventBufferStartTime = Date.now();
            }
        } else {
            log('[Discord]', 'Could not notify channel, will try again next update.');
        }
    }

    static handleChannelLiveUpdate(channelObj, streamObj, isOnline) {
        for (let i = 0; i < this.channelLiveCallbacks.length; i++) {
            let _callback = this.channelLiveCallbacks[i];

            if (_callback) {
                if (_callback(channelObj, streamObj, isOnline) === false) {
                    return false;
                }
            }
        }

        return true;
    }

    static handleChannelOffline(channelObj, streamObj) {
        this.handleChannelLiveUpdate(channelObj, streamObj, false);

        for (let i = 0; i < this.channelOfflineCallbacks.length; i++) {
            let _callback = this.channelOfflineCallbacks[i];

            if (_callback) {
                if (_callback(channelObj) === false) {
                    return false;
                }
            }
        }

        return true;
    }

    static onChannelLiveUpdate(callback) {
        this.channelLiveCallbacks.push(callback);
    }

    static onChannelOffline(callback) {
        this.channelOfflineCallbacks.push(callback);
    }
}

TwitchMonitor.eventBufferStartTime = 0;
TwitchMonitor.activeStreams = [];
TwitchMonitor.channelData = {};
TwitchMonitor.streamData = {};

TwitchMonitor.channelLiveCallbacks = [];
TwitchMonitor.channelOfflineCallbacks = [];

TwitchMonitor.EVENT_BUFFER_MS = 2 * 60 * 1000;
TwitchMonitor.MIN_POLL_INTERVAL_MS = 1 * 60 * 1000;

module.exports = TwitchMonitor;

// Events to happen when the bot is ready
bot.on('ready', async () => {
    log(chalk.green.bold('[Discord]', `Bot has started, with ${bot.users.size} users, in ${bot.channels.size} channels of ${bot.guilds.size} guilds.`));
    // Sets the discord Status
    // bot.user.setActivity("Checkout my master", {
    //     url: "https://www.twitch.tv/mrdemonwolf",
    //     type: "STREAMING"
    bot.user.setActivity(config.BOT_ACTIVITY, {
        type: "PLAYING"
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
        .setTitle(`Welcome to ${config.SERVER_NAME} Official Discord server!`)
        .setDescription(`Make sure you read up on the rules in the rules.  If you want to learn more about DemonWolfDev Community you can read the welcome channel or checkout our website www.demonwolfdev.com`)
        .setFooter(`Copyright © 2018 MrDemonWolf Powered by ${bot.user.username}`, bot.user.avatarURL)
        .setColor(config.MAIN_COLOR);
    // Sends a welcomeing message to a users DM when they join.
    member.send((embed));
    // Add user to member group
    member.addRole(member.guild.roles.find("name", "Member"));
    log(`${member.user.username} has joined ${config.SERVER_NAME}`);
    return;
});
// Setup Messages and commands
bot.on('message', async message => {
    // Owner Permissions
    const owner = message.member.user.id === message.member.guild.owner.user.id;
    // Admin Permissions
    const admin = message.member.hasPermission(`ADMINISTRATOR`);

    // If bot user don't reply to it selfs
    if (message.author.equals(bot.user)) return;

    // // Setups prefix and not case
    let messageArray = message.content.split(" ");
    let command = messageArray[0];
    let args = messageArray.slice(1);

    if (!command.startsWith(config.COMMAND_PREFIX)) return;

    // Testing Command
    if (command === config.COMMAND_PREFIX + "ping") {
        message.channel.send("Pong");
        log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}ping`)
        return;
    }
    // Ember command
    if (command === config.COMMAND_PREFIX + "embed") {
        let permission = message.member.roles.some(r => ["Administrator", "Moderator"].includes(r.name));
        let commandlength = `${config.COMMAND_PREFIX}embed`;
        let content = message.content.slice(commandlength.length)
        let embed = new Discord.RichEmbed()
            .setDescription(content)
            .setColor(config.MAIN_COLOR);
        if (owner === true || permission === true) {
            message.channel.send(embed);
            message.delete();
        } else {
            message.channel.send(`Sorry but you must be a owner or admin to use this command?  If you belive this is a error please message the server owner <@${message.member.guild.owner.user.id.toString()}>`)
            log(`[Discord] ${message.author.username} tryed to use ${config.COMMAND_PREFIX}embed but did not have permission!`)
        }
        log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}embed`)
    }
    // Command to remove messges
    if (command === config.COMMAND_PREFIX + "clear") {
        let number = args[0];
        if (owner || admin && number.match(/^\+?[1-9]\d*$/)) {
            message.delete()
            message.channel.bulkDelete(number);
            log(number)
        } else {
            message.delete()
            message.channel.send(`Sorry but you either don't have permissions or did not enter a vaid number`)
        }

    }
    // ServerInfo Command
    if (command == config.COMMAND_PREFIX + "serverinfo") {
        let embed = new Discord.RichEmbed()
            .setTitle(`Server name ${message.member.guild.name}!`)
            .addField(`Server Owner`, message.member.guild.owner.user.username, true)
            .addField('Invite Link', config.SERVER_INVITE, true)
            .addField('Created on', message.member.guild.createdAt)
            .addField(`Members joined`, message.member.guild.memberCount)
            .setFooter(`Copyright © 2018 MrDemonWolf Powered by ${bot.user.username}`, bot.user.avatarURL)
            // .setAuthor(message.member.guild.owner.user.username)
            .setColor(config.MAIN_COLOR);
        message.channel.send(embed)
        message.delete(2)
    }
    // Userinfo Command
    if (command === config.COMMAND_PREFIX + "userinfo") {
        let embed = new Discord.RichEmbed()
            .setTitle(`${message.author.username} User Info`)
            .addField(`Your account was created`, message.author.createdAt)
            .addField(`Your account ID is`, message.author.id, true)
            .setFooter(`Copyright © 2018 MrDemonWolf Powered by ${bot.user.username}`, bot.user.avatarURL)
            .setColor(config.MAIN_COLOR);
        message.channel.send(embed);
        log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}userinfo`)
        message.delete(2)
        return;
    }
    if (command === config.COMMAND_PREFIX + "botinfo") {
        let time = process.uptime();

        function secondsToHms(d) {
            d = Number(d);

            var h = Math.floor(d / 3600);
            var m = Math.floor(d % 3600 / 60);
            var s = Math.floor(d % 3600 % 60);

            return ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
        }
        let embed = new Discord.RichEmbed()
            .setTitle(`Bot Information`)
            .addField("Born", bot.user.createdAt, true)
            .addField("Name", bot.user.username, true)
            .addField("Uptime", (secondsToHms(time)))
            .setFooter(`Copyright © 2018 MrDemonWolf Powered by ${bot.user.username}`, bot.user.avatarURL);
        message.channel.send(embed)
        log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}botinfo`)

    }
    // Command List
    if (command === config.COMMAND_PREFIX + "commands") {
        let permission = message.member.roles.some(r => ["Administrator", "Moderator"].includes(r.name));
        let embedUsersCommands = new Discord.RichEmbed()
            .setTitle("User Commnads")
            .addField("User Info", `${config.COMMAND_PREFIX}userinfo`, true)
            .addField("Server Info", `${config.COMMAND_PREFIX}serverinfo`, true)
            .addField("Bot Info", `${config.COMMAND_PREFIX}botinfo`, true)
            .addField("Social Info", `${config.COMMAND_PREFIX}Social Info`, true)
            .addField("Ping", `${config.COMMAND_PREFIX}ping`, true)
        message.channel.send(embedUsersCommands)
        if (permission) {
            let embedStaffCommands = new Discord.RichEmbed()
                .setTitle("Staff Commnads")
                .addField("Embed Message Maker", `${config.COMMAND_PREFIX}embed`)
            message.channel.send(embedStaffCommands)
        }
    }
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
        msgEmbed.setDescription(`:white_circle:  ${twitchChannel.display_name} is now offline on Twitch`);
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