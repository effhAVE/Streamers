<template>
  <div id="app">
    <StreamerInput @refreshValChanged="refreshRate = $event * 1000"/>
    <transition-group name="list" tag="div" class="streamers-list" appear>
      <Streamer
        @remove="deleteStreamer(index)"
        class="streamer-item"
        v-for="(streamer, index) in filteredList"
        :key="streamer.id"
        :streamer="filteredList[index]"
        :isLoading="!streamer.id"
        @refresh="updateStreamer(streamer)"
      />
      <Loader v-if="newReq" :key="'loader'"/>
    </transition-group>
    <Filters ref="Filters" :streamers-list="streamersList"/>
  </div>
</template>

<script>
import StreamerInput from "./components/StreamerInput.vue";
import Streamer from "./components/Streamer.vue";
import Filters from "./components/Filters.vue";
import Loader from "./components/Loader.vue";
import bus from "./eventBus";
import { setInterval } from "timers";
const app = require("./api");

export default {
  name: "app",
  components: {
    StreamerInput,
    Streamer,
    Filters,
    Loader
  },
  data() {
    return {
      isMounted: false,
      streamersList: [],
      newReq: false,
      refreshRate: 120000
    };
  },

  methods: {
    addStreamer: function(streamer) {
      if (
        this.streamersList.some(
          el => el.name === streamer.name && el.platform === streamer.platform
        )
      ) {
        // if user has been added
        app.toastHandler(app.toastData.userDuplicate);
        return;
      }
      this.streamersList.push(streamer);
      this.saveToLS();
    },

    deleteStreamer: function(index) {
      this.streamersList.splice(index, 1);
      this.saveToLS();
    },

    saveToLS() {
      const parsed = JSON.stringify(this.streamersList);
      localStorage.setItem("streamersList", parsed);
    },

    updateStreams() {
      this.streamersList.forEach(el => {
        app.platforms[el.platform].getStreamData(el, el.name);
      });
    },

    updateStreamer(streamer) {
      app.platforms[streamer.platform].getStreamData(streamer, streamer.name);
    }
  },

  computed: {
    filteredList() {
      if (this.isMounted) {
        return this.$refs.Filters.filterList;
      }
    }
  },

  mounted() {
    this.isMounted = true;
    bus.$on("addStreamer", ev => {
      this.addStreamer(ev);
    });
    bus.$on("newRequest", () => {
      this.newReq = true;
    });
    bus.$on("reqCompleted", () => {
      this.newReq = false;
    });
    bus.$on("updated", () => {
      this.saveToLS();
    });
    if (
      localStorage.getItem("streamersList") &&
      localStorage.getItem("streamersList") !== "[]"
    ) {
      // get list of streamers from localStorage
      try {
        this.streamersList = JSON.parse(localStorage.getItem("streamersList"));
        this.updateStreams();
      } catch (err) {
        localStorage.removeItem("streamersList");
      }
    } else {
      // nothing found in localStorage, so we add a few placeholder streamers
      this.$nextTick(function() {
        app.platforms[0].getUserData("ESL_CSGO", new app.User(0));
        app.platforms[0].getUserData("RocketLeague", new app.User(0));
        app.platforms[0].getUserData("hAVE__", new app.User(0));
        app.platforms[0].getUserData("wgl_en", new app.User(0));
        app.platforms[2].getUserData("TheBesi523", new app.User(2));
      });
    }

    // Update streams' status with given refresh rate or a default value
    setInterval(this.updateStreams, this.refreshRate);
  }
};
</script>

<style lang="scss">
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding-bottom: 5em;
  height: 100%;
  overflow-y: hidden;
}

.control {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.input {
  margin: 30px 0;
  max-width: 60%;
}

body {
  font-family: "Lato", sans-serif;
}

.container {
  height: 100vh;
}

.filters {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  left: 0;
  bottom: 0;
}

.streamers-list {
  overflow-y: auto;
  height: 80%;
  padding: 0 20px;
}

.streamer-item {
  transition: all 1s;
  width: 100%;
}

.list-enter,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.list-leave-active {
  position: absolute;
}
</style>
