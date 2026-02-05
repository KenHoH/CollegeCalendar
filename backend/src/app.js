require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;

const {google} = require('googleapis');
const cookieParser = require('cookie-parser');

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

app.use(cookieParser());

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


    console.log("Refresh Token", tokens.refresh_token);

    res.cookie('accessToken', tokens.access_token, {
      maxAge: 900000, // Cookie expiration time in milliseconds (15 minutes)
      httpOnly: true, // Makes the cookie inaccessible to client-side JavaScript, mitigating XSS attacks
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'Strict' // Controls when the cookie is sent with cross-site requests
    });

    oauth2Client.setCredentials({
      refresh_token: tokens.refresh_token
    });

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
  console.log(process.env.HELLO);
});