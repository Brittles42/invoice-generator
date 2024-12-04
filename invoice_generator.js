const express = require('express');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb) {
    cb(null, 'work-image-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Express setup
const app = express();
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
 