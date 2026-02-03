require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;


const {google} = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

const scopes = [
  'https://www.googleapis.com/auth/calendar'
];

const url = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'offline',

  // If you only need one scope, you can pass it as a string
  scope: scopes
});

oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    console.log('Refresh token:', tokens.refresh_token);
  }
  console.log('Access token:', tokens.access_token);
});

app.get('/', (req, res) => {
  res.send('Hello World from Express!');
});

app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send('Missing code');
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    res.redirect('/');
  } catch (err) {
    console.error('OAuth error:', err);
    res.status(500).send('Authentication failed');
  }
});

oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    console.log(tokens.refresh_token);
  }
  console.log(tokens.access_token);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});