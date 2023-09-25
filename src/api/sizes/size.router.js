const router = require("express").Router();
const { checkToken } = require("../../auth/token_validation");
const {
    createSize,
    getSizeById,
    getSizes,
    updateSize,
} = require("./size.controller");
router.get("/", getSizes);
router.post("/", checkToken, createSize);
router.get("/:id", getSizeById);
router.put("/:id", checkToken, updateSize);
module.exports = router;