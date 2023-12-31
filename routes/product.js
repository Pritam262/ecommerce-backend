const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const sellerFetchuser = require('../middleware/sellerFecthuser');
const fetchUser = require('../middleware/fetchuser');
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
const cartProductModel = require('../models/cartProductModel');
const { error } = require('console');



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

router.post('/upload', sellerFetchuser, upload.fields([{ name: 'images', maxCount: 6 }]), [
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
            seller: req.user.id,
            productType,
            images: files.images.map(file => ({ filename: file.filename, path: file.path })),
            title,
            description,
            qty,
            price,
            color,
            // Add other fields as necessary
        });

        return res.status(200).json({ success: 'Product uploadsuccessfully' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
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


// API 2: Fetch all product

router.get('/allproduct', async (req, res) => {
    try {
        const page = req.query.page || 1; // Get the requested page number from the query
        const perPage = 20; // Number of item per page
        const allProduct = await productModel.find().skip((page - 1) * perPage).limit(perPage).populate('seller', 'sellername');
        const product = allProduct.map((item, index) => {
            return (
                {
                    id: item.id,
                    productType: item.productType,
                    imagePath: `http://127.0.0.1:3000/${item.images[0].path}`,
                    title: item.title,
                    description: item.description,
                    // qty: (item.qty < 15) ? item.qty : '',
                    qty: item.qty,
                    price: item.price,
                    color: item.color,
                    seller: {
                        id: item.seller._id,
                        sellerName: item.seller.sellername,
                    }
                }

            )
        })
        return res.status(200).json({ totalLength: allProduct.length, page: page, perPage, product })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

// API 3: Fetch specific product

router.get('/getproduct', async (req, res) => {
    const videoId = req.query.videoId;

    if (!videoId) {
        return res.status(400).json({ error: 'Product not found' })
    }
    try {
        const product = await productModel.findOne({ _id: videoId }).populate('seller', 'sellername');

        return res.status(200).json({ product });
    } catch (error) {
        return res.status(500).json({ error:error.message })
    }
})

// API 4: Delete product

router.delete('/deleteproduct', sellerFetchuser, async (req, res) => {

    const id = req.user.id;
    const videoId = req.header.id;
    try {
        if (!videoId) {
            return res.status(400).json({ error: 'Video id not found' })
        }
        let product = await productModel.findById(videoId);
        if (!product) { return res.status(404).send('File not found') };
        if (product.seller._id.toString() = req.user.id) {
            return res.status(401).json({ error: "User not allowed" });
        }
        product.images.map((item, index) => {
            fs.unlinkSync(`./${item.path}`)
        });
        const deleteProduct = await productModel.findByIdAndDelete(videoId);
        if (deleteProduct) {
            return res.status(200).json({ success: "Product delete successfully" })
        }

    } catch (error) {
        return res.status(500).json({ error :error.message });
    }
})


// API 5: Cart product

router.post('/cart', fetchUser, async (req, res) => {
    const productId = req.query.proId;

    const qty = req.body.qty;
    // const qty  = req.query.qty || 1;
    if (qty > 11) {
        return res.status(500).json({ error: 'Maximum order quentity riched' });
    }
    if (!productId) {
        return res.status(400).json({ error: 'Product id not found' })
    }
    try {

        const product = await productModel.findById(productId);

        const cartProduct = await cartProductModel.findOne({ product: productId });
        if (cartProduct) {

            // Update the document in Mongodb

            const user = req.user.id;
            const product = cartProduct.product;
            const upQty = (req.body.qty ? qty : cartProduct.qty + 1);

            cartProduct.user = user;
            cartProduct.product = product;
            cartProduct.qty = upQty;

            await cartProduct.save();


            return res.status(200).json({ success: "Cart update successfully" });
        } else {
            const response = await cartProductModel.create({
                user: req.user.id,
                product: product._id,
                qty: qty,
            });

            return res.status(200).json({ success: response });
        }

        // return res.status(200).send({ qty: qty })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})


// API 6: See all cart product,

router.get('/cartproduct', fetchUser, async (req, res) => {
    try {
        const products = await cartProductModel.find({ user: req.user.id }).populate('product', 'title images price');

        let totalPrice = 0;
        let totalLength = 0;
        const allCartproducts = products.map((item, index) => {
            totalPrice = (totalPrice + (item.qty * item.product.price));
            totalLength= (totalLength + item.qty);
            return ({
                id: item._id,
                user: item.user,
                productId: item.product._id,
                title: item.product.title,
                imageUrl: `http://127.0.0.1:3000/${item.product.images[0].path}`,
                qty: item.qty,
                price: item.product.price,
                proTotalPrice: (item.qty * item.product.price),
            }
            )
        })

        return res.status(200).json({ products: allCartproducts, totalPrice, totalLength });
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

// API 7: Delete cart product

router.delete('/deletecart', fetchUser, async (req, res) => {

    const cartId = req.query.cartId;
    if (!cartId) {
        return res.status(400).json({ error: "Cart id not found" });
    }
    try {

        const cart = await cartProductModel.findById(cartId);
        if (!cart) {
            return res.status(400).json({ error: "Cart product not found" });
        }
        if (cart.user != req.user.id) {
            return res.status(400).json({ error: "User isn't allow" });
        }
        await cartProductModel.findByIdAndDelete(cartId);
        return res.status(200).json({ error: 'Product delete successfully' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
})
module.exports = router;