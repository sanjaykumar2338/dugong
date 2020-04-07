if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}



const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

const express = require('express')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)
var bodyParser = require('body-parser');
let mysql = require('mysql');

let connection = mysql.createConnection({
  host: process.env.HOSTNAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/store', function(req, res) {
  fs.readFile('items.json', function(error, data) {
    if (error) {
      res.status(500).end()
    } else {
      
      //shipping_method_arr = [];
      fs.readFile('shipping_method.json', (err, shipping_method_arr) => {
        if (err) throw err;
        //console.log(shipping_method_arr);
      
      
      res.render('store.ejs', {
        stripePublicKey:stripePublicKey,
        items: JSON.parse(data),
        shipping_method_arr:JSON.parse(shipping_method_arr)
      })
    });
    }
  })
});

app.get('/checkout', async (req, res) => {
  res.render('checkout');
});

app.get('/stripe_payment', function(req, res) {
  res.render('charge.ejs');
});

app.get("/admin", async  (req, res) => {
  res.render('admin/main.ejs');
});

app.post('/checkout', function(req, res) {
      const itemsArray = req.body.items;
      let total = 0
      req.body.items.forEach(function(item) {
        total = total + item.price * item.quantity
      })

      total = total.toFixed(2);
      total = parseFloat(total);
      var amountInCents = Math.floor(total * 100);

      stripe.charges.create({
        amount: amountInCents,
        source: req.body.stripeTokenId,
        currency: 'eur'
      }).then(function(response) {
        console.log('Charge Successful',response);

        connection.connect(function(err) {
          if (err) {
            console.error('error: ' + err.message);
          }

          var charge_id = response.id;
          var responseJson = JSON.stringify(req.body.items);
          var values = [];
          values.push([charge_id,responseJson,req.body.shipping_method,req.body.other_info,req.body.recept,req.body.street,req.body.state,req.body.country]);
          
          connection.query('INSERT INTO orders (stripe_charge_it, order_data,shipping_method,other_info,recept,street,state,country) VALUES ?', [values], function(err,result) {
            if(err) {
              console.log('insert error',err);
            }
           else {
              console.log('inserted success');
            }
          });
         
          console.log('Connected to the MySQL server.');
        });


        res.json({ message: 'Successfully purchased items' })
      }).catch(function(err) {
        console.log('Charge Fail',err)
        res.status(500).end()
      })
})

app.listen(4000)
