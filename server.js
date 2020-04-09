if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

const express = require('express')
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)
var bodyParser = require('body-parser');
let mysql = require('mysql');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');

const app = express();

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());
app.use(cookieParser());
app.use(session({secret: 'secret123',saveUninitialized:true,resave:true}));

//- MYSQL Module
try{
    var mysql_npm = require('./node_modules/mysql');
}catch(err){
    console.log("Cannot find `mysql` module. Is it installed ? Try `npm install mysql` or `npm install`.");
}

//- Connection configuration
var db_config = {
    host         : 'localhost',
    user         : 'root',
    password     : '',
    database     : 'dugong'
};

//- Create the connection variable
var connection = mysql_npm.createConnection(db_config)



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

//Manage All the routes of Admin
var year = new Date().getFullYear();

//For Products
app.get("/admin", async  (req, res) => {
  res.render('admin/main.ejs',{year:year});
});

app.get("/admin/product", async  (req, res) => {
  res.render('admin/product/products.ejs',{year:year});
});

app.get("/admin/padd", async  (req, res) => {
  res.render('admin/product/new_product.ejs',{year:year});
});

//For Category
app.get("/admin/category", async  (req, res) => {
  res.locals.message = req.flash();
	
  connection.query('Select * from category', function(err,result) {
	  res.render('admin/category/index.ejs',{year:year,result:result});
  });	  

});

app.get("/admin/cadd", async  (req, res) => {
  res.render('admin/category/add.ejs',{year:year});
});

app.post("/admin/savecategory", async  (req, res) => {
	var name = req.body.name;
	
	var values = [];
	values.push([name]);
	
	connection.query('INSERT INTO category (name) VALUES ?', [values], function(err,result) {
		if(err) {
		  console.log('insert error',err);
		}
		else {
		  console.log('inserted success');
		}
	});
	
	res.redirect('/admin/category');
});

app.get("/admin/delete_category", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "DELETE FROM category WHERE id = '"+id+"'";
    connection.query(sql, function(err,result) {
		req.flash('success', 'Category Deleted successfully');
		res.redirect('/admin/category');
	});
});

app.listen(4000)
