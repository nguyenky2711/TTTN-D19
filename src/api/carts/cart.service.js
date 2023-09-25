const { CLIENT_COMPRESS } = require("mysql/lib/protocol/constants/client");
const connection = require("../../config/database");
module.exports = {
    addProduct: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `INSERT INTO Cart (product_id, user_id, quantity)
          VALUES (?, ?, ?)`,
                [
                    data.product_id,
                    data.user_id,
                    data.quantity
                ]
            );
            // Check if the insert operation was successful
            if (rows.affectedRows === 1) {
                const [rows2, fields2] = await connection.execute(
                    `SELECT * FROM  Cart  WHERE id=?`,
                    [
                        rows.insertId
                    ]
                );
                return rows2 // Return the inserted ID
            } else {
                throw new Error("Failed to insert product to cart");
            }
        } catch (error) {
            throw error;
        }
    },
    getCartByUserId: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Cart WHERE user_id = ?`,
                [id]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    },
    checkExistProduct: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Cart WHERE (product_id=? AND user_id=?)`,
                [
                    data.product_id,
                    data.user_id
                ]
            );   // Check if the insert operation was successful
            if (rows.length === 0) {
                // Rows is an empty array
                return false;
            } else {
                // Rows is not an empty array
                return true;
            }
        } catch (error) {
            throw error;
        }
    },
    deleteProduct: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `DELETE FROM Cart WHERE (product_id=? AND user_id=? )`,
                [
                    data.product_id,
                    data.user_id,
                ]
            );
            console.log(rows)
            return rows[0];
        } catch (error) {
            throw error;
        }
    },
    updateQuantity: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `UPDATE Cart SET quantity=? WHERE product_id=? AND user_id=?`,
                [
                    data.quantity,
                    data.product_id,
                    data.user_id,
                ]
            );
            console.log(rows);
            return rows.affectedRows; // Use affectedRows to indicate the number of rows updated
        } catch (error) {
            throw error;
        }
    },


};