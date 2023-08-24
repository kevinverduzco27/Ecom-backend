const express = require('express');
const routes = require('./routes');
const sequelize = require('./models'); // Assuming you've organized your sequelize models properly

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

// Sync sequelize models to the database and then start the server
sequelize.sync({ force: false }) // Set force to true if you want to drop and recreate tables on every restart
  .then(() => {
    app.listen(PORT, () => {
      console.log(`App listening on port ${PORT}!`);
    });
  })
  .catch((error) => {
    console.error('Error syncing sequelize models:', error);
});
