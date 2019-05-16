'use strict';

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");
const shortid = require("shortid");

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

app.use(cors());

//Database Schema & Model
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original: { type: String, required: true },
  id: String
});
const UrlModel = mongoose.model("UrlModel", urlSchema);

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});

app.post("/api/shorturl/new", (req, res) => {
  const orgUrl = req.body.url;
  UrlModel.findOne({ original: orgUrl }, (err, data) => {
    const regex = /^https?:\/\/www\./i;

    if (err) {
      console.log(err);
    }

    //There's an entry for that URL
    if (data) {
      res.json({ original_url: data.original, short_url: data.id });
      console.log("The URL is in the db");
    }

    //There's no entry for that URL
    else {
      //The URL follows the http(s)://www.example.com(/more/routes) format?
      if (regex.test(orgUrl)) {
        const domain = orgUrl.replace(regex, "");
        const shortNum = shortid.generate();
        dns.lookup(domain, (err, address) => {
          //Incorrect or nonexistant domain
          if (err || !address) {
            res.json({ error: "invalid URL" });
          } else {
            //Valid domain
            const newUrl = new UrlModel({
              original: orgUrl,
              id: shortNum
            });
            newUrl.save((err, data) => {
              if (err) {
                console.log(err);
              }
              res.json({ original_url: orgUrl, short_url: shortNum });
            });
          }
        });
      } else {
        res.json({ error: "invalid URL" });
      }
    }
  });
});

app.get("/api/shorturl/:shortened", (req, res) => {
  const shortened = req.params.shortened;
  UrlModel.findOne({ id: shortened }, (err, data) => {
    if (err) {
      console.log(err);
    }
    if (data) {
      res.redirect(data.original);
    }
  });
});