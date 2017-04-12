const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set("view engine", "ejs");

function generateRandomString() {
  let string = "";
  const CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++)
    string += CHAR_SET.charAt(Math.floor(Math.random() * CHAR_SET.length));

  return string;
}

// URL Database
let urlDB = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDB);
});

// list URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDB
  };
  res.render("urls_index", templateVars);
});

// create entry for new URL
app.post("/urls", (req, res) => {
  let templateVars = {
    urls: urlDB
  };
  let rand = generateRandomString();
  urlDB[rand] = req.body.longURL;
  res.render("urls_index", templateVars);
});

// add new URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// list short URL and its full URL 
app.get("/urls/:shortUrl", (req, res) => {
  let sUrl = req.params.shortUrl;
  if (urlDB[sUrl]) {
    let templateVars = {
      shorturl: sUrl,
      longurl: urlDB[sUrl]
    };
  res.render("urls_show", templateVars);
} else {
    res.end("Page Not Found. Shortened URL not found on database.");
  }
});

// redirect to long URL
app.get("/u/:shortUrl", (req, res) => {
  let sUrl = req.params.shortUrl;
  if (urlDB[sUrl]) {
    res.redirect(urlDB[sUrl]);
  } else {
    res.end("Page Not Found. Shortened URL not found on database.");
  }
});

// delete URL
app.post("/urls/:shortUrl/delete", (req, res) => {
  delete urlDB[req.params.shortUrl];
  let templateVars = {
    urls: urlDB
  };
  res.render("urls_index", templateVars);
});

// update URL
app.post("/urls/:shortUrl/update", (req, res) => {
  let sUrl = req.params.shortUrl;
  urlDB[sUrl] = req.body.longURL;

  // redirect to index page after update
  let templateVars = {
    urls: urlDB
  };
  res.render("urls_index", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});