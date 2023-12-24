const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtKey = process.env.JWT_SECRETE_KEY;
const router = express.Router();
const userModel = require('../models/user');
const varificationModel = require('../models/userVarification');
const fetchUser = require('../middleware/fetchuser');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);



// API 1: Registration API

router.post('/signin', [
    body('fname', "Enter your first name").trim().isLength({ min: 3 }),
    body('lname', "Enter your last name").trim().isLength({ min: 3 }),
    body('email', "Enter your email").trim().isEmail(),
    body('password', "Enter password").trim().isLength({ min: 8 }),
    body('countryCode', "Enter country code").trim().isLength({ min: 1, max: 3 }),
    body('phone', "Enter phone number").trim().isMobilePhone(),
    body('country', "Enter your country").trim().notEmpty()
], async (req, res) => {
    const { fname, lname, email, password, countryCode, phone, country } = req.body;
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() })
    }
    try {
        let user = await userModel.findOne({ email: email }) || await varificationModel.findOne({ email: email });
        if (user) {
            return res.status(400).json({ error: 'Sorry a user with this email already exits' })
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

        const createOtp = generateOTP(6);

        // Function to shuffle the characters in the OTP string
        function shuffleString(str) {
            const arr = str.split('');
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr.join('');
        }
        const varifyData = await varificationModel.create({
            fname,
            lname,
            email,
            password: hashPassword,
            country,
            countryCode,
            phone,
            otp: createOtp,
        });

        // Sent otp on the number

        client.messages.create({
            body: `Your otp is ${createOtp} for register ecommerce website`,
            from: '+14154948520',
            to: `+${countryCode}${phone}`
        });

        // client.messages.create({
        //     body: `Your otp is ${createOtp} for create ecommerce website`,
        //     from: '+14154948520',
        //     to: `+${countryCode}${phone}`
        // }).then(message => console.log(message.sid));

        return res.status(200).json({ id: varifyData._id, message: 'OTP send successfully' });

    } catch (error) {
        return res.status(500).json({ error: error });
    }
})


// API 2: Varify mobile number

router.post('/verifymobile', [
    body('otp', "Enter your 6 digit  otp").trim().isLength({ min: 6, max: 6 })
], async (req, res) => {
    const id = req.headers.id;
    const { otp } = req.body;
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() })
    }
    if (!id) {
        return res.status(400).send({ error: "ID not found" });
    }
    if (!otp) {
        return res.status(400).send({ error: 'OTP not found' });
    }
    try {
        const data = await varificationModel.findOne({ _id: id });
        if (!data) {
            return res.status(400).json({ error: 'User is not found' })
        }
        const isValidOtp = otp === data.otp;
        if (!isValidOtp) {
            return res.status(400).json({ error: "OTP didn't match" });
        }

        userData = await userModel.create({
            fname: data.fname,
            lname: data.lname,
            email: data.email,
            password: data.password,
            phone: data.phone,
            countryCode: data.countryCode,
            country: data.country,
            address: data.address,
        })
        const tokenPayload = {
            user: {
                id: userData.id,
            }
        };
        const authtoken = jwt.sign(tokenPayload, jwtKey);
        await varificationModel.findByIdAndDelete(id);
        return res.status(200).send({ authtoken });
    } catch (error) {
        return res.status(500).json({ error: error });
    }
})



// API 3: Login API

router.post('/login', [
    body('email', "Enter your email").trim().isEmail(),
    body('password', "Enter your password").trim().isLength({ min: 8 })
], async (req, res) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    const { email, password } = req.body;

    try {
        let user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Please try to login with valid credencials" });
        }
        const passCompare = await bcrypt.compare(password, user.password);
        if (!passCompare) {
            return res.status(400).json({ error: "Please try to login with correct credencials" });
        }

        const tokenPayload = {
            user: {
                id: user.id,
            }
        }
        const authtoken = jwt.sign(tokenPayload, jwtKey);
        return res.status(200).json({ authtoken });
    } catch (error) {
        return res.status(500).json({ error })
    }
})

// API 4: Get user data

router.get('/profile', fetchUser, async (req, res) => {
    try {
        const id = req.user.id;

        const profile = await userModel.findOne({ _id: id }).select('-password');
        return res.status(200).json({ data: profile });
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

// API 5: Add address

router.post('/addadress', fetchUser, [
    body('addressline', "Enter your address").trim().isLength({ min: 5 }),
    body('phone', "Enter your phone number").trim().isMobilePhone(),
    body('pinCode', "Enter your pin code").trim().isLength({ min: 6 }),
    body('district', "Enter your district").trim().isLength({ min: 5 }),
    body('stateName', "Enter your state").trim().isLength({ min: 3 })
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() })
    }
    try {
        const id = req.user.id;
        const { addressline, phone, pinCode, district, stateName } = req.body;
        let user = await userModel.findOne({ _id: id }).select('-password');

        const addressData = {
            addressline, phone, pinCode, district, stateName
        }
        user.address.push(addressData);
        let updateData = user.save()
        return res.status(200).json({ user: "Address upload successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

module.exports = router;
