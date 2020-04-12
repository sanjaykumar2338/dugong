$(document).ready(function(){
  var handler = StripeCheckout.configure({
  key: 'pk_test_c7qV6O2YfkWJDOsxb81NTU2W',
  image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
  token: function(token) {
    var items = []
        var cartItemContainer = document.getElementsByClassName('cart-items')[0]
        var cartRows = cartItemContainer.getElementsByClassName('cart-row')
        var shipping_method = document.getElementsByClassName('shipping_method')[0].value
        var other_info = document.getElementsByClassName('other_info')[0].value
        
        var recept = document.getElementsByClassName('recept')[0].value
        var street = document.getElementsByClassName('street')[0].value
        var state = document.getElementsByClassName('state')[0].value
        var country = document.getElementsByClassName('country')[0].value
		var zipcode = document.getElementsByClassName('zipcode')[0].value
		
        for (var i = 0; i < cartRows.length; i++) {
            var cartRow = cartRows[i]
            var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
            var priceElement = cartRow.getElementsByClassName('cart-price')[0]
            
            var price = priceElement.innerHTML.replace(/[^0-9]/gi, '');
            price = price / 100;
            
            var quantity = quantityElement.value
            var id = cartRow.dataset.itemId
            var nameElement = cartRow.getElementsByClassName('cart-item-title')[0]
            var name = nameElement.innerHTML;
            items.push({
                id: id,
                name: name,
                quantity: quantity,
                price:price
            })
            
        }

        fetch('/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                stripeTokenId: token.id,
                items: items,
                shipping_method:shipping_method,
                other_info:other_info,
                recept:recept,
                street:street,
                state:state,
                country:country,
				zipcode:zipcode
            })
        }).then(function(res) {
            return res.json()
        }).then(function(data) {
            alert(data.message)
            var cartItems = document.getElementsByClassName('cart-items')[0]
            while (cartItems.hasChildNodes()) {
                cartItems.removeChild(cartItems.firstChild)
            }

            updateCartTotal()
        }).catch(function(error) {
            console.error(error);
        })
  }
});

   $('#customButtonBankTranser').on('click', function(e) {
    var amt = $('.cart-total-price').text().replace(/[^0-9]/gi, '');
    if(amt==0){
      alert('Card is empty');
      return;
    }

    var recept = document.getElementsByClassName('recept')[0].value

    $('html, body').animate({
      scrollTop: $(".cart-total-price").offset().top
    }, 2000);

    if(recept==0){
      alert('Recept is required!');
      return;
    }

    var street = document.getElementsByClassName('street')[0].value

    if(street==0){
      alert('Street is required!');
      return;
    }

    var state = document.getElementsByClassName('state')[0].value

    if(state==0){
      alert('State is required!');
      return;
    }

    var country = document.getElementsByClassName('country')[0].value

    if(country==0){
      alert('Country is required!');
      return;
    }
	
	$('html, body').animate({
      scrollTop: $(".cart-total-price").offset().top
    });
	
	setTimeout(function(){
    let random_number = Math.floor(Math.random() * (100000000000 - 9 + 1)) + 9;
	$('#popup1').find('#iban_bank_random_number').val(random_number);
	$('#popup1').css({"visibility": "visible", "opacity": "1"});
	},2000);
	return;
    
    var cartItemContainer = document.getElementsByClassName('cart-items')[0]
    var cartRows = cartItemContainer.getElementsByClassName('cart-row')
    
    var total_price = [];
    for (var i = 0; i < cartRows.length; i++) {
      var cartRow = cartRows[i]
      var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
      var priceElement = cartRow.getElementsByClassName('cart-price')[0]
      
      var price = priceElement.innerHTML.replace(/[^0-9]/gi, '');
      price = price / 100;
      
      var quantity = quantityElement.value
      var id = cartRow.dataset.itemId
      var nameElement = cartRow.getElementsByClassName('cart-item-title')[0]
      var name = nameElement.innerHTML;
      
      var item_price = parseFloat(price) * parseInt(quantity);      
      total_price.push(item_price);
    }

    var sum = total_price.reduce(function(a, b){
        return a + b;
    }, 0);

    console.log(sum,'sum')
    //amt = sum / 100;
    amt = sum;
    console.log(amt,'amt');
    var amountInCents = Math.floor(amt * 100);
    console.log(amountInCents,'amountInCents')

    handler.open({
      name: 'Dugong',
      amount: amountInCents,
      currency:'eur',
      email:''
    });
    
    e.preventDefault();
  });
  
  $('.close').on('click',function(){
	$('#popup1').removeAttr("style");
  });
  
  $('#customButton').on('click', function(e) {
    var amt = $('.cart-total-price').text().replace(/[^0-9]/gi, '');
    if(amt==0){
      alert('Card is empty');
      return;
    }

    var recept = document.getElementsByClassName('recept')[0].value

    $('html, body').animate({
      scrollTop: $(".cart-total-price").offset().top
    }, 2000);

    if(recept==0){
      alert('Recept is required!');
      return;
    }

    var street = document.getElementsByClassName('street')[0].value

    if(street==0){
      alert('Street is required!');
      return;
    }

    var state = document.getElementsByClassName('state')[0].value

    if(state==0){
      alert('State is required!');
      return;
    }

    var country = document.getElementsByClassName('country')[0].value

    if(country==0){
      alert('Country is required!');
      return;
    }
    
    var cartItemContainer = document.getElementsByClassName('cart-items')[0]
    var cartRows = cartItemContainer.getElementsByClassName('cart-row')
    
    var total_price = [];
    for (var i = 0; i < cartRows.length; i++) {
      var cartRow = cartRows[i]
      var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
      var priceElement = cartRow.getElementsByClassName('cart-price')[0]
      
      var price = priceElement.innerHTML.replace(/[^0-9]/gi, '');
      price = price / 100;
      
      var quantity = quantityElement.value
      var id = cartRow.dataset.itemId
      var nameElement = cartRow.getElementsByClassName('cart-item-title')[0]
      var name = nameElement.innerHTML;
      
      var item_price = parseFloat(price) * parseInt(quantity);      
      total_price.push(item_price);
    }

    var sum = total_price.reduce(function(a, b){
        return a + b;
    }, 0);

    console.log(sum,'sum')
    //amt = sum / 100;
    amt = sum;
    console.log(amt,'amt');
    var amountInCents = Math.floor(amt * 100);
    console.log(amountInCents,'amountInCents')

    handler.open({
      name: 'Dugong',
      amount: amountInCents,
      currency:'eur',
      email:''
    });
    
    e.preventDefault();
  });

  // Close Checkout on page navigation
  $(window).on('popstate', function() {
    handler.close();
  });

  $('.stripe-button-el').hide();
  
  //pagination
  
      makePager = function(page){
	  var show_per_page = 8;
		var number_of_items = $('#gridshop .selectt').size();
		var number_of_pages = Math.ceil(number_of_items / show_per_page);
		var number_of_pages_todisplay = 5;
            var navigation_html = '';
            var current_page = page;
            var current_link = (number_of_pages_todisplay >= current_page ? 1 : number_of_pages_todisplay + 1);
            if (current_page > 1)
                current_link = current_page;
            if (current_link != 1) navigation_html += "<a class='nextbutton' href=\"javascript:first();\">« Start&nbsp;</a>&nbsp;<a class='nextbutton' href=\"javascript:previous();\">« Prev&nbsp;</a>&nbsp;";
            if (current_link == number_of_pages - 1) current_link = current_link - 3;
            else if (current_link == number_of_pages) current_link = current_link - 4;
            else if (current_link > 2) current_link = current_link - 2;
            else current_link = 1;
            var pages = number_of_pages_todisplay;
            while (pages != 0) {
                if (number_of_pages < current_link) { break; }
                if (current_link >= 1)
                    navigation_html += "<a class='" + ((current_link == current_page) ? "currentPageButton" : "numericButton") + "' href=\"javascript:showPage(" + current_link + ")\" longdesc='" + current_link + "'>" + (current_link) + "</a>&nbsp;";
                current_link++;
                pages--;
            }
            if (number_of_pages > current_page){
                navigation_html += "<a class='nextbutton' href=\"javascript:next()\">Next »</a>&nbsp;<a class='nextbutton' href=\"javascript:last(" + number_of_pages + ");\">Last »</a>";
            }
                    $('#page_navigation').html(navigation_html);
      }
      var pageSize = 8;
      showPage = function (page) {
            $('#gridshop .selectt').hide();
            $('#current_page').val(page);
            $('#gridshop .selectt').each(function (n) {
                if (n >= pageSize * (page - 1) && n < pageSize * page)
                    $(this).show();
            });
        makePager(page);
       }
        showPage(1);
       next = function () {
            new_page = parseInt($('#current_page').val()) + 1;
            showPage(new_page);
        }
        last = function (number_of_pages) {
            new_page = number_of_pages;
            $('#current_page').val(new_page);
            showPage(new_page);
        }
        first = function () {
            var new_page = "1";
            $('#current_page').val(new_page);
            showPage(new_page);    
      }
        previous = function () {
            new_page = parseInt($('#current_page').val()) - 1;
            $('#current_page').val(new_page);
            showPage(new_page);
      }
});