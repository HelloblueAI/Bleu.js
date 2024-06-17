<template>
    <div id="app" class="container">
      <header>
        <h1>Welcome to Bleu.js Server</h1>
        <p>Efficient and reliable server management</p>
      </header>
      <main>
        <img src="@/assets/Server.svg" alt="Server" class="server-image">
      </main>
      <footer>
        <p>&copy; 2024 Bleu.js. All rights reserved.</p>
      </footer>
    </div>
  </template>
  
  <script>
  export default {
    name: 'App'
  };
  </script>
  
  <style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
  
  body {
    margin: 0;
    font-family: 'Roboto', sans-serif;
    background-color: #f0f4f8;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    color: #333;
  }
  
  .container {
    text-align: center;
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    width: 100%;
    margin: 20px;
  }
  
  header h1 {
    margin: 0;
    font-size: 2.5em;
    color: #007bff;
  }
  
  header p {
    font-size: 1.2em;
    color: #555;
  }
  
  main {
    margin: 20px 0;
  }
  
  .server-image {
    width: 80%;
    max-width: 400px;
    transition: transform 0.3s ease-in-out;
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
  