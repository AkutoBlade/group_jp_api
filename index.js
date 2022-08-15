require("dotenv").config();
const db = require("./config/dbconn");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const PORT = process.env.PORT || 3000;
app.use(
  router,
  express.json(),
  express.urlencoded({
    extended: true,
  })
);

app.use(cors({
    origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
    credentials: true
 }));

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/index.html"));
  //   res.sendFile("./views/index.html", {root : __dirname});
});
// router.get("/users/register", (req, res) => {
//   res.sendFile(path.join(__dirname, "./views/register.html"));
// });
// router.get("/users/login", (req, res) => {
//   res.sendFile(path.join(__dirname, "./views/login.html"));
// });
app.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Sever http://localhost:${PORT} is running`);
});

// Users
//------------------------------------------------------------------------------------------------

//Users
app.post('/users/register', bodyParser.json(), async (req, res) => {
  const emails = `SELECT email FROM users WHERE ?`;
  let details = {
      email: req.body.email,
  }

  db.query(emails, details, async (err, results) =>{
    if(results.length > 0){
   res.send("Email Exist");
  console.log(results.length)
    }else{
    let bd = req.body;
  console.log(bd);
  bd.user_password = await bcrypt.hash(bd.user_password, 10)
  bd.join_date = `${new Date().toISOString().slice(0, 10)}`;
  if (bd.user_role === '' || bd.user_role === null) {
    bd.user_role = 'user'
  }
  let sql = `INSERT INTO users (user_fullname, email, user_password, user_role, phone_number , join_date)VALUES (?, ?, ?, ?, ?, ?);`
  db.query(sql, [bd.user_fullname, bd.email, bd.user_password, bd.user_role, bd.phone_number, bd.join_date], (err, results) => {
    if (err) throw err
    else {
      res.redirect('/users/login')
    }
  })};
  })

});

//Login users
app.post('/users/login',bodyParser.json(),(req,res) => {
  let sql = `SELECT * FROM users WHERE email LIKE ?`
  let email = {
    email : req.body.email
  }
  db.query(sql,email.email, async (err,results) => {
    if(err) throw err
    if(results.length === 0){
      res.send(`No email found`)
    }else{
      const isMatch = await bcrypt.compare(req.body.user_password, results[0].user_password);
      if(!isMatch){
        res.send('Password is Incorrect')
      }else{
        const payload = {
          user: {
              user_fullname: results[0].user_fullname,
              email: results[0].email,
              user_password: results[0].user_password,
              user_role: results[0].user_role,
              phone_number: results[0].phone_number,
              join_date: results[0].join_date
          },
      };
      jwt.sign(payload, process.env.jwtsecret, {
          expiresIn: "365d"
      }, (err, token) => {
          if (err) throw err;
          // res.send(token)
          // res.json({
          //   msg: results,
          //   token
          // })
          res.redirect('/')
      });
      }
    }
  })
});

//Specific users
router.get('/users/:user_id', (req, res) => {
  // Query
  const strQry =
      `
  SELECT user_id, user_fullname, email, user_password, user_role, phone_number, join_date, cart
  FROM users
  WHERE user_id = ?;
  `;
  db.query(strQry, [req.params.user_id], (err, results) => {
      if (err) throw err;
      res.json({
          status: 200,
          results: (results.length <= 0) ? "Sorry, no user was found." : results
      })
  })
});

//get all users
router.get('/users', (req, res) => {
  // Query
  const strQry =
      `
  SELECT user_id, user_fullname , email, user_password, user_role, phone_number, join_date, cart FROM users ;
  `;
  db.query(strQry, (err, results) => {
      if (err) throw err;
      res.json({
          status: 200,
          results: results
      })
      console.log(err)
  })
});

//update Or edit user
router.put('/users/:user_id',bodyParser.json(),(req, res) => {
  const bd = req.body;
 bd.user_password =  bcrypt.hashSync(bd.user_password, 10)
  // Query
  const strQry =
      `UPDATE users
   SET user_fullname = ?, email = ?, phone_number = ?, user_password = ?
   WHERE user_id = ${req.params.user_id}`;
   
   

  db.query(strQry, [bd.user_fullname, bd.email, bd.phone_number,  bd.user_password], (err, data) => {
      if (err) throw err;
      res.send(`number of affected record/s: ${data.affectedRows}`);
  })
});

