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
          <br>
          {{ streamer.streamDetails.title }}
        </p>
      </div>
    </div>
    <div class="media-right" :style="{ textAlign: 'right' }">
      <button class="delete" @click="$emit('remove')"></button>
      <p
        :class="{ 'is-live': streamer.streamDetails.live }"
      >{{ streamer.streamDetails.live ? 'LIVE' : 'OFFLINE' }}</p>
      <p>{{ streamer.streamDetails.live ? streamer.streamDetails.viewersCount + ' widzów' : null }}</p>
    </div>
  </article>
</template>

<script>
export default {
  name: "Streamer",
  props: {
    streamer: Object
  }
};
</script>
