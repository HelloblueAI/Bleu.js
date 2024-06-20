<template>
  <div class="home-container">
    <h1>Welcome to Bleu.js Server</h1>
    <p>Your efficient and reliable server management solution</p>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap');

body {
  margin: 0;
  font-family: 'Montserrat', sans-serif;
}

.home-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f5f5f5;
  text-align: center;
  padding: 20px;
}

h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

p {
  font-size: 1.2rem;
  color: #666;
  margin: 0;
}
</style>
