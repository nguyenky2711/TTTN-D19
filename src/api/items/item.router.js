const router = require("express").Router();
const { checkToken } = require("../../auth/token_validation");
const {
    createItem,
    getItemByItemId,
    getItems,
    changeStatusItem,
    updateItem,
    createReceipt,
    getProducts,
    getProductsById,
    updateThingById,
    filterThingByName,
    filterProductByName,
    deleteItem,
} = require("./item.controller");
router.get("/", getItems);
router.get("/:id", getItemByItemId);
router.post("/", createItem);
router.patch("/ahihi", checkToken, createReceipt);
router.get("/product", getProducts);
router.get("/product/filter", filterProductByName);
router.get("/product/:id", getProductsById);
router.put("/:id", checkToken, updateItem);
router.post("/:id", checkToken, deleteItem);
// router.patch("/", checkToken, changeStatusItem);
router.patch("/update/thing/:id", checkToken, updateThingById)
module.exports = router;