const { google } = require('googleapis');
require('dotenv').config();
const session = require('express-session');
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL, // Add POSTGRES_URL to your environment variables
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(
    session({
        secret: 'your-secret-key', // Replace with a strong secret
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Set to true if using HTTPS
    })
);
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Load Google Sheets API credentials
let credentials;
try {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
} catch (error) {
    console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_CREDENTIALS:', error.message);
    throw new Error('Ensure GOOGLE_SERVICE_ACCOUNT_CREDENTIALS is valid JSON.');
}

const { client_email } = credentials;
const privateKey = credentials.private_key.replace(/\\n/g, '\n');

const auth = new google.auth.JWT(client_email, null, privateKey, [
    'https://www.googleapis.com/auth/spreadsheets',
]);

// Your Google Sheet ID
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Handle login submission
app.post('/login', (req, res) => {
    const { password } = req.body;

    if (password !== '2532') {
        return res.status(403).json({ error: 'Invalid password!' });
    }

    req.session.loggedIn = true; // Mark user as logged in
    res.status(200).json({ message: 'Login successful!' });
});

app.get('/', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

// Route to handle form submission
app.post('/submit', async (req, res) => {
    
    const { firstName, lastName, checkIn, checkOut, allergies, organisation, additional } = req.body;

    // Function to validate DD-MM-YYYY format
    function isValidDate(dateString) {
        const dateRegex = /^([0-2][0-9]|3[0-1])-(0[1-9]|1[0-2])-\d{4}$/;
        if (!dateRegex.test(dateString)) return false;

        const [day, month, year] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
        );
    }

    // Function to check logical order of dates
    function areDatesValid(checkIn, checkOut) {
        const [dayIn, monthIn, yearIn] = checkIn.split('-').map(Number);
        const [dayOut, monthOut, yearOut] = checkOut.split('-').map(Number);

        const checkInDate = new Date(yearIn, monthIn - 1, dayIn);
        const checkOutDate = new Date(yearOut, monthOut - 1, dayOut);

        return checkOutDate > checkInDate;
    }

    if (!firstName || !lastName || !organisation) {
        return res.status(400).json({ error: 'First Name, Last Name, and Organisation are required!' });
    }

    if (checkIn && !isValidDate(checkIn)) {
        return res.status(400).json({ error: 'Check-in date must be in DD-MM-YYYY format if provided.' });
    }

    if (checkOut && !isValidDate(checkOut)) {
        return res.status(400).json({ error: 'Check-out date must be in DD-MM-YYYY format if provided.' });
    }

    if (checkIn && checkOut && !areDatesValid(checkIn, checkOut)) {
        return res.status(400).json({ error: 'Check-out date must be after check-in date if both are provided.' });
    }

    // Save data to Google Sheet
    try {
        // Authorize the client
        await auth.authorize();

        // Google Sheets API
        const sheets = google.sheets({ version: 'v4', auth });

        const values = [[firstName, lastName, checkIn || '', checkOut || '', allergies, organisation, additional, new Date().toISOString()]];
        const request = {
            spreadsheetId,
            range: 'Summit', // Update range as per your sheet
            valueInputOption: 'USER_ENTERED',
            resource: { values },
        };

        await sheets.spreadsheets.values.append(request);
        
        try {
            const query = `
                INSERT INTO tmc25 (first_name, last_name, organisation, check_in, check_out, allergies, additional)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            const values = [firstName, lastName, organisation, checkIn || null, checkOut || null, allergies, additional];
    
            await pool.query(query, values);
    
            console.error('Success saving to Postgres');
        } catch (error) {
            console.error('Error saving to Postgres:', error.message);
        }

        res.status(200).json({ message: `Submission successful! Welcome ${firstName}.` });
    } catch (error) {
        console.error('Error saving to Google Sheet:', error.message);
        res.status(500).json({ error: 'Failed to save data, try again or please contact Cimberly.' });
    }

});

if (require.main === module) {
    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`Server running locally on http://localhost:${PORT}`);
    });
}

module.exports = app;
