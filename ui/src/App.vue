<template>
  <div id="app">
    <img src="@/assets/Server.svg" alt="Bleu.js Logo">
    <div>
      <h2>{{ $store.state.message }}</h2>
      <button @click="updateMessage">Update Message</button>
    </div>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  methods: {
    updateMessage() {
      this.$store.dispatch('updateMessage', 'Hello from Bleu.js!');
    }
  }
}
</script>

<style scoped>
/* Global styles */
body {
  margin: 0;
  font-family: Arial, sans-serif;
}

img {
  max-width: 100%;
  height: auto;
  margin-bottom: 20px;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
}

button {
  cursor: pointer;
}
</style>
