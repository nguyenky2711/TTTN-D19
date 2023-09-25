const router = require("express").Router();
const { checkToken } = require("../../auth/token_validation");
const {
    createOrder,
    getOrders,
    getOrdersByUser,
    changeStatusOrder,
    getOrderDetailByUser,
    getPayments,
    getDiscounts,
} = require("./statistic.controller");
// router.get("/", getItems);
router.post("/", checkToken, createOrder);
router.get("/", checkToken, getOrders);
router.get("/payment", getPayments);
router.get("/discount", getDiscounts);
// router.get("/user", checkToken, getOrdersByUser);
router.get("/:id", checkToken, getOrderDetailByUser);
router.put("/:id", checkToken, changeStatusOrder);




module.exports = router;