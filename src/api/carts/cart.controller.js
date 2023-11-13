require('dotenv').config();
const errorCodes = require('../../errorMessages');

const {
    addProduct,
    getCartByUserId,
    checkExistProduct,
    getStatusDTO,
    deleteProduct,
    updateQuantity
} = require("./cart.service");
const formidable = require("formidable");
const moment = require("moment");
const { getProductById } = require('../products/product.service');
module.exports = {
    addProduct: async (req, res) => {
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
            const user_id = req.decoded.userId;
            const product_id = body.product_id.toString();
            const quantity = body.quantity.toString();
            const data = {
                product_id: product_id,
                user_id: user_id,
                quantity: quantity
            };
            try {
                const isExist = await checkExistProduct(data);

                if (isExist) {
                    return res.json({
                        success: 0,
                        message: errorCodes.PRODUCT_ALREADY_EXISTS_IN_CART
                    });
                }

                const result = await addProduct(data);

                return res.json({
                    success: 1,
                    data: result
                });
            } catch (error) {
                return res.json({
                    success: 0,
                    message: errorCodes.DATABASE_CONNECTION_ERROR
                });
            }
        });
    },
    getCartByUserId: async (req, res) => {
        const user_id = req.decoded.userId;
        const no = req.query.no ? Number(req.query.no) : 0
        const limit = req.query.limit ? Number(req.query.limit) : 100
        // console.log(req.decoded.userId)
        try {
            const cart = await getCartByUserId(user_id); // Assuming getUserByUserId is an asynchronous function that returns a promise

            if (!cart) {
                return res.json({
                    success: 0,
                    message: errorCodes.RECORD_NOT_FOUND,
                });
            }
            let list = []
            let subTotal = 0
            for (index in cart) {
                const { product_id, ...cartData } = cart[index];
                const productDTO = await getProductById(product_id)
                const cartDTO = { productDTO, ...cartData };
                list.push(cartDTO)
            }
            for (index in list) {
                subTotal += (list[index].productDTO.priceDTO[0].discounted_price * list[index].quantity)
            }

            const totalPages = Math.ceil(list.length / limit);
            const startIndex = no * limit;
            const endIndex = startIndex + limit;
            const paginatedData = list.slice(startIndex, endIndex);
            return res.json({
                success: 1,
                totalPages: totalPages,
                totalItem: list.length,
                no: no,
                limit: limit,
                cartDTO: {
                    list: paginatedData,
                    subTotal
                }
            })

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: 0,
                message: errorCodes.DATABASE_CONNECTION_ERROR,
            });
        }
    },
    deleteProduct: async (req, res) => {
        const product_id = req.query.product_id;
        const user_id = req.decoded.userId;
        const data = {
            product_id: product_id,
            user_id: user_id
        };


        try {
            const result = await deleteProduct(data);

            return res.json({
                success: 1,
                message: errorCodes.DELETE_PROUDCT_FROM_CART_SUCCESS,
                data: result
            });
        } catch (error) {
            return res.json({
                success: 0,
                message: errorCodes.DATABASE_CONNECTION_ERROR
            });
        }
    },
    updateQuantity: async (req, res) => {
        const user_id = req.decoded.userId;
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
            const role = req.decoded.role;
            const data = {
                user_id: user_id,
                product_id: parseInt(body.product_id.toString()),
                quantity: parseInt(body.quantity.toString())
            }
            try {

                const result = await updateQuantity(data);
                return res.status(200).json({
                    success: 1,
                    message: errorCodes.UPDATE_CART_SUCCESSFULLY,
                    data: {
                        result
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
};