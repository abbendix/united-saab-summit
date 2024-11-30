const express = require('express');
const path = require('path');
const cors = require('cors');
const { google } = require('googleapis');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Load Google Sheets API credentials
const credentials = JSON.parse(fs.readFileSync('google-credentials.json', 'utf8'));
const { client_email, private_key } = credentials;
const sheets = google.sheets('v4');
const auth = new google.auth.JWT(client_email, null, private_key, ['https://www.googleapis.com/auth/spreadsheets']);

// Your Google Sheet ID
const spreadsheetId = '86e72efbdb8cc9307827a9661f3cb4debef2383d';

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
        const authClient = await auth.authorize();

        const values = [[firstName, lastName, checkIn, checkOut, allergies, organisation]];
        //const values = [[firstName, lastName, checkIn, checkOut, allergies, organisation, new Date().toISOString()]];
        const request = {
            spreadsheetId,
            range: 'Sheet1!A1', // Update range as per your sheet
            valueInputOption: 'USER_ENTERED',
            resource: { values },
            auth: authClient,
        };

        await sheets.spreadsheets.values.append(request);
        res.status(200).json({ message: `Submission successful! Welcome ${firstName}.` });
    } catch (error) {
        console.error('Error saving to Google Sheet:', error);
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
