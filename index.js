require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb')
const urlparser = require('url')
const dns = require('dns')
const client = new MongoClient (process.env.MONGO_URI)
const db = client.db('myDB') //db name
const urls = db.collection('urlShortener')  //collection_name

// app.use(cors()) is for FCC testing purposes only
app.use(cors())
app.use(express.json())
// app.use(express.urlencoded({ extended: true })) // for form data to access req.body
app.use(express.urlencoded({ extended: true }))

// Basic Configuration
const port = process.env.PORT || 3000;


app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  const url = req.body.url
  // look up if url is valid
  const dnslookup = dns.lookup(urlparser.parse(url).hostname, async (err, address) => {
    // if there's no url, return error
    if (!address) {
      res.json({error: "Invalid URL"})
    } else {
      // if url is valid, lookup if it's already in the db
      // count the number of documents in the db
      const urlCount = await urls.countDocuments({})
      const urlDoc = {
        url,
        short_url: urlCount
      }

      // if it's not in the db, insert it
      const result = await urls.insertOne(urlDoc)
      // console.log(result)
      res.json({
        original_url: url,
        short_url: urlCount
      })
    }
  }) 
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const short_url = req.params.short_url
  // find the document with the short_url
  const urlDoc = await urls.findOne({short_url: +short_url})
  res.redirect(urlDoc.url)
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
