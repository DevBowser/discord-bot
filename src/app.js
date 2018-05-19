// Load config
var config = require('./config.json');
// Sets up
const log = console.log
// Impout
const chalk = require('chalk');
const Discord = require('discord.js');
const TwitchApi = require('twitch-api');
const TwitterAPI = require('twitter');
const mongoose = require('mongoose');

const bot = new Discord.Client({
  autoReconnect: true
});
mongoose.connect('mongodb://localhost/myTestDB');

var db = mongoose.connection;

db.on('error', function (err) {
  console.log('connection error', err);
});
db.once('open', function () {
  console.log('connected.');
});

const TwitchMonitor = require('./TwitchMonitor.js');
// Events to happen on when the bot is ready
bot.on('ready', async () => {
  // Teels you the bot is ready.
  log(chalk.green.bold('[Discord]', `Bot has started. }`));
  //  Currenlty there are ${bot.users.size} users and in ${bot.channels.size} channels in ${bot.guilds.get(config.SERVER_ID).name}`));
  // Set's Bot Activity
  try {
    bot.user.setActivity(config.BOT_ACTIVITY, {
      type: "PLAYING"
    })
  } catch (e) {
    log(e.stack);
  }
  // Gives link to connect bot to server
  try {
    let link = await bot.generateInvite(["ADMINISTRATOR"]);
    log(`[Discord] Please use the following link to invite the discord bot to your server ${link}`);
  } catch (e) {
    log(e.stack);
  }
  // Twitch Monitor
  syncServerList(true);
  TwitchMonitor.start();
});
// Events for Twitter API
var twitter = new TwitterAPI({
  consumer_key: config.TWITTER_CONSUMER_KEY,
  consumer_secret: config.TWITTER_CONSUMER_SECRET,
  access_token_key: config.TWITTER_ACCESS_KEY,
  access_token_secret: config.TWITTER_ACCESS_SECRET,
});

bot.on("guildCreate", guild => {
  syncServerList(false);
});

bot.on("guildDelete", guild => {
  syncServerList(false);
});

