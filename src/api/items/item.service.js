const connection = require("../../config/database");
module.exports = {
    createItem: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `INSERT INTO Items (name,description, guide, type_id,status_id)
          VALUES (?, ?, ?,?,?)`,
                [
                    data.name,
                    data.description,
                    data.guide,
                    data.type_id,
                    2
                ]
            );

            // Check if the insert operation was successful
            if (rows.affectedRows === 1) {
                return rows.insertId // Return the inserted ID
            } else {
                throw new Error("Failed to insert item");
            }
        } catch (error) {
            throw error;
        }
    },
    getItemById: async (id, nameItem, typeItem) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Items WHERE id = ? `,
                [id]
            );

            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    getItems: async () => {
        const [rows, fields] = await connection.execute('SELECT * FROM Items');
        return rows
    },
    updateItem: async (id, data) => {
        console.log('update')
        try {
            const [rows, fields] = await connection.execute(
                `update Items set name=?, description=?, guide=?, type_id=? where id=?`,
                [
                    data.name,
                    data.description,
                    data.guide,
                    data.type_id,
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
    createImage: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `INSERT INTO Images (name, item_id, url)
          VALUES (?, ?,?)`,
                [
                    data.name,
                    data.item_id,
                    data.url,
                ]
            );

            // Check if the insert operation was successful
            if (rows.affectedRows === 1) {
                return rows.insertId // Return the inserted ID
            } else {
                throw new Error("Failed to insert images");
            }
        } catch (error) {
            throw error;
        }
    },
    getItemByName: async (name) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT id FROM Items WHERE name = ?`,
                [name]
            );

            return rows[0];
        } catch (error) {
            throw error;
        }
    },
    getSizeByInfo: async (info_size) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT id FROM Sizes WHERE info_size = ?`,
                [info_size]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    getThingById: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Things WHERE id = ?`,
                [id]
            );

            return rows[0];
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

    filterThingByName: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Things WHERE (name LIKE '%?%' AND id=?)`,
                [
                    data.name,
                    data.id
                ]
            );

            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    createThing: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `INSERT INTO Things (name,type_id)
          VALUES (?,?)`,
                [
                    data.name,
                    data.type_id
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
    createSize: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `INSERT INTO Sizes (info_size)
          VALUES (?)`,
                [
                    data,
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
    createReceipt: async (created_at, created_by, items_id) => {
        try {
            const [rows, fields] = await connection.execute(
                `INSERT INTO Receipts (created_at, created_by, items_id)
          VALUES (?,?,?)`,
                [
                    created_at,
                    created_by,
                    items_id
                ]
            );
            // Check if the insert operation was successful
            if (rows.affectedRows === 1) {
                await connection.execute('CALL UpdateProductMaxPrice()');

                return rows.insertId // Return the inserted ID
            } else {
                throw new Error("Failed to insert user");
            }
        } catch (error) {
            throw error;
        }
    },
    getProducts: async () => {
        const [rows1, fields1] = await connection.execute('SELECT DISTINCT thing_id, size_id FROM Items');
        const [rows2, fields2] = await connection.execute('SELECT thing_id, size_id FROM Products');
        const array2Set = new Set(rows2.map(obj => JSON.stringify(obj)));

        const difference = rows1.filter(obj => !array2Set.has(JSON.stringify(obj)));

        const result = difference;
        if (result) {
            console.log(result);
            for (index in result) {
                await connection.execute(
                    `INSERT INTO Products (thing_id, size_id)
                    VALUES (?, ?)`,
                    [
                        result[index].thing_id,
                        result[index].size_id
                    ])
            }
        }
        const [rows3, fields3] = await connection.execute('SELECT * FROM Products');

        return rows3
    },
    updateProduct: async (temp) => {
        try {
            const [rows, fields] = await connection.execute(
                `update Products set stock=? where id=?`,
                [
                    temp.stock,
                    temp.id,
                ]);
            if (rows.affectedRows === 0) {
                throw new Error('Item not found');
            }
            const item = await connection.execute(
                `select * from Products  where id=?`,
                [
                    temp.id
                ]);
            return item[0][0]
        } catch (error) {
            throw error;
        }
    },
    updateThingById: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `UPDATE Things SET name=?, description=?, guide=?, type_id=? WHERE id=?`,
                [
                    data.name,
                    data.description,
                    data.guide,
                    data.type_id,
                    data.id
                ]
            );

            if (rows.affectedRows === 0) {
                throw new Error('Item not found');
            }

            return { success: true, message: 'Item updated successfully' };
        } catch (error) {
            throw error;
        }
    },
    getNothing: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `SET @items_id := (SELECT items_id FROM Receipts WHERE id = ?);`,
                [data]
            );
            const [result, _] = await connection.execute(
                `CALL splitString(@items_id, ',');`
            );
            return result[0];
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    updateStock: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Items WHERE id = ?;`,
                [id]
            );

            const quantity = rows[0].quantity;
            const thingId = rows[0].thing_id;
            const sizeId = rows[0].size_id;

            const [rows2, fields2] = await connection.execute(
                `SELECT * FROM Products WHERE thing_id = ? AND size_id = ?;`,
                [thingId, sizeId]
            );

            const stock = rows2[0].stock;
            const productId = rows2[0].id;

            const newStock = stock + quantity;

            const [rows3, fields3] = await connection.execute(
                `UPDATE Products SET stock = ? WHERE id = ?;`,
                [newStock, productId]
            );

            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    getImageByName: async (name) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Images WHERE name = ?`,
                [name]
            );

            return rows;
        } catch (error) {
            throw error;
        }
    },
    getImageByItemId: async (item_id) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Images WHERE item_id = ?`,
                [item_id]
            );

            return rows;
        } catch (error) {
            throw error;
        }
    },
    deleteImageByName: async (name, item_id) => {
        try {
            const [rows, fields] = await connection.execute(
                `DELETE  FROM Images WHERE name = ? and item_id=?`,
                [name, item_id]
            );

            return rows;
        } catch (error) {
            throw error;
        }
    },
    deleteItem: async (id) => {
        try {
            const [rows, fields] = await connection.execute(
                `update Items set status_id=? where id=?`,
                [
                    10,
                    id,
                ]);
            if (rows.affectedRows === 0) {
                throw new Error('Item not found');
            }

            return rows
        } catch (error) {
            throw error;
        }
    },
    activeStatusItem: async (temp) => {
        try {
            const [rows, fields] = await connection.execute(
                `update Items set status_id=? where id=?`,
                [
                    1,
                    temp.id,
                ]);
            if (rows.affectedRows === 0) {
                throw new Error('Item not found');
            }

            return rows
        } catch (error) {
            throw error;
        }
    },
    getReviews: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Review`,

            );

            return rows;
        } catch (error) {
            throw error;
        }
    },
    getReviewById: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Review  where id=?`,
                [data]
            );

            return rows[0];
        } catch (error) {
            throw error;
        }
    },
    getReviewByItemId: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `SELECT * FROM Review  where item_id=?`,
                [data]
            );

            return rows;
        } catch (error) {
            throw error;
        }
    },
    getReviewByItemIdUserIdOrderId: async (data) => {
        try {
            console.log(data)

            const [rows, fields] = await connection.execute(
                `SELECT reviewed FROM Review  WHERE item_id=? AND order_id=? AND created_by=? `,
                [
                    data.item_id,
                    data.order_id,
                    data.created_by,
                ]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    },
    createReviewSlot: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `INSERT INTO Review (id, item_id, created_by, rating, text, modifield_time, imageUrl, reviewed,order_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.id,
                    data.item_id,
                    data.created_by,
                    null,
                    null,
                    data.modifield_time,
                    null,
                    0,
                    data.order_id,
                ]
            );
            // Check if the insert operation was successful
            if (rows.affectedRows === 1) {
                return rows.insertId // Return the inserted ID
            } else {
                throw new Error("Failed to insert revie slot");
            }
        } catch (error) {
            throw error;
        }
    },
    updateReviewSlot: async (data) => {
        try {
            const [rows, fields] = await connection.execute(
                `update Review set  created_by=?, rating=?, text=?, modifield_time=?, like=?, dislike=?, purchased=? where id=? and product_id=?`,
                [
                    data.created_by,
                    data.rating,
                    data.text,
                    data.modifield_time,
                    data.like,
                    data.dislike,
                    data.purchased,
                    data.id,
                    data.product_id,
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