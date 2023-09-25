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
    updateDiscount,
    createDiscount,
    getDiscountById,
    getPaymentById,
    statisticOrdersByTime,
    statisticOrdersByTimeWithItemId,
} = require("./order.controller");
// router.get("/", getItems);
router.post("/", checkToken, createOrder);
router.get("/", checkToken, getOrders);
router.get("/payment", getPayments);
router.get("/discount", getDiscounts);
router.get("/statistic", checkToken, statisticOrdersByTime);
router.get("/statistic/:id", checkToken, statisticOrdersByTimeWithItemId);
router.get("/:id", checkToken, getOrderDetailByUser);
router.put("/:id", checkToken, changeStatusOrder);
router.get("/discount/:id", getDiscountById);
router.get("/payment/:id", getPaymentById);
router.put("/discount/:id", checkToken, updateDiscount);
router.post("/discount/", checkToken, createDiscount);




module.exports = router;