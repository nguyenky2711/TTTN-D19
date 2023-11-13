require('dotenv').config();
const errorCodes = require('../../errorMessages');

const {
    createTableOrder, createDetailOrder, getOrders, getPaymentById, getDiscountById, getOrderDetailById, getOrdersByUser, getOrderById, changeStatusOrder, getStockById, updateProductStock, returnProductStock, getPayments, getDiscounts, getUserByUserId, updateDiscount, createDiscount, getReviewById, updateReivew
} = require("./order.service");
const formidable = require("formidable");
const connection = require("../../config/database");
const moment = require("moment");
const { getStatusDTO, updateProduct, getItemById, createReviewSlot, getReviews, getReviewByItemId, getReviewByItemIdUserIdOrderId } = require('../items/item.service');
const { updateStatusCart, deleteProduct } = require('../carts/cart.service');
const { getStockByProductId, getProductById, getProductByItemId, getProductByIdPriceId } = require('../products/product.service');
module.exports = {
    createOrder: async (req, res) => {
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
            console.log(body)
            created_at = moment(new Date()).format('yyyy-MM-DD')
            created_by = req.decoded.userId
            const table = {
                created_at,
                created_by,
                payment_id: isNaN(body.payment_id.toString()) ? null : parseInt(body.payment_id.toString()),
                // discount_id: isNaN(body.discount_id.toString()) ? null : parseInt(body.discount_id.toString()),
                total: parseFloat(body.total.toString()),
                receiver_name: body.receiver_name.toString(),
                receiver_phone: body.receiver_phone.toString(),
                receiver_address: body.receiver_address.toString(),
                // status_id: parseInt(body.status_id.toString()),
            }
            // console.log(table)
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
                            message: errorCodes.PRODUCT_NOT_FOUND
                        });
                    } else if (inventoryItem.stock < order_detail[index].quantity) {
                        return res.status(403).json({
                            success: 0,
                            message: errorCodes.ORDERED_QUANTITY_EXCEEDS_STOCK
                        });
                    }

                }
                const orderId = await createTableOrder(table)

                for (index in order_detail) {
                    const detail = {
                        product_id: order_detail[index].product_id,
                        order_id: orderId,
                        quantity: order_detail[index].quantity,
                        sum: order_detail[index].sum,
                        price_id: order_detail[index].price_id,
                    }
                    const cart = {
                        product_id: order_detail[index].product_id,
                        user_id: req.decoded.userId,
                    }
                    const idDetail = await createDetailOrder(detail)
                    const deleteCartItem = await deleteProduct(cart)
                    const result = await updateProductStock(idDetail)
                    listOrder_detail.push(result)
                }

                return res.status(200).json({
                    success: 1,
                    message: errorCodes.ORDER_CREATED_SUCCESSFULLY,

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
    getOrders: async (req, res) => {
        const role = req.decoded.role
        const userId = req.decoded.userId
        const statusId = req.query.status_id
        const no = req.query.no ? Number(req.query.no) : 0
        const limit = req.query.limit ? Number(req.query.limit) : 100
        if (role == 'admin') {
            try {
                const result = await getOrders(statusId);
                let newResult = []
                for (index in result) {
                    // const { payment_id, discount_id, status_id, created_by, ...resultData } = result[index];
                    const { payment_id, status_id, created_by, ...resultData } = result[index];
                    const paymentDTO = await getPaymentById(payment_id);
                    // const discountDTO = await getDiscountById(discount_id);
                    const statusDTO = await getStatusDTO(status_id);
                    const order_detailDTO = await getOrderDetailById(result[index].id);
                    const creatorDTO = await getUserByUserId(created_by)
                    const tempObject = {
                        ...resultData,
                        order_detailDTO: order_detailDTO,
                        statusDTO: statusDTO,
                        paymentDTO: paymentDTO,
                        // discountDTO: discountDTO,
                        creatorDTO: creatorDTO
                    }
                    newResult.push(tempObject);
                }
                newResult = newResult.reverse();
                const totalPages = Math.ceil(newResult.length / limit);
                const startIndex = no * limit;
                const endIndex = startIndex + limit;
                const paginatedData = newResult.slice(startIndex, endIndex);
                // console.log(newResult)
                return res.json({
                    success: 1,
                    totalPages: totalPages,
                    totalItem: newResult.length,
                    no: no,
                    limit: limit,
                    data: paginatedData
                })
            } catch (error) {
                return res.json({
                    success: 0,
                    data: errorCodes.DATABASE_CONNECTION_ERROR
                });
            }
        } else {
            try {
                const result = await getOrdersByUser(userId, statusId);
                let newResult = []
                for (index in result) {
                    // const { payment_id, discount_id, status_id, created_by, created_at, ...resultData } = result[index];
                    const { payment_id, status_id, created_by, created_at, ...resultData } = result[index];
                    const paymentDTO = await getPaymentById(payment_id);
                    // const discountDTO = await getDiscountById(discount_id);
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
                        // discountDTO: discountDTO,
                        created_at: newTime
                    }
                    // console.log(tempObject)
                    newResult.push(tempObject);
                }
                // console.log(newResult)
                newResult = newResult.reverse();

                const totalPages = Math.ceil(newResult.length / limit);
                const startIndex = no * limit;
                const endIndex = startIndex + limit;
                const paginatedData = newResult.slice(startIndex, endIndex);
                // console.log(newResult)
                return res.json({
                    success: 1,
                    totalPages: totalPages,
                    totalItem: newResult.length,
                    no: no,
                    limit: limit,
                    list: paginatedData
                })
            } catch (error) {
                return res.json({
                    success: 0,
                    data: errorCodes.DATABASE_CONNECTION_ERROR
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
                // const { payment_id, discount_id, status_id, created_by, ...resultData } = result[index];
                const { payment_id, status_id, created_by, ...resultData } = result[index];
                const paymentDTO = await getPaymentById(payment_id);
                // const discountDTO = await getDiscountById(discount_id);
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
                    // discountDTO: discountDTO,
                }
                newResult.push(tempObject);
            }
            // console.log(newResult)
            return res.json({
                success: 1,
                data: newResult.reverse()
            })
        } catch (error) {
            return res.json({
                success: 0,
                data: errorCodes.DATABASE_CONNECTION_ERROR
            });
        }
    },
    getOrderDetailByUser: async (req, res) => {

        const userId = req.decoded.userId
        const role = req.decoded.role
        const orderId = req.params.id
        const no = req.query.no ? Number(req.query.no) : 0
        const limit = req.query.limit ? Number(req.query.limit) : 100
        const orderData = await getOrderById(orderId)
        // console.log(orderData)
        // console.log(userId)
        if (orderData?.created_by != userId && role != 'admin') {
            return res.status(403).json({ error: "Unauthorized to perform this action.", message: errorCodes.ACCESS_DENIED });
        }
        try {
            const result = await getOrderDetailById(orderId);
            let newResult = []
            if (role != 'admin') {
                for (index in result) {
                    const { order_id, product_id, price_id, ...resultData } = result[index];
                    const productData = await getProductByIdPriceId(product_id, price_id);
                    const { stockDTO, ...productDTO } = productData;

                    const review = await getReviewByItemIdUserIdOrderId({
                        item_id: productData.itemDTO.data.id,
                        order_id: parseInt(orderId),
                        created_by: userId,
                    })
                    console.log(review)
                    const tempObject = {
                        ...resultData,
                        productDTO: productDTO,
                        reviewed: review?.reviewed ? true : false
                    }
                    newResult.push(tempObject);
                }
            } else {
                for (index in result) {
                    const { order_id, product_id, price_id, ...resultData } = result[index];
                    const productDTO = await getProductByIdPriceId(product_id, price_id);
                    const tempObject = {
                        ...resultData,
                        productDTO: productDTO,
                    }
                    newResult.push(tempObject);
                }
            }
            const totalPages = Math.ceil(newResult.length / limit);
            const startIndex = no * limit;
            const endIndex = startIndex + limit;
            const paginatedData = newResult.slice(startIndex, endIndex);
            return res.json({
                success: 1,
                totalPages: totalPages,
                totalItems: result.length,
                no: no,
                limit: limit,
                data: {
                    id: orderId,
                    orderDTO: orderData,
                    // receiverDTO: {
                    //     name: orderData.receiver_name,
                    //     phone: orderData.receiver_phone,
                    //     address: orderData.receiver_address,
                    // },
                    order_detailDTO: paginatedData
                }
            })

        } catch (error) {
            return res.json({
                success: 0,
                data: errorCodes.DATABASE_CONNECTION_ERROR
            });
        }
    },
    changeStatusOrder: async (req, res) => {
        try {
            const role = req.decoded.role;
            const userId = req.decoded.userId;
            const orderId = req.params.id;
            const order = await getOrderById(orderId);
            const statusId = parseInt(req.query.status_id);

            if (role !== 'admin' && userId != order.created_by) {
                return res.status(403).json({
                    success: 0,
                    message: errorCodes.ACCESS_DENIED
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
            // add review slot
            if (result !== undefined && statusId === 9) {
                // Define an async function to use 'await'
                const uniqueProducts = [];
                for (let i in order_detail) {
                    const product = await getProductById(order_detail[i].product_id);
                    console.log(product)
                    const existingProduct = uniqueProducts.find((r) => r.itemDTO.data.id === product.itemDTO.data.id);

                    if (!existingProduct) {
                        uniqueProducts.push(product);
                    }
                }

                // Call the async function and await the result
                for (const uniqueProduct of uniqueProducts) {
                    const reviews = await getReviews()

                    const sendData = {
                        created_by: order.created_by,
                        modifield_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                        id: reviews.length + 1,
                        item_id: uniqueProduct.itemDTO.data.id,
                        order_id: orderId,
                    }
                    await createReviewSlot(sendData)
                }


                // Now you can use 'uniqueProducts' here.
            }

            res.json({
                success: 1,
                message: errorCodes.STATUS_UPDATED_SUCCESSFULLY
            });

        } catch (error) {
            // Handle errors and send an appropriate response
            console.error(error);
            res.status(500).json({
                success: 0,
                message: errorCodes.DATABASE_CONNECTION_ERROR
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
            res.status(500).json({ success: 0, error: 'Failed to get payments', message: errorCodes.RECORD_NOT_FOUND });
        }
    },
    getPaymentById: async (req, res) => {
        const id = req.params.id
        try {
            const payment = await getPaymentById(id);
            // const { status_id, ...rest } = discounts
            // const statusDTO = await getStatusDTO(status_id)
            // const temp = {
            //     ...rest,
            //     statusDTO: statusDTO
            // }

            // Assuming you want to send the payments data as the response
            return res.status(200).json({ success: 1, data: payment });
        } catch (error) {
            // Handle any errors that occurred during fetching payments
            console.error('Error fetching payments:', error);
            return res.status(500).json({ success: 0, error: 'Failed to get payments', message: errorCodes.RECORD_NOT_FOUND });
        }
    },

    statisticOrdersByTime: async (req, res) => {
        const role = req.decoded.role;
        if (role == 'admin') {
            const date = req.query.date;
            const month = req.query.month;
            if (date != undefined && date != '') {
                try {
                    const result = await getOrders();
                    let total = 0;
                    for (index in result) {
                        if (moment(result[index].created_at).format('DD-MM-YYYY') == date) {
                            total = total + result[index].total
                        }
                    }
                    return res.json({
                        success: 1,
                        data: {
                            date: date,
                            total: total
                        }
                    })
                } catch (error) {
                    return res.json({
                        success: 0,
                        data: errorCodes.DATABASE_CONNECTION_ERROR
                    });
                }
            } else if (month != undefined && month != '') {
                const listMonth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                const listTotal = []
                const listResult = []
                try {
                    const result = await getOrders();
                    for (index in listMonth) {
                        let total = 0;
                        for (index2 in result) {
                            if ((parseInt(moment(result[index2].created_at).format('MM'))) == (listMonth[index])) {
                                total = total + result[index2].total
                            }
                        }
                        listTotal.push(total)

                    }
                    for (index in listMonth) {
                        const temp = {
                            month: listMonth[index],
                            total: listTotal[index]
                        }
                        listResult.push(temp)
                    }
                    return res.json({
                        success: 1,
                        data: listResult
                    })
                } catch (error) {
                    return res.json({
                        success: 0,
                        data: errorCodes.DATABASE_CONNECTION_ERROR
                    });
                }
            }
        }


    },
    statisticOrdersByTimeWithItemId: async (req, res) => {
        const role = req.decoded.role;
        if (role == 'admin') {
            const date = req.query.date;
            const month = req.query.month;
            const itemId = req.params.id;
            if (date != undefined && date != '') {
                try {
                    const result = await getOrders();
                    // console.log(result)
                    let total = 0;
                    const productList = await getProductByItemId(itemId)
                    let productIds = []
                    for (index in productList) {
                        productIds.push(productList[index].id)
                    }
                    let order_details = []
                    for (index in result) {
                        if (moment(result[index].created_at).format('DD-MM-YYYY') == date) {
                            const order_detail = await getOrderDetailById(result[index].id)
                            for (index2 in productIds) {
                                for (index3 in order_detail) {
                                    if (order_detail[index3].product_id == productIds[index2]) {
                                        order_details.push(order_detail[index3])
                                    }
                                }
                            }
                        }
                    }
                    for (index in order_details) {
                        total = total + order_details[index].sum
                    }
                    // console.log(order_details) /
                    return res.json({
                        success: 1,
                        data: {
                            date: date,
                            total: total
                        }
                    })
                } catch (error) {
                    return res.json({
                        success: 0,
                        data: errorCodes.DATABASE_CONNECTION_ERROR
                    });
                }
            } else if (month != undefined && month != '') {
                const listMonth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                const listTotal = []
                const listResult = []
                try {
                    const result = await getOrders();
                    for (index in listMonth) {
                        let total = 0;
                        const productList = await getProductByItemId(itemId)
                        let productIds = []
                        for (index2 in productList) {
                            productIds.push(productList[index2].id)
                        }
                        let order_details = []
                        for (index2 in result) {
                            if ((parseInt(moment(result[index2].created_at).format('MM'))) == (listMonth[index])) {
                                const order_detail = await getOrderDetailById(result[index2].id)
                                for (index3 in productIds) {
                                    for (index4 in order_detail) {
                                        if (order_detail[index4].product_id == productIds[index3]) {
                                            order_details.push(order_detail[index4])
                                        }
                                    }
                                }
                            }
                        }
                        for (index in order_details) {
                            total = total + order_details[index].sum
                        }
                        listTotal.push(total)

                    }
                    for (index in listMonth) {
                        const temp = {
                            month: listMonth[index],
                            total: listTotal[index]
                        }
                        listResult.push(temp)
                    }
                    return res.json({
                        success: 1,
                        data: listResult
                    })
                } catch (error) {
                    return res.json({
                        success: 0,
                        data: errorCodes.DATABASE_CONNECTION_ERROR
                    });
                }
            }
        }


    },
    updateReview: async (req, res) => {
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
            const userId = req.decoded.userId;
            body.rating = Number(body.rating.toString())
            body.item_id = Number(body.item_id.toString())
            body.text = body.text.toString()
            body.imageUrl = body.imageUrl.toString()

            try {
                // Assuming updateReivew is an asynchronous function that updates a review
                const result = await updateReivew({
                    ...body,
                    created_by: userId,
                    modifield_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                });
                // Check if the update was successful
                if (result) {
                    return res.status(200).json({
                        success: 1,
                        message: "Review updated successfully",
                    });
                } else {
                    // If updateReivew returns a falsy value on failure, you can handle it here.
                    return res.status(400).json({
                        success: 0,
                        message: "Review update failed",
                    });
                }
            } catch (error) {
                // Log any unexpected errors, like database connection issues
                console.error(error);
                return res.status(500).json({
                    success: 0,
                    message: "Database connection error",
                });
            }

        });
    },
};