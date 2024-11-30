const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to serve static files and parse request body
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Route to serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Route to handle form submission
app.post('/submit', (req, res) => {
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});