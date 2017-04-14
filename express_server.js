const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
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

function urlsForUser(uid) {
  let filtered = {};

  for (let url in urlDB) {
    let shorturl = urlDB[url].shortURL;
    if (urlDB[url].userID === uid)
      filtered[shorturl] = urlDB[url];
  }
  return filtered;
}

function generateRandomString() {
  let string = '';
  const CHAR_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++)
    string += CHAR_SET.charAt(Math.floor(Math.random() * CHAR_SET.length));
  return string;
}

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

// HOME
// if user is logged in:
//    redirect -> /urls
// if user is not logged in:
//    redirect -> /login
app.get('/', (req, res) => {
  // if (req.session.user_id) {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// Registration
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
          errMsg: 'Email already taken. Consider login or register with alternate email'
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

// register landing page
// if user is logged in:
//    redirect -> /
// if user is not logged in:
//    returns a 200 response, HTML with:
//    a form, which contains:
//    input fields for email and password
//    "register" button -> POST /register
app.get('/register', (req, res) => {
  // if (req.session.user_id) {
  if (req.session.user_id) {
    res.redirect('/');
  } else {
    res.status(200);
    res.render('urls_reg', { userid: null });
  }
});

// user login landing page
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

app.post('/login', (req, res) => {

  const emailInput = req.body.email;
  const password = req.body.password;

  for (let id in users) {
    // if email & pw matches user database, set cookies and redirect to '/'
    if (users[id].email === emailInput && bcrypt.compareSync(password, users[id].password)) {
      // res.cookie('user_id', id);
      req.session.user_id = id;
      res.redirect('/');
      return;
    }
  }

  // Email / PW don't match
  const templateVars = {
    errCode: 400,
    errMsg: 'Password do not match with this email account!'
  }
  res.status(401);
  res.render('error', templateVars);
});

// user logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.get('/hello', (req, res) => {
  res.end('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDB);
});

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
      userid: req.session.user_id
    };

    res.render('urls_index', templateVars);

    // if not logged in
  } else {
    res.status(401);
    res.end("<html><body><h3>Error 401. Please login</h3><a href='/login'>Login</body></html>");
  }
});

function checkHTTPprefix (url){
  var myRe = /d(b+)d/g;
var myArray = myRe.exec('cdbbdbsbz');

  const exp = /https?:\/\//;
  if (!exp.exec(url)) {
      return url += 'http://'+url;
  }
}
// create entry for new URL
// if user is logged in:
//    generates a shortURL, saves the link and associates it with the user
//    redirect -> /urls/:id
// if user is not logged in:
//    returns a 401 response, HTML with a relevant error message and a link to /login
app.post('/urls', (req, res) => {
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
    userid: req.session.user_id
  };
  res.render('urls_index', templateVars);
});


// Conver URL
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
    res.status(401);
  }
});

// list short URL and its full URL 
app.get('/urls/:shortUrl', (req, res) => {
  let sUrl = req.params.shortUrl;
  if (urlDB[sUrl]) {
    let templateVars = {
      usersDB: users,
      shorturl: sUrl,
      urls: urlDB,
      userid: req.session.user_id
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

// redirect to long URL
app.get('/u/:shortUrl', (req, res) => {
  let sUrl = req.params.shortUrl;
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

// delete URL
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

  // redirect to index page after update
  let templateVars = {
    usersDB: users,
    urls: urlDB,
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