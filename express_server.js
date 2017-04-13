const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
app.use(cookieParser())
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'ejs');

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
    password: 'purple-monkey-dinosaur'
  },
  '0Se7Gs': {
    id: '0Se7Gs',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
}

// URL Database
const urlDB = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

// HOME
// if user is logged in:
//    redirect -> /urls
// if user is not logged in:
//    redirect -> /login
app.get('/', (req, res) => {
  if (req.cookies['user_id']) {
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
    const cookiesID = generateRandomString();
    const useremail = req.body.email;
    const userpw = req.body.password;

    users[cookiesID] = {
      id: cookiesID,
      email: req.body.email,
      // TODO: encrypt with bcrypt
      password: req.body.password
    }
    res.cookie('user_id', cookiesID);
    res.cookie('email', req.body.email);
    res.cookie('password', req.body.password);
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
  if (req.cookies['user_id']) {
    res.redirect('/');
  } else {
    res.status(200);
    res.render('urls_reg', {userid: null});
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
  if (req.cookies['user_id']) {
    res.redirect('/');
  } else {
    res.status(200);
    res.render('urls_login', {
      userid: req.cookies['user_id'],
    });
  }
});

/*
// find user
var username = req.body.username
var password = req.body.password;
var user = users.find(function(user){
  return user.username === username;
});

if (user.password === password){
  res.cookie('user', user.id);
} else {
  res.redirect('/login');
}
*/

// if email & password params match an existing user:
//    sets a cookie
//    redirect -> /
// if they don't match:
//    returns a 401 response, HTML with a relevant error message

app.post('/login', (req, res) => {

  const emailInput = req.body.email;
  const pwInput = req.body.password;

  for (let id in users) {
    // if email & pw matches user database, set cookies and redirect to '/'
    if (users[id].email === emailInput && users[id].password === pwInput) {
      res.cookie('user_id', id);
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
  res.clearCookie('user_id');
  res.clearCookie('password');
  res.clearCookie('email');
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
  if (req.cookies['user_id']) {
    let templateVars = {
      usersDB: users,
      urls: urlDB,
      userid: req.cookies['user_id']
    };
    res.render('urls_index', templateVars);

    // if not logged in
  } else {
    res.status(401);
    res.end("<html><body><h3>Error 401. Please login</h3><a href='/login'>Login</body></html>");
  }
});

// TODO!!!
// create entry for new URL
// if user is logged in:
//    generates a shortURL, saves the link and associates it with the user
//    redirect -> /urls/:id
// if user is not logged in:
//    returns a 401 response, HTML with a relevant error message and a link to /login
app.post('/urls', (req, res) => {
  let templateVars = {
    usersDB: users,
    urls: urlDB,
    userid: req.cookies['user_id']
  };
  let rand = generateRandomString();
  urlDB[rand] = req.body.longURL;
  res.render('urls_index', templateVars);
});

// add new URL
app.get('/urls/new', (req, res) => {
  res.render('urls_new', {
    usersDB: users,
    userid: req.cookies['user_id']
  });
});

// list short URL and its full URL 
app.get('/urls/:shortUrl', (req, res) => {
  let sUrl = req.params.shortUrl;
  if (urlDB[sUrl]) {
    let templateVars = {
      usersDB: users,
      shorturl: sUrl,
      longurl: urlDB[sUrl],
      userid: req.cookies['user_id']
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
    res.redirect(urlDB[sUrl]);
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
  let templateVars = {
    usersDB: users,
    urls: urlDB,
    userid: req.cookies['user_id']
  };
  res.render('urls_index', templateVars);
});

// update URL
app.post('/urls/:shortUrl/update', (req, res) => {
  let sUrl = req.params.shortUrl;
  urlDB[sUrl] = req.body.longURL;

  // redirect to index page after update
  let templateVars = {
    usersDB: users,
    urls: urlDB,
    userid: req.cookies['user_id']
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