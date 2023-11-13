require('dotenv').config();
const errorCodes = require('../../errorMessages');
const { confirmUser, getUserByConfirmationToken, createUser, getUserByUserEmail, changePassword, updateResetToken, resetPassword, getUserByResetToken, getUserByUserId } = require("./account.service");
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const { sign, verify } = require("jsonwebtoken");
const formidable = require("formidable");
const { sendConfirmationEmail, sendResetPasswordEmail } = require('../../utils/mail');
const crypto = require('crypto');

let refreshTokens = []
module.exports = {
    confirmUser: async (req, res) => {
        const token = req.params.token;
        try {
            // Find the user in your database by the confirmation token
            const user = await getUserByConfirmationToken(token);

            if (user) {
                // Validate the confirmation token
                if (user.activeToken === token) {
                    // Mark the user account as active
                    user.confirm = true;

                    // Update the user account in your database
                    await confirmUser(user);

                    const loginLink = `http://localhost:3000/login`;
                    return res.redirect(loginLink);

                } else {
                    return res.status(400).json({
                        success: false,
                        message: errorCodes.INVALID_OR_EXPIRED_CONFIRMATION_TOKEN
                    });

                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: errorCodes.INVALID_OR_EXPIRED_CONFIRMATION_TOKEN
                });

            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: 0,
                message: errorCodes.DATABASE_CONNECTION_ERROR
            });
        }
    },
    requestRefreshToken: async (req, res) => {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) return res.status(401).json("You're not authenticatied")
        if (!refreshTokens.includes(refreshToken)) {
            return res.status(403).json("Refresh token is not valid")
        }
        verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
            if (err) {
                console.log(err)
            }
            refreshTokens = refreshTokens.filter((token) => token !== refreshToken)
            const newToken = sign({ userId: user.id, role: user.role }, process.env.JWT_KEY, {
                expiresIn: "1h"
            });
            const newRefreshToken = sign({ userId: user.id, role: user.role }, process.env.JWT_REFRESH_KEY, {
                expiresIn: "1w"
            });
            refreshTokens.push(newRefreshToken)
            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: false,
                path: '/',
                sameSite: 'strict'
            })
            res.status(200).json({ token: newToken })
        })
    },
    createUser: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: 0,
                    message: errorCodes.FORM_DATA_PARSE_ERROR
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
                        message: errorCodes.EMAIL_ALREADY_EXISTS
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
                    message: errorCodes.USER_CREATED_SUCCESSFULLY,
                    data: {
                        userID
                    }
                });
            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    success: 0,
                    message: errorCodes.DATABASE_CONNECTION_ERROR
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
                    message: errorCodes.FORM_DATA_PARSE_ERROR
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
                        message: errorCodes.EMAIL_PASSWORD_INVALID
                    });
                }
                if (!user.confirm) {
                    return res.status(401).json({
                        success: false,
                        message: errorCodes.ACCOUNT_NOT_CONFIRMED
                    });
                }
                if (user.status_id == 2) {
                    return res.status(401).json({
                        success: false,
                        message: errorCodes.YOUR_ACCOUNT_LOCKED,
                    });
                }
                const passwordMatch = compareSync(body.password, user.password);
                if (passwordMatch) {
                    const token = sign({ userId: user.id, role: user.role }, process.env.JWT_KEY, {
                        expiresIn: "1h"
                    });
                    const refreshToken = sign({ userId: user.id, role: user.role }, process.env.JWT_REFRESH_KEY, {
                        expiresIn: "1w"
                    });
                    refreshTokens.push(refreshToken)
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
    logout: async (req, res) => {
        res.clearCookie("refreshToken")
        refreshTokens = refreshTokens.filter((token) => token !== res.cookies.refreshToken)
        res.status(200).json("Logged out!")
    },
    changePassword: async (req, res) => {
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
            const userId = req.decoded.userId
            try {
                const user = await getUserByUserId(userId);

                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }
                const passwordMatch = compareSync(body.oldPassword[0], user.password);

                if (!passwordMatch) {
                    return res.status(401).json({
                        success: false,
                        message: "Current password is incorrect"
                    });
                }

                const salt = genSaltSync(10).toString();
                const hashedPassword = hashSync(body.newPassword[0], salt);

                // Update the user's password in the database
                user.password = hashedPassword;
                const data = {
                    id: req.decoded.userId,
                    password: hashedPassword,
                }
                await changePassword(data);

                return res.status(200).json({
                    success: true,
                    message: "Password changed successfully"
                });
            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    success: false,
                    message: "Something went wrong"
                });
            }
        });
    },
    handleRequest: async (req, res) => {
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
            try {
                const user = await getUserByUserEmail(body.email[0]);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }
                if (!user.confirm) {
                    return res.status(401).json({
                        success: false,
                        message: "Account is not confirmed"
                    });
                }
                // Generate a reset token and set an expiration time (e.g., 1 hour)
                const resetToken = crypto.randomBytes(20).toString('hex');
                const resetExpiration = Date.now() + 3600000; // Token expires in 1 hour

                // Save the reset token and expiration in the user record in the database
                user.resetToken = resetToken;
                user.resetExpiration = resetExpiration;
                const data = {
                    resetToken: resetToken,
                    resetExpiration: resetExpiration,
                    email: body.email[0],
                }
                await updateResetToken(data)
                // Send the reset password email to the user
                const resetLink = `http://localhost:3000/resetPassword/reset/${resetToken}`;
                sendResetPasswordEmail(body.email[0], resetLink);

                return res.status(200).json({
                    success: true,
                    message: "Password reset email sent successfully"
                });
            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    success: false,
                    message: "Something went wrong"
                });
            }
        });
    },
    resetPassword: async (req, res) => {
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
            try {
                const user = await getUserByResetToken(body.resetToken[0]);
                if (!user) {
                    return res.status(404).json({
                        success: 0,
                        message: "User not found"
                    });
                }
                if (!user.confirm) {
                    return res.status(401).json({
                        success: 0,
                        message: "Account is not confirmed"
                    });
                }
                if (user) {
                    // Check if the reset token is still valid (not expired)
                    if (user.resetExpiration > Date.now()) {
                        // Update the user's password with the new password
                        const salt = genSaltSync(10).toString();
                        const hashedPassword = hashSync(body.newPassword[0], salt);
                        const data = {
                            password: hashedPassword,
                            resetToken: null,
                            resetExpiration: null,
                            id: user.id
                        }
                        await resetPassword(data)

                        return res.status(200).json({
                            success: true,
                            message: "Password updated successfully"
                        });
                    } else {
                        return res.status(401).json({
                            success: false,
                            message: "Reset token has expired. Please request a new password reset."
                        });
                    }
                } else {
                    return res.status(404).json({
                        success: false,
                        message: "Invalid reset token."
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

};
