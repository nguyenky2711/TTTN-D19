const { CLIENT_COMPRESS } = require("mysql/lib/protocol/constants/client");
const connection = require("../../config/database");
module.exports = {
    createTableOrder: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `INSERT INTO Orders (created_at, created_by, payment_id, discount_id, total,  status_id, receiver_name, receiver_phone, receiver_address)
          VALUES (?, ?, ?, ?, ?, ?,?,?,?)`,
                [
                    data.created_at,
                    data.created_by,
                    data.payment_id,
                    data.discount_id,
                    data.total,
                    5,
                    data.receiver_name,
                    data.receiver_phone,
                    data.receiver_address,
                ]
            );
            // Check if the insert operation was successful
            if (rows.affectedRows === 1) {

                return rows.insertId // Return the inserted ID
            } else {
                throw new Error("Failed to insert product to cart");
            }
        } catch (error) {
            throw error;
        }
    },
    createDetailOrder: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `INSERT INTO OrderDetail (product_id, order_id, quantity, sum)
          VALUES (?, ?, ?, ?)`,
                [
                    data.product_id,
                    data.order_id,
                    data.quantity,
                    data.sum,
                ]
            );
            // Check if the insert operation was successful
            if (rows.affectedRows === 1) {

                return rows.insertId // Return the inserted ID
            } else {
                throw new Error("Failed to insert product to cart");
            }
        } catch (error) {
            throw error;
        }
    },
    getOrders: async (data) => {
        if (data == '') {

            const [rows, fields] = await connection.execute('SELECT * FROM Orders');
            return rows
        } else {
            const [rows, fields] = await connection.execute(`SELECT * FROM Orders Where status_id=?`, [data]);
            return rows
        }
    },
    getOrderById: async (id) => {
        const [rows, fields] = await connection.execute(`SELECT * FROM Orders Where id=?`,
            [id]);
        return rows[0]
    },
    getOrdersByUser: async (created_by, status_id) => {
        if (status_id == '') {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Orders Where (created_by=? )`,
                [created_by]
            );
            return rows
        } else {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Orders Where (created_by=? AND status_id=?)`,
                [created_by, status_id]
            );
            return rows
        }
    },
    getPaymentById: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Payments WHERE id = ?`,
                [id]
            );

            return rows[0];
        } catch (error) {
            throw error;
        }
    },
    getPayments: async () => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Payments`,
            );

            return rows;
        } catch (error) {
            throw error;
        }
    },
    getDiscountById: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Discounts WHERE id = ?`,
                [id]
            );

            return rows[0];
        } catch (error) {
            throw error;
        }
    },
    getDiscounts: async () => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Discounts `,
            );

            return rows;
        } catch (error) {
            throw error;
        }
    },
    getOrderDetailById: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT *  FROM OrderDetail where order_id=?`,
                [
                    id
                ]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    },
    getOrderDetailByUser: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT *  FROM OrderDetail where order_id=?`,
                [
                    id
                ]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    },
    changeStatusOrder: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `update Orders set  status_id=? where id=?`,
                [
                    data.status_id,
                    data.order_id
                ]);
            if (rows.affectedRows === 0) {
                throw new Error('Order not found');
            }
            return rows
        } catch (error) {
            throw error;
        }
    },
    getStockById: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Inventory WHERE product_id = ?`,
                [id]
            );

            return rows[0];
        } catch (error) {
            throw error;
        }
    },
    updateProductStock: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT *  FROM OrderDetail where id=?`,
                [
                    id
                ]
            );
            const [rows1, fields1] = await connection.execute(
                `UPDATE Inventory
                SET stock = Inventory.stock - ?
                WHERE (product_id=?);`,
                [
                    rows[0].quantity,
                    rows[0].product_id
                ]
            );
            return rows1[0];
        } catch (error) {
            throw error;
        }
    },
    returnProductStock: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT *  FROM OrderDetail where id=?`,
                [
                    id
                ]
            );
            const [rows1, fields1] = await connection.execute(
                `UPDATE Inventory
                SET stock = Inventory.stock + ?
                WHERE (product_id=?);`,
                [
                    rows[0].quantity,
                    rows[0].product_id
                ]
            );
            return rows1[0];
        } catch (error) {
            throw error;
        }
    },

};