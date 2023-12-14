const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const sellerFetchuser = require('../middleware/sellerFecthuser');
const path = require('path');
const multer = require('multer');
const bp = require('body-parser');
const fs = require('fs');

const serverIP = `http://${process.env.SERVER_IP}:${process.env.PORT}`

// Increase the limit for request body to handle larger files
router.use(bp.json({ limit: '50mb' }));

// Increase the limit as needed

router.use(bp.urlencoded({ extended: true, limit: '50mb' }));

const productModel = require('../models/productModel');



// Storage setting

// const storage = multer.diskStorage({
//     destination: './public/upload',
//     filename: (req, file, cb) => {
//         const fileExtension = () => {
//             for (let index = 0; index <= file.length; index++) {
//                 const element = array[index];

//                 return `${path.extname(file.originalname).toLowerCase()}_${element}`;
//             }
//         }
//         const fileName = () => {
//             for (let index = 0; index <= file.length; index++) {
//                 const element = array[index];

//                 return `${req.user.id}_${index}`

//             }
//         }
//         const finalFileName = `${fileName}_${Date.now().toString()}${fileExtension}`
//         cb(null, finalFileName);
//     }
// })

// const upload = multer({
//     storage: storage,
//     fileFilter: (req, file, cb) => {
//         const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.webp',];
//         // find file extension 
//         const fileExtension = path.extname(file.originalname).toLowerCase();

//         // Varify fileextension based on logic
//         if (file.fieldname === 'images' && allowedImageExtensions.includes(fileExtension)) {
//             cb(null, true);
//         }
//         else {
//             cb(new Error('Invalid file type.'));
//         }
//     }
// })

const storage = multer.diskStorage({
    destination: './public/upload',
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const fileName = `${req.user.id}_${Date.now().toString()}${fileExtension}`;
        cb(null, fileName);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const fileExtension = path.extname(file.originalname).toLowerCase();

        if (allowedImageExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type.'));
        }
    }
});

// API 1: upload product

router.post('/upload', sellerFetchuser, upload.fields([{ name: 'images', maxCount: 5 }]), [
    body('productType', "Enter your product type").trim().isString().isLength(4),
    body('title', "Enter your title").trim().isLength({ min: 5 }),
    body('description', 'Enter your description').trim().isLength({ min: 10 }),
    body('qty', "Enter your quentity").trim().notEmpty(),
    body('price', "Enter your product price").trim().notEmpty(),
    body('color', "Enter your product color").optional().trim(),
], async (req, res) => {

    const { productType, title, description, qty, price, color } = req.body;
    const files = req.files; // Access uploaded files
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }
    try {

        const product = await productModel.create({
            user: req.user.id,
            productType,
            images: files.images.map(file => ({ filename: file.filename, path: file.path })),
            title,
            description,
            qty,
            price,
            color,
            // Add other fields as necessary
        });

        console.log(product);
        return res.status(200).json({ success: 'Product uploadsuccessfully' });
    } catch (error) {
    return res.status(500).json({ error});
    }
});



/*
     router.post('/upload', sellerFetchuser, upload.array('images', 5), async (req, res) => {
         const { productType, title, description, qty, price, color } = req.body;
         const files = req.files; // Access uploaded files
     
         // Check for validation errors and handle accordingly
         // ...
     
         try {
             // Save files and other data to MongoDB
             // Example: Saving files to MongoDB may require using GridFS for larger files
             const product = await productModel.create({
                 user: req.user.id,
                 productType,
                 images: files.map(file => ({ filename: file.filename, path: file.path })),
                 title,
                 description,
                 qty,
                 price,
                 color,
                 // Add other fields as necessary
               });
     
             return res.status(200).json({Success: 'Product upload successfully'});
         } catch (error) {
             return res.status(500).json({ error: error });
         }
     });

*/


// API : Fetch all product

router.get('/allproduct', async (req, res) => {
    try {
        const product = await productModel.find().populate('seller', 'sellername');
        return res.status(200).json(product)
    } catch (error) {
        return res.status(500).json({ error })
    }
})

module.exports = router;