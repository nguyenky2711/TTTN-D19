const connection = require("../config/database");

const getAllUser = async () => {
    let [results, fields] = await connection.query('SELECT * FROM Users');
    return results
}
const getUserByID = async (id) => {
    let [results, fields] = await connection.query(`SELECT * FROM Users where id = ?`, [id]);
    let user = results && results.length > 0 ? results[0] : {}

    return user
}
const updateUserByID = async (email, name, city, id) => {
    let [results, fields] = await connection.query(`UPDATE Users SET email = ?, name =?, city = ? where id = ?`, [email, name, city, id]);
    let user = results && results.length > 0 ? results[0] : {}

    return user
}
const deleteUserByID = async ( id) => {
    let [results, fields] = await connection.query(`DELETE FROM Users WHERE  id = ?`, [ id]);
    let user = results && results.length > 0 ? results[0] : {}

    return user
}
module.exports = {
    getAllUser, getUserByID, updateUserByID, deleteUserByID
}