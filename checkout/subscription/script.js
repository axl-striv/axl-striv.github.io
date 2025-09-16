// Modern Checkout Experience - Ultra Simplified
document.addEventListener("DOMContentLoaded", () => {
  // App State
  const state = {
    currentStep: 1,
    selections: {
      hardware: { selected: true, price: 149 },
      subscription: { plan: null, price: 0 },
      delivery: { frequency: null, price: 0 },
      addons: []
    },
    totals: {
      today: 149,
      monthly: 0,
      delivery: 0
    }
  };

  // DOM References
  const elements = {
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    stepSlides: document.querySelectorAll('.step-slide'),
    navBack: document.getElementById('nav-back'),
    navNext: document.getElementById('nav-next'),
    navComplete: document.getElementById('nav-complete'),
    errorToast: document.getElementById('error-message'),
    errorText: document.querySelector('.error-text'),
    
    // Order summary
    orderItems: document.getElementById('order-items'),
    totalToday: document.getElementById('total-today'),
    totalMonthly: document.getElementById('total-monthly'),
    totalDelivery: document.getElementById('total-delivery'),
    recurringSubscription: document.getElementById('recurring-subscription'),
    recurringDelivery: document.getElementById('recurring-delivery'),
    
    // Form inputs
    planInputs: document.querySelectorAll('input[name="subscription"]'),
    frequencyInputs: document.querySelectorAll('input[name="frequency"]'),
    quantityInputs: document.querySelectorAll('input[name="quantity"]'),
    addonInputs: document.querySelectorAll('.addon-checkbox-input'),
    
    // Delivery elements
    deliverySummaryText: document.getElementById('delivery-summary-text'),
    deliveryTotalPrice: document.getElementById('delivery-total-price')
  };

  // Initialize
  init();

  function init() {
    setupEventListeners();
    updateUI();
    updateProgressIndicator();
    updateOrderSummary();
    
    // Initialize default quantity selection (2 pairs is checked by default)
    const defaultQuantity = 2;
    if (!state.selections.delivery) {
      state.selections.delivery = {};
    }
    state.selections.delivery.quantity = defaultQuantity;
    document.querySelector('.quantity-option[data-quantity="2"]').classList.add('selected');
    updateDeliveryPricing();
    
    // Ensure step 1 is active on load
    goToStep(1);
  }

  function setupEventListeners() {
    // Navigation
    elements.navNext.addEventListener('click', handleNext);
    elements.navBack.addEventListener('click', handleBack);
    elements.navComplete.addEventListener('click', handleComplete);

    // Form inputs
    elements.planInputs.forEach(input => {
      input.addEventListener('change', handlePlanSelection);
    });

    elements.frequencyInputs.forEach(input => {
      input.addEventListener('change', handleFrequencySelection);
    });

    elements.quantityInputs.forEach(input => {
      input.addEventListener('change', handleQuantitySelection);
    });

    elements.addonInputs.forEach(input => {
      input.addEventListener('change', handleAddonSelection);
    });

    // Card click handlers for better UX
    setupCardClickHandlers();
  }

  function setupCardClickHandlers() {
    // Plan cards
    document.querySelectorAll('.plan-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.type !== 'radio') {
          const radio = card.querySelector('input[type="radio"]');
          if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
          }
        }
      });
    });

    // Frequency cards
    document.querySelectorAll('.frequency-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.type !== 'radio') {
          const radio = card.querySelector('input[type="radio"]');
          if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
          }
        }
      });
    });

    // Quantity options
    document.querySelectorAll('.quantity-option').forEach(option => {
      option.addEventListener('click', (e) => {
        if (e.target.type !== 'radio') {
          const radio = option.querySelector('input[type="radio"]');
          if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
          }
        }
      });
    });

    // Addon cards
    document.querySelectorAll('.addon-item').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox') {
          const checkbox = card.querySelector('input[type="checkbox"]');
          if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
          }
        }
      });
    });
  }

  function handleNext() {
    if (validateCurrentStep()) {
      if (state.currentStep < 3) {
        goToStep(state.currentStep + 1);
      }
    }
  }

  function handleBack() {
    if (state.currentStep > 1) {
      goToStep(state.currentStep - 1);
    }
  }

  function handleComplete() {
    if (validateAllSteps()) {
      processCheckout();
    }
  }

  function handlePlanSelection(e) {
    const planId = e.target.value;
    const planData = window.strivData.subscriptions[planId];
    
    state.selections.subscription = {
      plan: planId,
      price: planData.monthlyPrice
    };

    // Update visual selection state
    document.querySelectorAll('.plan-card').forEach(card => {
      card.classList.remove('selected');
    });
    e.target.closest('.plan-card').classList.add('selected');

    updateOrderSummary();
    updateUI();
    
    // Add selection animation
    animateSelection(e.target.closest('.plan-card'));
  }

  function handleFrequencySelection(e) {
    const frequency = parseInt(e.target.value);
    
    if (!state.selections.delivery) {
      state.selections.delivery = {};
    }
    
    state.selections.delivery.frequency = frequency;

    // Update visual selection state
    document.querySelectorAll('.frequency-card').forEach(card => {
      card.classList.remove('selected');
    });
    e.target.closest('.frequency-card').classList.add('selected');

    updateDeliveryPricing();
    updateOrderSummary();
    updateUI();
    
    // Add selection animation
    animateSelection(e.target.closest('.frequency-card'));
  }

  function handleQuantitySelection(e) {
    const quantity = parseInt(e.target.value);
    
    if (!state.selections.delivery) {
      state.selections.delivery = {};
    }
    
    state.selections.delivery.quantity = quantity;

    // Update visual selection state
    document.querySelectorAll('.quantity-option').forEach(option => {
      option.classList.remove('selected');
    });
    e.target.closest('.quantity-option').classList.add('selected');

    updateDeliveryPricing();
    updateOrderSummary();
    updateUI();
    
    // Add selection animation
    animateSelection(e.target.closest('.quantity-option'));
  }

  function updateDeliveryPricing() {
    const delivery = state.selections.delivery;
    
    if (!delivery || !delivery.frequency || !delivery.quantity) {
      elements.deliverySummaryText.textContent = 'Select frequency and quantity';
      elements.deliveryTotalPrice.textContent = '$0';
      return;
    }

    const basePrice = window.strivData.delivery.basePrice[delivery.quantity];
    const frequencyData = window.strivData.delivery.frequencies[delivery.frequency];
    const shippingCost = frequencyData.shipping;
    const totalPrice = basePrice + shippingCost;
    
    // Update state
    state.selections.delivery.price = totalPrice;
    
    // Update UI
    const quantityText = delivery.quantity === 1 ? 'pair' : 'pairs';
    const frequencyText = delivery.frequency === 3 ? '3 months' : '6 months';
    const summaryText = `${delivery.quantity} ${quantityText} every ${frequencyText}`;
    
    elements.deliverySummaryText.textContent = summaryText;
    elements.deliveryTotalPrice.textContent = `$${totalPrice}`;
  }

  function handleAddonSelection(e) {
    const addonItem = e.target.closest('.addon-item');
    const addonId = addonItem.dataset.addonId;
    const addonPrice = parseInt(addonItem.dataset.price);
    const addonData = window.strivData.addons[addonId];

    if (e.target.checked) {
      state.selections.addons.push({
        id: addonId,
        name: addonData.name,
        price: addonPrice
      });
      addonItem.classList.add('selected');
    } else {
      state.selections.addons = state.selections.addons.filter(
        addon => addon.id !== addonId
      );
      addonItem.classList.remove('selected');
    }

    updateOrderSummary();
    
    // Add selection animation
    animateSelection(addonItem);
  }

  function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 3) return;

    // Hide all steps
    elements.stepSlides.forEach(slide => {
      slide.classList.remove('active');
    });

    // Show new step
    const newSlide = document.getElementById(`step-${stepNumber}`);
    if (newSlide) {
      newSlide.classList.add('active');
    }

    state.currentStep = stepNumber;
    updateProgressIndicator();
    updateUI();
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateCurrentStep() {
    hideError();

    switch (state.currentStep) {
      case 1:
        return true; // Hardware is always selected
      
      case 2:
        if (!state.selections.subscription.plan) {
          showError("Please select an AI coaching plan to continue");
          return false;
        }
        return true;
      
      case 3:
        if (!state.selections.delivery || !state.selections.delivery.frequency || !state.selections.delivery.quantity) {
          showError("Please select both delivery frequency and quantity to continue");
          return false;
        }
        return true;
      
      default:
        return true;
    }
  }

  function validateAllSteps() {
    if (!state.selections.subscription.plan) {
      showError("Please select an AI coaching plan");
      goToStep(2);
      return false;
    }

    if (!state.selections.delivery.frequency) {
      showError("Please select a delivery schedule");
      goToStep(3);
      return false;
    }

    return true;
  }

  function updateProgressIndicator() {
    const progress = (state.currentStep / 3) * 100;
    elements.progressFill.style.width = `${progress}%`;
    elements.progressText.textContent = `Step ${state.currentStep} of 3`;
  }

  function updateUI() {
    // Update navigation buttons
    elements.navBack.classList.toggle('hidden', state.currentStep === 1);
    
    if (state.currentStep === 3) {
      elements.navNext.classList.add('hidden');
      elements.navComplete.classList.remove('hidden');
      
      // Update complete button state
      const isValid = state.selections.subscription.plan && state.selections.delivery.frequency;
      elements.navComplete.disabled = !isValid;
    } else {
      elements.navNext.classList.remove('hidden');
      elements.navComplete.classList.add('hidden');
      
      // Update next button state and text
      let buttonText = 'Continue';
      let isDisabled = false;
      
      if (state.currentStep === 2) {
        buttonText = state.selections.subscription.plan ? 'Continue to Delivery' : 'Select a Plan';
        isDisabled = !state.selections.subscription.plan;
      }
      
      elements.navNext.querySelector('span').textContent = buttonText;
      elements.navNext.disabled = isDisabled;
    }
  }

  function updateOrderSummary() {
    // Calculate totals
    state.totals.today = state.selections.hardware.price;
    state.totals.monthly = state.selections.subscription.price;
    state.totals.delivery = state.selections.delivery.price;

    // Add addon prices to today's total
    state.selections.addons.forEach(addon => {
      state.totals.today += addon.price;
    });

    // Update order items
    updateOrderItems();
    
    // Update totals
    elements.totalToday.textContent = `$${state.totals.today}`;
    
    // Show/hide recurring items
    if (state.totals.monthly > 0) {
      elements.recurringSubscription.classList.remove('hidden');
      elements.totalMonthly.textContent = `$${state.totals.monthly}`;
    } else {
      elements.recurringSubscription.classList.add('hidden');
    }

    if (state.totals.delivery > 0) {
      elements.recurringDelivery.classList.remove('hidden');
      elements.totalDelivery.textContent = `$${state.totals.delivery}`;
    } else {
      elements.recurringDelivery.classList.add('hidden');
    }
  }

  function updateOrderItems() {
    const container = elements.orderItems;
    
    // Clear existing items except hardware
    const hardwareItem = container.querySelector('.hardware-item');
    container.innerHTML = '';
    container.appendChild(hardwareItem);

    // Add subscription
    if (state.selections.subscription.plan) {
      const subData = window.strivData.subscriptions[state.selections.subscription.plan];
      addOrderItem(subData.name, `$${state.selections.subscription.price}/mo`);
    }

    // Add delivery
    if (state.selections.delivery && state.selections.delivery.frequency && state.selections.delivery.quantity) {
      const quantity = state.selections.delivery.quantity;
      const frequency = state.selections.delivery.frequency;
      const quantityText = quantity === 1 ? 'pair' : 'pairs';
      const frequencyText = frequency === 3 ? '3 months' : '6 months';
      const deliveryName = `${quantity} ${quantityText} every ${frequencyText}`;
      addOrderItem(deliveryName, `$${state.selections.delivery.price}`);
    }

    // Add addons
    state.selections.addons.forEach(addon => {
      addOrderItem(addon.name, `$${addon.price}`);
    });
  }

  function addOrderItem(name, price) {
    const item = document.createElement('div');
    item.className = 'order-item';
    item.innerHTML = `
      <div class="item-info">
        <span class="item-name">${name}</span>
      </div>
      <span class="item-price">${price}</span>
    `;
    elements.orderItems.appendChild(item);
  }

  function animateSelection(element) {
    element.style.transform = 'scale(0.98)';
    element.style.transition = 'transform 0.1s ease';
    
    setTimeout(() => {
      element.style.transform = '';
      element.style.transition = '';
    }, 100);
  }

  function showError(message) {
    elements.errorText.textContent = message;
    elements.errorToast.classList.remove('hidden');
    
    // Auto hide after 5 seconds
    setTimeout(hideError, 5000);
  }

  function hideError() {
    elements.errorToast.classList.add('hidden');
  }

  function processCheckout() {
    // Show loading state
    elements.navComplete.disabled = true;
    elements.navComplete.querySelector('span').textContent = 'Processing...';

    // Prepare order data
    const orderData = {
      hardware: state.selections.hardware,
      subscription: state.selections.subscription,
      delivery: state.selections.delivery,
      addons: state.selections.addons,
      totals: state.totals
    };

    // Store in session for potential backend processing
    try {
      sessionStorage.setItem('strivOrder', JSON.stringify(orderData));
    } catch (error) {
      console.error('Failed to store order data:', error);
    }

    // Simulate processing
    setTimeout(() => {
      elements.navComplete.querySelector('span').textContent = 'Order Complete!';
      elements.navComplete.style.background = 'var(--brand-success)';
      
      setTimeout(() => {
        alert('Order completed successfully! (Stripe integration pending)');
        resetCheckout();
      }, 1000);
    }, 2000);
  }

  function resetCheckout() {
    // Reset state
    state.currentStep = 1;
    state.selections.subscription = { plan: null, price: 0 };
    state.selections.delivery = { frequency: null, price: 0 };
    state.selections.addons = [];

    // Reset form
    elements.planInputs.forEach(input => input.checked = false);
    elements.frequencyInputs.forEach(input => input.checked = false);
    elements.quantityInputs.forEach(input => input.checked = false);
    elements.addonInputs.forEach(input => input.checked = false);

    // Reset visual states
    document.querySelectorAll('.plan-card, .frequency-card, .quantity-option, .addon-item').forEach(card => {
      card.classList.remove('selected');
    });

    // Reset UI
    goToStep(1);
    updateOrderSummary();
    
    // Reset button
    elements.navComplete.disabled = false;
    elements.navComplete.style.background = '';
    elements.navComplete.querySelector('span').textContent = 'Complete Order';
  }

  // Enhanced mobile experience
  if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
    
    // Add touch feedback to interactive elements
    const touchElements = document.querySelectorAll('.plan-card, .delivery-card, .addon-item, .nav-btn');
    touchElements.forEach(element => {
      element.addEventListener('touchstart', () => {
        element.style.transform = 'scale(0.98)';
      }, { passive: true });
      
      element.addEventListener('touchend', () => {
        setTimeout(() => {
          element.style.transform = '';
        }, 150);
      }, { passive: true });
    });
  }
});