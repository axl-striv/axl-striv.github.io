document.addEventListener("DOMContentLoaded", () => {
  // State management
  const state = {
    productQuantities: {}, // { 'productId': quantity }
    selectedAddons: [],
    total: 0,
  }

  // Use centralized product data from index.html
  // Wait for strivData to be populated with data from the backend
  // If strivData isn't available yet (fetch still in progress), use default empty objects
  const productDetails = window.strivData?.products || {}
  const addonDetails = window.strivData?.addons || {}

  // DOM Elements
  const productCards = document.querySelectorAll(".product-card") // Keep for potential future use (e.g., styling)
  const productQuantityControls = document.querySelectorAll(".product-quantity-control")
  const addonCheckboxes = document.querySelectorAll(".addon-checkbox-input")
  const addonCards = document.querySelectorAll(".addon-card")
  const toggleAddonsBtn = document.getElementById("toggle-addons")
  const addonsContainer = document.getElementById("addons-container")
  const noProductWarning = document.getElementById("no-product-warning")
  const addonsGrid = document.getElementById("addons-grid")
  const orderSummary = document.getElementById("order-summary")
  const productSummary = document.getElementById("product-summary")
  const addonsSummary = document.getElementById("addons-summary")
  const addonsList = document.getElementById("addons-list")
  const totalPrice = document.getElementById("total-price")
  const checkoutButton = document.getElementById("checkout-button")
  const checkoutForm = document.getElementById("checkout-form")
  const errorMessage = document.getElementById("error-message")

  // Initialize
  init()

  function init() {
    // Set up event listeners
    setupProductQuantityControls()
    setupAddonSelection()
    setupAddonQuantityControls()
    setupToggleAddons()
    setupCheckoutForm()

    // Initial UI update
    updateUI()
  }

  function setupProductQuantityControls() {
    productQuantityControls.forEach(control => {
      const minusBtn = control.querySelector(".minus")
      const plusBtn = control.querySelector(".plus")
      const quantityDisplay = control.querySelector(".quantity")
      const productId = control.dataset.productId

      // Initial state for button (minus disabled at 0)
      minusBtn.disabled = true 

      minusBtn.addEventListener("click", () => {
        const currentQuantity = state.productQuantities[productId] || 0
        if (currentQuantity > 0) {
          const newQuantity = currentQuantity - 1
          state.productQuantities[productId] = newQuantity
          quantityDisplay.textContent = newQuantity
          minusBtn.disabled = newQuantity === 0

          if (newQuantity === 0) {
             delete state.productQuantities[productId] // Clean up state if quantity is 0
          }
          updateAddonsAvailability() // Check if addons should be shown/hidden
          updateAddonQuantitiesLimits() // Update limits for per-unit addons
          updateOrderSummary()
          updateCheckoutButton()
        }
      })

      plusBtn.addEventListener("click", () => {
        const currentQuantity = state.productQuantities[productId] || 0
        const newQuantity = currentQuantity + 1
        state.productQuantities[productId] = newQuantity
        quantityDisplay.textContent = newQuantity
        minusBtn.disabled = false // Ensure minus is enabled

        updateAddonsAvailability()
        updateAddonQuantitiesLimits() // Update limits for per-unit addons
        updateOrderSummary()
        updateCheckoutButton()
      })
    })
  }

  function setupAddonSelection() {
    addonCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        const addonCard = this.closest(".addon-card")
        const addonId = addonCard.dataset.addonId
        const quantityControl = addonCard.querySelector(".quantity-control")

        if (this.checked) {
          // Add addon to selected addons - only store ID and quantity
          state.selectedAddons.push({
            id: addonId,
            quantity: 1
          })

          // Show quantity control
          quantityControl.classList.remove("hidden")
          addonCard.classList.add("selected")
        } else {
          // Remove addon from selected addons
          state.selectedAddons = state.selectedAddons.filter((addon) => addon.id !== addonId)

          // Hide quantity control
          quantityControl.classList.add("hidden")
          addonCard.classList.remove("selected")
        }

        updateOrderSummary()
        updateCheckoutButton()
      })
    })
  }

  function setupAddonQuantityControls() {
    const quantityControls = document.querySelectorAll(".addon-card .quantity-control")

    quantityControls.forEach((control) => {
      const minusBtn = control.querySelector(".minus")
      const plusBtn = control.querySelector(".plus")
      const quantityDisplay = control.querySelector(".quantity")
      const addonCard = control.closest(".addon-card")
      const addonId = addonCard.dataset.addonId

      // Add minus button click handler
      minusBtn.addEventListener("click", () => {
        const addonIndex = state.selectedAddons.findIndex((addon) => addon.id === addonId)
        if (addonIndex !== -1) {
          const currentQuantity = state.selectedAddons[addonIndex].quantity
          if (currentQuantity > 1) {
            state.selectedAddons[addonIndex].quantity = currentQuantity - 1
            quantityDisplay.textContent = currentQuantity - 1
            
            // Update button states
            minusBtn.disabled = (currentQuantity - 1) <= 1
            
            // Enable plus button as we're decreasing
            const addonData = window.strivData?.addons?.[addonId];
            const addonPerUnit = addonData?.perUnit === true;
            const maxQuantity = addonPerUnit ? getTotalBaseUnits() : 999
            plusBtn.disabled = false
            
            updateOrderSummary()
          }
        }
      })

      // Add plus button click handler
      plusBtn.addEventListener("click", () => {
        const addonIndex = state.selectedAddons.findIndex((addon) => addon.id === addonId)
        if (addonIndex !== -1) {
          const currentQuantity = state.selectedAddons[addonIndex].quantity
          
          // For per-unit addons, limit quantity to total base product units
          const addonData = window.strivData?.addons?.[addonId];
          const addonPerUnit = addonData?.perUnit === true;
          let maxQuantity = 999 // Default high number
          if (addonPerUnit) {
            maxQuantity = getTotalBaseUnits()
          }
          
          if (currentQuantity < maxQuantity) {
            state.selectedAddons[addonIndex].quantity = currentQuantity + 1
            quantityDisplay.textContent = currentQuantity + 1
            
            // Update button states
            minusBtn.disabled = false // Enable minus when quantity > 1
            plusBtn.disabled = (currentQuantity + 1) >= maxQuantity
            
            updateOrderSummary()
          }
        }
      })

      // Set initial button states
      const addonIndex = state.selectedAddons.findIndex((addon) => addon.id === addonId)
      if (addonIndex !== -1) {
        const currentQuantity = state.selectedAddons[addonIndex].quantity
        const addonData = window.strivData?.addons?.[addonId];
        const addonPerUnit = addonData?.perUnit === true;
        let maxQuantity = 999
        if (addonPerUnit) {
          maxQuantity = getTotalBaseUnits()
        }
        minusBtn.disabled = currentQuantity <= 1
        plusBtn.disabled = currentQuantity >= maxQuantity
      } else {
        // Should not happen if control is only visible when selected, but defensively:
        minusBtn.disabled = true
        plusBtn.disabled = false
      }
    })
  }

  function setupToggleAddons() {
    toggleAddonsBtn.addEventListener("click", function () {
      const chevron = this.querySelector("svg")
      const isExpanded = !addonsContainer.classList.contains("hidden")

      if (isExpanded) {
        addonsContainer.classList.add("hidden")
        chevron.classList.remove("chevron-up")
        chevron.classList.add("chevron-down")
        chevron.innerHTML = '<path d="m6 9 6 6 6-6"/>'
      } else {
        addonsContainer.classList.remove("hidden")
        chevron.classList.remove("chevron-down")
        chevron.classList.add("chevron-up")
        chevron.innerHTML = '<path d="m18 15-6-6-6 6"/>'
      }
    })
  }

  function setupCheckoutForm() {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Check if any product has quantity > 0 OR if there are any add-ons
      const hasProducts = Object.values(state.productQuantities).some(qty => qty > 0)
      const hasAddons = state.selectedAddons.length > 0
      
      if (!hasProducts && !hasAddons) {
        errorMessage.textContent = "Please add at least one product or add-on to your order."
        errorMessage.classList.remove("hidden")
        return
      }

      errorMessage.classList.add("hidden")

      // Prepare checkout data for backend
      const checkoutData = {
        products: Object.entries(state.productQuantities)
          .filter(([_, quantity]) => quantity > 0)
          .map(([id, quantity]) => ({ id, quantity })),
        addons: state.selectedAddons.map((addon) => ({
          id: addon.id,
          quantity: addon.quantity,
        }))
      }

      console.log("Sending to backend:", checkoutData)

      // Show loading state
      checkoutButton.disabled = true
      checkoutButton.textContent = "Processing..."

      // Send to backend for secure price calculation and Stripe checkout
      fetch(`${window.strivBaseUrl}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Checkout request failed');
        }
        return response.json();
      })
      .then(data => {
        console.log("Checkout response:", data);
        
        if (data.success && data.checkout_url) {
          // Redirect to Stripe checkout page
          window.location.href = data.checkout_url;
        } else {
          // Redirect to cancel page if there's no valid checkout URL
          window.location.href = 'checkout-cancel.html';
        }
      })
      .catch(error => {
        console.error("Checkout error:", error);
        errorMessage.textContent = "There was a problem processing your checkout. Please try again.";
        errorMessage.classList.remove("hidden");
        checkoutButton.disabled = false;
        checkoutButton.textContent = `Complete Purchase ($${state.total.toFixed(2)})`;
      });
    })
  }

  function resetUI() {
    // Reset product selection (clear quantities)
    productQuantityControls.forEach(control => {
      const quantityDisplay = control.querySelector(".quantity")
      const minusBtn = control.querySelector(".minus")
      quantityDisplay.textContent = "0"
      minusBtn.disabled = true
    })
    // Remove product selection styling if any was added (none currently)
    // updateProductCards() // No longer needed as we don't highlight single cards

    // Reset addon selection
    addonCheckboxes.forEach((checkbox) => {
      checkbox.checked = false
      const addonCard = checkbox.closest(".addon-card")
      addonCard.classList.remove("selected")
      const quantityControl = addonCard.querySelector(".quantity-control")
      quantityControl.classList.add("hidden")
      const quantityDisplay = quantityControl.querySelector(".quantity")
      quantityDisplay.textContent = "1"
    })

    errorMessage.textContent = "Please select a product or add-on" // Update error text
    errorMessage.classList.add("hidden")

    // Update addons availability
    updateAddonsAvailability()
  }

  function updateUI() {
    updateAddonsAvailability()
    updateOrderSummary()
    updateCheckoutButton()
  }

  function updateAddonsAvailability() {
    const hasProducts = Object.values(state.productQuantities).some(qty => qty > 0)

    // Always show add-ons, even if no products are selected
    noProductWarning.classList.add("hidden")
    addonsGrid.classList.remove("hidden")
  }

  function updateOrderSummary() {
    const hasProducts = Object.values(state.productQuantities).some(qty => qty > 0)
    const hasAddons = state.selectedAddons.length > 0

    if (!hasProducts && !hasAddons) {
      orderSummary.classList.add("hidden")
      return
    }

    orderSummary.classList.remove("hidden")

    // Clear previous summary items
    productSummary.innerHTML = '' // Clear product summary area
    addonsList.innerHTML = ''

    let productTotal = 0

    // Update product summary section for multiple products
    Object.entries(state.productQuantities).forEach(([id, quantity]) => {
      if (quantity > 0) {
        // Make sure we have data for this product
        if (!window.strivData?.products?.[id]) {
          console.error(`Product data not found for ID: ${id}`)
          return
        }
        
        const details = window.strivData.products[id]
        const itemPrice = details.price * quantity
        productTotal += itemPrice
        
        const productItem = document.createElement('div')
        productItem.classList.add('summary-item')
        
        // Create price display with sale information if applicable
        let priceHtml = `$${itemPrice.toFixed(2)}`
        if (details.onSale && details.regularPrice > details.price) {
          const regularTotal = details.regularPrice * quantity
          const saveAmount = regularTotal - itemPrice
          priceHtml = `
            <div>
              <span class="regular-price">$${regularTotal.toFixed(2)}</span>
              <div class="sale-price">$${itemPrice.toFixed(2)}</div>
            </div>
          `
        }
        
        productItem.innerHTML = `
          <div class="summary-content-wrapper">
            <div class="summary-title">${details.name} ${quantity > 1 ? `(x${quantity})` : ''}</div>
            <div class="summary-description">${details.description}</div>
          </div>
          <div class="summary-price">${priceHtml}</div>
        `
        productSummary.appendChild(productItem)
      }
    })

    // Update addons summary section
    let addonsTotal = 0
    if (state.selectedAddons.length > 0) {
      addonsSummary.classList.remove("hidden")
      state.selectedAddons.forEach((addon) => {
        // Make sure we have data for this addon
        if (!window.strivData?.addons?.[addon.id]) {
          console.error(`Addon data not found for ID: ${addon.id}`)
          return
        }
        
        const addonData = window.strivData.addons[addon.id]
        const itemPrice = addonData.price * addon.quantity
        addonsTotal += itemPrice
        
        // Create price display with sale information if applicable
        let priceHtml = `$${itemPrice.toFixed(2)}`
        if (addonData.onSale && addonData.regularPrice > addonData.price) {
          const regularTotal = addonData.regularPrice * addon.quantity
          priceHtml = `
            <div>
              <span class="regular-price">$${regularTotal.toFixed(2)}</span>
              <div class="sale-price">$${itemPrice.toFixed(2)}</div>
            </div>
          `
        }

        const addonItem = document.createElement("div")
        addonItem.classList.add("addon-summary-item")
        addonItem.innerHTML = `
          <span class="addon-summary-name">${addonData.name} ${addon.quantity > 1 ? `(x${addon.quantity})` : ''}</span>
          <span class="addon-summary-price">${priceHtml}</span>
        `
        addonsList.appendChild(addonItem)
      })
    } else {
      addonsSummary.classList.add("hidden")
    }

    // Update total price
    state.total = calculateTotal()
    totalPrice.textContent = `$${state.total.toFixed(2)}`
    updateCheckoutButton() // Update button text with total
  }

  function updateCheckoutButton() {
    const hasProducts = Object.values(state.productQuantities).some(qty => qty > 0)
    const hasAddons = state.selectedAddons.length > 0
    state.total = calculateTotal() // Ensure total is up-to-date

    if (hasProducts || hasAddons) {
      checkoutButton.disabled = false
      checkoutButton.textContent = `Complete Purchase ($${state.total.toFixed(2)})`
    } else {
      checkoutButton.disabled = true
      checkoutButton.textContent = "Complete Purchase ($0.00)"
    }
  }

  // Function to calculate total
  function calculateTotal() {
    let currentTotal = 0

    // Calculate product total
    Object.entries(state.productQuantities).forEach(([id, quantity]) => {
      if (quantity > 0 && window.strivData?.products?.[id]) {
        currentTotal += window.strivData.products[id].price * quantity
      }
    })

    // Calculate addon total
    state.selectedAddons.forEach((addon) => {
      if (window.strivData?.addons?.[addon.id]) {
        currentTotal += window.strivData.addons[addon.id].price * addon.quantity
      }
    })

    return currentTotal
  }

  // Update helper to get total base units from quantities
  function getTotalBaseUnits() {
    let totalUnits = 0
    Object.entries(state.productQuantities).forEach(([id, quantity]) => {
      if (id === 'insole-1pack') {
        totalUnits += quantity
      } else if (id === 'insole-2pack') {
        totalUnits += quantity * 2 // 2-pack counts as 2 base units
      }
    })
    // If no product is selected, return at least 1 unit to allow purchasing per-unit add-ons
    return Math.max(totalUnits, 1)
  }

  // Function to update addon quantity limits (needed when base product quantity changes)
  function updateAddonQuantitiesLimits() {
    const totalBaseUnits = getTotalBaseUnits()
    state.selectedAddons.forEach(addon => {
      const addonData = window.strivData?.addons?.[addon.id];
      const addonPerUnit = addonData?.perUnit === true;
      
      if (addonPerUnit) {
        // Clamp addon quantity to the new total base units
        addon.quantity = Math.min(addon.quantity, totalBaseUnits)
        
        // Update the UI for this specific addon's quantity control
        const addonCard = document.querySelector(`.addon-card[data-addon-id="${addon.id}"]`)
        if (addonCard) {
          const quantityControl = addonCard.querySelector(".quantity-control")
          const quantityDisplay = quantityControl.querySelector(".quantity")
          const minusBtn = quantityControl.querySelector(".minus")
          const plusBtn = quantityControl.querySelector(".plus")
          quantityDisplay.textContent = addon.quantity
          minusBtn.disabled = addon.quantity <= 1
          plusBtn.disabled = addon.quantity >= totalBaseUnits
        }
      }
    })
    // Recalculate summary after potential clamping
    updateOrderSummary() 
  }
})