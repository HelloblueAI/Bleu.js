<template>
  <div id="app" class="container">
    <header>
      <h1>Welcome to Bleu.js Server</h1>
      <p>Efficient and reliable server management</p>
    </header>
    <main>
      <img src="./assets/Server.svg" alt="Server" class="server-image" />
    </main>
    <footer>
      <p>&copy; 2024 Bleu.js. All rights reserved.</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');

body {
  margin: 0;
  font-family: 'Roboto', sans-serif;
}

.container {
  text-align: center;
  padding: 20px;
}

header {
  background-color: #282c34;
  padding: 20px;
  color: white;
}

header h1 {
  margin: 0;
}

header p {
  margin: 0;
  font-size: 1.2em;
}

main {
  margin: 20px 0;
}

.server-image {
  width: 150px;
  height: 150px;
  transition: transform 0.2s;
}

.server-image:hover {
  transform: scale(1.05);
}

footer {
  font-size: 0.9em;
  color: #888;
}

footer p {
  margin: 10px 0 0;
}
</style>
