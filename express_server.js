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

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortUrl", (req, res) => { 
  if (urlDatabase[req.params.shortUrl]){
    let templateVars = {
      shorturl: req.params.shortUrl,
      longurl: urlDatabase[req.params.shortUrl]
    };
    res.render("urls_show", templateVars);
  } else {
    res.send("Page Not Found. Shortened URL not found on database. ");
  }
});

// redirect to long URL
app.get("/u/:shortUrl", (req, res) => {
  let sUrl = req.params.shortUrl;
  if(urlDatabase[sUrl]){
  res.redirect(urlDatabase[sUrl]);
  } else {
    res.send("Page Not Found. Shortened URL not found on database. ");
  }
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// post method
app.post("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase
  };
  let rand = generateRandomString();
  urlDatabase[rand] = req.body.longURL; 
  res.render("urls_index", templateVars); 
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


