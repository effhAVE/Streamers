<template>
  <div id="app">
    <StreamerInput
      ref="StreamerInput"
      @addStreamer="addStreamer($event)"
      @newRequest="newReq = true"
      @reqCompleted="newReq = false"
    />
    <transition-group name="list" tag="div" class="streamers-list" appear>
      <Streamer
        @remove="deleteStreamer(index)"
        class="streamer-item"
        v-for="(streamer, index) in filteredList"
        :key="streamer.id"
        :streamer="filteredList[index]"
        :isLoading="!streamer.id"
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
import { setInterval } from 'timers';

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
      errors: [],
      streamersList: [],
      newReq: false
    };
  },

  methods: {
    addStreamer: function(streamer) {
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
    if (localStorage.getItem("streamersList") !== "[]") {
      try {
        this.streamersList = JSON.parse(localStorage.getItem("streamersList"));
      } catch (e) {
        localStorage.removeItem("streamersList");
      }
    } else {
      this.$nextTick(function() {
        this.$refs.StreamerInput.platforms[0].getUserData("ESL_CSGO");
        this.$refs.StreamerInput.platforms[0].getUserData("RocketLeague");
        this.$refs.StreamerInput.platforms[0].getUserData("hAVE__");
        this.$refs.StreamerInput.platforms[0].getUserData("wgl_en");
        this.$refs.StreamerInput.platforms[2].getUserData("TheBesi523");
      });
    }
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

.is-live {
  color: red;
  font-weight: bold;
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

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.is-loading {
  background-color: red;
}

.spinner3 {
  border-top: 3px solid rgba(0, 0, 0, 0.5);
  border-right: 3px solid transparent;
  border-radius: 50%;
  animation: rotation 0.8s linear infinite;
  width: 4rem;
  height: 4rem;
}
</style>
