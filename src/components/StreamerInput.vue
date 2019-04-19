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
          @change="emitRefresh()"
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
const app = require("../api");

export default {
  name: "StreamerInput",
  data() {
    return {
      nickname: "",
      selected: 0,
      refreshValue: 120,
      toastData: app.toastData,
      platforms: app.platforms
    };
  },

  methods: {
    send: function() {
      if (!this.nickname) {
        return;
      }

      this.$emit("newRequest");
      let newUser = new app.User(this.selected);
      app.platforms[this.selected].getUserData(this.nickname, newUser);
      this.nickname = "";
    },

    emitRefresh() {
      if (this.refreshValue < 60) {
        this.refreshValue = 60;
      }

      this.$emit("refreshValChanged", this.refreshValue);
    }
  },

  created() {
    this.emitRefresh();
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
