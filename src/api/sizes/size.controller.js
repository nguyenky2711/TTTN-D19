require('dotenv').config();
const {
    createSize,
    getSizeById,
    getSizes,
    updateSize,
} = require("./size.service");
const formidable = require("formidable");
const moment = require("moment");
const { getStatusDTO } = require('../items/item.service');

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
    getSizeById: async (req, res) => {
        const id = req.params.id;
        // console.log(req.decoded.userId)
        try {

            const size = await getSizeById(id); // Assuming getUserByUserId is an asynchronous function that returns a promise
            if (!item) {
                return res.json({
                    success: 0,
                    message: "Record not found",
                });
            }
            const sizeDTO = { ...size };
            return res.json({
                success: 1,
                data: {
                    sizeDTO,
                }
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: 0,
                message: "Something went wrong",
            });
        }
    },

    getSizes: async (req, res) => {
        try {

            const result = await getSizes();
            return res.json({
                success: 1,
                data: result
            })
        } catch (error) {
            return res.json({
                success: 0,
                data: 'Something wrong'
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
}