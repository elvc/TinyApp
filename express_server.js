const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000; 
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: ['kies']
}));

const userpw = bcrypt.hashSync('purple', 10);
const user2pw = bcrypt.hashSync('funky', 10);

app.set('view engine', 'ejs');

// ===========================================================

// Filter URL lists per user
function urlsForUser(uid) {
  let filtered = {};

  for (let url in urlDB) {
    let shorturl = urlDB[url].shortURL;
    if (urlDB[url].userID === uid)
      filtered[shorturl] = urlDB[url];
  }

  return filtered;
}

// Generate 6 alpha-numeric characters
function generateRandomString() {
  let string = '';
  const CHAR_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++)
    string += CHAR_SET.charAt(Math.floor(Math.random() * CHAR_SET.length));
  return string;
}

// ===========================================================

// User DB
const users = {
  'xuD83h': {
    id: 'xuD83h',
    email: 'user@example.com',
    password: userpw
  },
  '0Se7Gs': {
    id: '0Se7Gs',
    email: 'user2@example.com',
    password: user2pw
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
// DONE
// HOME
// if user is logged in:
//    redirect -> /urls
// if user is not logged in:
//    redirect -> /login

app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// ===========================================================
// DONE
// REGISTRATION LANDING
// if user is logged in:
//    redirect -> /
// if user is not logged in:
//    returns a 200 response, HTML with:
//    a form, which contains:
//    input fields for email and password
//    "register" button -> POST /register
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/');
  } else {
    res.status(200);
    res.render('urls_reg', {
      userid: null
    });
  }
});

// ===========================================================
// DONE
// REGISTRATION
// if email or password are empty:
//    returns a 400 response, with a relevant error message
// if email already exists:
//    returns a 400 response, with a relevant error message
// if all is well:
//    creates a user
//    encrypts their password with bcrypt
//    sets a cookie
//    redirect -> /

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
    const userpw = bcrypt.hashSync(req.body.password, 10);

    req.session.user_id = generateRandomString();

    users[req.session.user_id] = {
      id: req.session.user_id,
      email: req.body.email,
      password: userpw
    }
    res.cookie('user_id', req.session.user_id);
    res.redirect('/');
  }
});

// ===========================================================
// DONE
// USER LOGIN LANDING 
// if user is logged in:
//    redirect -> /
// if user is not logged in:
//    returns a 200 response, HTML with:
//    a form which contains:
//      input fields for email and password
//      submit button -> POST /login

app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/');
  } else {
    res.status(200);
    res.render('urls_login', {
      userid: req.session.user_id
    });
  }
});

// ===========================================================
// DONE
// USER LOGIN POST
// if email & password params match an existing user:
//    sets a cookie
//    redirect -> /
// if they don't match:
//    returns a 401 response, HTML with a relevant error message

app.post('/login', (req, res) => {

  const emailInput = req.body.email;
  const password = req.body.password;

  for (let id in users) {
    // if email & pw matches user database, set cookies and redirect to '/'
    if (users[id].email === emailInput && bcrypt.compareSync(password, users[id].password)) {
      req.session.user_id = id;
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
// DONE
// LOGOUT

app.post('/logout', (req, res) => {
  req.session = null;
  res.clearCookie('user_id');
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
// DONE
// list URLs
// if user is not logged in:
//    returns a 401 response, HTML with a relevant error message and a link to /login
// if user is logged in:
//    returns a 200 response, HTML with:
//      the site header (see below)
//      a table of urls the user has created, each row:
//      short url
//      long url
//      edit button -> GET /urls/:id
//      delete button -> POST /urls/:id/delete
//      date created (stretch)
//      number of visits (stretch)
//      number of unique visits (stretch)
//    a link to "Create a New Short Link" -> /urls/new

app.get('/urls', (req, res) => {

  // if user is logged in
  if (req.session.user_id) {
    // filter only user
    const filteredDB = urlsForUser(req.session.user_id);
    let templateVars = {
      usersDB: users,
      urls: filteredDB,
      userid: req.session.user_id,
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
// DONE
// Create new URL entry
// if user is logged in:
//    generates a shortURL, saves the link and associates it with the user
//    redirect -> /urls/:id
// if user is not logged in:
//    returns a 401 response, HTML with a relevant error message and a link to /login

app.post('/urls', (req, res) => {

  if (req.session.user_id) {
    let rand = generateRandomString();

    urlDB[rand] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
      shortURL: rand
    };

    // filter only user
    const filteredDB = urlsForUser(req.session.user_id);
    let templateVars = {
      usersDB: users,
      urls: filteredDB,
      userid: req.session.user_id,
      email: users[req.session.user_id].email 
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
// DONE
// Convert URL
// if user is not logged in:
//    returns a 401 response, HTML with:
//    error message
//    a link to /login
// if user is logged in:
//    returns a 200 response, HTML with:
//    the site header (see below)
//    a form, which contains:
//    text input field for the original URL
//    submit button -> POST /urls

app.get('/urls/new', (req, res) => {
  if (req.session.user_id) {
    res.status(200);
    res.render('urls_new', {
      usersDB: users,
      userid: req.session.user_id
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
// DONE
// LIST SHORT URL, LONG URL, UPDATE and DELETE FORM
// if url w/ :id does not exist:
//    returns a 404 response, HTML with a relevant error message
// if user is not logged in:
//    returns a 401 response, HTML with a relevant error message and a link to /login
// if logged in user does not match the user that owns this url:
//    returns a 403 response, HTML with a relevant error message
// if all is well:
//    returns a 200 response, HTML with:
//    the short url
//    date created (stretch)
//    number of visits (stretch)
//    number of unique visits (stretch)
//    a form, which contains:
//      the long url
//      "update" button -> POST /urls/:id
//      "delete" button -> POST /urls/:id/delete

app.get('/urls/:id', (req, res) => {
  
  const filteredDB = urlsForUser(req.session.user_id);
    
  if (urlDB[req.params.id]) {
    // let templateVars = {
    //   usersDB: users,
    //   shorturl: req.params.id,
    //   urls: urlDB,
    //   userid: req.session.user_id
    // };
    let templateVars = {
      usersDB: users,
      urls: filteredDB,
      shorturl: req.params.id,
      userid: req.session.user_id,
      email: users[req.session.user_id].email 
    };
    res.render('urls_show', templateVars);
  } else {
    let templateVars = {
      errCode: 404,
      errMsg: 'Page Not Found. Invalid short URL.'
    }
    res.status(404);
    res.render('error', templateVars);
  }
});

// ===========================================================
// DONE
// REDIRECT URLs
// if url with :id exists:
//    redirect -> the corresponding longURL
// otherwise:
//    returns a 404 response, HTML with a relevant error message

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
// DELETE URL
app.post('/urls/:shortUrl/delete', (req, res) => {

  delete urlDB[req.params.shortUrl];

  const filteredDB = urlsForUser(req.session.user_id);

  let templateVars = {
    usersDB: users,
    urls: filteredDB,
    userid: req.session.user_id
  };
  res.render('urls_index', templateVars);
});

// update URL
app.post('/urls/:shortUrl/update', (req, res) => {
  let sUrl = req.params.shortUrl;
  urlDB[sUrl].longURL = req.body.longURL;
  const filteredDB = urlsForUser(req.session.user_id);
  // redirect to index page after update
  let templateVars = {
    usersDB: users,
    urls: filteredDB,
    userid: req.session.user_id
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