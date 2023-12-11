const jwt = require('jsonwebtoken');
const userModel = require('../models/user');

const jwtKey = process.env.JWT_SECRETE_KEY;

const fetchuser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).json({ error: "Token not found" })
    }
    try {
        const data = jwt.verify(token, jwtKey);
        if (data) {
            const id = data.user.id;

            // Check if the user with the given ID exits in the user model
            const user = await userModel.findById(id);
            if (user) {
                req.user = user;
                return next();
            } else {
                return res.status(401).json({ error: 'User not available' });
            }
        }
    } catch (error) {
        return res.status(401).json({ error: 'Please authentication using a valid token' });
    }
}


module.exports = fetchuser;