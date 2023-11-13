require('dotenv').config();
const errorCodes = require('../../errorMessages');

const formidable = require("formidable");
const moment = require("moment");
const { getStatusDTO, getItemByName, createItem, createImage, getSizeByInfo, getItems, activeStatusItem, getItemById } = require('../items/item.service');
const { getProducts, getProductById, createProduct, getProductByItemId, getProductDTOByItemId, getProductByItemSizeId, createImport, updateInventoryByProductId, createImportDetail, getPriceByProductId, createPriceItem, createInventoryItem, updatePriceByProductId, updateDiscount, createDiscount, getDiscountById, getDiscountByItemId, getDiscounts, getPrices, getReviewsByItemId, getLikesByReviewId, getDislikesByReviewId, createLike, createDislike, getReviewById, getLikesByReviewUserId, deleteLike, getDislikesByReviewUserId, deleteDislike } = require('./product.service');
const path = require('path');
const fs = require('fs');
const { createSize, updateSize } = require('../sizes/size.service');
const { getStockById, getUserByUserId } = require('../orders/order.service');
module.exports = {
    createSize: async (req, res) => {
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
            const role = req.decoded.role;
            if (role != 'admin') {
                return res.status(403).json({
                    success: 0,
                    message: "Access denied",
                });
            }
            body.info_size = body.info_size.toString();

            try {

                const sizeId = await createSize(body);
                return res.status(200).json({
                    success: 1,
                    message: "Size created successfully",
                    data: {
                        sizeId
                    }
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
    getProductById: async (req, res) => {
        const id = req.params.id;
        // console.log(req.decoded.userId)
        try {

            const result = await getProductById(id); // Assuming getUserByUserId is an asynchronous function that returns a promise
            if (!result) {
                return res.json({
                    success: 0,
                    message: errorCodes.RECORD_NOT_FOUND,
                });
            }
            return res.json({
                success: 1,
                productDTO: result
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: 0,
                message: errorCodes.DATABASE_CONNECTION_ERROR,
            });
        }
    },
    getProductByItemId: async (req, res) => {
        const id = req.params.id;
        // console.log(req.decoded.userId)
        try {
            const result = await getProductByItemId(id)
            let reviews = await getReviewsByItemId(id)
            for (const review of reviews) {
                const likes = await getLikesByReviewId(review.id);
                const dislikes = await getDislikesByReviewId(review.id);
                const created_by_DTO = await getUserByUserId(review.created_by)
                review.created_by_DTO = created_by_DTO
                review.like = likes.length;
                review.dislike = dislikes.length;
            }
            if (!result) {
                return res.json({
                    success: 0,
                    message: errorCodes.RECORD_NOT_FOUND,
                });
            }
            let resultDT0 = []
            for (index in result) {
                const temp = await getProductDTOByItemId(result[index]);
                resultDT0.push(temp)
            }
            return res.json({
                success: 1,
                productDTO: resultDT0,
                reviewDTO: reviews,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: 0,
                message: errorCodes.DATABASE_CONNECTION_ERROR,
            });
        }
    },
    getProducts: async (req, res) => {
        // console.log(r)
        const name = req.query.name
        const typeId = req.query.type_id
        const no = req.query.no ? Number(req.query.no) : 0
        const limit = req.query.limit ? Number(req.query.limit) : 100
        const minPrice = req.query.limit ? Number(req.query.minPrice) : 0
        const maxPrice = req.query.limit ? Number(req.query.maxPrice) : 10000000000
        try {
            // scan price exprire
            const discounts = await getDiscounts()
            const prices = await getPrices()
            for (const discount of discounts) {
                if (discount.status_id == 1) {
                    if (new Date(discount.startDate) <= new Date() && new Date(discount.endDate) >= new Date()) {
                        const products = await getProductByItemId(parseInt(discount.item_id))
                        for (const product of products) {
                            const price = await getPriceByProductId(product.id);
                            if (price.price == price.discounted_price) {
                                const discounted_price = price.price * (1 - Number(discount.percentDiscount) / 100);
                                const newPrice = { ...price, discounted_price };
                                await createPriceItem(newPrice);
                                await updatePriceByProductId({ ...price, status_id: 2 });
                            }
                        }
                    }
                    if (new Date(discount.endDate) <= new Date()) {
                        const products = await getProductByItemId(parseInt(discount.item_id))
                        for (const product of products) {
                            const price = await getPriceByProductId(product.id);
                            const discounted_price = price.price;
                            const newPrice = { ...price, discounted_price };
                            await createPriceItem(newPrice);
                            await updatePriceByProductId({ ...price, status_id: 2 });

                        }
                        const sendData = {
                            ...discount,
                            status_id: 2,
                            modifield_time: moment().format('YYYY-MM-DD HH:mm:ss'),

                        }
                        await updateDiscount(sendData)


                    }
                }

            }
            // get list product
            const result = await getProducts();
            var dataa = []
            for (index in result) {
                const temp = await getProductById(result[index].id)
                // console.log(temp.itemDTO.data.status_id)
                if (temp.itemDTO.data.status_id == 1) {
                    dataa.push(temp)
                }
            }
            const groupedData = dataa.reduce((acc, item) => {
                const itemId = item.itemDTO.data.id;

                if (!acc[itemId]) {
                    acc[itemId] = [];
                }
                acc[itemId].push(item);
                return acc;
            }, []);
            const filteredData = groupedData.filter((item) => {
                const itemNameMatch = name ? item[0].itemDTO.data.name.toLowerCase().includes(name.toLowerCase()) : true;
                const itemTypeMatch = typeId ? item[0].itemDTO.data.type_id == typeId : true;
                const itemPrice = item[0].priceDTO[0]?.discounted_price // Assuming the property is called 'price'

                // Check if itemPrice is within the specified min and max range
                const priceInRange = (!minPrice || itemPrice >= minPrice) && (!maxPrice || itemPrice <= maxPrice);

                return itemNameMatch && itemTypeMatch && priceInRange;
            });

            const totalPages = Math.ceil(filteredData.length / limit);
            const startIndex = no * limit;
            const endIndex = startIndex + limit;
            const paginatedData = filteredData.slice(startIndex, endIndex);
            return res.json({
                success: 1,
                totalPages: totalPages,
                totalItems: filteredData.length,
                no: no,
                limit: limit,
                productList: paginatedData
            })
        } catch (error) {
            return res.json({
                success: 0,
                message: errorCodes.DATABASE_CONNECTION_ERROR
            });
        }

    },
    getProductsForImport: async (req, res) => {
        try {

            const result = await getItems();

            return res.json({
                success: 1,
                itemList: result
            })
        } catch (error) {
            return res.json({
                success: 0,
                message: errorCodes.DATABASE_CONNECTION_ERROR
            });
        }

    },
    updateSize: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: 0,
                    message: "Error parsing form data"
                });
            }

            const id = req.params.id;
            const body = fields;
            const userID = req.decoded.userId;
            const role = req.decoded.role;
            if (role != 'admin') {
                return res.status(403).json({
                    success: 0,
                    message: "Access denied",
                });
            }
            body.info_size = body.info_size.toString();
            try {

                await updateSize(id, body);

                return res.json({
                    success: 1,
                    message: "Updated size successfully"
                });
            } catch (error) {
                // console.error(error);
                return res.status(500).json({
                    success: 0,
                    message: "Something went wrong"
                });
            }
        });

    },
    updatePrice: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: 0,
                    message: errorCodes.FORM_DATA_PARSE_ERROR
                });
            }

            const id = req.params.id;
            const body = fields;
            const userID = req.decoded.userId;
            const role = req.decoded.role;
            if (role != 'admin') {
                return res.status(403).json({
                    success: 0,
                    message: errorCodes.ACCESS_DENIED,
                });
            }
            body.price = body.price.toString();
            const sendData = {
                product_id: Number(id),
                price: Number(body.price),
                discounted_price: Number(body.price),
                modifield_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                id: body.price_id.toString(),
            }
            try {

                await updatePriceByProductId(sendData);

                return res.json({
                    success: 1,
                    message: errorCodes.UPDATED_PRICE_SUCCESSFUL
                });
            } catch (error) {
                // console.error(error);
                return res.status(500).json({
                    success: 0,
                    message: errorCodes.DATABASE_CONNECTION_ERROR
                });
            }
        });

    },
    createProduct: async (req, res) => {
        const role = req.decoded.role;
        if (role != 'admin') {
            return res.status(403).json({
                success: 0,
                message: errorCodes.ACCESS_DENIED,
            });
        }
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
            // console.log(files.images)
            body.description = body.description.toString();
            body.guide = body.guide.toString();
            body.type_id = body.type_id.toString();
            body.name = body.name.toString();
            body.info_size = JSON.parse(body.info_size.toString());
            const images = files.images;
            const testItem = await getItemByName(body.name)
            if (testItem) {
                return res.status(409).json({
                    success: 0,
                    message: errorCodes.ITEM_NAME_ALREADY_EXISTS
                });
            }
            // for (index in body.info_size) {
            //     const testSize = await getSizeByInfo(body.info_size[index])
            //     if (testSize) {
            //         return res.status(409).json({
            //             success: 0,
            //             message: "Size with the same infor already exists"
            //         });
            //     }
            // }
            try {
                const itemID = await createItem(body);

                for (index in body.info_size) {
                    let size_id = null;
                    const testSize = await getSizeByInfo(body.info_size[index])
                    if (testSize != undefined) {
                        size_id = testSize.id
                    } else {
                        const temp_size = {
                            info_size: body.info_size[index]
                        }
                        const sizeID = await createSize(temp_size)
                        size_id = sizeID
                    }
                    console.log('size', size_id)
                    const temp = {
                        item_id: itemID,
                        size_id: size_id
                    }
                    console.log(temp)
                    await createProduct(temp)
                }

                // Array to store the paths of the uploaded images
                const imagePaths = [];
                const imageNames = [];
                // Handle multiple image uploads
                for (const image of (Array.isArray(images) ? images : [images])) {
                    console.log(image)
                    const tempPath = image.filepath;
                    const fileName = image.originalFilename;
                    const destinationPath = path.join(__dirname, '../../uploads', fileName);

                    try {
                        // Check if the temporary file exists before moving it
                        fs.accessSync(tempPath, fs.constants.R_OK);

                        // Move the uploaded file to the destination path
                        fs.renameSync(tempPath, destinationPath);
                        imageNames.push(fileName)
                        imagePaths.push(destinationPath);
                    } catch (error) {
                        console.error('Error moving file:', error);
                    }
                }
                for (index in imageNames) {
                    const temp = {
                        name: imageNames[index],
                        item_id: itemID
                    }
                    await createImage(temp)
                }

                return res.status(200).json({
                    success: 1,
                    message: errorCodes.PRODUCT_CREATED_SUCCESSFULLY,
                    data: {
                        itemID
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
    createImport: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: 0,
                    message: errorCodes.FORM_DATA_PARSE_ERROR
                });
            }

            const id = req.params.id;
            const body = JSON.parse(fields.requestData);
            const userID = req.decoded.userId;
            const role = req.decoded.role;
            if (role != 'admin') {
                return res.status(403).json({
                    success: 0,
                    message: errorCodes.ACCESS_DENIED,
                });
            }
            const imports = body.importlist

            console.log(imports)
            try {


                const importId = await createImport({ created_by: userID, created_at: moment().format('YYYY-MM-DD') })
                for (index in imports) {
                    const item_id = Number(imports[index].itemId)
                    const lengthh = imports[index]?.length;
                    const height = imports[index]?.height;
                    const width = imports[index]?.width;

                    const newSize = `${lengthh}x${height}x${width}cm`
                    const existSize = lengthh && height && width && await getSizeByInfo(newSize)
                    if (imports[index].sizeType === 1 || (imports[index].sizeType === 2 && existSize)) {
                        const tempObj = {
                            item_id: item_id,
                            size_id: imports[index].sizeType === 1 ? Number(imports[index].sizeId) : existSize.id
                        }
                        const existProduct = await getProductByItemSizeId(tempObj);
                        if (existProduct != undefined) {
                            //create import detail
                            const importDetailObj = {
                                quantity: Number(imports[index].quantity),
                                raw_price: Number(imports[index].price),
                                product_id: existProduct.id,
                                import_id: importId

                            }
                            await createImportDetail(importDetailObj)
                            //update stock
                            const currentStock = await getStockById(existProduct.id)
                            const stockObj = {
                                stock: Number(imports[index].quantity) + currentStock.stock,
                                product_id: existProduct.id
                            }
                            await updateInventoryByProductId(stockObj)
                            //update price if neccesary
                            const listPrice = await getPriceByProductId(existProduct.id)
                            if (listPrice.length == 0) {
                                const newPriceObj = {
                                    product_id: existProduct.id,
                                    price: Number(imports[index].price) * 1.3,
                                    discounted_price: Number(imports[index].price) * 1.3,
                                    modifield_time: moment().format('YYYY-MM-DD HH:mm:SS'),
                                }
                                const result = await createPriceItem(newPriceObj)
                            } else if (listPrice[listPrice.length - 1]?.price < Number(imports[index].price) * 1.3) {
                                const newPriceObj = {
                                    product_id: existProduct.id,
                                    discounted_price: Number(imports[index].price) * 1.3,
                                    price: Number(imports[index].price) * 1.3,
                                    modifield_time: moment().format('YYYY-MM-DD HH:mm:SS'),
                                }
                                const result = await createPriceItem(newPriceObj)
                            }


                        } else {
                            const productId = await createProduct(tempObj);
                            //create import detail
                            const importDetailObj = {
                                quantity: Number(imports[index].quantity),
                                raw_price: Number(imports[index].price),
                                product_id: productId,
                                import_id: importId,
                            }
                            await createImportDetail(importDetailObj)
                            // create stock
                            const stockObj = {
                                stock: Number(imports[index].quantity),
                                product_id: productId,
                            }
                            await createInventoryItem(stockObj)
                            //create price
                            const newPriceObj = {
                                product_id: productId,
                                discounted_price: Number(imports[index].price) * 1.3,
                                price: Number(imports[index].price) * 1.3,
                                modifield_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                            }
                            const result = await createPriceItem(newPriceObj)

                        }
                    } else if (imports[index].sizeType === 2 && !existSize) {
                        const sizeId = await createSize({ info_size: newSize })
                        //create product
                        const tempObj = {
                            item_id: item_id,
                            size_id: sizeId
                        }
                        const productId = await createProduct(tempObj);
                        //crate import detail
                        const importDetailObj = {
                            quantity: Number(imports[index].quantity),
                            raw_price: Number(imports[index].price),
                            product_id: productId,
                            import_id: importId,
                        }
                        await createImportDetail(importDetailObj)
                        //create stock
                        const stockObj = {
                            stock: Number(imports[index].quantity),
                            product_id: productId,
                        }
                        await createInventoryItem(stockObj)
                        // create price
                        const newPriceObj = {
                            product_id: productId,
                            discounted_price: Number(imports[index].price) * 1.3,
                            price: Number(imports[index].price) * 1.3,
                            modifield_time: moment().format('YYYY-MM-DD HH:mm:ss')
                        }
                        await createPriceItem(newPriceObj)

                    }

                    await activeStatusItem({ id: item_id })
                }

                return res.json({
                    success: 1,
                    message: errorCodes.CREATE_IMPORT_SUCCESSFULLY
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
    getDiscounts: async (req, res) => {
        const no = req.query.no ? Number(req.query.no) : 0
        const limit = req.query.limit ? Number(req.query.limit) : 100
        try {
            const discounts = await getDiscounts(); // Assuming getPayments is an asynchronous function that fetches payments data
            let result = []
            for (index in discounts) {
                const { status_id, item_id, ...rest } = discounts[index]
                if (status_id !== 10) {
                    const statusDTO = await getStatusDTO(status_id)
                    const itemDTO = await getItemById(item_id)
                    const temp = {
                        ...rest,
                        statusDTO: statusDTO,
                        itemDTO: itemDTO,
                    }
                    result.push(temp)
                }
            }
            result = result.reverse()
            const totalPages = Math.ceil(result.length / limit);
            const startIndex = no * limit;
            const endIndex = startIndex + limit;
            const paginatedData = result.slice(startIndex, endIndex);
            // Assuming you want to send the payments data as the response
            return res.json({
                success: 1,
                totalPages: totalPages,
                totalItem: result.length,
                no: no,
                limit: limit,
                data: paginatedData
            })
        } catch (error) {
            // Handle any errors that occurred during fetching payments
            console.error('Error fetching payments:', error);
            res.status(500).json({
                success: 0,
                message: errorCodes.DATABASE_CONNECTION_ERROR
            });
        }
    },
    getDiscountById: async (req, res) => {
        const id = req.params.id
        try {
            const discounts = await getDiscountById(id);
            const { status_id, ...rest } = discounts
            const statusDTO = await getStatusDTO(status_id)
            const temp = {
                ...rest,
                statusDTO: statusDTO
            }

            // Assuming you want to send the payments data as the response
            return res.status(200).json({ success: 1, data: temp });
        } catch (error) {
            // Handle any errors that occurred during fetching payments
            console.error('Error fetching payments:', error);
            return res.status(500).json({
                success: 0, error: 'Failed to get discount',
                message: errorCodes.DATABASE_CONNECTION_ERROR
            });
        }
    },
    getDiscountByItemId: async (req, res) => {
        const itemId = req.query.itemId
        try {
            const discounts = await getDiscountByItemId(itemId);
            const { status_id, ...rest } = discounts
            const statusDTO = await getStatusDTO(status_id)
            const temp = {
                ...rest,
                statusDTO: statusDTO
            }

            // Assuming you want to send the payments data as the response
            return res.status(200).json({ success: 1, data: temp });
        } catch (error) {
            // Handle any errors that occurred during fetching payments
            console.error('Error fetching payments:', error);
            return res.status(500).json({
                success: 0, error: 'Failed to get discount',
                message: errorCodes.DATABASE_CONNECTION_ERROR
            });
        }
    },
    updateDiscount: async (req, res) => {
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
            const currentData = await getDiscountById(Number(req.params.id))
            const sendData = {
                id: Number(req.params.id),
                percentDiscount: Number(body.percentDiscount.toString()),
                status_id: parseInt(body.status_id.toString()),
                item_id: parseInt(body.item_id.toString()),
                modifield_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                startDate: moment(body.startDate.toString()).format('YYYY-MM-DD'),
                endDate: moment(body.endDate.toString()).format('YYYY-MM-DD'),
            }
            const products = await getProductByItemId(sendData.item_id)

            if (sendData.status_id == 10) { ///delete
                try {
                    for (const product of products) {
                        const price = await getPriceByProductId(product.id);
                        const discounted_price = price.price;
                        const newPrice = { ...price, discounted_price };
                        await createPriceItem(newPrice);
                        await updatePriceByProductId({ ...price, status_id: 2 });
                    }
                    const tempData = {
                        ...sendData,
                        status_id: 10,
                        modifield_time: moment().format('YYYY-MM-DD HH:mm:ss'),

                    }
                    const result = await updateDiscount(tempData)

                    return res.status(200).json({
                        success: 1,
                        message: errorCodes.UPDATE_DISCOUNT_SUCCESSFULLY,

                    });
                } catch (error) {
                    console.error(error);
                    return res.status(500).json({
                        success: 0,
                        message: errorCodes.DATABASE_CONNECTION_ERROR
                    });
                }
            } else { //update
                if (currentData.status_id == 2) { //disable
                    if (new Date(sendData.startDate) <= new Date() && new Date(sendData.endDate) >= new Date()) {

                        console.log(123)
                        try {
                            for (const product of products) {
                                const price = await getPriceByProductId(product.id);
                                const discounted_price = price.price * (1 - Number(body.percentDiscount.toString()) / 100);
                                const newPrice = { ...price, discounted_price };
                                await createPriceItem(newPrice);
                                await updatePriceByProductId({ ...price, status_id: 2 });
                            }
                            const tempData = {
                                ...sendData,
                                id: sendData.id + 1,
                            }
                            const result = await createDiscount(tempData)
                            return res.status(200).json({
                                success: 1,
                                message: errorCodes.UPDATE_DISCOUNT_SUCCESSFULLY,
                            });
                        } catch (error) {
                            console.error(error);
                            return res.status(500).json({
                                success: 0,
                                message: errorCodes.DATABASE_CONNECTION_ERROR
                            });
                        }
                    }
                    if (new Date(sendData.startDate) > new Date()) {
                        try {

                            const result = await createDiscount(sendData)
                            return res.status(200).json({
                                success: 1,
                                message: errorCodes.UPDATE_DISCOUNT_SUCCESSFULLY,
                            });
                        } catch (error) {
                            console.error(error);
                            return res.status(500).json({
                                success: 0,
                                message: errorCodes.DATABASE_CONNECTION_ERROR
                            });
                        }
                    }

                } else { //active
                    if (currentData.percentDiscount == Number(body.percentDiscount.toString())) {
                        if (new Date(sendData.startDate) <= new Date() && new Date(sendData.endDate) >= new Date()) {

                            try {

                                const result = await updateDiscount(sendData)
                                return res.status(200).json({
                                    success: 1,
                                    message: errorCodes.UPDATE_DISCOUNT_SUCCESSFULLY,

                                });
                            } catch (error) {
                                console.error(error);
                                return res.status(500).json({
                                    success: 0,
                                    message: errorCodes.DATABASE_CONNECTION_ERROR
                                });
                            }
                        }
                        if (new Date(sendData.startDate) > new Date()) {
                            try {
                                for (const product of products) {
                                    const price = await getPriceByProductId(product.id);
                                    const discounted_price = price.price;
                                    const newPrice = { ...price, discounted_price };
                                    await createPriceItem(newPrice);
                                    await updatePriceByProductId({ ...price, status_id: 2 });
                                }

                                const result = await updateDiscount(sendData)
                                return res.status(200).json({
                                    success: 1,
                                    message: errorCodes.UPDATE_DISCOUNT_SUCCESSFULLY,

                                });
                            } catch (error) {
                                console.error(error);
                                return res.status(500).json({
                                    success: 0,
                                    message: errorCodes.DATABASE_CONNECTION_ERROR
                                });
                            }
                        }
                    } else {
                        if (new Date(sendData.startDate) <= new Date() && new Date(sendData.endDate) >= new Date()) {

                            try {
                                for (const product of products) {
                                    const price = await getPriceByProductId(product.id);
                                    const discounted_price = price.price * (1 - Number(body.percentDiscount.toString()) / 100);
                                    const newPrice = { ...price, discounted_price };
                                    await createPriceItem(newPrice);
                                    await updatePriceByProductId({ ...price, status_id: 2 });
                                }

                                const result = await updateDiscount(sendData)
                                return res.status(200).json({
                                    success: 1,
                                    message: errorCodes.UPDATE_DISCOUNT_SUCCESSFULLY,

                                });
                            } catch (error) {
                                console.error(error);
                                return res.status(500).json({
                                    success: 0,
                                    message: errorCodes.DATABASE_CONNECTION_ERROR
                                });
                            }
                        }
                    }
                }

            }


        });
    },
    createDiscount: async (req, res) => {
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
            const existDiscount = await getDiscountByItemId(parseInt(body.item_id.toString()))
            if (existDiscount && existDiscount?.status_id === 1) {
                return res.status(409).json({
                    success: 0,
                    message: errorCodes.ITEM_ALREADY_HAS_DISCOUNT
                });

            }
            const discounts = await getDiscounts();
            const products = await getProductByItemId(parseInt(body.item_id.toString()))
            const sendData = {
                percentDiscount: Number(body.percentDiscount.toString()),
                item_id: parseInt(body.item_id.toString()),
                modifield_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                // startDate: body.startDate.toString().moment().format('YYYY-MM-DD'),
                // endDate: body.endDate.toString().moment().format('YYYY-MM-DD'),
                startDate: body.startDate.toString(),
                endDate: body.endDate.toString(),
                status_id: 1,
                id: discounts.length + 1,
            }
            try {
                if (new Date(sendData.startDate) <= new Date() && new Date(sendData.endDate) >= new Date()) {

                    for (const product of products) {
                        const price = await getPriceByProductId(product.id);
                        const discounted_price = price.price * (1 - Number(body.percentDiscount.toString()) / 100);
                        const newPrice = { ...price, discounted_price };
                        await createPriceItem(newPrice);
                        await updatePriceByProductId({ ...price, status_id: 2 });
                    }
                }

                const result = await createDiscount(sendData)
                return res.status(200).json({
                    success: 1,
                    message: errorCodes.CREATE_DISCOUNT_SUCCESSFULLY,

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
    createLike: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        success: 0,
                        message: "Error parsing form data"
                    });
                }

                const id = req.params.id;
                const body = fields;
                const userID = req.decoded.userId;

                const reviewDTO = await getReviewById(body.review_id.toString());

                if (!reviewDTO) {
                    return res.status(404).json({
                        success: 0,
                        message: "Review not found"
                    });
                }

                if (reviewDTO.created_by == userID) {
                    return res.status(403).json({
                        success: 0,
                        message: "You can't interact with your own review"
                    });
                }

                const sendData = {
                    review_id: Number(body.review_id.toString()),
                    created_by: Number(userID),
                    created_at: moment().format('YYYY-MM-DD'),
                };

                const likeDTO = await getLikesByReviewUserId(sendData);

                if (likeDTO.length !== 0) {
                    await deleteLike(sendData);
                    return res.status(200).json({
                        success: 1,
                        message: "Like deleted successfully"
                    });
                } else {
                    const result = await createLike(sendData);
                    return res.json({
                        success: 1,
                        message: "Like created successfully"
                    });
                }
            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    success: 0,
                    message: "Something went wrong"
                });
            }
        });


    },
    createDislike: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        success: 0,
                        message: "Error parsing form data"
                    });
                }

                const id = req.params.id;
                const body = fields;
                const userID = req.decoded.userId;

                const reviewDTO = await getReviewById(body.review_id.toString());

                if (!reviewDTO) {
                    return res.status(404).json({
                        success: 0,
                        message: "Review not found"
                    });
                }

                if (reviewDTO.created_by == userID) {
                    return res.status(403).json({
                        success: 0,
                        message: "You can't interact with your own review"
                    });
                }

                const sendData = {
                    review_id: Number(body.review_id.toString()),
                    created_by: Number(userID),
                    created_at: moment().format('YYYY-MM-DD'),
                };

                const dislikeDTO = await getDislikesByReviewUserId(sendData);

                if (dislikeDTO.length !== 0) {
                    await deleteDislike(sendData);
                    return res.status(200).json({
                        success: 1,
                        message: "Dislike deleted successfully"
                    });
                } else {
                    const result = await createDislike(sendData);
                    return res.json({
                        success: 1,
                        message: "Dislike created successfully"
                    });
                }
            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    success: 0,
                    message: "Something went wrong"
                });
            }
        });

    },
    getReviewsByItemId: async (req, res) => {
        const no = req.query.no ? Number(req.query.no) : 0
        const limit = req.query.limit ? Number(req.query.limit) : 100
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                const id = req.params.id;
                const body = fields;
                console.log(body)
                const review_id = body.review_id.toString()
                const reviews = await getReviewsByItemId(review_id);
                reviews = reviews.reverse()
                const totalPages = Math.ceil(result.length / limit);
                const startIndex = no * limit;
                const endIndex = startIndex + limit;
                const paginatedData = reviews.slice(startIndex, endIndex);
                // Assuming you want to send the payments data as the response
                return res.json({
                    success: 1,
                    totalPages: totalPages,
                    totalItem: reviews.length,
                    no: no,
                    limit: limit,
                    data: paginatedData
                })
            } catch (error) {
                // Handle any errors that occurred during fetching payments
                console.error('Error fetching payments:', error);
                res.status(500).json({ success: 0, error: 'Failed to get reviews' });
            }
        });

    },
}