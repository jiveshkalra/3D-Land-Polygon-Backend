// Functions needed ->
// 1. Add an entry to the database (entry of the 3d model form {model_name: 'model_name', seller_wallet: 'seller_wallet',cost:'cost',description:'description',model_url:'model_url',tags:'tags',category:'category'}) -> take the model file from the user and thens end it to the firestore and then get its url and upload it to the database
// 2. Get all the entries from the database
// 3. Get the entry from the database by the model name
// 4. Purchasing model , transfer of model as NFT and payment to the seller as etherium on polygon network

const {
  initializeApp,
  applicationDefault,
  cert,
} = require("firebase-admin/app");
const {
  getFirestore,
  Timestamp,
  FieldValue,
  Filter,
} = require("firebase-admin/firestore");
const multer = require("multer");
const {
  getStorage,
  Storage,
  getDownloadURL 
} = require("firebase-admin/storage");
const serviceAccount = require("./serviceAccountKey.json");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
const crypto = require("crypto"); // Import the crypto module

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const multer_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + "/files");
  },
  filename: function (req, file, cb) {
    const filename = `${crypto.randomUUID()}_${file.originalname}`;
    cb(null, filename);
  },
});
const upload = multer({ storage: multer_storage });

// Step : 0
// Database connection import from firebaseConfig.js and setting up db and firestore

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "webthreedland.appspot.com",
});

const db = getFirestore();
const storage = getStorage();

var model_bucket = storage.bucket('models');

// Test Route
app.get("/form", function (req, res) {
  res.render("form");
});

// 1. Add an entry to the database
app.post("/add", upload.any(), async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }
  if (req.body) {
    var entry = {
      model_name: req.body.model_name,
      seller_wallet: req.body.seller_wallet,
      cost: req.body.cost,
      description: req.body.description,
      model_url: req.body.model_url,
      tags: req.body.tags,
      category: req.body.category,
    };

    // Upload model file to storage 
    model_file_path = req.files[0].path;
    model_file_filename = req.files[0].filename;
    var fileRef = model_bucket.file(model_file_filename);  
    return fileRef.getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
      }).then(signedUrls => { 
        entry.model_url = signedUrls[0];
        var id = crypto.randomUUID().substring(2, 18);
        db.collection("models")
          .doc(id)
          .set(entry, { merge: true })
          .then((result) => {
            console.log(result);
            res.status(200).send("Entry added to database");
          })
          .catch((error) => {
            console.log(error);
            res.status(500).send("Error adding entry to database");
          });
      });

  } else {
    res.status(400).send("Invalid request body");
  }
});

app.get("/", function (req, res) {
  res.send("Hello World");
});

app.listen(3000, function () {
  console.log("Example app listening on port 3000!");
});
