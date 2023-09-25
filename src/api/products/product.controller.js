require('dotenv').config();
const formidable = require("formidable");
const moment = require("moment");
const { getStatusDTO, getItemByName, createItem, createImage, getSizeByInfo, getItems, activeStatusItem } = require('../items/item.service');
const { getProducts, getProductById, createProduct, getProductByItemId, getProductDTOByItemId, getProductByItemSizeId, createImport, updateInventoryByProductId, createImportDetail, getPriceByProductId, createPriceItem, createInventoryItem, updatePriceByProductId } = require('./product.service');
const path = require('path');
const fs = require('fs');
const { createSize, updateSize } = require('../sizes/size.service');
const { getStockById } = require('../orders/order.service');
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
                    message: "Record not found",
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
                message: "Something went wrong",
            });
        }
    },
    getProductByItemId: async (req, res) => {
        const id = req.params.id;
        // console.log(req.decoded.userId)
        try {
            const result = await getProductByItemId(id)
            if (!result) {
                return res.json({
                    success: 0,
                    message: "Record not found",
                });
            }
            let resultDT0 = []
            for (index in result) {
                const temp = await getProductDTOByItemId(result[index]);
                resultDT0.push(temp)
            }
            console.log(resultDT0)
            return res.json({
                success: 1,
                productDTO: resultDT0
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: 0,
                message: "Something went wrong",
            });
        }
    },
    getProducts: async (req, res) => {
        // console.log(r)
        const name = req.query.name
        const typeId = req.query.type_id
        const no = req.query.no ? Number(req.query.no) : 0
        const limit = req.query.limit ? Number(req.query.limit) : 100
        try {

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
                return itemNameMatch && itemTypeMatch;
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
                message: 'Something wrong'
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
                message: 'Something wrong'
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
            body.price = body.price.toString();
            const sendData = {
                product_id: Number(id),
                price: Number(body.price),
                modifield_time: moment().format('YYYY-MM-DD HH:mm:ss')
            }
            try {

                await updatePriceByProductId(sendData);

                return res.json({
                    success: 1,
                    message: "Updated price successfully"
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
    createProduct: async (req, res) => {
        const role = req.decoded.role;
        if (role != 'admin') {
            return res.status(403).json({
                success: 0,
                message: "Access denied",
            });
        }
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
                    message: "Item with the same name already exists"
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
                    message: "Product created successfully",
                    data: {
                        itemID
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
    createImport: async (req, res) => {
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
            const imports = JSON.parse(body.imports)

            try {

                const importId = await createImport({ created_by: userID, created_at: moment().format('YYYY-MM-DD') })
                for (index in imports) {
                    const item_id = Number(imports[index].name)
                    for (index2 in imports[index].insideRows) {
                        if (imports[index].insideRows[index2].size !== '') {
                            const tempObj = {
                                item_id: item_id,
                                size_id: Number(imports[index].insideRows[index2].size)
                            }
                            const existProduct = await getProductByItemSizeId(tempObj);
                            if (existProduct != undefined) {
                                console.log(1)
                                const importDetailObj = {
                                    quantity: Number(imports[index].insideRows[index2].quantity),
                                    raw_price: Number(imports[index].insideRows[index2].raw_price),
                                    product_id: existProduct.id,
                                    import_id: importId

                                }
                                await createImportDetail(importDetailObj)
                                const currentStock = await getStockById(existProduct.id)
                                const stockObj = {
                                    stock: Number(imports[index].insideRows[index2].quantity) + currentStock.stock,
                                    product_id: existProduct.id
                                }
                                await updateInventoryByProductId(stockObj)
                                const listPrice = await getPriceByProductId(existProduct.id)
                                if (listPrice.length == 0) {
                                    const newPriceObj = {
                                        product_id: existProduct.id,
                                        price: Number(imports[index].insideRows[index2].raw_price) * 1.3,
                                        modifield_time: moment().format('YYYY-MM-DD HH:mm:SS')
                                    }
                                    const result = await createPriceItem(newPriceObj)
                                }
                                if (listPrice[listPrice.length - 1].price != Number(imports[index].insideRows[index2].raw_price) * 1.3) {
                                    const newPriceObj = {
                                        product_id: existProduct.id,
                                        price: Number(imports[index].insideRows[index2].raw_price) * 1.3,
                                        modifield_time: moment().format('YYYY-MM-DD HH:mm:SS')
                                    }
                                    const result = await createPriceItem(newPriceObj)

                                }

                            } else {
                                console.log(2)
                                const productId = await createProduct(tempObj);
                                const importDetailObj = {
                                    quantity: Number(imports[index].insideRows[index2].quantity),
                                    raw_price: Number(imports[index].insideRows[index2].raw_price),
                                    product_id: productId,
                                    import_id: importId

                                }
                                await createImportDetail(importDetailObj)
                                const stockObj = {
                                    stock: Number(imports[index].insideRows[index2].quantity),
                                    product_id: productId
                                }
                                await createInventoryItem(stockObj)
                                const newPriceObj = {
                                    product_id: productId,
                                    price: Number(imports[index].insideRows[index2].raw_price) * 1.3,
                                    modifield_time: moment().format('YYYY-MM-DD HH:mm:ss')
                                }
                                const result = await createPriceItem(newPriceObj)

                            }
                        } else {
                            console.log(3)
                            const lengthh = imports[index].insideRows[index2].length;
                            const height = imports[index].insideRows[index2].height;
                            const width = imports[index].insideRows[index2].width;

                            const newSize = `${lengthh}x${height}x${width}cm`
                            const sizeId = await createSize({ info_size: newSize })
                            const tempObj = {
                                item_id: item_id,
                                size_id: sizeId
                            }
                            const productId = await createProduct(tempObj);
                            const importDetailObj = {
                                quantity: Number(imports[index].insideRows[index2].quantity),
                                raw_price: Number(imports[index].insideRows[index2].raw_price),
                                product_id: productId,
                                import_id: importId

                            }
                            await createImportDetail(importDetailObj)
                            const stockObj = {
                                stock: Number(imports[index].insideRows[index2].quantity),
                                product_id: productId,
                            }
                            await createInventoryItem(stockObj)
                            const newPriceObj = {
                                product_id: productId,
                                price: Number(imports[index].insideRows[index2].raw_price) * 1.3,
                                modifield_time: moment().format('YYYY-MM-DD HH:mm:ss')
                            }
                            const result = await createPriceItem(newPriceObj)


                        }
                    }
                    await activeStatusItem({ id: item_id })
                }

                return res.json({
                    success: 1,
                    message: "Create import successfully"
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
}