//Delete a specific user
router.delete('/users/:user_id', (req, res) => {
  // Query
  const strQry =
      `
  DELETE FROM users
  WHERE user_id = ?;
  `;
  db.query(strQry, [req.params.user_id], (err, data, fields) => {
      if (err) throw err;
      res.send(`${data.affectedRows} row was affected`);
  })
});

// Products
//--------------------------------------------------------------------------------------------------------

//create products
router.post('/products', bodyParser.json(),
    (req, res) => {
        try {

            const bd = req.body;
            bd.totalamount = bd.quantity * bd.price;
            // Query
            const strQry =
                `
        INSERT INTO products(title, category, img, product_description, price)
        VALUES(?, ?, ?, ?, ?);
        `;
            //
            db.query(strQry,
                [bd.title, bd.category, bd.img, bd.product_description, bd.price],
                (err, results) => {
                    if (err) throw err
                    res.send(`number of affected row/s: ${results.affectedRows}`);
                })
        } catch (e) {
            console.log(`Create a new product: ${e.message}`);
        }
    });

//get products
router.get('/products', (req, res) => {
  // Query
  const strQry =
      `
  SELECT product_id, title , category, product_description, img, price, created_by FROM products;
  `;
  db.query(strQry, (err, results) => {
      if (err) throw err;
      res.json({
          status: 200,
          results: results
      })
      console.log(err)
  })
});

//get specific
router.get('/products/:product_id', (req, res) => {
  // Query
  const strQry =
      `
  SELECT product_id, title, category, product_description, img, price, created_by
  FROM products
  WHERE product_id = ?;
  `;
  db.query(strQry, [req.params.product_id], (err, results) => {
      if (err) throw err;
      res.json({
          status: 200,
          results: (results.length <= 0) ? "Sorry, no product was found." : results
      })
  })
});
// Update product
router.put('/products', (req, res) => {
  const bd = req.body;
  // Query
  const strQry =
      `UPDATE products
   SET ?
   WHERE id = ?`;

  db.query(strQry, [bd.id], (err, data) => {
      if (err) throw err;
      res.send(`number of affected record/s: ${data.affectedRows}`);
  })
});

// Delete product
router.delete('/clinic/:id', (req, res) => {
  // Query
  const strQry =
      `
  DELETE FROM products 
  WHERE id = ?;
  `;
  db.query(strQry, [req.params.id], (err, data, fields) => {
      if (err) throw err;
      res.send(`${data.affectedRows} row was affected`);
  })
});

// Cart
//---------------------------------------------------------------------------

//Get specific user's cart
app.get('/users/:user_id/cart', (req, res) => {
  let sql = `SELECT cart FROM users WHERE user_id = ${req.params.user_id}`
  db.query(sql, (err, results) => {
    if (err) throw err
    res.json({
      status: 200,
      results: JSON.parse(results[0].cart)
    })
  })
})

//Add items to the user's specific cart
app.post('/users/:user_id/cart', bodyParser.json(), (req, res) => {
  let bd = req.body
  let sql = `SELECT cart FROM users WHERE user_id = ${req.params.id}`
  db.query(sql, (err, results) => {
    if (err) throw err
    if (results.length > 0) {
      let cart;
      if (results[0].length == null) {
        cart = []
      } else {
        cart = JSON.parse(results[0].cart)
      }
      let product = {
        "product_id": cart.length + 1,
        "title": bd.title,
        "category": bd.category,
        "product_description": bd.product_description,
        "img": bd.img,
        "price": bd.price,
        "create_by": bd.create_by
      }
      cart.push(product)
      let sql1 = `UPDATE users SET cart = ? WHERE user_id = ${req.params.id}`
      db.query(sql1, JSON.stringify(cart), (err, results) => {
        if (err) throw results
        res.send(`Product added to your cart`)
      })
    }
  })
});

//Delete items from the specific user's cart
app.delete('/users/:user_id/cart', bodyParser.json(), (req, res) => {
  let bd = req.body
  let sql = `UPDATE users SET cart = null WHERE user_id = ${req.params.id}`
  db.query(sql, (err, results) => {
    if (err) throw err
    res.send('Cart is empty')
  })
})