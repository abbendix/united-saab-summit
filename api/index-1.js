const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());

// Middleware to serve static files and parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));


// Route to serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

// Route to handle form submission
app.post('/submit', (req, res) => {

    console.log(req.body)

    const { firstName, lastName, checkIn, checkOut, allergies, organisation, password } = req.body;

    if (!firstName || !lastName || !checkIn || !checkOut || !allergies || !organisation || !password) {
        return res.status(400).json({ error: 'All fields are required!' });
    }

    if (password !== '2532') {
        return res.status(403).json({ error: 'Invalid password!' });
    }

    res.status(200).json({ message: `Submission successful! Welcome ${firstName}.` });
});

if (require.main === module) {
    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(`Server running locally on http://localhost:${PORT}`);
    });
  }

module.exports = app;