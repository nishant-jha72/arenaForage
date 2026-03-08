const dotenv = require('dotenv');
dotenv.config();
const userRoutes = require('./Routes/user.routes');

const db = require('./DB');

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.send('Welcome to the Arena Forage API!');
});
app.use('/api/users', userRoutes);

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});