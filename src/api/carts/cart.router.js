const router = require("express").Router();
const { checkToken } = require("../../auth/token_validation");
const {
    addProduct,
    getCartByUserId,
    deleteProduct,
    updateQuantity,
} = require("./cart.controller");
router.get("/", checkToken, getCartByUserId);
router.post("/", checkToken, addProduct);
router.delete("/", checkToken, deleteProduct);
router.put("/", checkToken, updateQuantity);

module.exports = router;