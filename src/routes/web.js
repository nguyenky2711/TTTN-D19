const express = require('express')
const router = express.Router()
const { getHomePage, getNTK, getabc, postCreateUser, getCreateUser, getUpdateUser,putUpdateUser, deleteUser, getDeleteUser } = require('../controllers/homeController')
// router.Method('route', handler)

router.get('/', getHomePage)
router.get('/abc', getabc)
router.get('/ntk', getNTK)
router.get('/create', getCreateUser)
router.get('/update/:id', getUpdateUser)

router.post('/create-user', postCreateUser)
router.post('/update-user', putUpdateUser)
router.post('/delete-user/:id', getDeleteUser)
router.post('/delete-user', deleteUser)



module.exports = router