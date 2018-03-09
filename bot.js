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
        log('[Discord]', `Configured stream status polling [${checkIntervalMs}ms] for channels [${config.TWITCH_CHNANELS_NAME}].`);
        this.refresh();
    }

    static refresh() {
        if (!config.TWITCH_CHNANELS_NAME) {
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
            "channel": config.TWITCH_CHNANELS_NAME
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

// Events to happen on when the bot is ready
bot.on('ready', async () => {
    // Teels you the bot is ready.
    log(chalk.green.bold('[Discord]', `Bot has started, with ${bot.users.size} users, in ${bot.channels.size} channels of ${bot.guilds.size} guilds.`));
    // Sets the discord Status
    // bot.user.setActivity("Checkout my master", {
    //     url: "https://www.twitch.tv/mrdemonwolf",
    //     type: "STREAMING"
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
        .setTitle(`Welcome to ${config.SERVER_NAME} Official Discord server!`)
        .setDescription(`Test`)
        .setFooter(`Copyright © 2018 MrDemonWolf Powered by ${bot.user.username}`, bot.user.avatarURL)
        .setColor("#050240");
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
        message.channel.send("Pong");
        log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}ping`)
        return;
    }
    // ServerInfo Command
    if (command == config.COMMAND_PREFIX + "serverinfo"){
        let embed = new Discord.RichEmbed()
        .setAuthor(config.SERVER_OWNER)
    }
    // Userinfo Command
    if (command === config.COMMAND_PREFIX + "userinfo") {
        let embed = new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .addField(`Your account was created`, message.author.createdAt)
            .addField(`Your account ID is`, message.author.id, true)
            .setColor("#050240");
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