module.exports = {
  apps: [{
    name: 'shopbackend', // Use a distinct name for your app
    script: './server.js', // The correct path to your main script
    env: {
      NODE_MODULE: "Production",
      DATABASE_URL: "mongodb+srv://palmoildb:Palmoil15@cluster0.5kjtnoz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      // ... include all your other environment variables
    }
  }]
};