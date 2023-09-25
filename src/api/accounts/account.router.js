const router = require("express").Router();
const { checkToken } = require("../../auth/token_validation");
const {
    confirmUser, requestRefreshToken, login, createUser, logout, changePassword, handleRequest, resetPassword,
} = require("./account.controller");
router.get("/confirm/:token", confirmUser);
router.post("/refresh", requestRefreshToken);
router.post("/login", login);
router.post("/register", createUser);
router.post("/logout", checkToken, logout);
router.put("/changePassword", checkToken, changePassword);
router.post("/resetPassword/request", handleRequest);
router.post("/resetPassword/reset", resetPassword);

module.exports = router;
