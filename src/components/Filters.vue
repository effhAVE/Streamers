<template>
  <div class="filters">
    <input class="input is-primary" type="text" placeholder="Filtruj" v-model="filters.name">
    <div class="field">
      <div class="control">
        <div class="select is-primary">
          <select v-model="filters.live">
            <option :value="null">Live + Offline</option>
            <option :value="true">Tylko Live</option>
            <option :value="false">Tylko Offline</option>
          </select>
        </div>
      </div>
    </div>
    <button class="button is-primary" type="button" @click="setDefaultValues">Resetuj filtry</button>
  </div>
</template>

<script>
export default {
  props: {
    streamersList: Array
  },

  data() {
    return {
      filters: {
        name: "",
        live: null
      }
    };
  },

  methods: {
    // Methods that return a filtered list for the specific parameter
    checkStatus: function(obj) {
      if (this.filters.live === null) {
        // Live + Offline
        return true;
      } else {
        return obj.streamDetails.live === this.filters.live;
      }
    },

    checkUsername: function(obj) {
      return obj.displayName
        .toLowerCase()
        .includes(this.filters.name.toLowerCase());
    },

    setDefaultValues: function() {
      this.filters.name = "";
      this.filters.live = null;
    }
  },

  computed: {
    // A function that checks all filters and returns a filtered list of streamers
    filterList: function() {
      return this.streamersList.filter(obj => {
        return this.checkUsername(obj) && this.checkStatus(obj);
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.field:not(:last-child) {
  margin: 0;
}
</style>

