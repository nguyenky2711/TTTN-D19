require('dotenv').config();
const {
    createTableOrder, createDetailOrder, getOrders, getPaymentById, getDiscountById, getOrderDetailById, getOrdersByUser, getOrderById, changeStatusOrder, getStockById, updateProductStock, returnProductStock, getPayments, getDiscounts
} = require("./statistic.service");
const formidable = require("formidable");
const connection = require("../../config/database");
const moment = require("moment");
const { getStatusDTO, updateProduct } = require('../items/item.service');
const { updateStatusCart, deleteProduct } = require('../carts/cart.service');
const { getStockByProductId, getProductById } = require('../products/product.service');
module.exports = {
    createOrder: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: 0,
                    message: "Error parsing form data"
                });
            }
            const body = fields;
            created_at = moment(new Date()).format('yyyy-MM-DD')
            created_by = req.decoded.userId
            const table = {
                created_at,
                created_by,
                payment_id: parseInt(body.payment_id.toString()),
                discount_id: parseInt(body.discount_id.toString()),
                total: parseFloat(body.total.toString()),
                receiver_name: body.receiver_name.toString(),
                receiver_phone: body.receiver_phone.toString(),
                receiver_address: body.receiver_address.toString(),
                // status_id: parseInt(body.status_id.toString()),
            }
            try {
                const order_detail = JSON.parse(body.order_detail)

                const listOrder_detail = []

                for (index in order_detail) {
                    const inventoryItem = await getStockByProductId(order_detail[index].product_id)
                    if (inventoryItem.stock == 0) {
                        return res.status(403).json({
                            success: 0,
                            message: "Out of stock"
                        });
                    } else if (inventoryItem == undefined) {
                        return res.status(403).json({
                            success: 0,
                            message: "Product not found in inventory"
                        });
                    } else if (inventoryItem.stock < order_detail[index].quantity) {
                        return res.status(403).json({
                            success: 0,
                            message: "Ordered quantity exceeds available stock."
                        });
                    }

                }
                const orderId = await createTableOrder(table)

                for (index in order_detail) {
                    const detail = {
                        product_id: order_detail[index].product_id,
                        order_id: orderId,
                        quantity: order_detail[index].quantity,
                        sum: order_detail[index].sum
                    }
                    const cart = {
                        product_id: order_detail[index].product_id,
                        user_id: req.decoded.userId
                    }
                    const idDetail = await createDetailOrder(detail)
                    const deleteCartItem = await deleteProduct(cart)
                    const result = await updateProductStock(idDetail)
                    listOrder_detail.push(result)
                }

                return res.status(200).json({
                    success: 1,
                    message: "Order created successfully",

                });
            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    success: 0,
                    message: "Database connection error"
                });
            }
        });
    },
    getOrders: async (req, res) => {
        const role = req.decoded.role
        const userId = req.decoded.userId
        const statusId = req.query.status_id
        if (role == 'admin') {
            try {
                const result = await getOrders(statusId);
                let newResult = []
                for (index in result) {
                    const { payment_id, discount_id, status_id, ...resultData } = result[index];
                    const paymentDTO = await getPaymentById(payment_id);
                    const discountDTO = await getDiscountById(discount_id);
                    const statusDTO = await getStatusDTO(status_id);
                    const order_detailDTO = await getOrderDetailById(result[index].id);
                    const tempObject = {
                        ...resultData,
                        order_detailDTO: order_detailDTO,
                        statusDTO: statusDTO,
                        paymentDTO: paymentDTO,
                        discountDTO: discountDTO,
                    }
                    newResult.push(tempObject);
                }
                console.log(newResult)
                return res.json({
                    success: 1,
                    data: newResult
                })
            } catch (error) {
                return res.json({
                    success: 0,
                    data: 'Something wrong'
                });
            }
        } else {
            try {
                const result = await getOrdersByUser(userId, statusId);
                let newResult = []
                for (index in result) {
                    const { payment_id, discount_id, status_id, created_by, created_at, ...resultData } = result[index];
                    const paymentDTO = await getPaymentById(payment_id);
                    const discountDTO = await getDiscountById(discount_id);
                    const statusDTO = await getStatusDTO(status_id);
                    const order_detailDTO = await getOrderDetailById(result[index].id);
                    const newTime = moment(new Date(created_at)).format('yyyy-MM-DD');
                    // let order_detailDTO = []
                    // for (index in order_detail) {
                    //     const { product_id, ...data } = order_detail[index]

                    //     const productDTO = await getProductById(product_id)
                    //     const newDTO = {
                    //         ...data,
                    //         productDTO
                    //     }
                    //     order_detailDTO.push(newDTO)
                    // }
                    const tempObject = {
                        ...resultData,
                        order_detailDTO: order_detailDTO,
                        statusDTO: statusDTO,
                        paymentDTO: paymentDTO,
                        discountDTO: discountDTO,
                        created_at: newTime
                    }
                    console.log(tempObject)
                    newResult.push(tempObject);
                }
                // console.log(newResult)
                return res.json({
                    success: 1,
                    data: newResult
                })
            } catch (error) {
                return res.json({
                    success: 0,
                    data: 'Something wrong'
                });
            }
        }
    },
    getOrdersByUser: async (req, res) => {
        const userId = req.decoded.userId
        try {
            const result = await getOrdersByUser(userId);
            let newResult = []
            for (index in result) {
                const { payment_id, discount_id, status_id, created_by, ...resultData } = result[index];
                const paymentDTO = await getPaymentById(payment_id);
                const discountDTO = await getDiscountById(discount_id);
                const statusDTO = await getStatusDTO(status_id);
                const order_detailDTO = await getOrderDetailById(result[index].id);
                // let order_detailDTO = []
                // for (index in order_detail) {
                //     const { product_id, ...data } = order_detail[index]

                //     const productDTO = await getProductById(product_id)
                //     const newDTO = {
                //         ...data,
                //         productDTO
                //     }
                //     order_detailDTO.push(newDTO)
                // }
                const tempObject = {
                    ...resultData,
                    order_detailDTO: order_detailDTO,
                    statusDTO: statusDTO,
                    paymentDTO: paymentDTO,
                    discountDTO: discountDTO,
                }
                newResult.push(tempObject);
            }
            // console.log(newResult)
            return res.json({
                success: 1,
                data: newResult
            })
        } catch (error) {
            return res.json({
                success: 0,
                data: 'Something wrong'
            });
        }
    },
    getOrderDetailByUser: async (req, res) => {
        const userId = req.decoded.userId
        const role = req.decoded.role
        const orderId = req.params.id
        const orderData = await getOrderById(orderId)
        if (orderData?.created_by != userId && role != 'admin') {
            return res.status(403).json({ error: "Unauthorized to perform this action." });
        }
        try {
            const result = await getOrderDetailById(orderId);
            let newResult = []
            if (role != 'admin') {
                for (index in result) {
                    const { order_id, product_id, ...resultData } = result[index];
                    const productData = await getProductById(product_id);
                    const { stockDTO, ...productDTO } = productData;
                    const tempObject = {
                        ...resultData,
                        productDTO: productDTO,
                    }
                    newResult.push(tempObject);
                }
            } else {
                for (index in result) {
                    const { order_id, product_id, ...resultData } = result[index];
                    const productDTO = await getProductById(product_id);
                    const tempObject = {
                        ...resultData,
                        productDTO: productDTO,
                    }
                    newResult.push(tempObject);
                }
            }
            return res.json({
                success: 1,
                data: {
                    id: orderId,
                    order_detailDTO: newResult
                }
            })
        } catch (error) {
            return res.json({
                success: 0,
                data: 'Something wrong'
            });
        }
    },
    changeStatusOrder: async (req, res) => {
        try {
            const role = req.decoded.role;
            const userId = req.decoded.userId;
            const orderId = req.params.id;
            const order = await getOrderById(orderId);
            const statusId = req.query.status_id;

            if (role !== 'admin' && userId != order.created_by) {
                return res.status(403).json({
                    success: 0,
                    message: "Access Denied"
                });
            }

            const data = {
                status_id: statusId,
                created_by: order.created_by,
                order_id: orderId
            };

            const result = await changeStatusOrder(data);
            const order_detail = await getOrderDetailById(orderId)
            //handle cancel
            if (result != undefined && statusId == 6) {
                for (index in order_detail) {

                    await returnProductStock(order_detail[index].id)
                }
            }
            res.json({
                success: 1,
                message: "Status updated successfully"
            });

        } catch (error) {
            // Handle errors and send an appropriate response
            console.error(error);
            res.status(500).json({
                success: 0,
                message: "Internal server error"
            });
        }
    },
    getPayments: async (req, res) => {
        try {
            const payments = await getPayments(); // Assuming getPayments is an asynchronous function that fetches payments data

            // Assuming you want to send the payments data as the response
            res.status(200).json({ success: 1, data: payments });
        } catch (error) {
            // Handle any errors that occurred during fetching payments
            console.error('Error fetching payments:', error);
            res.status(500).json({ success: 0, error: 'Failed to get payments' });
        }
    },
    getDiscounts: async (req, res) => {
        try {
            const discounts = await getDiscounts(); // Assuming getPayments is an asynchronous function that fetches payments data

            // Assuming you want to send the payments data as the response
            res.status(200).json({ success: 1, data: discounts });
        } catch (error) {
            // Handle any errors that occurred during fetching payments
            console.error('Error fetching payments:', error);
            res.status(500).json({ success: 0, error: 'Failed to get discounts' });
        }
    },
    statisticOrder: async (req, res) => {
        const role = req.decoded.role
        const userId = req.decoded.userId
        const result = await getOrders();
        console.log(result)
        // if (role == 'admin') {
        //     try {
        //         const result = await getOrders();
        //         let newResult = []
        //         for (index in result) {
        //             const { payment_id, discount_id, status_id, ...resultData } = result[index];
        //             const paymentDTO = await getPaymentById(payment_id);
        //             const discountDTO = await getDiscountById(discount_id);
        //             const statusDTO = await getStatusDTO(status_id);
        //             const order_detailDTO = await getOrderDetailById(result[index].id);
        //             const tempObject = {
        //                 ...resultData,
        //                 order_detailDTO: order_detailDTO,
        //                 statusDTO: statusDTO,
        //                 paymentDTO: paymentDTO,
        //                 discountDTO: discountDTO,
        //             }
        //             newResult.push(tempObject);
        //         }
        //         console.log(newResult)
        //         return res.json({
        //             success: 1,
        //             data: newResult
        //         })
        //     } catch (error) {
        //         return res.json({
        //             success: 0,
        //             data: 'Something wrong'
        //         });
        //     }
        // }
    },
};