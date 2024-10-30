// upload.js
const multer = require('multer');
const path = require('path');

// Configure storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ensure this folder exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Create a unique filename
    }
});

// Use multer to handle multiple file uploads
const upload = multer({ storage: storage }).fields([{ name: 'image', maxCount: 3 }]);

module.exports = upload;
