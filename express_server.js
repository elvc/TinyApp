const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const generateRandomString = require('./generateRandom');
const express = require('express');
const app = express();

app.locals.email = '';

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: ['kies']
}));

const HASH_NUM = 10;
const userPw = bcrypt.hashSync('purple', HASH_NUM);
const user2Pw = bcrypt.hashSync('funky', HASH_NUM);

app.set('view engine', 'ejs');

// ===========================================================

// Filter URL lists per user
function urlsForUser(uId) {
  let filtered = {};

  for (let url in urlDB) {
    let shortUrl = urlDB[url].shortURL;
    if (urlDB[url].userID === uId)
      filtered[shortUrl] = urlDB[url];
  }

  return filtered;
}

// ===========================================================

// User DB
const users = {
  'xuD83h': {
    id: 'xuD83h',
    email: 'user@example.com',
    password: userPw
  },
  '0Se7Gs': {
    id: '0Se7Gs',
    email: 'user2@example.com',
    password: user2Pw
  }
}

// URL Database
const urlDB = {
  'b2xVn2': {
    userID: 'xuD83h',
    shortURL: 'b2xVn2',
    longURL: 'http://www.lighthouselabs.ca'
  },
  '9sm5xK': {
    userID: '0Se7Gs',
    shortURL: '9sm5xK',
    longURL: 'http://www.google.com'
  }
};

// ===========================================================

app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// ===========================================================

app.get('/register', (req, res) => {
  if (req.session.userId) {
    res.redirect('/');
  } else {
    res.status(200);
    res.render('urls_reg', {
      userId: null
    });
  }
});

// ===========================================================

app.post('/register', (req, res) => {

  // check if email and password are empty strings
  if (!req.body.email || !req.body.password) {
    const templateVars = {
      errCode: 400,
      errMsg: 'Cannot proceed. You have not entered email or password'
    }
    res.status(400);
    res.render('error', templateVars);

  } else {

    // check if email already exists
    for (let ids in users) {
      if (users[ids].email === req.body.email) {
        const templateVars = {
          errCode: 400,
          errMsg: 'Email address has already been registered by another user. If this is you, please login. Or register with an alternate email address'
        }
        res.status(400);
        res.render('error', templateVars);
      }
    }

    // all is well => Create a new user record
    const useremail = req.body.email;
    app.locals.email = req.body.email;
    const userPw = bcrypt.hashSync(req.body.password, HASH_NUM);

    req.session.userId = generateRandomString();

    users[req.session.userId] = {
      id: req.session.userId,
      email: useremail,
      password: userPw
    }
    res.cookie('userId', req.session.userId);
    res.redirect('/');
  }
});

// ===========================================================

app.get('/login', (req, res) => {
  if (req.session.userId) {
    res.redirect('/');
  } else {
    res.status(200);
    res.render('urls_login', {
      userId: req.session.userId,
      email: app.locals.email
    });
  }
});

// ===========================================================

app.post('/login', (req, res) => {

  const emailInput = req.body.email;
  app.locals.email = req.body.email;
  const password = req.body.password;

  for (let id in users) {
    // if email & pw matches user database, set cookies and redirect to '/'
    if (users[id].email === emailInput && bcrypt.compareSync(password, users[id].password)) {
      req.session.userId = id;
      res.redirect('/');
      return;
    }
  }

  // If Email / PW don't match
  const templateVars = {
    errCode: 401,
    errMsg: 'Access Denied. Email/Password combination do not match. Please register or check credentials.'
  }
  res.status(401);
  res.render('error', templateVars);
});

// ===========================================================

app.post('/logout', (req, res) => {
  req.session = null;
  app.locals.email = '';
  res.clearCookie('userId');
  res.redirect('/');
});

// ===========================================================

app.get('/hello', (req, res) => {
  res.end('<html><body>Hello <b>World</b></body></html>\n');
});

// ===========================================================

app.get('/urls.json', (req, res) => {
  res.json(urlDB);
});

// ===========================================================

app.get('/urls', (req, res) => {

  // if user is logged in
  if (req.session.userId) {
    // filter only user
    const filteredDB = urlsForUser(req.session.userId);
    let templateVars = {
      usersDB: users,
      urls: filteredDB,
      userId: req.session.userId,
      email: app.locals.email
    };
    res.status(200);
    res.render('urls_index', templateVars);

    // if not logged in
  } else {
    let templateVars = {
      errCode: 401,
      errMsg: 'Please Login First'
    }
    res.status(401);
    res.render('error', templateVars);
  }
});

