# Descartes

*"A state is better governed which has few laws, and those laws strictly observed."*

*– Rene Descartes*

## Getting started

```html
<body>
  <div id="cart_container"></div>
</body>
```

```javascript
ReactDOM.render(
  <Cart cartPath="/api/cart" />,
  document.getElementById('cart_container')
);
```

## Exposed methods

`Descartes.addItem(product_id, quantity)` adds a product to the cart

`Descartes.emptyCart()`empties the cart

`Descartes.refreshCart()` fetches and refreshes the cart

## API expectations

```

  GET      /api/cart (gets the cart)

  Returns
  `{
    "cart":{
      "id":integer,
      "cart_items":[
        {
          "id":integer
          "name":string
          "product_type":string
          "product_id":integer
          "price":integer
          "formatted_price":string
          "quantity":integer
        }
      ]
    },
    "_meta":{
      "timestamp":"2015-11-30T12:05:37.618+02:00"
    }
  }`

  PATCH    /api/cart (add item to cart)

    Returns updated cart (see example above)

  PATCH    /api/cart/:item_id (changes an item)

    Formdata:

    cart_item[id]:125
    cart_item[name]:Finlandia Hymn (Full Orchestra)
    cart_item[product_type]:Product
    cart_item[product_id]:1
    cart_item[price]:1240
    cart_item[formatted_price]:12.40 €
    cart_item[quantity]:7

    Returns updated cart

  DELETE   /api/cart (empties the cart)

    Returns `[]`
```
