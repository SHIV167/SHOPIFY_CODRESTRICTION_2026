document.addEventListener('DOMContentLoaded', function() {
    const cartIcon = document.getElementById('cart-icon-bubble');
    const popupCart = document.getElementById('popup-cart');
    const closePopup = document.getElementById('close-popup');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalPrice = document.querySelector('.cart-total-price');
    const cartCountBubble = document.querySelector('.cart-count-bubble');
    const emptyCartMessage = document.querySelector('.empty-cart-message');
    const cartSummary = document.querySelector('.cart-summary');

    // Function to format money
    function formatMoney(cents) {
        return (cents/100).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

      async function removeItem(itemId) {
        try {
            const cartItem = document.querySelector(`[data-id="${itemId}"]`).closest('.cart-item');
            cartItem.classList.add('removing');

            const response = await fetch('/cart/change.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: itemId,
                    quantity: 0
                })
            });
            
            const cart = await response.json();
            
            // Wait for animation to complete before updating display
            setTimeout(() => {
                updateCartDisplay(cart);
            }, 300);
        } catch (error) {
            console.error('Error removing item from cart:', error);
        }
    }

   // Function to handle adding items to cart
async function addToCart(formData) {
    try {
        const response = await fetch('/cart/add.js', {
            method: 'POST',
            body: formData
        });
        const item = await response.json();
        
        // Fetch updated cart data
        const cartResponse = await fetch('/cart.js');
        const cart = await cartResponse.json();
        
        // Show the popup cart
        popupCart.classList.remove('hidden');
        popupCart.classList.add('show');
        
        // Update cart display with the new cart data
        updateCartDisplay(cart);
        
        // Make sure cart summary is visible if there are items
        if (cart.item_count > 0) {
            if (cartSummary) {
                cartSummary.style.display = 'block';
            }
            if (cartTotalPrice) {
                cartTotalPrice.textContent = `${formatMoney(cart.total_price)} Rs`;
            }
            if (emptyCartMessage) {
                emptyCartMessage.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
    }
}

// Update the updateCartDisplay function
function updateCartDisplay(cart) {
    if (!cartItemsContainer) return;

    if (cart.item_count > 0) {
        let cartHTML = '';
        cart.items.forEach(item => {
            cartHTML += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.title}" />
                    <div class="cart-item-details">
                        <div class="cart-item-header">
                            <h3>${item.title}</h3>
                            <button class="remove-item" data-id="${item.id}" aria-label="Remove item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="quantity-selector">
                            <label for="quantity-${item.id}">Quantity:</label>
                            <input type="number" 
                                id="quantity-${item.id}" 
                                class="quantity-input" 
                                value="${item.quantity}" 
                                min="1" 
                                max="99" 
                                data-id="${item.id}" />
                        </div>
                        <p>Price: ${formatMoney(item.price)} Rs</p>
                    </div>
                </div>
            `;
        });
        cartItemsContainer.innerHTML = cartHTML;

        // Update cart summary and total price
        if (cartSummary) {
            cartSummary.style.display = 'block';
            
            // Create cart summary content if it doesn't exist
            if (!cartSummary.querySelector('.cart-total')) {
                cartSummary.innerHTML = `
                    <div class="cart-total">
                        <p>Total: <span class="cart-total-price">${formatMoney(cart.total_price)} Rs</span></p>
                    </div>
                    <div class="cart-actions">
                        <a href="/checkout" id="proceed-checkout" class="button button--primary">
                            Proceed to Checkout
                        </a>
                        <a href="/cart" id="view-cart" class="button button--secondary">
                            View Cart
                        </a>
                    </div>
                `;
            } else if (cartTotalPrice) {
                cartTotalPrice.textContent = `${formatMoney(cart.total_price)} Rs`;
            }
        }
        
        if (emptyCartMessage) {
            emptyCartMessage.style.display = 'none';
        }

        updateCartCount(cart.item_count);
    } else {
        if (emptyCartMessage) {
            emptyCartMessage.style.display = 'block';
        }
        if (cartSummary) {
            cartSummary.style.display = 'none';
        }
        cartItemsContainer.innerHTML = '';
        updateCartCount(0);
    }
}

    // Add event listener for remove buttons
    document.addEventListener('click', function(event) {
        if (event.target.closest('.remove-item')) {
            event.preventDefault();
            const button = event.target.closest('.remove-item');
            const itemId = button.dataset.id;
            removeItem(itemId);
        }
    });



    // Function to update cart count bubble
    function updateCartCount(count) {
        const existingBubble = document.querySelector('.cart-count-bubble');
        if (count > 0) {
            if (!existingBubble) {
                const newBubble = document.createElement('div');
                newBubble.className = 'cart-count-bubble';
                newBubble.innerHTML = `<span aria-hidden="true">${count}</span>`;
                cartIcon.appendChild(newBubble);
            } else {
                existingBubble.querySelector('span[aria-hidden="true"]').textContent = count;
            }
        } else {
            if (existingBubble) {
                existingBubble.remove();
            }
        }
    }

    // Function to update item quantity
    async function updateItemQuantity(itemId, newQuantity) {
        try {
            const response = await fetch('/cart/change.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: itemId,
                    quantity: parseInt(newQuantity)
                })
            });
            
            const cart = await response.json();
            updateCartDisplay(cart);
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    }

    // Show the popup cart
    cartIcon.addEventListener('click', async function(event) {
        event.preventDefault();
        popupCart.classList.remove('hidden');
        popupCart.classList.add('show');
        
        try {
            const response = await fetch('/cart.js');
            const cart = await response.json();
            updateCartDisplay(cart);
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    });

    // Close the popup cart
    closePopup.addEventListener('click', function() {
        popupCart.classList.remove('show');
        setTimeout(() => {
            popupCart.classList.add('hidden');
        }, 300);
    });

    // Close popup when clicking outside
    popupCart.addEventListener('click', function(event) {
        if (event.target === popupCart) {
            closePopup.click();
        }
    });

    // Handle quantity changes
    document.addEventListener('change', function(event) {
        if (event.target.classList.contains('quantity-input')) {
            const itemId = event.target.dataset.id;
            const newQuantity = event.target.value;
            updateItemQuantity(itemId, newQuantity);
        }
    });

    // Function to handle adding items to cart
    async function addToCart(formData) {
        try {
            const response = await fetch('/cart/add.js', {
                method: 'POST',
                body: formData
            });
            const item = await response.json();
            
            // Fetch updated cart data
            const cartResponse = await fetch('/cart.js');
            const cart = await cartResponse.json();
            
            // Update the cart display
            updateCartDisplay(cart);
            
            // Show the popup cart
            popupCart.classList.remove('hidden');
            popupCart.classList.add('show');
        } catch (error) {
            console.error('Error adding to cart:', error);
        }
    }

    // Add event listener for add to cart forms
    document.addEventListener('submit', function(event) {
        if (event.target.matches('form[action="/cart/add"]')) {
            event.preventDefault();
            const formData = new FormData(event.target);
            addToCart(formData);
        }
    });

    // Initial cart fetch
    fetch('/cart.js')
        .then(response => response.json())
        .then(cart => updateCartDisplay(cart))
        .catch(error => console.error('Error fetching initial cart:', error));
});