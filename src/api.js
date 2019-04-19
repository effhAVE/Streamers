/* eslint-disable */

import bus from "./eventBus";
import axios from "axios";
import moment from "moment";
import {
    toast
} from "bulma-toast";

class Toast {
    constructor(message) {
        this.message = message;
    }
}

class Err extends Toast {
    constructor(message) {
        super(message);
        this.type = "is-danger";
    }
}

class Warning extends Toast {
    constructor(message) {
        super(message);
        this.type = "is-warning";
    }
}

const userNotFound = new Warning(
    "Użytkownik o podanej nazwie nie mógł zostać znaleziony."
);

const userDuplicate = new Warning("Użytkownik został już wcześniej dodany.");

const limitExceeded = new Err("APP: Przekroczono maksymalną liczbę żądań.");

const toastData = {
    userNotFound,
    userDuplicate,
    limitExceeded
};

const User = function (platform) {
    this.id = -1;
    this.name = "";
    this.displayName = "";
    this.avatar = "";
    this.url = "";
    this.streamDetails = {
        live: false,
        title: "",
        viewersCount: 0
    };
    this.platform = platform;
    this.lastUpdate = moment();
};

const toastHandler = function (obj) {
    toast({
        ...obj,
        duration: 5000
    });
};

const platforms = [
    /*
     * Each platform has 2 methods used to gather information from API:
     * getUserData - used to get general user's data
     * getStreamData - used to get stream's specific data (status, viewer count, title)
     */
    {
        name: "Twitch.tv",
        clientID: "8o42qg6i3424rm4tw4rzfx1xzvfxsj",
        limitExceeded: false,
        getUserData: function (nickname, newUser) {
            let streamerData = newUser;
            axios
                .get("https://api.twitch.tv/helix/users?login=" + nickname, {
                    headers: {
                        "Client-ID": this.clientID
                    }
                })
                .then(res => {
                    const data = res.data.data[0];
                    if (!data) {
                        // if user was not found
                        toastHandler(toastData.userNotFound);
                        throw new Error();
                    }

                    // assign API data to streamer object
                    streamerData.id = data.id;
                    streamerData.name = data.login;
                    streamerData.displayName = data.display_name;
                    streamerData.url = `https://www.twitch.tv/${streamerData.name}`;
                    streamerData.avatar = data.profile_image_url;
                })
                .then(() => {
                    // if streamer was found, get his stream data and emit an event to add him to the array
                    this.getStreamData(streamerData, nickname);
                    bus.$emit("addStreamer", streamerData);
                })
                .catch(err => {
                    if (err.response) {
                        // if API request returned an error
                        err = err.response.data;

                        // create a toast error object
                        let errObj = new Err(err.message);

                        // and display it
                        toastHandler(errObj);
                    }
                })
                .then(() => {
                    // Emit an event to indicate that processing of the request has ended.
                    bus.$emit("reqCompleted");
                });
        },
        getStreamData: function (userData, nickname) {
            if (this.limitExceeded) {
                return;
            }

            axios
                .get("https://api.twitch.tv/helix/streams?user_login=" + nickname, {
                    headers: {
                        "Client-ID": this.clientID
                    }
                })
                .then(res => {
                    const data = res.data.data;

                    // Get current time using moment.js and assign it to lastUpdate property.
                    userData.lastUpdate = moment();
                    bus.$emit("updated");
                    if (data.length) {
                        // if streamer is live (API response is not empty)
                        userData.streamDetails.live = true;
                        userData.streamDetails.title = data[0].title;
                        userData.streamDetails.viewersCount = data[0].viewer_count;
                    } else {
                        // streamer is not live / went offline after update
                        userData.streamDetails.live = false;
                        userData.streamDetails.title = "";
                        userData.streamDetails.viewersCount = 0;
                    }
                })
                .catch(err => {
                    if (err.response) {
                        if (err.response.status === 429) {
                            // if daily limit of request has been exceeded
                            toastHandler(toastData.limitExceeded);
                            this.limitExceeded = true;
                        } else {
                            err = err.response.data;
                            let errObj = new Err(err.message);
                            toastHandler(errObj);
                        }
                    }
                });
        }
    },
    {
        // FIXME: needs an update to match other platforms
        name: "Smashcast",
        getUserData: function (nickname, newUser) {
            let streamerData = newUser;
            axios
                .get("https://api.smashcast.tv/user/" + nickname)
                .then(res => {
                    let userData = res.data;
                    streamerData.id = userData.user_id;
                    streamerData.displayName = userData.user_name;
                    streamerData.avatar =
                        "https://edge.sf.hitbox.tv" + userData.user_logo;
                    if (userData.is_live) {
                        streamerData.streamDetails.live = true;
                    }
                })
                .then(() => {
                    if (!streamerData.id) {
                        this.toastHandler(this.toastData.userNotFound);
                        throw new Error();
                    } else {
                        this.getStreamData(streamerData, nickname);
                        bus.$emit("addStreamer", streamerData);
                    }
                    bus.$emit("reqCompleted");
                });
        },
        getStreamData: function (userData, nickname) {
            if (!userData.streamDetails.live) {
                return;
            }

            axios.get("https://api.smashcast.tv/media/live/" + nickname).then(res => {
                let streamData = res.data.livestream[0];
                userData.lastUpdate = moment();
                bus.$emit("updated");
                userData.streamDetails.title = streamData.media_status;
                userData.streamDetails.viewersCount = streamData.media_views;
            });
        }
    },
    {
        name: "YouTube",
        clientID: "AIzaSyA93xyB0C3A7nxUuUGBCzCltpbVkzxQWAU",
        limitExceeded: false,
        getUserData: function (nickname, newUser) {
            let streamerData = newUser;
            axios
                .get(
                    "https://www.googleapis.com/youtube/v3/channels?key=" +
                    this.clientID, {
                        params: {
                            forUsername: nickname,
                            part: "snippet, id"
                        }
                    }
                )
                .then(res => {
                    const data = res.data.items[0];
                    if (!data) {
                        toastHandler(toastData.userNotFound);
                        throw new Error();
                    }

                    streamerData.id = data.id;
                    streamerData.displayName = data.snippet.title;
                    streamerData.url;
                    streamerData.avatar = data.snippet.thumbnails.default.url;
                    this.getStreamData(streamerData, nickname);
                    bus.$emit("addStreamer", streamerData);
                })
                .catch(err => {
                    if (err.response) {
                        err = err.response.data;
                        let errObj = new Err(err.message);
                        toastHandler(errObj);
                    }
                })
                .then(() => {
                    bus.$emit("reqCompleted");
                });
        },
        getStreamData: function (userData) {
            if (this.limitExceeded) {
                return;
            }

            let videoID = "";
            axios
                .get(
                    "https://www.googleapis.com/youtube/v3/search?key=" +
                    this.clientID, {
                        params: {
                            part: "snippet",
                            channelId: userData.id,
                            type: "video",
                            eventType: "live"
                        }
                    }
                )
                .then(res => {
                    const data = res.data.items[0];
                    userData.lastUpdate = moment();
                    bus.$emit("updated");
                    if (typeof data !== "undefined") {
                        userData.streamDetails.live = true;
                        userData.streamDetails.title = data.snippet.title;
                        videoID = data.id.videoId;
                    } else {
                        userData.streamDetails.live = false;
                        userData.streamDetails.title = "";
                        videoID = "";
                        userData.streamDetails.viewersCount = 0;
                    }
                })
                .catch(err => {
                    if (err.response) {
                        if (err.response.status === 403) {
                            toastHandler(toastData.limitExceeded);
                            this.limitExceeded = true;
                        }
                    }
                })
                .then(() => {
                    if (videoID) {
                        axios
                            .get(
                                "https://www.googleapis.com/youtube/v3/videos?key=" +
                                this.clientID, {
                                    params: {
                                        id: videoID,
                                        part: "snippet, liveStreamingDetails"
                                    }
                                }
                            )
                            .then(res => {
                                userData.streamDetails.viewersCount =
                                    res.data.items[0].liveStreamingDetails.concurrentViewers;
                            });
                    }
                });
        }
    }
];


export {
    toastData,
    toastHandler,
    platforms,
    User
}