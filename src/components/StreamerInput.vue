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
    </div>
  </div>
</template>

<script>
import axios from "axios";
import moment from "moment";

export default {
  name: "StreamerInput",
  data() {
    return {
      nickname: "",
      selected: 0,
      platforms: [
        {
          name: "Twitch.tv",
          clientID: "8o42qg6i3424rm4tw4rzfx1xzvfxsj",
          getUserData: (nickname, newUser) => {
            let streamerData = newUser;
            axios
              .get("https://api.twitch.tv/helix/users?login=" + nickname, {
                headers: {
                  "Client-ID": this.platforms[0].clientID
                }
              })
              .then(res => {
                let userData = res.data.data[0];
                streamerData.id = userData.id;
                streamerData.username = userData.display_name;
                streamerData.avatar = userData.profile_image_url;
              })
              .catch(err => {
                this.$emit("error", err);
              })
              .then(() => {
                if (streamerData.id !== -1) {
                  this.platforms[0].getStreamInfo(streamerData, nickname);
                  this.$emit("addStreamer", streamerData);
                }
                this.$emit("reqCompleted");
              });
          },
          getStreamInfo: (userData, nickname) => {
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
                let streamData = res.data.data;
                userData.lastUpdate = moment();
                this.$emit('updated');
                if (streamData.length) {
                  userData.streamDetails.live = true;
                  userData.streamDetails.title = streamData[0].title;
                  userData.streamDetails.viewersCount =
                    streamData[0].viewer_count;
                }
              });
          }
        },
        {
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
                  this.$emit("error", {
                    message: "User with the given ID was not found "
                  });
                } else {
                  this.platforms[1].getStreamInfo(streamerData, nickname);
                  console.log(streamerData);
                  this.$emit("addStreamer", streamerData);
                }

                this.$emit("reqCompleted");
              });
          },
          getStreamInfo: (userData, nickname) => {
            if (!userData.streamDetails.live) return;
            axios
              .get("https://api.smashcast.tv/media/live/" + nickname)
              .then(res => {
                let streamData = res.data.livestream[0];
                userData.lastUpdate = moment();
                this.$emit('updated');
                userData.streamDetails.title = streamData.media_status;
                userData.streamDetails.viewersCount = streamData.media_views;
              });
          }
        },
        {
          name: "YouTube",
          clientID: "AIzaSyA93xyB0C3A7nxUuUGBCzCltpbVkzxQWAU",
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
                let userData = res.data.items[0];
                streamerData.id = userData.id;
                streamerData.username = userData.snippet.title;
                streamerData.avatar = userData.snippet.thumbnails.default.url;
              })
              .catch(err => {
                this.$emit("error", err);
              })
              .then(() => {
                if (streamerData.id !== -1) {
                  this.platforms[2].getStreamInfo(streamerData, nickname);
                  this.$emit("addStreamer", streamerData);
                }
                this.$emit("reqCompleted");
              });
          },
          getStreamInfo: (userData, nickname) => {
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
                let streamData = res.data.items[0];
                userData.lastUpdate = moment();
                this.$emit('updated');
                if (typeof streamData !== "undefined") {
                  userData.streamDetails.live = true;
                  userData.streamDetails.title = streamData.snippet.title;
                  //userData.streamDetails.viewersCount = streamData.liveStreamingDetails.concurrentViewers;
                }
                console.log(streamData);
              });
          }
        }
      ]
    };
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
      if (!this.nickname) return;
      this.$emit("newRequest");
      let newUser = new this.User(this.selected);
      this.platforms[this.selected].getUserData(this.nickname, newUser);
      this.nickname = "";
    }
  }
};
</script>

<style scoped>
</style>


