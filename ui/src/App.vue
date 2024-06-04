<template>
  <div id="app">
    <header>
      <h1>Welcome to Bleu.js</h1>
      <p>Powered by Helloblue, running on HenFarm!</p>
    </header>
    <main>
      <img src="@/ui/src/assets/Server.svg" alt="Bleu.js Logo" />
      <div class="content">
        <h2>{{ message }}</h2>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Your gateway to seamless customer service solutions!'
    };
  }
};
</script>

<style scoped>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

header {
  background-color: #34495e;
  color: white;
  padding: 20px;
  width: 100%;
}

header h1 {
  margin: 0;
  font-size: 2.5em;
}

header p {
  margin: 0;
  font-size: 1.2em;
}

main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

main img {
  width: 150px;
  height: auto;
  margin: 20px 0;
}

.content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 80%;
  max-width: 600px;
}

.content h2 {
  margin: 0;
  font-size: 1.5em;
  color: #2c3e50;
}
</style>
