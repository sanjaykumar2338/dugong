$(document).ready(function(){
  var handler = StripeCheckout.configure({
  key: 'pk_test_BDlJ33LBsh5s6L69P5y3AAvp00ETkWe6tP',
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
                country:country
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
});