// Load config
const config = require('./config.json')
// Sets up
const log = console.log
// Impout
const chalk = require('chalk');
const Discord = require('discord.js');
const TwitchApi = require('twitch-api');
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
                return;
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