// ===========================================================

app.post('/urls', (req, res) => {

  if (req.session.userId) {
    let rand = generateRandomString();

    urlDB[rand] = {
      longURL: req.body.longURL,
      userID: req.session.userId,
      shortURL: rand
    };

    // filter only user
    const filteredDB = urlsForUser(req.session.userId);
    let templateVars = {
      usersDB: users,
      urls: filteredDB,
      userId: req.session.userId,
      email: app.locals.email
    };
    res.redirect('/urls/' + rand);

  } else {
    let templateVars = {
      errCode: 401,
      errMsg: 'Please Login First'
    }
    res.status(401);
    res.render('error', templateVars);
  }
});

// ===========================================================

app.get('/urls/new', (req, res) => {
  if (req.session.userId) {
    res.status(200);
    res.render('urls_new', {
      usersDB: users,
      userId: req.session.userId,
      email: app.locals.email
    });
  } else {
    let templateVars = {
      errCode: 401,
      errMsg: 'Login Required to create new URL. Register a new account or login'
    }
    res.status(401);
    res.render('error', templateVars);
  }
});

// ===========================================================

app.get('/urls/:id', (req, res) => {

  const filteredDB = urlsForUser(req.session.userId);

  if (!urlDB[req.params.id]) {
    let templateVars = {
      errCode: 404,
      errMsg: 'Invalid URL. Please double check'
    }
    res.status(404);
    res.render('error', templateVars);
  }

  // if user is not logged in
  else if (!req.session.userId) {
    let templateVars = {
      errCode: 401,
      errMsg: 'Login Required to edit URL'
    }
    res.status(401);
    res.render('error', templateVars);
  }

  // if user does not match the url owner
  else if (req.session.userId !== urlDB[req.params.id].userID) {
    let templateVars = {
      errCode: 403,
      errMsg: "You are not allowed to edit other's URL"
    }
    res.status(403);
    res.render('error', templateVars);
  }

  // if (urlDB[req.params.id]) {
  else {
    let templateVars = {
      usersDB: users,
      urls: filteredDB,
      shortUrl: req.params.id,
      userId: req.session.userId,
      email: app.locals.email
    };
    res.render('urls_show', templateVars);
  }
});

app.post('/urls/:shortUrl/', (req, res) => {
  const sUrl = req.params.shortUrl;

  if (!urlDB[sUrl]) {
    let templateVars = {
      errCode: 404,
      errMsg: 'Invalid URL. Please double check'
    }
    res.status(404);
    res.render('error', templateVars);
  }

  // if user is not logged in
  else if (!req.session.userId) {
    let templateVars = {
      errCode: 401,
      errMsg: 'Login Required to edit URL'
    }
    res.status(401);
    res.render('error', templateVars);
  }

  // if user does not match the url owner
  else if (req.session.userId !== urlDB[sUrl].userID) {
    let templateVars = {
      errCode: 403,
      errMsg: "You are not allowed to edit other's URL"
    }
    res.status(403);
    res.render('error', templateVars);
  }

  // all is well
  else {
    urlDB[sUrl].longURL = req.body.longURL;
    const filteredDB = urlsForUser(req.session.userId);
    // redirect to index page after update
    let templateVars = {
      usersDB: users,
      urls: filteredDB,
      userId: req.session.userId,
      email: app.locals.email
    };
    res.render('urls_index', templateVars);
  }
});

// ===========================================================

app.get('/u/:id', (req, res) => {
  let sUrl = req.params.id;
  if (urlDB[sUrl]) {
    res.redirect(urlDB[sUrl].longURL);
  } else {
    let templateVars = {
      errCode: 404,
      errMsg: 'Short URL Not Found. Unable to redirect'
    }
    res.status(404);
    res.render('error', templateVars);
  }
});

// ===========================================================

app.post('/urls/:shortUrl/delete', (req, res) => {

  delete urlDB[req.params.shortUrl];

  const filteredDB = urlsForUser(req.session.userId);

  let templateVars = {
    usersDB: users,
    urls: filteredDB,
    userId: req.session.userId,
    email: app.locals.email
  };
  res.render('urls_index', templateVars);
});

app.get('*', function (req, res, next) {
  let templateVars = {
    errCode: 404,
    errMsg: 'Page Not Found. Invalid path.'
  }
  res.status(404);
  res.render('error', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});