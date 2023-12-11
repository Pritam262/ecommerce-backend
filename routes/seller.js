const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const sellerModel = require('../models/SellerModel');
const router = express.Router();
const SellerVarificaton = require("../models/SellerVarification");
const jwtKey = process.env.JWT_SECRETE_KEY;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

router.post('/signin', [
    body('sellername', "Enter your brand name").trim().isLength({ min: 3, max: 10 }),
    body('email', "Enter your email").trim().isEmail(),
    body('password', "Enter your password").trim().isLength({ min: 8 }),
    body('phone', "Enter your phone number").trim().isMobilePhone(),
    body('countryCode', "Enter your country code").trim().isLength({ min: 1, max: 3 }),
    body('country', "Enter your country").trim().isLength({ min: 4, max: 15 }),
    body('pin', "Enter your pin code").trim().isLength({ min: 6 }),
    body('address', "Enter your address").trim().isLength({ min: 3 }),
], async (req, res) => {
    const { sellername, email, password, phone, countryCode, country, pin, address } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }
    try {

        let user = await sellerModel.findOne({ email: email }) || await SellerVarificaton.findOne({ email: email });

        if (user) {
            return res.status(400).json({ error: "An user already register with this email" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // Generate otp 

        function generateOTP(length) {
            const numCount = 2; // Minimum count of numeric characters
            const alphaCount = 2; // Minimum count of alphabetic characters

            // Characters to use in the OTP
            const numericCharacters = '0123456789';
            const alphaCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

            let OTP = '';

            // Generate minimum required numeric characters
            for (let i = 0; i < numCount; i++) {
                OTP += numericCharacters.charAt(Math.floor(Math.random() * numericCharacters.length));
            }

            // Generate minimum required alphabetic characters
            for (let i = 0; i < alphaCount; i++) {
                OTP += alphaCharacters.charAt(Math.floor(Math.random() * alphaCharacters.length));
            }

            // Generate remaining characters randomly
            const remainingLength = length - (numCount + alphaCount);
            const characters = numericCharacters + alphaCharacters;

            for (let i = 0; i < remainingLength; i++) {
                OTP += characters.charAt(Math.floor(Math.random() * characters.length));
            }

            // Shuffle the OTP characters to randomize their positions
            OTP = shuffleString(OTP);

            return OTP;
        }

                // Function to shuffle the characters in the OTP string
                function shuffleString(str) {
                    const arr = str.split('');
                    for (let i = arr.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [arr[i], arr[j]] = [arr[j], arr[i]];
                    }
                    return arr.join('');
                }
        const createOtp = generateOTP(6);

        const userData = await SellerVarificaton.create({
            sellername, email, password: hashPassword, phone, countryCode, country, pin, address, otp: createOtp
        });

        // Sent otp on the number

        client.messages.create({
            body: `Your otp is ${createOtp} to become a sellers on ecommerce website`,
            from: '+14154948520',
            to: `+${countryCode}${phone}`
        });


        return res.status(200).json({ id: userData._id, message: "OTP send on your mobile number" });
    } catch (error) {
        return res.status(500).json({ error });
    }
})


//API 2:  Varify mobile number

router.post('/verifymobile', [
    body('otp', "Enter your 6 digit otp").trim().isLength({ min: 6, max: 6 })
], async (req, res) => {

    const id = req.headers.id;
    const { otp } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() })
    }

    if (!id) {
        return res.status(400).json({ message: 'ID not found' });
    }
    try {

        const data = await SellerVarificaton.findOne({ _id: id });

        if (!data) {
            return res.status(400).json({ message: "User not found" })
        }

        if (otp != data.otp) {
            return res.status(400).json({ message: "OTP didn't match" });
        }

        userData = await sellerModel.create({
            sellername:data.sellername, email:data.email, password:data.password, phone:data.phone, countryCode:data.countryCode, country:data.country, pin:data.pin, address:data.address,
        });

        const tokenPayload = {
            user: {
                id: userData.id,
            }
        }

        await SellerVarificaton.findByIdAndDelete(id);
        const authtoken = jwt.sign(tokenPayload, jwtKey);

        return res.status(200).json({ authtoken })

    } catch (error) {
        return res.status(500).json({ error });
    }
})



// API 3: Login API

router.post('/login', [
    body('email', "Enter your email").trim().isEmail(),
    body('password', 'Enter your password').trim().isLength({ min: 8 })
], async (req, res) => {

    const { email, password } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.json({ error: errors.array() });
    }

    try {

        const user = await sellerModel.findOne({ email });

        const comPassword = await bcrypt.compare(password, user.password);

        if (!comPassword) {
            return res.status(400).json({ message: "Enter a valid credencials" });
        }

        const tokenPayload = {
            user: {
                id: user.id,
            }
        }
        const authtoken = jwt.sign(tokenPayload, jwtKey);
        return res.status(200).json({ authtoken });

    } catch (error) {
        return res.status(500).json({ error });
    }
})





module.exports = router;