const connection = require("../../config/database");
module.exports = {
    createSize: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `INSERT INTO Sizes (info_size)
          VALUES (?)`,
                [
                    data.info_size,
                ]
            );

            // Check if the insert operation was successful
            if (rows.affectedRows === 1) {
                return rows.insertId // Return the inserted ID
            } else {
                throw new Error("Failed to insert user");
            }
        } catch (error) {
            throw error;
        }
    },
    getSizeById: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Sizes WHERE id = ?`,
                [id]
            );

            return rows[0];
        } catch (error) {
            throw error;
        }
    },
    getSizeByInfor: async (info_size) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Sizes WHERE info_size = ?`,
                [info_size]
            );

            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    getSizes: async () => {
        const [rows, fields] = await connection.execute('SELECT * FROM Sizes');
        return rows
    },
    updateSize: async (id, data) => {
        console.log('update')
        try {
            const [rows, fields] = await connection.execute(
                `update Items set infor_size=? where id=?`,
                [
                    data.info_size,
                    id,
                ]);
            if (rows.affectedRows === 0) {
                throw new Error('Item not found');
            }

            return rows[0]
        } catch (error) {
            throw error;
        }
    },

};