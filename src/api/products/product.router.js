const router = require("express").Router();
const { checkToken } = require("../../auth/token_validation");
const { getProducts, getProductById, createProduct, getProductByItemId, createImport, getProductsForImport, updateSize, updatePrice, createDiscount, updateDiscount, getDiscounts, getDiscountById } = require("./product.controller");
router.get("/", getProducts);
router.get("/import", getProductsForImport);
router.get("/discount", checkToken, getDiscounts);

router.get("/:id", getProductById);
router.get("/items/:id", getProductByItemId);
router.get("/discount/:id", getDiscountById);
router.post("/", checkToken, createProduct);
router.post("/import", checkToken, createImport);
router.put("/size/:id", checkToken, updateSize);
router.put("/price/:id", checkToken, updatePrice);
router.post("/discount", checkToken, createDiscount);
router.put("/discount/:id", checkToken, updateDiscount);
module.exports = router;