<template>
  <article class="media">
    <div class="spinner3"></div>
  </article>
</template>

<style lang="scss" scoped>
@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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



