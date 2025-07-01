document.addEventListener("DOMContentLoaded", () => {
  // Mobile detection and optimization
  const isMobile = window.innerWidth <= 767;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // State management
  const state = {
    productQuantities: { 'sensor-base': 1 }, // Always include 1 sensor
    selectedSubscription: null, // subscription plan ID
    selectedAddons: [],
    oneTimeTotal: 129, // Base sensor price
    recurringTotal: 0,
  }

  // Use centralized product data from index.html
  // Wait for strivData to be populated with data from the backend
  // If strivData isn't available yet (fetch still in progress), use default empty objects
  const productDetails = window.strivData?.products || {}
  const subscriptionPlans = window.strivData?.subscriptions || {}

  // DOM Elements
  const subscriptionRadios = document.querySelectorAll(".subscription-radio-input")
  const subscriptionCards = document.querySelectorAll(".subscription-card, .subscription-card-compact")
  const addonCheckboxes = document.querySelectorAll(".addon-checkbox-input")
  const addonCards = document.querySelectorAll(".addon-card")
  const toggleAddonsBtn = document.getElementById("toggle-addons")
  const addonsContainer = document.getElementById("addons-container")
  const noSubscriptionWarning = document.getElementById("no-subscription-warning")
  const addonsGrid = document.getElementById("addons-grid")
  const orderSummary = document.getElementById("order-summary")
  const productSummary = document.getElementById("product-summary")
  const subscriptionSummary = document.getElementById("subscription-summary")
  const subscriptionDetails = document.getElementById("subscription-details")
  const addonsSummary = document.getElementById("addons-summary")
  const addonsList = document.getElementById("addons-list")
  const oneTimeTotal = document.getElementById("onetime-total")
  const recurringTotal = document.getElementById("recurring-total")
  const checkoutButton = document.getElementById("checkout-button")
  const checkoutButtonText = checkoutButton?.querySelector(".button-text")
  const checkoutForm = document.getElementById("checkout-form")
  const errorMessage = document.getElementById("error-message")
  const showShorterOptionBtn = document.getElementById("show-shorter-option")
  const shorterOption = document.getElementById("shorter-option")

  // Initialize
  init()

  function init() {
    // Mobile-specific optimizations
    if (isMobile) {
      optimizeForMobile()
    }
    
    // Set up event listeners
    setupSubscriptionSelection()
    setupAlternativeToggle()
    setupAddonSelection()
    setupAddonQuantityControls()
    setupToggleAddons()
    setupCheckoutForm()

    // Initial UI update
    updateUI()
    updateAddonsAvailability()
    
    // Add smooth scrolling for better UX
    setupSmoothScrolling()
  }

  function optimizeForMobile() {
    // Add mobile class to body for styling hooks
    document.body.classList.add('mobile-optimized')
    
    // Improve touch feedback
    if (isTouch) {
      document.body.classList.add('touch-device')
      
      // Add touch feedback to interactive elements
      const touchElements = document.querySelectorAll('.subscription-card, .checkout-button, .alternative-toggle')
      touchElements.forEach(element => {
        element.addEventListener('touchstart', handleTouchStart, { passive: true })
        element.addEventListener('touchend', handleTouchEnd, { passive: true })
      })
    }
    
    // Optimize viewport for mobile
    let viewportMeta = document.querySelector('meta[name="viewport"]')
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    }
    
    // Add momentum scrolling for iOS
    document.body.style.webkitOverflowScrolling = 'touch'
    
    // Prevent double-tap zoom
    let lastTouchEnd = 0
    document.addEventListener('touchend', function (event) {
      const now = (new Date()).getTime()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }, false)
  }

  function handleTouchStart(event) {
    event.currentTarget.classList.add('touch-active')
  }

  function handleTouchEnd(event) {
    setTimeout(() => {
      event.currentTarget.classList.remove('touch-active')
    }, 150)
  }

  function setupSmoothScrolling() {
    // Smooth scroll to order summary when plan is selected
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target
          if (target.classList.contains('selected') && (target.classList.contains('subscription-card') || target.classList.contains('subscription-card-compact'))) {
            // Small delay to ensure DOM updates are complete
            setTimeout(() => {
              const summary = document.getElementById('order-summary')
              if (summary && !summary.classList.contains('hidden')) {
                summary.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
              }
            }, 300)
          }
        }
      })
    })

    subscriptionCards.forEach(card => {
      observer.observe(card, { attributes: true })
    })
  }

  function setupSubscriptionSelection() {
    subscriptionRadios.forEach((radio) => {
      radio.addEventListener("change", function () {
        if (this.checked) {
          state.selectedSubscription = this.value
          
          // Update card styling
          subscriptionCards.forEach(card => {
            card.classList.remove("selected")
          })
          
          const selectedCard = this.closest(".subscription-card, .subscription-card-compact")
          selectedCard.classList.add("selected")
          
          // Add selection animation
          selectedCard.style.transform = 'scale(1.02)'
          setTimeout(() => {
            selectedCard.style.transform = ''
          }, 200)
          
          updateOrderSummary()
          updateCheckoutButton()
          updateAddonsAvailability()
          
          // Show order summary with animation
          if (orderSummary.classList.contains('hidden')) {
            orderSummary.classList.remove('hidden')
            orderSummary.style.opacity = '0'
            orderSummary.style.transform = 'translateY(20px)'
            
            requestAnimationFrame(() => {
              orderSummary.style.transition = 'all 0.3s ease-out'
              orderSummary.style.opacity = '1'
              orderSummary.style.transform = 'translateY(0)'
            })
          }
        }
      })
    })

    // Make subscription cards clickable
    subscriptionCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.subscription-checkbox')) return // Don't interfere with radio button
        
        const radio = card.querySelector('.subscription-radio-input')
        if (radio && !radio.checked) {
          radio.checked = true
          radio.dispatchEvent(new Event('change'))
        }
      })
    })
  }

  function setupAlternativeToggle() {
    if (showShorterOptionBtn && shorterOption) {
      showShorterOptionBtn.addEventListener("click", function() {
        const isHidden = shorterOption.classList.contains("hidden")
        const arrow = this.querySelector(".toggle-arrow")
        
        if (isHidden) {
          shorterOption.classList.remove("hidden")
          arrow.textContent = "↑"
          this.innerHTML = 'Hide shorter option <span class="toggle-arrow">↑</span>'
          
          // Smooth reveal animation
          shorterOption.style.maxHeight = '0'
          shorterOption.style.overflow = 'hidden'
          requestAnimationFrame(() => {
            shorterOption.style.transition = 'max-height 0.3s ease-out'
            shorterOption.style.maxHeight = '500px'
          })
          
        } else {
          arrow.textContent = "↓"
          this.innerHTML = 'Need a shorter commitment? <span class="toggle-arrow">↓</span>'
          
          // Smooth hide animation
          shorterOption.style.maxHeight = '0'
          setTimeout(() => {
            shorterOption.classList.add("hidden")
            shorterOption.style.maxHeight = ''
            shorterOption.style.transition = ''
          }, 300)
          
          // If 6-month plan was selected, clear selection
          const sixMonthRadio = document.getElementById("subscription-6month")
          if (sixMonthRadio && sixMonthRadio.checked) {
            sixMonthRadio.checked = false
            state.selectedSubscription = null
            subscriptionCards.forEach(card => {
              card.classList.remove("selected")
            })
            updateOrderSummary()
            updateCheckoutButton()
            
            // Hide order summary
            orderSummary.classList.add("hidden")
          }
        }
      })
    }
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
          const maxQuantity = 999 // Default high number
          
          if (currentQuantity < maxQuantity) {
            state.selectedAddons[addonIndex].quantity = currentQuantity + 1
            quantityDisplay.textContent = currentQuantity + 1
            
            // Update button states
            minusBtn.disabled = false
            plusBtn.disabled = (currentQuantity + 1) >= maxQuantity
            
            updateOrderSummary()
          }
        }
      })

      // Set initial button states
      const addonIndex = state.selectedAddons.findIndex((addon) => addon.id === addonId)
      if (addonIndex !== -1) {
        const currentQuantity = state.selectedAddons[addonIndex].quantity
        minusBtn.disabled = currentQuantity <= 1
        plusBtn.disabled = currentQuantity >= 999
      } else {
        minusBtn.disabled = true
        plusBtn.disabled = false
      }
    })
  }

  function setupToggleAddons() {
    if (toggleAddonsBtn && addonsContainer) {
      toggleAddonsBtn.addEventListener("click", function() {
        const isHidden = addonsContainer.classList.contains("hidden")
        const chevron = this.querySelector("svg")
        
        if (isHidden) {
          addonsContainer.classList.remove("hidden")
          chevron.innerHTML = '<path d="m18 15-6-6-6 6"/>'
        } else {
          addonsContainer.classList.add("hidden")
          chevron.innerHTML = '<path d="m6 9 6 6 6-6"/>'
        }
      })
    }
  }

  function setupCheckoutForm() {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Check if subscription is selected (sensor is always included)
      const hasSubscription = state.selectedSubscription !== null
      
      if (!hasSubscription) {
        errorMessage.textContent = "Please select an AI coach plan to continue."
        errorMessage.classList.remove("hidden")
        
        // Scroll to error message
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Shake animation for error
        errorMessage.style.animation = 'shake 0.5s ease-in-out'
        setTimeout(() => {
          errorMessage.style.animation = ''
        }, 500)
        
        return
      }

      errorMessage.classList.add("hidden")

      // Prepare checkout data for backend
      const checkoutData = {
        products: Object.entries(state.productQuantities)
          .filter(([_, quantity]) => quantity > 0)
          .map(([id, quantity]) => ({ id, quantity })),
        subscription: state.selectedSubscription,
        addons: state.selectedAddons.map((addon) => ({
          id: addon.id,
          quantity: addon.quantity,
        })),
        type: 'subscription'
      }

      console.log("Sending to backend:", checkoutData)

      // Show loading state with better UX
      checkoutButton.disabled = true
      if (checkoutButtonText) {
        checkoutButtonText.textContent = "Processing..."
      } else {
        checkoutButton.textContent = "Processing..."
      }
      checkoutButton.style.opacity = '0.7'

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
          // Show success state briefly before redirect
          if (checkoutButtonText) {
            checkoutButtonText.textContent = "Redirecting to checkout..."
          } else {
            checkoutButton.textContent = "Redirecting to checkout..."
          }
          checkoutButton.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
          
          setTimeout(() => {
            window.location.href = data.checkout_url;
          }, 500)
        } else {
          // Redirect to cancel page if there's no valid checkout URL
          window.location.href = '../checkout-cancel.html';
        }
      })
      .catch(error => {
        console.error("Checkout error:", error);
        errorMessage.textContent = "There was a problem processing your checkout. Please try again.";
        errorMessage.classList.remove("hidden");
        
        // Reset button state
        checkoutButton.disabled = false;
        checkoutButton.style.opacity = '1'
        checkoutButton.style.background = ''
        updateCheckoutButton(); // Reset button text
        
        // Scroll to error
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' })
      });
    })
  }

  function updateUI() {
    updateOrderSummary()
    updateCheckoutButton()
  }

  function updateOrderSummary() {
    const hasSubscription = state.selectedSubscription !== null

    // Calculate totals
    state.oneTimeTotal = 0
    state.recurringTotal = 0

    // Update product summary section
    productSummary.innerHTML = ''
    Object.entries(state.productQuantities).forEach(([id, quantity]) => {
      if (quantity > 0) {
        // Make sure we have data for this product
        if (!window.strivData?.products?.[id]) {
          console.error(`Product data not found for ID: ${id}`)
          return
        }
        
        const details = window.strivData.products[id]
        const itemPrice = details.price * quantity
        state.oneTimeTotal += itemPrice
        
        const productItem = document.createElement('div')
        productItem.classList.add('summary-item')
        
        productItem.innerHTML = `
          <div class="summary-content-wrapper">
            <div class="summary-title">${details.name} ${quantity > 1 ? `(x${quantity})` : ''}</div>
            <div class="summary-description">${details.description}</div>
          </div>
          <div class="summary-price">$${itemPrice.toFixed(2)}</div>
        `
        productSummary.appendChild(productItem)
      }
    })

    // Update subscription summary section
    if (state.selectedSubscription) {
      subscriptionSummary.classList.remove("hidden")
      
      // Make sure we have data for this subscription
      if (!window.strivData?.subscriptions?.[state.selectedSubscription]) {
        console.error(`Subscription data not found for ID: ${state.selectedSubscription}`)
        return
      }
      
      const subData = window.strivData.subscriptions[state.selectedSubscription]
      state.recurringTotal = subData.monthlyPrice || subData.price
      
      // Create subscription summary display
      let priceHtml = `$${state.recurringTotal.toFixed(2)}`
      if (subData.regularPrice && subData.regularPrice > subData.price) {
        priceHtml = `
          <div>
            <span class="regular-price">$${subData.regularPrice.toFixed(2)}</span>
            <div class="sale-price">$${state.recurringTotal.toFixed(2)}</div>
          </div>
        `
      }

      const billingText = subData.billingInterval ? `per month (billed ${subData.billingInterval})` : `per ${subData.interval}`

      subscriptionDetails.innerHTML = ''
      const subscriptionItem = document.createElement("div")
      subscriptionItem.classList.add("subscription-summary-item")
      subscriptionItem.innerHTML = `
        <span class="subscription-summary-name">${subData.name}</span>
        <span class="subscription-summary-price">${priceHtml} ${billingText}</span>
      `
      subscriptionDetails.appendChild(subscriptionItem)
    } else {
      subscriptionSummary.classList.add("hidden")
    }

    // Update addons summary section
    let addonsTotal = 0
    if (state.selectedAddons.length > 0) {
      addonsSummary.classList.remove("hidden")
      addonsList.innerHTML = ''
      
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

    // Add addons total to one-time total
    state.oneTimeTotal += addonsTotal

    // Update total displays
    oneTimeTotal.textContent = `$${state.oneTimeTotal.toFixed(2)}`
    recurringTotal.textContent = state.recurringTotal > 0 ? `$${state.recurringTotal.toFixed(2)}` : '$0'
    
    updateCheckoutButton()
  }

  function updateCheckoutButton() {
    const hasSubscription = state.selectedSubscription !== null

    if (hasSubscription) {
      checkoutButton.disabled = false
      checkoutButton.style.opacity = '1'
      
    //   const totalText = state.recurringTotal > 0 
    //     ? `Start AI Coach Now — $${state.oneTimeTotal.toFixed(2)} + $${state.recurringTotal.toFixed(2)}/mo`
    //     : `Start AI Coach Now — $${state.oneTimeTotal.toFixed(2)}`
      
      const totalText = "Get AI Coached Now!"
      if (checkoutButtonText) {
        checkoutButtonText.textContent = totalText
      } else {
        checkoutButton.textContent = totalText
      }
      
      // Add pulse animation to draw attention
      checkoutButton.style.animation = 'pulse 2s ease-in-out 3'
      setTimeout(() => {
        checkoutButton.style.animation = ''
      }, 6000)
      
    } else {
      checkoutButton.disabled = true
      checkoutButton.style.opacity = '0.6'
      
      if (checkoutButtonText) {
        checkoutButtonText.textContent = "Select AI Coach Plan"
      } else {
        checkoutButton.textContent = "Select AI Coach Plan"
      }
    }
  }

  function updateAddonsAvailability() {
    const hasSubscription = state.selectedSubscription !== null

    if (hasSubscription) {
      noSubscriptionWarning.classList.add("hidden")
      addonsGrid.classList.remove("hidden")
    } else {
      noSubscriptionWarning.classList.remove("hidden")
      addonsGrid.classList.add("hidden")
    }
  }

  // Add CSS for shake animation
  const shakeCSS = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
  `
  
  const style = document.createElement('style')
  style.textContent = shakeCSS
  document.head.appendChild(style)
})