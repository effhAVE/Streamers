<template>
  <div class="field">
    <div class="control">
      <input
        class="input is-primary"
        type="text"
        placeholder="Wprowadź nick streamera"
        v-model="nickname"
        @keyup.enter="send"
      >
      <div class="select is-primary">
        <select v-model="selected">
          <option
            v-for="(platform, index) in platforms"
            :value="index"
            :key="index"
          >{{ platform.name }}</option>
        </select>
      </div>
      <div class="refresh-rate">
        <input
          class="input is-primary"
          type="number"
          min="60"
          @change="checkRefreshInput()"
          v-model.number="refreshValue"
        >
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import moment from "moment";
import { toast } from "bulma-toast";

// Classes that will be used to display messages to the user via bulma-toast
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

export default {
  name: "StreamerInput",
  data() {
    return {
      nickname: "",
      selected: 0,
      refreshValue: 120,
      toastData: toastData,
      platforms: [
        /*
         * Each platform has 2 methods used to gather information from API:
         * getUserData - used to get general user's data
         * getStreamData - used to get stream's specific data (status, viewer count, title)
         */
        {
          name: "Twitch.tv",
          clientID: "8o42qg6i3424rm4tw4rzfx1xzvfxsj",
          limitExceeded: false,
          getUserData: (nickname, newUser) => {
            let streamerData = newUser;
            axios
              .get("https://api.twitch.tv/helix/users?login=" + nickname, {
                headers: {
                  "Client-ID": this.platforms[0].clientID
                }
              })
              .then(res => {
                const data = res.data.data[0];
                if (!data) {
                  // if user was not found
                  this.toastHandler(this.toastData.userNotFound);
                  throw new Error();
                }

                // assign API data to streamer object
                streamerData.id = data.id;
                streamerData.username = data.display_name;
                streamerData.avatar = data.profile_image_url;
              })
              .then(() => {
                // if streamer was found, get his stream data and emit an event to add him to the array
                this.platforms[0].getStreamData(streamerData, nickname);
                this.$emit("addStreamer", streamerData);
              })
              .catch(err => {
                if (err.response) {
                  // if API request returned an error
                  err = err.response.data;

                  // create a toast error object
                  let errObj = new Err(err.message);

                  // and display it
                  this.toastHandler(errObj);
                }
              })
              .then(() => {
                // Emit an event to indicate that processing of the request has ended.
                this.$emit("reqCompleted");
              });
          },
          getStreamData: (userData, nickname) => {
            if (this.platforms[0].limitExceeded) {
              return;
            }

            axios
              .get(
                "https://api.twitch.tv/helix/streams?user_login=" + nickname,
                {
                  headers: {
                    "Client-ID": this.platforms[0].clientID
                  }
                }
              )
              .then(res => {
                const data = res.data.data;

                // Get current time using moment.js and assign it to lastUpdate property.
                userData.lastUpdate = moment();
                this.$emit("updated");
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
                    this.toastHandler(this.toastData.limitExceeded);
                    this.platforms[0].limitExceeded = true;
                  } else {
                    err = err.response.data;
                    let errObj = new Err(err.message);
                    this.toastHandler(errObj);
                  }
                }
              });
          }
        },
        {
          // FIXME: needs an update to match other platforms
          name: "Smashcast",
          getUserData: (nickname, newUser) => {
            let streamerData = newUser;
            axios
              .get("https://api.smashcast.tv/user/" + nickname)
              .then(res => {
                let userData = res.data;
                streamerData.id = userData.user_id;
                streamerData.username = userData.user_name;
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
                  this.platforms[1].getStreamData(streamerData, nickname);
                  this.$emit("addStreamer", streamerData);
                }
                this.$emit("reqCompleted");
              });
          },
          getStreamData: (userData, nickname) => {
            if (!userData.streamDetails.live) {
              return;
            }

            axios
              .get("https://api.smashcast.tv/media/live/" + nickname)
              .then(res => {
                let streamData = res.data.livestream[0];
                userData.lastUpdate = moment();
                this.$emit("updated");
                userData.streamDetails.title = streamData.media_status;
                userData.streamDetails.viewersCount = streamData.media_views;
              });
          }
        },
        {
          name: "YouTube",
          clientID: "AIzaSyA93xyB0C3A7nxUuUGBCzCltpbVkzxQWAU",
          limitExceeded: false,
          getUserData: (nickname, newUser) => {
            let streamerData = newUser;
            axios
              .get(
                "https://www.googleapis.com/youtube/v3/channels?key=" +
                  this.platforms[2].clientID,
                {
                  params: {
                    forUsername: nickname,
                    part: "snippet, id"
                  }
                }
              )
              .then(res => {
                const data = res.data.items[0];
                if (!data) {
                  this.toastHandler(this.toastData.userNotFound);
                  throw new Error();
                }

                streamerData.id = data.id;
                streamerData.username = data.snippet.title;
                streamerData.avatar = data.snippet.thumbnails.default.url;
                this.platforms[2].getStreamData(streamerData, nickname);
                this.$emit("addStreamer", streamerData);
              })
              .catch(err => {
                if (err.response) {
                  err = err.response.data;
                  let errObj = new Err(err.message);
                  this.toastHandler(errObj);
                }
              })
              .then(() => {
                this.$emit("reqCompleted");
              });
          },
          getStreamData: userData => {
            if (this.platforms[2].limitExceeded) {
              return;
            }

            let videoID = "";
            axios
              .get(
                "https://www.googleapis.com/youtube/v3/search?key=" +
                  this.platforms[2].clientID,
                {
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
                this.$emit("updated");
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
                    this.toastHandler(this.toastData.limitExceeded);
                    this.platforms[2].limitExceeded = true;
                  }
                }
              })
              .then(() => {
                if (videoID) {
                  axios
                    .get(
                      "https://www.googleapis.com/youtube/v3/videos?key=" +
                        this.platforms[2].clientID,
                      {
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
      ]
    };
  },

  computed: {
    refreshRate() {
      if (this.refreshValue >= 60) {
        return this.refreshValue * 100;
      } else {
        return 60 * 100;
      }
    }
  },

  methods: {
    User: function(platform) {
      this.id = -1;
      this.username = "";
      this.avatar = "";
      this.streamDetails = {
        live: false,
        title: "",
        viewersCount: 0
      };
      this.platform = platform;
      this.lastUpdate = moment();
    },

    send: function() {
      if (!this.nickname) {
        return;
      }

      this.$emit("newRequest");
      let newUser = new this.User(this.selected);
      this.platforms[this.selected].getUserData(this.nickname, newUser);
      this.nickname = "";
    },

    toastHandler: function(obj) {
      toast({ ...obj, duration: 5000 });
    },

    checkRefreshInput() {
      if (this.refreshValue < 60) {
        this.refreshValue = 60;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.refresh-rate {
  text-align: center;
  position: relative;
  & > .input {
    width: auto;
    margin: 0 10px;
    text-align: center;
  }
  &::after {
    position: absolute;
    width: 100%;
    font-size: 0.7em;
    content: "Częstotliwość aktualizacji (sek)";
    bottom: 0;
    left: 50%;
    transform: translate(-50%, 100%);
  }
}
</style>
