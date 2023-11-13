
const errorCodes = require('../errorMessages');
const { verify } = require("jsonwebtoken");
require('dotenv').config();
module.exports = {
  checkToken: (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({
        success: 0,
        message: errorCodes.UNAUTHORIZED_USER,
      });
    }

    // Remove "Bearer " from the token string
    const tokenValue = token.replace("Bearer ", "");
    try {
      const decoded = verify(tokenValue, process.env.JWT_KEY);
      req.decoded = decoded;
      // console.log(req.decoded)
      next();
    } catch (error) {
      return res.status(401).json({
        success: 0,
        message: errorCodes.INVALID_TOKEN,
      });
    }
  },
};
