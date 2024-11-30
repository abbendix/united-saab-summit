const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const router = express.Router();

// Middleware to serve static files and parse request body
app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Route to serve the HTML form
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'index.html'));
});

// Route to handle form submission
router.post('/submit', (req, res) => {
    const { name, role, password } = req.body;

    // Backend validation
    if (!name || !role || !password) {
        return res.status(400).send('All fields are required!');
    }

    if (password !== '2532') {
        return res.status(403).send('Invalid password!');
    }

    res.send(`Submission successful! Welcome ${name}, your role is ${role}.`);
});

app.use('/api', router);

module.exports = app;