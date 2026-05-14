require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Connect DB
connectDB();

// Routes
app.use('/accounts', require('./routes/accounts'));
app.use('/exams', require('./routes/exams'));
app.use('/users', require('./routes/users'));
app.use('/admin', require('./routes/admin'));

// Root
app.get('/', (req, res) => res.send('Markr API is running'));

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
