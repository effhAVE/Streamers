<template>
  <article class="media">
    <figure class="media-left">
      <p class="image is-64x64">
        <img v-bind:src="streamer.avatar">
      </p>
    </figure>
    <div class="media-content">
      <div class="content">
        <p>
          <strong>{{ streamer.username }}</strong>
          <small class="is-pulled-right has-text-weight-light">Aktualizacja: {{ update }}</small>
          <br>
          {{ streamer.streamDetails.title }}
        </p>
      </div>
    </div>
    <div class="media-right">
      <div class="options">
        <button class="refresh" @click="$emit('refresh')">
          <i class="fas fa-sync-alt"></i>
        </button>
        <button class="delete" @click="$emit('remove')"></button>
      </div>
      <p
        :class="{ 'is-live': streamer.streamDetails.live }"
      >{{ streamer.streamDetails.live ? 'LIVE' : 'OFFLINE' }}</p>
      <p v-if="streamer.streamDetails.live">{{ streamer.streamDetails.viewersCount + ' widzów' }}</p>
    </div>
  </article>
</template>

<script>
import moment from "moment";
import { setInterval } from "timers";

export default {
  name: "Streamer",
  props: {
    streamer: Object
  },

  data() {
    return {
      update: null
    };
  },

  methods: {
    updateTime: function() {
      moment.locale("pl");
      this.update = moment().to(this.streamer.lastUpdate);
    }
  },

  created() {
    this.updateTime();
    setInterval(() => {
      this.updateTime();
    }, 6000);
  }
};
</script>

<style lang="scss" scoped>
small {
  padding-left: 100px;
}

.media-right {
  min-width: 10%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  & > * {
    padding-bottom: 5px;
  }
}

.is-live {
  color: red;
  font-weight: bold;
}

.refresh {
  border-radius: 50%;
  border: none;
  height: 20px;
  width: 20px;
  cursor: pointer;
  color: white;
  background-color: rgba(10, 10, 10, 0.2);
  font-size: 11px;
  margin: 0 5px;
  text-align: center;
  padding: 0;
  &:hover {
    background-color: rgba(10,10,10,.3);
  }
}

.options {
  display: flex;
  align-items: center;
}
</style>