// Events to happen when a new member joins
bot.on('guildMemberAdd', member => {
  try {
    // Sets welcome messgae.
    let welcome = new Discord.RichEmbed()
      .setTitle(`Welcome to ${bot.guilds.get(config.SERVER_ID).name} Official Discord server!`)
      .setDescription(`Make sure you read up on the rules in the rules.  If you want to learn more about DemonWolfDev Community you can read the welcome channel or checkout our website www.demonwolfdev.com`)
      .setFooter(`Powered by ${bot.user.username}`, bot.user.avatarURL)
      .setColor(config.MAIN_COLOR);
    // Sents a welcomeing message tho a users DM when they join.
    member.send((welcome));
    // Adds the user to member role when they join.
    member.addRole(member.guild.roles.find("name", "Member"));
    log(`${member.user.username} has joined ${bot.guild}`);
  } catch (e) {
    log(e.stack)
  }
});
// Setup Messages and commands
bot.on('message', async message => {
  if (message.author.equals(bot.user)) return;
  if (message.channel.type === "dm") return;
  // Sets up command and prefix
  let messageArray = message.content.split(" ");
  let command = messageArray[0];
  let args = messageArray.slice(1);
  //  Admin permissin
  let admin = message.member.hasPermission(`ADMINISTRATOR`);
  // Guild Owner
  let owner = message.member.user.id === message.member.guild.owner.user.id;
  let ownerBot = message.author.id === config.OWNER_ID
  // Permission template
  // let permission = message.member.roles.some(r => ["Member"].includes(r.name));

  if (!command.startsWith(config.COMMAND_PREFIX)) return;

  // Check if bot is working
  if (command === config.COMMAND_PREFIX + "ping") {
    try {
      message.channel.send("Pong");
      log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}ping`);
    } catch (e) {
      log(`[Discord] ${messagae.author.username} tryed to use ${config.COMMAND_PREFIX}ping but had a error.`);
    }
  }
  // Testing Command
  // if (command === config.COMMAND_PREFIX + "test") {
  //   try {
  //     message.author.send("Pong")
  //     log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}test`);
  //   } catch (e) {
  //     log(`[Discord] ${messagae.author.username} tryed to use ${config.COMMAND_PREFIX} but had a error.`)
  //   }
  // }
  // Ember command
  if (command === config.COMMAND_PREFIX + "embed") {
    let permission = message.member.roles.some(r => ["Administrator", "Moderator"].includes(r.name));
    let commandlength = `${config.COMMAND_PREFIX}embed`;
    let content = message.content.slice(commandlength.length)
    let embed = new Discord.RichEmbed()
      .setDescription(content)
      .setColor(config.MAIN_COLOR);
    if (permission && !args[0]) {
      try {
        messgae.channel.send(`Sorry but you must add what you want to be emebed`);
        log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX} but did not add anything they wanted to embed`);
      } catch (e) {
        log(`[Discord] ${messagae.author.username} tryed to use ${config.COMMAND_PREFIX}embed. User did not provided a arg. Error Stack ${e.stack}`);
      }
    };
    if (permission && args[0]) {
      try {
        message.channel.send(embed);
        message.delete();
        log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}embed`);
      } catch (e) {
        log(`[Discord] ${messagae.author.username} tryed to use ${config.COMMAND_PREFIX}embed but had a error. Error Stack ${e.stack}`);
      }
    };
    if (!permission && args[0]) {
      try {
        message.channel.send(`Sorry but you don't have permissions to use the command!`);
        log(`[Discord] ${message.author.username} tryed to use ${config.COMMAND_PREFIX}embed but did not have permission!`)
      } catch (e) {
        log(`[Discord] ${messagae.author.username} tryed to use ${config.COMMAND_PREFIX}embed but had a error. User does not have permission. Error Stack ${e.stack}`);
      }
    }
  }

  if (command === config.COMMAND_PREFIX + "tweet") {
    let commandlength = `${config.COMMAND_PREFIX}tweet`;
    let content = message.content.slice(commandlength.length)
    if (ownerBot && args[0]) {
      try {
        twitter.post('statuses/update', {
          status: content
        }, function (error, tweet, response) {
          if (error) {
            message.channel.send(`Error sending tweet.  Please try again.`);
            log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}tweet. Sending Tweet. But a error has happen.`)
            log(tweeth)
          } else {
            message.channel.send(`Sending Tweet`);
            log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}tweet. Sending Tweet.`)
          }
        });
      } catch (e) {
        log(`[Discord] ${messagae.author.username} tryed to use ${config.COMMAND_PREFIX}tweet. Error Stack ${e.stack}`);
      }
    };
  }
  // ServerInfo Command
  if (command == config.COMMAND_PREFIX + "serverinfo") {
    try {
      let embed = new Discord.RichEmbed()
        .setAuthor(message.member.guild.owner.user.id)
        .setColor(config.MAIN_COLOR);
      message.channel.send(embed)
      message.delete(2)
    } catch (e) {
      log(`[Discord] ${messagae.author.username} tryed to use ${config.COMMAND_PREFIX}embed but had a error. User did not provided a arg. Error Stack ${e.stack}`);
    }
  }
  // Userinfo Command
  if (command === config.COMMAND_PREFIX + "userinfo") {
    try {
      let embed = new Discord.RichEmbed()
        .setAuthor(message.author.username)
        .addField(`Your account was created`, message.author.createdAt)
        .addField(`Your account ID is`, message.author.id, true)
        .setColor(config.MAIN_COLOR);
      message.channel.send(embed);
      log(`[Discord] ${message.author.username} used ${config.COMMAND_PREFIX}userinfo`)
      message.delete(2)
    } catch (e) {
      log(`[Discord] ${messagae.author.username} tryed to use ${config.COMMAND_PREFIX}embed but had a error. Error Stack ${e.stack}`);
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
  // Sent live to twitter
  let twitterPost =
    twitter.post('statuses/update', {
      status: `${twitchChannel.display_name} is live. Playing ${twitchChannel.game || "No Game"}`
    }, function (error, tweet, response) {
      if (!error) {
        console.log(tweet);
      }
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
              embed: msgEmbed,
              twitterPost
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
