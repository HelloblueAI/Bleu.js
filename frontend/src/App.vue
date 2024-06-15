<template>
  <div id="app">
    <img src="@/assets/Server.svg" alt="Server Image" />
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
img {
  display: block;
  margin: 0 auto;
  max-width: 100%;
}
</style>
