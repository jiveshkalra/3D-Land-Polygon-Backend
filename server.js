// Functions needed ->
// 1. Add an entry to the database (entry of the 3d model form {model_name: 'model_name', seller_wallet: 'seller_wallet',cost:'cost',description:'description',model_url:'model_url',tags:'tags',category:'category'}) -> take the model file from the user and thens end it to the firestore and then get its url and upload it to the database
// 2. Get all the entries from the database
// 3. Get the entry from the database by the model name
// 4. Get the entry from the database by categories
// 5. Purchasing model , transfer of model as NFT and payment to the seller as etherium on polygon network
// 6. Update the entry
// 7. Delete the entry

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
  getDownloadURL,
} = require("firebase-admin/storage");
const serviceAccount = require("./serviceAccountKey.json");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
const crypto = require("crypto"); // Import the crypto module

// import { use } from '@maticnetwork/maticjs'
// import { Web3ClientPlugin } from '@maticnetwork/maticjs-ethers'

// // install ethers plugin
// use(Web3ClientPlugin)
   
app.use(express.static(__dirname + '/views'));
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
  //   storageBucket: "gs://web3dland.appspot.com",
  storageBucket: "web3dland.appspot.com",
});

const db = getFirestore();
const storage = getStorage();

var model_bucket = storage.bucket();

// Test Route
app.get("/form", function (req, res) {
  res.sendFile('form.html', {
    root:__dirname+'/views/'
  });
});

// 1. Add an entry to the database
app.post("/add", upload.any(), (req, res) => {
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

    const options = { destination: model_file_filename };
    model_bucket.upload(model_file_path, options, (err, file) => {
      if (err) {
        console.log(err);
        return res.status(400).send("Error uploading file");
      }
      const image_url = `https://firebasestorage.googleapis.com/v0/b/${model_bucket.name}/o/${model_file_filename}?alt=media`;

      entry.model_url = image_url;
      var id = crypto.randomUUID().substring(2, 18);
      db.collection("models")
        .doc(id)
        .set(entry, { merge: true })
        .then((result) => {
          console.log(result);
          res.status(200).send("Entry added to database");
        });
    });
  } else {
    res.status(400).send("Invalid request body");
  }
});

// 2. Get all the entries from the database
app.get("/getAll", (req, res) => {
  db.collection("models")
    .get()
    .then((snapshot) => {
      var data = [];
      snapshot.forEach((doc) => {
        data.push(doc.data());
      });
      res.status(200).send(data);
    });
});

// 3. Get the entry from the database by the model name
app.get("/getByModelName/:model_name", (req, res) => {
  db.collection("models")
    .where("model_name", "==", req.params.model_name)
    .get()
    .then((snapshot) => {
      var data = [];
      snapshot.forEach((doc) => {
        data.push(doc.data());
      });
      res.status(200).send(data);
    });
});

// 4. Get the entry from the database by categories
app.get("/getByCategory/:category", (req, res) => {
  db.collection("models")
    .where("category", "==", req.params.category)
    .get()
    .then((snapshot) => {
      var data = [];
      snapshot.forEach((doc) => {
        data.push(doc.data());
      });
      res.status(200).send(data);
    });
});

// 5. Purchasing model , transfer of model as NFT and payment to the seller as etherium on polygon network
app.post("/purchase", (req, res) => {
    const { model_id, buyer_wallet } = req.body;

    // 1. Retrieve the model from the database
    db.collection("models")
        .doc(model_id)
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return res.status(404).send("Model not found");
            }

            const model = doc.data();
            console.log(model)
            // 2. Transfer the model as NFT to the buyer
            // TODO: Implement the logic to transfer the model as NFT

            // 3. Make payment to the seller as ethereum on polygon network
            // TODO: Implement the logic to make payment to the seller

            res.status(200).send("Purchase successful");
        })
        .catch((error) => {
            console.log(error);
            res.status(500).send("Internal server error");
        });
});

// 6. Update the entry
app.put("/update/:id", (req, res) => {
  if (req.body) {
    db.collection("models")
      .doc(req.params.id)
      .set(req.body, { merge: true })
      .then((result) => {
        console.log(result);
        res.status(200).send("Entry updated in database");
      });
  } else {
    res.status(400).send("Invalid request body");
  }
});


// 7. Delete the entry
app.delete("/delete/:id", (req, res) => {
  db.collection("models")
    .doc(req.params.id)
    .delete()
    .then((result) => {
      console.log(result);
      res.status(200).send("Entry deleted from database");
    });
});


app.get("/", function (req, res) {
  res.send("Hello World");
});

app.listen(3000, function () {
  console.log("Example app listening on port 3000!");
});
