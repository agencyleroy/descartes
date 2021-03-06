/**

  Route expectations:

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

*/

var Cart = React.createClass({
  propTypes: function() {
    {cartPath: React.PropTypes.string.isRequired}
  },

  getInitialState: function() {
    return {
      items: [],
      isOpen: false,
      isEmpty: true
    }
  },

  // Bind the cart in a global variable and fetch the cart items with ajax
  componentDidMount: function() {
    var self = this;
    ReactDOM.CART_PATH = this.props.cartPath
    self.refreshCart();
    window.Descartes = self;
  },

  // Hide the minicart after a duration
  setHideTimeout: function() {
    var self = this;
    self.removeHideTimeout();
    self._timer = setTimeout(function(){
      self.setState({isOpen: false});
    }, 3000);
  },

  // Reset the minicart hiding timeout
  removeHideTimeout: function() {
    this._timer != null ? clearTimeout(this._timer) : null
  },

  // Fetch the cart items with ajax and store the result in local storage
  refreshCart: function(){
    var self = this;
    if (localStorage.descartes_cart_items && localStorage.descartes_cart_items.length) {
      self.setState({
        items: JSON.parse(localStorage.getItem('descartes_cart_items') || '[]')
      });
    } else {
      $.get(ReactDOM.CART_PATH, function(result) {
        if (result) {
          if (self.isMounted()) {
            self.setState({
              items: result.cart.cart_items
            });
            self.persistItemsToLocalStorage();
          }
        }
      }.bind(this));
    }
  },

  // Local storage proxy
  persistItemsToLocalStorage: function() {
    localStorage.setItem('descartes_cart_items', JSON.stringify(this.state.items))
  },

  // Empties the cart and stores results in local storage
  emptyCart: function(cart, event, id, nativeEvent) {
    var self = this;
    $.ajax({
      url: ReactDOM.CART_PATH,
      type: 'DELETE',
      success: function(result) {
        cart.setState({
          items: result
        })
        self.persistItemsToLocalStorage();
      }
    });
  },

  // Adds item to cart and stores result in local storage
  addItem: function(product_id) {
    var self = this;
    $.ajax({
      url: ReactDOM.CART_PATH,
      type: 'PATCH',
      data: {product_id: product_id},
      success: function(result) {
        self.setHideTimeout();
        self.setState({
          items: result.cart.cart_items
        });
        self.persistItemsToLocalStorage();
      }.bind(this),
      error: function(error) {
        console.error(error)
      }
    });
    self.setState({isOpen: true});
  },

  // Removes item from cart
  removeItem: function(product_id) {
    var self = this;
    self.setState({
      items: self.state.items.filter((item, i) => item.id !== product_id)
    });
  },

  // Update quantity of item in DOM
  updateQuantity: function(object, event) {
    var self = this;
    var newItems = [];

    $(self.state.items).each(function(ix, item){
      if (item.product_id == object.product_id) {
        self.setState({ items: newItems });
        item.quantity = event.target.value;
      }
      newItems.push(item);
    });
  },

  // Visit the cart page
  goToCheckout: function(e) {
    e.preventDefault();
    Turbolinks.visit("/cart");
  },

  render: function() {
    var self = this;
    var stateClass = self.state.isOpen ? "minicart minicart--open" : "minicart minicart--closed";
    if (!self.state.items.length) {
      var potentiallyEmpty = {__html: "Nothing in the cart"};
    } else {
      var potentiallyEmpty = {__html: ""};
    }
    return (
      <div id="minicart" onMouseEnter={this.removeHideTimeout} onMouseLeave={this.setHideTimeout} className={stateClass}>
        <div className="minicart__items-container">
          <div className="minicart__message" dangerouslySetInnerHTML={potentiallyEmpty} />
          <ul>
            {self.state.items.map(function(item){
              return <CartItem removeItem={self.removeItem} key={item.id} item={item} updateQuantity={self.updateQuantity} />;
            })}
          </ul>
          <CartDetails items={self.state.items} />
          <div className="minicart__actions">
            <a className="empty" onClick={self.emptyCart.bind(this, this)}>Empty</a>
            <a className="checkout" onClick={self.goToCheckout}>View cart</a>
          </div>
        </div>
      </div>
    )
  }
});

var CartItem = React.createClass({
  getInitialState: function() {
    return {
      item: this.props.item,
      initialQuantity: this.props.item.quantity
    }
  },

  // Send quantity to parent
  updateQuantity: function(event){
    this.props.updateQuantity(this.state.item, event);
  },

  // Persists the quantity to server and local storage
  persistQuantity: function() {
    var self = this;
    var qty = self.props.item.quantity;
    if (qty != self.state.initialQuantity) {
      $.ajax({
        url: ReactDOM.CART_PATH + '/' +self.props.item.id,
        type: 'PATCH',
        data: {
          cart_item: self.props.item
        },
        success: function(result) {
          if (qty == 0) {
            console.debug("Quantity was 0.. removing from DOM");
            self.props.removeItem(self.props.item.id)
          }
          // Persist the change to localStorage too
          localStorage.setItem('descartes_cart_items', JSON.stringify(result.cart.cart_items))

          // Refresh cart page
          //
          //    TODO: The path should be initiazed from the component
          //
          if (window.location.pathname === "/cart") {
            if (Turbolinks !== 'undefined') {
              Turbolinks.visit("/cart", {change: ["item:"+self.props.item.id]})
            } else {
              location.reload();
            }
          }
        },
        error: function(error) {
          console.error(error)
          alert("Could not update the quantity.")
        }
      });
    }
  },

  render: function() {
    return (
      <li className="minicart__item">
        <h5 className="text-white">{this.props.item.name}</h5>
        <QuantityInput persistQuantity={this.persistQuantity} key={this.props.item.id} quantity={this.props.item.quantity} updateQuantity={this.updateQuantity} />
        <span className="minicart__item__total">{this.props.item.formatted_price}</span><br />
      </li>
    )
  }
});

var QuantityInput = React.createClass({
  // Send quantity to parent for persistance
  persistQuantity: function() {
    this.props.persistQuantity();
  },

  componentDidUpdate: function() {
    this.flashQuantity();
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return nextProps.quantity !== this.props.quantity
  },

  flashQuantity: function() {
    elem = ReactDOM.findDOMNode(this);
    $(elem).addClass('flash');
    var t = setTimeout(function(){
      $(elem).removeClass('flash');
    }, 1000);
  },

  render: function() {
    return (
      <input type="text" value={this.props.quantity} onBlur={this.persistQuantity} onChange={this.props.updateQuantity} />
    )
  }
});

var CartDetails = React.createClass({
  render: function() {
    var totalPrice = 0;
    this.props.items.map(function(item,ix){
      totalPrice += (item.price * item.quantity)
    });
    return (
      <div className="minicart__details">
        <span>Total {(totalPrice / 100).toFixed(2) + "€"}</span>
      </div>
    )
  }
});