require('dotenv').config();
const axios = require('axios');
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

const calendar = google.calendar({
  version: 'v3',
  auth: oauth2Client
})

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
      maxAge: 900000, 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'Strict' 
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

app.get('/college', async (req, res) => {
  const postData = {
    "roleActivity": [
      {
        "name": "Student",
        "userCode": "2802397640",
        "roleId": "4bcb81bd-46a8-4a09-a923-5e812cb7007b",
        "roleType": "student",
        "roleOrganizationId": "437a8c7c-d8fa-4bdd-b920-eaeb965ea146",
        "academicCareer": "RS1",
        "institution": "BNS01",
        "isPrimary": true,
        "isActive": true
      }
    ]
  }

  try {
    const response = await axios.post('https://func-bm7-schedule-prod.azurewebsites.net/api/Schedule/Month-v1/2026-2-1', postData ,{
      headers: {
        "Authorization":"Bearer eyJhbGciOiJQUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImQ1MTc4ZmQzLThhNzQtNDEwMy1hNzcxLTNjNjVmYWQwYmQ2MiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJLRU5ORVRIIE1BWElNSUxMSUFOIFBSQU5BVEEiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJrZW5uZXRoLnByYW5hdGFAYmludXMuYWMuaWQiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiQk4xMjUyNjIzOTEiLCJHdWVzdCJdLCJuYmYiOjE3NzAyNzA4ODcsImV4cCI6MTc3MDM1NzI4NywiaXNzIjoiQmludXNTZXJ2aWNlcyIsImF1ZCI6Ik5leHVzLklkZW50aXR5U2VydmljZSJ9.RkGmHzwrxUDbjLnjiLvVeiWgS3oQppttI6Q1xlUnau3iAZk_uXBYUQBDr4ra5hpGKzIEb9EJAhZYGxl-pUjAmccTAZWwThyhtsw9eNlvZntmbqHs5TaqH7SS1YKJVZAJ7-NXkbSBjgogea8MKWxVLlfTl8J7K3CaSS3S9mz2O74",
        "academicCareer":"RS1",
        "institution":"BNS01",
        "rOId":"437a8c7c-d8fa-4bdd-b920-eaeb965ea146",
        "roleId":"4bcb81bd-46a8-4a09-a923-5e812cb7007b",
        "roleName":"Student",
      }, 
      timeout: 10000 
    })
    res.json(response.data);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Request failed' });
  }

})

app.get('/events', async (req, res) => {
  try {

    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).send('Not authenticated');
    }

    oauth2Client.setCredentials({
      access_token: accessToken
    });

    const response = await calendar.events.list({
      calendarId: 'primary',           
      timeMin: (new Date()).toISOString(), 
      maxResults: 10,                  
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(response.data.items);
  } catch (error) {
    console.log('Error listing events:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

app.post('/create/calendar', async (req, res) => {
  try {

    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).send('Not authenticated');
    }

    oauth2Client.setCredentials({
      access_token: accessToken
    });
    const event = {
      summary: 'Test Event from Node.js',
      description: 'This event was created using Google Calendar API',
      start: {
        dateTime: '2026-02-06T10:00:00-05:00',
        timeZone: 'Asia/Jakarta',
      },
      end: {
        dateTime: '2026-02-06T11:00:00-05:00',
        timeZone: 'Asia/Jakarta',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    res.json({
      message: 'Event created successfully',
      eventLink: response.data.htmlLink,
    });
  } catch (error) {
    console.log('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
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