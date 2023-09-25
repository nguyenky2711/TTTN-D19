const express = require('express')
const routerAPI = express.Router()
// router.Method('route', handler)

routerAPI.get('/', (req, res) => {
    res.send('hello')
})
routerAPI.get('/abc', (req, res) => {
    res.status(201).json({
        data: 'helollo'
    })
})
routerAPI.get('/users', (req, res) => {
    res.status(201).json({
        data: 'helollo'
    })
})



module.exports = routerAPI