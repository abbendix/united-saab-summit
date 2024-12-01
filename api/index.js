const { google } = require('googleapis');
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');

const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

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


// Route to serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

// Route to handle form submission
app.post('/submit', async (req, res) => {
    //console.log(req.body);

    const { firstName, lastName, checkIn, checkOut, allergies, organisation, password } = req.body;

    if (!firstName || !lastName || !checkIn || !checkOut || !allergies || !organisation || !password) {
        return res.status(400).json({ error: 'All fields are required!' });
    }

    if (password !== '2532') {
        return res.status(403).json({ error: 'Invalid password!' });
    }

    // Save data to Google Sheet
    try {
        // Authorize the client
        await auth.authorize();

        // Google Sheets API
        const sheets = google.sheets({ version: 'v4', auth });

        const values = [[firstName, lastName, checkIn, checkOut, allergies, organisation, new Date().toISOString()]];
        const request = {
            spreadsheetId,
            range: 'Summit', // Update range as per your sheet
            valueInputOption: 'USER_ENTERED',
            resource: { values },
        };

        await sheets.spreadsheets.values.append(request);
        res.status(200).json({ message: `Submission successful! Welcome ${firstName}.` });
    } catch (error) {
        console.error('Error saving to Google Sheet:', error.message);
        res.status(500).json({ error: 'Failed to save data to Google Sheet.' });
    }
});

if (require.main === module) {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Server running locally on http://localhost:${PORT}`);
    });
}

module.exports = app;
