const express = require("express");
const app = express();


const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require('express-session');
const MongoStore = require('connect-mongo');
require("dotenv").config();
var cookieParser = require('cookie-parser');
const Product = require("./models/Product");
const Order = require("./models/Order");


app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
 
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser(process.env.OUR_SECRET));

app.use(session({
    secret: process.env.OUR_SECRET,
    resave: false,
    saveUninitialized: false
  }));

  app.use(
    session({
      secret: process.env.OUR_SECRET,
      resave: false,
      saveUninitialized: true,
      store: MongoStore.create({
        mongoUrl: process.env.DATABASE_URL,
      }),
    })
  );

  mongoose.connect(process.env.DATABASE_URL)
    .then(() => { console.log("Connected to database!") })
    .catch((err) => { console.log("Connection failed!", err) });

app.get("/", (req,res) => {
    res.json("Seranova api")
})

app.post('/product/create', async (req, res) => {
    try {
      const { name, stock, dimensions } = req.body;
      const newProduct = new Product({ name, stock, dimensions });
      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Could not create product" });
    }
  });
  
  // Route to get all products
  app.get('/product/all', async (req, res) => {
    try {
      const products = await Product.find();
      res.json(products);
    } catch (error) {
      console.error("Error getting all products:", error);
      res.status(500).json({ error: "Could not get products" });
    }
  });
  
  // Route to get a product by ID
  app.get('/product/:id', async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      res.json(product);
    } catch (error) {
      console.error("Error getting product by ID:", error);
      res.status(500).json({ error: "Could not get product" });
    }
  });
  
  // Route to update a product by ID
  app.post('/product/edit/:id', async (req, res) => {
    try {
      const { name, stock, dimensions } = req.body;
      const product = await Product.findById(req.params.id);

      const editPayload = {
        name: name || product.name,
        stock: stock || product.stock,
        dimensions: dimensions || product.dimensions,
      }
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        editPayload,
      );
      if (!updatedProduct) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product by ID:", error);
      res.status(500).json({ error: "Could not update product" });
    }
  });
  
  // Route to delete a product by ID
  app.post('/product/delete/:id', async (req, res) => {
    try {
      const deletedProduct = await Product.findByIdAndDelete(req.params.id);
      if (!deletedProduct) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product by ID:", error);
      res.status(500).json({ error: "Could not delete product" });
    }
  });


  app.post("/order/create", async (req, res) => {
    try {
      const { products, totalPrice } = req.body;
        console.log(req.body)
        const newOrder = await new Order({
            products: products,
            price: totalPrice,
        })

        for (const product of products) {
            const qt = parseInt(product.quantity);
            const p = await Product.findByIdAndUpdate(product._id, { $inc: { stock: -qt } });
        }

        await newOrder.save();
      res.status(201).json("order placed");
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Could not create order" });
    }
  });
  
  function calculateTotalAmount(items) {
    let total = 0;
    console.log({items})
    for (const orderItem of items) {
      // Fetch the product price based on the order item
      // (You need to implement this logic to fetch the price from the Product model)
      const productPrice = /* Fetch the price from the Product model */
  
      total += productPrice * orderItem.quantity;
    }
    return total;
  }
  
  // Create a route to get all orders
  app.get("/order/all", async (req, res) => {
    try {
      const orders = await Order.find().populate('products').sort({createdAt: "desc"});
      res.json(orders);
    } catch (error) {
      console.error("Error getting all orders:", error);
      res.status(500).json({ error: "Could not get orders" });
    }
  });
  
  app.get('/order/count', async (req, res) => {
    try {
      const orderCount = await Order.countDocuments();
      res.json(orderCount);
    } catch (error) {
      console.error('Error getting order count:', error);
      res.status(500).json({ error: 'Could not get order count' });
    }
  });

  // Create a route to get an order by its ID
  app.get("/order/:id", async (req, res) => {
    try {
      const orderId = req.params.id;
      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
  
      res.json(order);
    } catch (error) {
      console.error("Error getting order by ID:", error);
      res.status(500).json({ error: "Could not get order" });
    }
  });

app.listen(process.env.PORT, () => console.log(`listening on http://localhost:${process.env.PORT}`));