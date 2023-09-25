require('dotenv').config()
const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const connection = require('./config/database')
const configViewEngine = require('./config/viewEngine')
// const session = require('express-session')

const webRoutes = require('./routes/web')
const apiRoutes = require('./routes/api')
const userRouter = require("./api/users/user.router");
const itemRouter = require("./api/items/item.router");
const cartRouter = require("./api/carts/cart.router");
const orderRouter = require("./api/orders/order.router");
const accountRouter = require("./api/accounts/account.router");
const productRouter = require("./api/products/product.router")
const sizeRouter = require("./api/sizes/size.router")
const app = express()
app.use(cors());
const port = process.env.PORT || 3000
const host = process.env.HOST

//config req.body
app.use(express.json()) //for json
app.use(express.urlencoded({ extended: true })) //for form data
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/items", itemRouter);
app.use("/api/carts", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api", accountRouter);
app.use("/api/sizes", sizeRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, host, () => {
  console.log(`Example app listening on port ${port}`)
})