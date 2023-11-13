const connection = require("../../config/database");

module.exports = {
    createUser: async (data) => {
        try {
            // Check if the email already exists
            const [rows, fields] = await connection.execute(
                `INSERT INTO Users (email, password, name, address, phone, role, status_id, confirm, activeToken)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.email,
                    data.password,
                    data.name,
                    data.address,
                    data.phone,
                    "user",
                    1,
                    data.confirm,
                    data.activeToken
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
    getUserByUserEmail: async (email) => {
        try {
            const [rows, fields] = await connection.execute(`select * from Users where email = ?`,
                [email],);
            return rows[0]
        } catch (error) {
            throw error;
        }

    },
    getUserByConfirmationToken: async (token) => {
        try {
            const [rows, fields] = await connection.execute(`select * from Users where activeToken = ?`,
                [token],);
            return rows[0]
        } catch (error) {
            throw error;
        }

    },
    getUserByUserId: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT id, email, password, name, address, phone, role FROM Users WHERE id = ?`,
                [id]
            );

            return rows[0];
        } catch (error) {
            throw error;
        }
    },
    getUsers: async () => {
        const [rows, fields] = await connection.execute('SELECT id, email, name, address, phone FROM Users');
        return rows
    },
    updateUser: async (id, data) => {
        try {
            const [rows, fields] = await connection.execute(
                `update Users set  name=?, phone=?,  address=?  where id = ?`,
                [
                    data.name,
                    data.phone,
                    data.address,
                    id
                ]);
            if (rows.affectedRows === 0) {
                throw new Error('User not found');
            }
            return true
        } catch (error) {
            throw error;
        }
    },
    changeStatusUser: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `update Users set  status_id=? where id = ?`,
                [
                    data.status_id,
                    data.user_id
                ]);
            if (rows.affectedRows === 0) {
                throw new Error('User not found');
            }
            return true
        } catch (error) {
            throw error;
        }
    },
    getStatusDTO: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Status WHERE id = ?`,
                [id]
            );

            return rows[0];
        } catch (error) {
            throw error;
        }
    },
    confirmUser: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `update Users set  confirm=? where id = ?`,
                [
                    true,
                    data.id
                ]);
            if (rows.affectedRows === 0) {
                throw new Error('User not found');
            }
            return true
        } catch (error) {
            throw error;
        }
    },
    changePassword: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `update Users set  password=? where id = ?`,
                [
                    data.password,
                    data.id
                ]);
            if (rows.affectedRows === 0) {
                throw new Error('User not found');
            }
            return true
        } catch (error) {
            throw error;
        }
    },
    updateResetToken: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `update Users set  resetToken=? , resetExpiration =? where email = ?`,
                [
                    data.resetToken,
                    data.resetExpiration,
                    data.email
                ]);
            if (rows.affectedRows === 0) {
                throw new Error('User not found');
            }
            return true
        } catch (error) {
            throw error;
        }
    },
    getUserByResetToken: async (token) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT id, email, resetExpiration, confirm FROM Users WHERE resetToken = ?`,
                [token]
            );

            return rows[0];
        } catch (error) {
            throw error;
        }
    },
    resetPassword: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `update Users set  password=?, resetToken=?, resetExpiration=?  where id = ?`,
                [
                    data.password,
                    data.resetToken,
                    data.resetExpiration,
                    data.id
                ]);
            if (rows.affectedRows === 0) {
                throw new Error('User not found');
            }
            return true
        } catch (error) {
            throw error;
        }
    },
};
