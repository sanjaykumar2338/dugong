if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready)
} else {
    ready()
}

function ready() {
    var removeCartItemButtons = document.getElementsByClassName('btn-danger')
    for (var i = 0; i < removeCartItemButtons.length; i++) {
        var button = removeCartItemButtons[i]
        button.addEventListener('click', removeCartItem)
    }

    var addToCartButtons = document.getElementsByClassName('shop-item-button')
    for (var i = 0; i < addToCartButtons.length; i++) {
        var button = addToCartButtons[i]
        button.addEventListener('click', addToCartClicked)
    }

    document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purchaseClicked)
}

//Handle Stripe Payment
function handleStripePayment() {
  window.location = './stripe_payment';
}

var stripeHandler = StripeCheckout.configure({
    key: stripePublicKey,
    locale: 'en',
    token: function(token) {
        var items = []
        var cartItemContainer = document.getElementsByClassName('cart-items')[0]
        var cartRows = cartItemContainer.getElementsByClassName('cart-row')
        for (var i = 0; i < cartRows.length; i++) {
            var cartRow = cartRows[i]
            var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
            var quantity = quantityElement.value
            var id = cartRow.dataset.itemId
            var nameElement = cartRow.getElementsByClassName('cart-item-title')[0]
            var name = nameElement.value
            items.push({
                id: id,
                name: name,
                quantity: quantity
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
                items: items
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
            console.error(error)
        })
    }
})

function purchaseClicked() {
    var priceElement = document.getElementsByClassName('cart-total-price')[0]
    var price = parseFloat(priceElement.innerText.replace('$', '')) * 100
    stripeHandler.open({
        amount: price,
        adress: ''
    })
}


function removeCartItem(event) {
    var buttonClicked = event.target
    buttonClicked.parentElement.parentElement.remove()
    updateCartTotal()
}



function addToCartClicked(event) {
    var button = event.target
    var shopItem = button.parentElement.parentElement

    var title = shopItem.getElementsByClassName('shop-item-title')[0].innerText
    var price = shopItem.getElementsByClassName('shop-item-price1')[0].innerText
    var imageSrc = shopItem.getElementsByClassName('shop-item-image')[0].src
    var quantidade = shopItem.getElementsByClassName('quantity')[0]
	var default_size = shopItem.getElementsByClassName('shop_item_default_size')[0]
	var size = shopItem.getElementsByClassName('size_choosen')[0]
	
	var selected_size = default_size.innerText;
	if(size.value!=""){
		selected_size = size.value;
	}
	
    var quantidade2 = quantidade.value
    var id = shopItem.getElementsByClassName('shop-item-price1')[0].getAttribute("id");
	
	console.log(selected_size,'selected_size');
   
    addItemToCart(title, price, imageSrc, quantidade2, id,selected_size)
    updateCartTotal()
}

function addItemToCart(title, price, imageSrc, quantidade2, id,selected_size) {
    var cartRow = document.createElement('div')
   
    cartRow.dataset.itemId = id
    cartRow.classList.add('cart-row')
    var cartItems = document.getElementsByClassName('cart-items')[0]
    var cartItemNames = cartItems.getElementsByClassName('cart-item-title')
    for (var i = 0; i < cartItemNames.length; i++) {
        if (cartItemNames[i].innerText == title) {
            alert('This item is already added to the cart')
            return
        }
    }
    var cartRowContents = `
        <div class="cart-item cart-column">
            <img class="cart-item-image" src="${imageSrc}" width="200" height="250">
            <br>
            <span class="cart-item-title">${title}</span>
        </div>
        Price: <span class="cart-price cart-column">${price}</span><br>
		Choosed Size: <span class="selected_size">${selected_size}</span>
        <div class="cart-quantity cart-column">
        
            <input class="cart-quantity-input" value="${quantidade2}">
            
        
        
            
            <button class="btn btn-danger" type="button">Remover</button>
        </div>`;
		
    cartRow.innerHTML = cartRowContents
    cartItems.append(cartRow)
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click', removeCartItem)
}

function updateCartTotal() {
    var cartItemContainer = document.getElementsByClassName('cart-items')[0]
    var cartRows = cartItemContainer.getElementsByClassName('cart-row')
    var total = 0
    for (var i = 0; i < cartRows.length; i++) {
        var cartRow = cartRows[i]
        var priceElement = cartRow.getElementsByClassName('cart-price')[0]
        
        var price = parseFloat(priceElement.innerText.replace('€', ''))
       
        total = total + price 
    }
    total = Math.round(total * 100) / 100
    document.getElementsByClassName('cart-total-price')[0].innerText = '€' + total
}




function obterPreço(){
    var cartItemContainer2 = document.getElementsByClassName('shop-items')[0]
    var cartRows2 = cartItemContainer2.getElementsByClassName('Produtos')
    var total2 = 0
    for (var i = 0; i < cartRows2.length; i++) {
        var cartRow2 = cartRows2[i]
    var preço = cartRow2.getElementsByClassName('priceCell')[0]
    var quantidade = cartRow2.getElementsByClassName('quantity')[0]
    var quantity = quantidade.value
    var price = parseFloat(preço.innerText.replace('$', ''))
    total2 = price * quantity
    if (quantidade < 1)
    return 
    
    console.log( total2)

    cartRow2.getElementsByClassName('shop-item-price1')[0].innerHTML = '€' + total2

}}




