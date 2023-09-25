const connection = require('../config/database')
const { getAllUser, getUserByID, updateUserByID, deleteUserByID } = require('../service/CRUDService')

const getHomePage = async (req, res) => {
    let results = await getAllUser()
    console.log(results)
    return res.render('homePage.ejs', { listUser: results })
}
const getCreateUser = (req, res) => {
    return res.render('createUser.ejs')
}
const getabc = (req, res) => {
    res.send('Hello World abc!')
}
const getNTK = (req, res) => {
    res.render('sample.ejs')
}
const getUpdateUser = async (req, res) => {
    // console.log(req.params)
    const userID = req.params.id;
    let user = await getUserByID(userID);
    res.render('editUser.ejs', { user: user })
}

const postCreateUser = async (req, res) => {
    console.log(req.body)
    let email = req.body.email
    let name = req.body.name
    let city = req.body.city

    let [results, fields] = await connection.query(
        `INSERT INTO Users (email,name,city) VALUES ( ?, ?, ?)`, [email, name, city],
    );
    console.log(results)
    res.send('create user succeed')
}
const putUpdateUser = async (req, res) => {
    console.log(req.body)
    let email = req.body.email
    let name = req.body.userName
    let city = req.body.city
    let id = req.body.userID
    const results = await updateUserByID(email, name, city, id)
    console.log(results)
    res.redirect('/')
    // res.send('Update user succeed')
}
const getDeleteUser = async (req, res) => {
    const userID = req.params.id;
    let user = await getUserByID(userID);
    res.render('deleteUser.ejs', { user: user })
}
const deleteUser = async (req, res) => {
    let id = req.body.userID
    const results = await deleteUserByID(id)
    console.log(results)
    res.redirect('/')
}
module.exports = {
    getHomePage,
    getCreateUser,
    getUpdateUser,
    getNTK,
    getabc,
    postCreateUser,
    putUpdateUser,
    getDeleteUser,
    deleteUser,
}