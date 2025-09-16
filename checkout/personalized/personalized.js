document.addEventListener("DOMContentLoaded", () => {
  // State management for personalized flow
  const state = {
    currentStep: 1,
    trainingGoal: null,
    weeklyMileage: null,
    customMileage: null,
    recommendedPlan: null,
    customizations: {
      aiLevel: null,
      insoleFrequency: null
    },
    finalPlan: null
  };

  // Plan recommendation logic
  const planRecommendations = {
    // Goal-based recommendations
    fitness: {
      aiLevel: 'essential',
      defaultInsole: 'standard',
      explanation: 'For general fitness, our Essential AI Coach provides the perfect balance of guidance without overwhelming you. Standard insole delivery keeps your sensors fresh every 6 months.'
    },
    race: {
      aiLevel: 'full',
      defaultInsole: 'standard',
      explanation: 'Race training benefits from our Full AI Coach with advanced analytics and structured training insights. Standard delivery supports consistent training volume.'
    },
    performance: {
      aiLevel: 'full',
      defaultInsole: 'quarterly',
      explanation: 'Serious performance training requires our Full AI Coach with biomechanical analysis and PT insights. Quarterly insole delivery ensures maximum sensor accuracy for high-volume training.'
    },
    recovery: {
      aiLevel: 'full',
      defaultInsole: 'standard',
      explanation: 'Recovery and injury prevention benefit from our Full AI Coach with PT guidance and movement analysis. Standard delivery is perfect for gradual mileage increases.'
    }
  };

  // Mileage-based adjustments
  const mileageAdjustments = {
    beginner: { // 0-10 miles
      aiLevel: 'essential',
      insoleFrequency: 'standard'
    },
    intermediate: { // 10-25 miles
      // No changes - use goal-based defaults
    },
    advanced: { // 25-50 miles
      insoleFrequency: 'quarterly' // Higher volume needs more frequent replacement
    },
    elite: { // 50+ miles
      aiLevel: 'full',
      insoleFrequency: 'quarterly'
    }
  };

  // AI Plan Details
  const aiPlans = {
    essential: {
      name: 'Essential AI Coach',
      price: 5.99,
      features: [
        'Real-time feedback during runs',
        'Basic performance analytics',
        'Efficiency & fatigue analysis',
        'Weekly performance summaries',
        'Mobile app coaching'
      ]
    },
    full: {
      name: 'Full AI Coach',
      price: 12.99,
      features: [
        'Everything in Essential +',
        'Advanced biomechanical analysis',
        'PT connections & consultations',
        'Shoe comparison & recommendations',
        'Advanced trend analysis',
        'Weekly AI summaries with latest AI models',
        'Priority support'
      ]
    }
  };

  // Insole Plans
  const insolePlans = {
    standard: {
      name: 'Standard Delivery',
      price: 20,
      frequency: '6 months',
      description: '2 pairs delivered every 6 months'
    },
    quarterly: {
      name: 'Quarterly Delivery',
      price: 25,
      frequency: '3 months',
      description: '2 pairs delivered every 3 months'
    }
  };

  // DOM Elements
  const stepSections = document.querySelectorAll('.step-section');
  const progressSteps = document.querySelectorAll('.progress-steps .step');
  const nextButton = document.getElementById('next-button');
  const prevButton = document.getElementById('prev-button');
  const errorMessage = document.getElementById('error-message');

  // Step 1 elements
  const goalCards = document.querySelectorAll('.goal-card');

  // Step 2 elements
  const mileageCards = document.querySelectorAll('.mileage-card');
  const customMilesInput = document.getElementById('custom-miles');

  // Step 3 elements
  const editPlanBtn = document.getElementById('edit-plan-btn');
  
  // Step 3b elements
  const aiOptions = document.querySelectorAll('.ai-option');
  const insoleOptions = document.querySelectorAll('.insole-option');
  const saveCustomizationBtn = document.getElementById('save-customization');

  // Step 4 elements
  const backToEditBtn = document.getElementById('back-to-edit');
  const finalCheckoutBtn = document.getElementById('final-checkout-btn');

  // Initialize
  init();

  function init() {
    setupEventListeners();
    updateUI();
  }

  function setupEventListeners() {
    // Navigation
    nextButton.addEventListener('click', handleNext);
    prevButton.addEventListener('click', handlePrevious);

    // Step 1: Training Goals
    goalCards.forEach(card => {
      card.addEventListener('click', () => {
        goalCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.trainingGoal = card.dataset.goal;
        updateUI();
      });
    });

    // Step 2: Mileage Selection
    mileageCards.forEach(card => {
      card.addEventListener('click', () => {
        mileageCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.weeklyMileage = card.dataset.mileage;
        state.customMileage = null;
        customMilesInput.value = '';
        updateUI();
      });
    });

    // Custom mileage input
    customMilesInput.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (value && value > 0) {
        mileageCards.forEach(c => c.classList.remove('selected'));
        state.customMileage = value;
        state.weeklyMileage = categorizeMileage(value);
        updateUI();
      } else {
        state.customMileage = null;
        state.weeklyMileage = null;
      }
    });

    // Step 3: Edit Plan
    editPlanBtn.addEventListener('click', () => {
      goToStep('3-edit');
    });

    // Step 3b: Customization options
    aiOptions.forEach(option => {
      option.addEventListener('click', () => {
        aiOptions.forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        state.customizations.aiLevel = option.dataset.ai;
        updateCustomizationTotals();
      });
    });

    insoleOptions.forEach(option => {
      option.addEventListener('click', () => {
        insoleOptions.forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        state.customizations.insoleFrequency = option.dataset.insole;
        updateCustomizationTotals();
      });
    });

    saveCustomizationBtn.addEventListener('click', () => {
      applyCustomizations();
      goToStep(4);
    });

    // Step 4: Final actions
    backToEditBtn.addEventListener('click', () => {
      goToStep('3-edit');
    });

    finalCheckoutBtn.addEventListener('click', handleFinalCheckout);
  }

  function handleNext() {
    if (validateCurrentStep()) {
      if (state.currentStep === 1) {
        goToStep(2);
      } else if (state.currentStep === 2) {
        generateRecommendation();
        goToStep(3);
      } else if (state.currentStep === 3) {
        goToStep(4);
      }
    }
  }

  function handlePrevious() {
    if (state.currentStep === 2) {
      goToStep(1);
    } else if (state.currentStep === 3) {
      goToStep(2);
    } else if (state.currentStep === 4) {
      goToStep(3);
    }
  }

  function validateCurrentStep() {
    hideError();

    switch (state.currentStep) {
      case 1:
        if (!state.trainingGoal) {
          showError("Please select your training goal to continue");
          return false;
        }
        return true;
      
      case 2:
        if (!state.weeklyMileage) {
          showError("Please select your weekly mileage or enter a custom amount");
          return false;
        }
        return true;
      
      default:
        return true;
    }
  }

  function goToStep(stepNumber) {
    // Handle special step IDs
    if (stepNumber === '3-edit') {
      stepSections.forEach(section => section.classList.add('hidden'));
      document.getElementById('step-3-edit').classList.remove('hidden');
      setupCustomizationDefaults();
      return;
    }

    // Hide all sections
    stepSections.forEach(section => section.classList.add('hidden'));
    
    // Show target section
    const targetSection = document.getElementById(`step-${stepNumber}`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }

    // Update state and UI
    state.currentStep = stepNumber;
    updateProgressSteps();
    updateUI();

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgressSteps() {
    progressSteps.forEach((step, index) => {
      const stepNumber = index + 1;
      
      step.classList.remove('active', 'completed');
      
      if (stepNumber < state.currentStep) {
        step.classList.add('completed');
      } else if (stepNumber === state.currentStep) {
        step.classList.add('active');
      }
    });
  }

  function updateUI() {
    // Update navigation buttons
    if (state.currentStep === 1) {
      prevButton.classList.add('hidden');
    } else {
      prevButton.classList.remove('hidden');
    }

    if (state.currentStep === 4) {
      nextButton.classList.add('hidden');
    } else {
      nextButton.classList.remove('hidden');
    }

    // Update next button text and state
    updateNextButton();
  }

  function updateNextButton() {
    const buttonText = nextButton.querySelector('.button-text');
    
    switch (state.currentStep) {
      case 1:
        buttonText.textContent = state.trainingGoal ? 'Continue' : 'Select Training Goal';
        nextButton.disabled = !state.trainingGoal;
        break;
      case 2:
        buttonText.textContent = state.weeklyMileage ? 'Get My Plan' : 'Select Weekly Mileage';
        nextButton.disabled = !state.weeklyMileage;
        break;
      case 3:
        buttonText.textContent = 'Continue to Checkout';
        nextButton.disabled = false;
        break;
      default:
        buttonText.textContent = 'Continue';
        nextButton.disabled = false;
    }
  }

  function categorizeMileage(miles) {
    if (miles <= 10) return 'beginner';
    if (miles <= 25) return 'intermediate';
    if (miles <= 50) return 'advanced';
    return 'elite';
  }

  function generateRecommendation() {
    const goalRec = planRecommendations[state.trainingGoal];
    const mileageAdj = mileageAdjustments[state.weeklyMileage] || {};

    // Start with goal-based recommendation
    const recommendation = {
      aiLevel: goalRec.aiLevel,
      insoleFrequency: goalRec.defaultInsole,
      explanation: goalRec.explanation
    };

    // Apply mileage-based adjustments
    if (mileageAdj.aiLevel) {
      recommendation.aiLevel = mileageAdj.aiLevel;
    }
    if (mileageAdj.insoleFrequency) {
      recommendation.insoleFrequency = mileageAdj.insoleFrequency;
    }

    // Update explanation for mileage adjustments
    if (state.weeklyMileage === 'elite') {
      recommendation.explanation = 'With your high training volume (50+ miles/week), you need our Full AI Coach for comprehensive analysis and quarterly insole delivery to maintain sensor accuracy.';
    } else if (state.weeklyMileage === 'advanced') {
      recommendation.explanation = goalRec.explanation + ' With your advanced training volume, we recommend quarterly insole delivery for optimal sensor performance.';
    } else if (state.weeklyMileage === 'beginner') {
      recommendation.explanation = 'For beginners, our Essential AI Coach provides perfect guidance without overwhelming complexity. Standard insole delivery supports your growing training routine.';
    }

    state.recommendedPlan = recommendation;
    state.finalPlan = { ...recommendation }; // Copy for final plan

    displayRecommendation();
  }

  function displayRecommendation() {
    const aiPlan = aiPlans[state.recommendedPlan.aiLevel];
    const insolePlan = insolePlans[state.recommendedPlan.insoleFrequency];

    // Update plan title and subtitle
    document.getElementById('recommended-plan-title').textContent = 
      `${aiPlan.name} + ${insolePlan.name}`;
    document.getElementById('recommended-plan-subtitle').textContent = 
      `Personalized for ${getGoalDisplayName(state.trainingGoal)} (${getMileageDisplayName()})`;

    // Update AI section
    document.getElementById('ai-plan-name').textContent = aiPlan.name;
    document.getElementById('ai-plan-price').textContent = `$${aiPlan.price}/mo`;
    
    const aiFeatures = document.getElementById('ai-features');
    aiFeatures.innerHTML = aiPlan.features.map(feature => 
      `<div class="feature-item">• ${feature}</div>`
    ).join('');

    // Update insole section
    document.getElementById('insole-plan-name').textContent = insolePlan.name;
    document.getElementById('insole-plan-price').textContent = `$${insolePlan.price} every ${insolePlan.frequency}`;
    document.getElementById('insole-description').textContent = insolePlan.description;

    // Update totals
    document.getElementById('today-total').textContent = '$149';
    document.getElementById('monthly-total').textContent = `$${aiPlan.price}`;
    document.getElementById('insole-total').textContent = `$${insolePlan.price} every ${insolePlan.frequency}`;

    // Update explanation
    document.getElementById('recommendation-explanation').textContent = state.recommendedPlan.explanation;
  }

  function setupCustomizationDefaults() {
    // Pre-select recommended options
    aiOptions.forEach(option => {
      option.classList.remove('selected');
      if (option.dataset.ai === state.recommendedPlan.aiLevel) {
        option.classList.add('selected');
        state.customizations.aiLevel = state.recommendedPlan.aiLevel;
      }
    });

    insoleOptions.forEach(option => {
      option.classList.remove('selected');
      if (option.dataset.insole === state.recommendedPlan.insoleFrequency) {
        option.classList.add('selected');
        state.customizations.insoleFrequency = state.recommendedPlan.insoleFrequency;
      }
    });

    updateCustomizationTotals();
  }

  function updateCustomizationTotals() {
    if (!state.customizations.aiLevel || !state.customizations.insoleFrequency) return;

    const aiPlan = aiPlans[state.customizations.aiLevel];
    const insolePlan = insolePlans[state.customizations.insoleFrequency];

    document.getElementById('custom-today-total').textContent = '$149';
    document.getElementById('custom-monthly-total').textContent = `$${aiPlan.price}`;
    document.getElementById('custom-insole-total').textContent = `$${insolePlan.price} every ${insolePlan.frequency}`;
  }

  function applyCustomizations() {
    state.finalPlan = {
      aiLevel: state.customizations.aiLevel,
      insoleFrequency: state.customizations.insoleFrequency
    };
    updateFinalSummary();
  }

  function updateFinalSummary() {
    const aiPlan = aiPlans[state.finalPlan.aiLevel];
    const insolePlan = insolePlans[state.finalPlan.insoleFrequency];

    // Update final summary
    document.getElementById('final-goal').textContent = getGoalDisplayName(state.trainingGoal);
    document.getElementById('final-mileage').textContent = getMileageDisplayName();
    
    document.getElementById('final-ai-name').textContent = aiPlan.name;
    document.getElementById('final-ai-price').textContent = `$${aiPlan.price}/mo`;
    
    document.getElementById('final-insole-name').textContent = insolePlan.name;
    document.getElementById('final-insole-price').textContent = `$${insolePlan.price} every ${insolePlan.frequency}`;
    
    document.getElementById('final-today-total').textContent = '$149';
    document.getElementById('final-monthly-total').textContent = `$${aiPlan.price}`;
    document.getElementById('final-insole-total').textContent = `$${insolePlan.price} every ${insolePlan.frequency}`;
  }

  function getGoalDisplayName(goal) {
    const goalNames = {
      fitness: 'General Fitness',
      race: 'Race Training',
      performance: 'Performance',
      recovery: 'Recovery & Injury Prevention'
    };
    return goalNames[goal] || goal;
  }

  function getMileageDisplayName() {
    if (state.customMileage) {
      return `${state.customMileage} miles/week`;
    }
    
    const mileageNames = {
      beginner: '0-10 miles/week',
      intermediate: '10-25 miles/week',
      advanced: '25-50 miles/week',
      elite: '50+ miles/week'
    };
    return mileageNames[state.weeklyMileage] || state.weeklyMileage;
  }

  function handleFinalCheckout(e) {
    e.preventDefault();

    // Prepare checkout data
    const checkoutData = {
      trainingGoal: state.trainingGoal,
      weeklyMileage: state.weeklyMileage,
      customMileage: state.customMileage,
      aiLevel: state.finalPlan.aiLevel,
      insoleFrequency: state.finalPlan.insoleFrequency,
      hardware: { price: 149 },
      totals: {
        today: 149,
        monthly: aiPlans[state.finalPlan.aiLevel].price,
        insole: insolePlans[state.finalPlan.insoleFrequency].price,
        insoleFrequency: insolePlans[state.finalPlan.insoleFrequency].frequency
      }
    };

    // Store order data
    try {
      sessionStorage.setItem('personalizedOrderData', JSON.stringify(checkoutData));
      console.log('Personalized order data saved:', checkoutData);
    } catch (error) {
      console.error('Error saving order data:', error);
    }

    // Show loading state
    finalCheckoutBtn.disabled = true;
    finalCheckoutBtn.querySelector('.button-text').textContent = 'Processing...';

    // Simulate checkout process (replace with actual Stripe integration)
    setTimeout(() => {
      finalCheckoutBtn.querySelector('.button-text').textContent = 'Order Complete!';
      setTimeout(() => {
        alert('Order completed! (Stripe integration coming soon)\n\nYour personalized AI running coach system is on its way!');
        // Reset for demo
        resetFlow();
      }, 1000);
    }, 2000);
  }

  function resetFlow() {
    // Reset state
    Object.assign(state, {
      currentStep: 1,
      trainingGoal: null,
      weeklyMileage: null,
      customMileage: null,
      recommendedPlan: null,
      customizations: { aiLevel: null, insoleFrequency: null },
      finalPlan: null
    });

    // Reset UI
    goalCards.forEach(card => card.classList.remove('selected'));
    mileageCards.forEach(card => card.classList.remove('selected'));
    customMilesInput.value = '';
    
    finalCheckoutBtn.disabled = false;
    finalCheckoutBtn.querySelector('.button-text').textContent = 'Complete Order - Start My AI Coaching';

    goToStep(1);
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideError() {
    errorMessage.classList.add('hidden');
  }

  // Initialize the flow
  updateUI();
});
