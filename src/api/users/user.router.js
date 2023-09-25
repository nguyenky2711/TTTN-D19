const router = require("express").Router();
const { checkToken } = require("../../auth/token_validation");
const {
  createUser,
  login,
  getUserByUserId,
  getUsers,
  updateUsers,
  changeStatusUser
} = require("./user.controller");
router.get("/", checkToken, getUsers);
router.put("/", checkToken, changeStatusUser);

router.post("/", createUser);
router.post("/login", login);

router.get("/:id", checkToken, getUserByUserId);
router.put("/:id", checkToken, updateUsers);
// router.patch("/", checkToken, updateUsers);

module.exports = router;
