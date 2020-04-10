if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

const express = require('express')
const path = require('path');
const crypto = require('crypto');
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)
var bodyParser = require('body-parser');
let mysql = require('mysql');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });

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

//console.log(connection,'testing');

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
	res.locals.message = req.flash();
	connection.query('Select product.id as product_id,product.title,product.description,product.price,product.image,product.image_org_name,category.name as category_name,size.name as size_name,country.name as country_name from product LEFT JOIN category ON category.id = product.category_id LEFT JOIN country ON country.id = product.country_id LEFT JOIN size ON size.id = product.size_id order by product.updated_at desc', function(err,result) {
		res.render('admin/product/products.ejs',{year:year,result:result});
	});
});

app.get("/admin/padd", async  (req, res) => {
	connection.query( 'SELECT * FROM category', function(err1,category_res) {
		connection.query( 'SELECT * FROM country', function(err2,country_res) {
			connection.query( 'SELECT * FROM size', function(err3,size_res) {
				res.render('admin/product/new_product.ejs',{year:year,category:category_res,country:country_res,size:size_res});
			});	
		});	
	});
});

app.get("/admin/edit_product", async  (req, res) => {
	let id = req.query.id;
	var sql = "Select * from product WHERE id = '"+id+"'";
	
	connection.query(sql, function(err,product_response) {
		var product_res = JSON.parse(JSON.stringify(product_response));
		
		connection.query( 'SELECT * FROM category', function(err1,category_res) {
			connection.query( 'SELECT * FROM country', function(err2,country_res) {
				connection.query( 'SELECT * FROM size', function(err3,size_res) {
					res.render('admin/product/edit_product.ejs',{year:year,category:category_res,country:country_res,size:size_res,product:product_res[0]});
				});	
			});	
		});
	});
});

app.post("/admin/save_product", async  (req, res) => {	
	
	let upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, path.join(__dirname, './'))
		},
		filename: (req, file, cb) => {
			// randomBytes function will generate a random name
			let customFileName = crypto.randomBytes(18).toString('hex')
			// get file extension from original file name
			let fileExtension = path.extname(file.originalname).split('.')[1];
			cb(null, customFileName + '.' + fileExtension)
		}
	  })
	})
	
	console.log(upload,'dddd');
		
	var values = [];
	values.push([req.body.title,req.body.description,req.body.price,req.body.country,req.body.category,req.body.size,'sss','dd']);
	
	var error = '';
	connection.query('INSERT INTO product (title,description,price,country_id,category_id,size_id,image,image_org_name) VALUES ?', [values], function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Product added successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/product');
	});
});

app.get("/admin/delete_product", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "DELETE FROM product WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Product Deleted successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/product');
	});
});

//For Category
app.get("/admin/category", async  (req, res) => {
  res.locals.message = req.flash();
	
  connection.query('Select * from category order by updated_at DESC', function(err,result) {
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
	
	var error = '';
	connection.query('INSERT INTO category (name) VALUES ?', [values], function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Category added successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/category');
	});
});

app.get("/admin/delete_category", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "DELETE FROM category WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Category Deleted successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/category');
	});
});

app.get("/admin/edit_category", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "SELECT * FROM category WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
			
		   req.flash('success',err.sqlMessage);
		   res.redirect('/admin/category');
		}
		else {
		   var result = JSON.parse(JSON.stringify(result));
		   res.render('admin/category/edit.ejs',{year:year,result:result[0]});
		}
	});
});

app.post("/admin/save_edit_category", async  (req, res) => {
	let id = req.query.id;
	
	var name = req.body.name;
	var sql = "UPDATE category SET name='"+name+"' WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		    error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		   error = 'Category updated successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/category');
	});
});

//For SIZE
app.get("/admin/size", async  (req, res) => {
  res.locals.message = req.flash();
	
  connection.query('Select * from size order by updated_at DESC', function(err,result) {
	  res.render('admin/size/index.ejs',{year:year,result:result});
  });	  

});

app.get("/admin/sadd", async  (req, res) => {
  res.render('admin/size/add.ejs',{year:year});
});

app.post("/admin/savesize", async  (req, res) => {
	var name = req.body.name;
	
	var values = [];
	values.push([name]);
	
	var error = '';
	connection.query('INSERT INTO size (name) VALUES ?', [values], function(err,result) {
		if(err) {
		   error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Size added successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/size');
	});
});

app.get("/admin/delete_size", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "DELETE FROM size WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Size Deleted successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/size');
	});
});

app.get("/admin/edit_size", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "SELECT * FROM size WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		   req.flash('success',err.sqlMessage);
		   res.redirect('/admin/size');
		}
		else {
		   var result = JSON.parse(JSON.stringify(result));
		   res.render('admin/size/edit.ejs',{year:year,result:result[0]});
		}
	});
});

app.post("/admin/save_edit_size", async  (req, res) => {
	let id = req.query.id;
	
	var name = req.body.name;
	var sql = "UPDATE size SET name='"+name+"' WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		   error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		   error = 'Size updated successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/size');
	});
});

//For Country
app.get("/admin/country", async  (req, res) => {
  res.locals.message = req.flash();
	
  connection.query('Select * from country order by updated_at DESC', function(err,result) {
	  res.render('admin/country/index.ejs',{year:year,result:result});
  });	  

});

app.get("/admin/coadd", async  (req, res) => {
  res.render('admin/country/add.ejs',{year:year});
});

app.post("/admin/savecountry", async  (req, res) => {
	var name = req.body.name;
	
	var values = [];
	values.push([name]);
	
	var error = '';
	connection.query('INSERT INTO country (name) VALUES ?', [values], function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Country added successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/country');
	});
});

app.get("/admin/delete_country", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "DELETE FROM country WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		  error = 'SQL ERROR '+err.sqlMessage;
		}
		else {
		  error = 'Country Deleted successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/country');
	});
});

app.get("/admin/edit_country", async  (req, res) => {
	let id = req.query.id;
	
	var sql = "SELECT * FROM country WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
			
		   req.flash('success',err.sqlMessage);
		   res.redirect('/admin/country');
		}
		else {
		   var result = JSON.parse(JSON.stringify(result));
		   res.render('admin/country/edit.ejs',{year:year,result:result[0]});
		}
	});
});

app.post("/admin/save_edit_country", async  (req, res) => {
	let id = req.query.id;
	
	var name = req.body.name;
	var sql = "UPDATE country SET name='"+name+"' WHERE id = '"+id+"'";
	var error = '';
    connection.query(sql, function(err,result) {
		if(err) {
		   error = err.sqlMessage;
		}
		else {
		   error = 'Country updated successfully';
		}
		
		req.flash('success',error);
		res.redirect('/admin/country');
	});
});

app.listen(4000)
