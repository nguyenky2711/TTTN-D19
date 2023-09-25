require('dotenv').config();
const {
  getUserByUserEmail,
  getUserByUserId,
  getUsers,
  updateUser,
  changeStatusUser,
  getStatusDTO,
  createUser
} = require("./user.service");
const {
  sendConfirmationEmail
} = require('../../utils/mail')
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const { sign } = require("jsonwebtoken");
const formidable = require("formidable");
const nodemailer = require('nodemailer');
const crypto = require('crypto');

module.exports = {
  createUser: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: 0,
          message: "Error parsing form data"
        });
      }

      const body = fields;
      const password = body.password.toString(); // Convert password to string if it's not already
      const salt = genSaltSync(10).toString(); // Convert salt to string

      body.password = hashSync(password, salt);
      body.email = body.email.toString();
      body.name = body.name.toString();
      body.address = body.address.toString();
      body.phone = body.phone.toString();

      try {
        const existingUser = await getUserByUserEmail(body.email);

        if (existingUser) {
          return res.status(400).json({
            success: 0,
            message: "Email already exists. Please use a different email address."
          });
        }
        const activeToken = crypto.randomBytes(20).toString('hex');
        body.activeToken = activeToken;
        body.confirm = false;

        const userID = await createUser(body);

        const confirmationLink = `http://localhost:4000/api/confirm/${activeToken}`;
        sendConfirmationEmail(body.email, confirmationLink);

        return res.status(200).json({
          success: 1,
          message: "User created successfully",
          data: {
            userID
          }
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          success: 0,
          message: "Database connection error"
        });
      }
    });
  },

  login: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: "Error parsing form data"
        });
      }

      const body = fields;
      body.password = body.password.toString(); // Convert password to string if it's not already
      body.email = body.email.toString();
      try {
        const user = await getUserByUserEmail(body.email);
        if (!user) {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password"
          });
        }
        if (!user.confirm) {
          return res.status(401).json({
            success: false,
            message: "Account is not confirmed"
          });
        }
        if (user.status_id == 2)
          return res.status(401).json({
            success: false,
            message: "Account has been locked"
          });
        const passwordMatch = compareSync(body.password, user.password);
        if (passwordMatch) {
          const token = sign({ userId: user.id, role: user.role }, process.env.JWT_KEY, {
            expiresIn: "1h"
          });
          const refreshToken = sign({ userId: user.id, role: user.role }, process.env.JWT_REFRESH_KEY, {
            expiresIn: "1w"
          });
          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            path: '/',
            sameSite: 'strict'
          })
          const { password, ...userData } = user; // Exclude password from the response
          return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
              userDTO: userData
            }
          });
        } else {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password"
          });
        }
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          success: false,
          message: "Something went wrong"
        });
      }
    });
  },
  getUserByUserId: async (req, res) => {
    const id = req.params.id;
    const userID = req.decoded.userId;
    // console.log(req.decoded.userId)
    try {
      if (id != userID) {
        return res.status(403).json({
          success: 0,
          message: "Access denied. You are not authorized to view this user's data.",
        });
      }
      const user = await getUserByUserId(id); // Assuming getUserByUserId is an asynchronous function that returns a promise
      if (!user) {
        return res.json({
          success: 0,
          message: "Record not found",
        });
      }
      const userDTO = { ...user };
      delete userDTO.password;
      console.log(userDTO)
      // user.password = undefined;
      return res.json({
        success: 1,
        data: {
          userDTO,
          role: user.role
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: 0,
        message: "Something went wrong",
      });
    }
  },

  getUsers: async (req, res) => {
    const no = req.query.no ? Number(req.query.no) : 0
    const limit = req.query.limit ? Number(req.query.limit) : 100
    const role = req.decoded.role;
    if (role != 'admin') {
      return res.status(403).json({
        success: 0,
        message: "Access denied. You are not authorized to get user's data.",
      });
    }
    try {
      const result = await getUsers();
      let list = []
      for (index in result) {
        const { id, status_id, ...rest } = result[index];
        const statusDTO = await getStatusDTO(status_id)
        const temp = {
          id,
          ...rest,
          statusDTO: statusDTO
        }
        list.push(temp)
      }
      const totalPages = Math.ceil(list.length / limit);
      const startIndex = no * limit;
      const endIndex = startIndex + limit;
      const paginatedData = list.slice(startIndex, endIndex);
      // console.log(paginatedData)
      return res.json({
        success: 1,
        totalPages: totalPages,
        totalItem: list.length,
        no: no,
        limit: limit,
        data: paginatedData
      })
    } catch (error) {
      return res.json({
        success: 0,
        data: 'Something wrong'
      });
    }

  },
  updateUsers: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: 0,
          message: "Error parsing form data"
        });
      }

      const id = req.params.id;
      const body = fields;
      const userID = req.decoded.userId;
      console.log(req.decoded)
      body.name = body.name.toString();
      body.address = body.address.toString();
      body.phone = body.phone.toString();
      try {
        if (id != userID) {
          return res.status(403).json({
            success: 0,
            message: "Access denied. You are not authorized to update this user's data.",
          });
        }
        // const salt = genSaltSync(10);
        // body.password = hashSync(body.password, salt);
        delete body.password;

        await updateUser(id, body);

        return res.json({
          success: 1,
          message: "Updated successfully"
        });
      } catch (error) {
        // console.error(error);
        return res.status(500).json({
          success: 0,
          message: "Something went wrong"
        });
      }
    });

  },

  changeStatusUser: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: 0,
          message: "Error parsing form data"
        });
      }
      const role = req.decoded.role;
      const data = fields;
      data.status_id = data.status_id.toString();
      data.user_id = data.user_id.toString();
      if (role !== 'admin') {
        return res.status(403).json({
          success: 0,
          message: "Access Denied"
        });
      }

      try {
        const result = await changeStatusUser(data);

        if (!result) {
          return res.status(404).json({
            success: 0,
            message: "Record Not Found"
          });
        }

        return res.status(200).json({
          success: 1,
          message: "User status changed successfully"
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          success: 0,
          message: "Something went wrong"
        });
      }
    });

  }
};
