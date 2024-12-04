let totalAmount = 0;

function addLineItem() {
    const lineItemsDiv = document.getElementById('lineItems');
    const newLineItem = document.createElement('div');
    newLineItem.className = 'line-item row mb-2';
    newLineItem.innerHTML = `
        <div class="col">
            <input type="text" class="form-control" placeholder="Description">
        </div>
        <div class="col">
            <input type="number" class="form-control" placeholder="Quantity">
        </div>
        <div class="col">
            <input type="number" class="form-control" placeholder="Price">
        </div>
        <div class="col-auto">
            <button type="button" class="btn btn-danger" onclick="this.parentElement.parentElement.remove()">Remove</button>
        </div>
    `;
    lineItemsDiv.appendChild(newLineItem);
}

document.getElementById('invoiceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = 'Generating...';
    
    // Gather all form data
    const formData = new FormData();
    
    // Add company info
    formData.append('companyName', document.getElementById('companyName').value);
    formData.append('license', document.getElementById('license').value);
    formData.append('insurance', document.getElementById('insurance').value);
    
    // Add client info
    formData.append('clientName', document.getElementById('clientName').value);
    formData.append('clientEmail', document.getElementById('clientEmail').value);
    
    // Add line items
    const lineItems = [];
    document.querySelectorAll('.line-item').forEach(item => {
        lineItems.push({
            description: item.querySelector('input[placeholder="Description"]').value,
            quantity: item.querySelector('input[placeholder="Quantity"]').value,
            price: item.querySelector('input[placeholder="Price"]').value
        });
    });
    formData.append('lineItems', JSON.stringify(lineItems));
    
    // Add images
    const imageInput = document.getElementById('workImages');
    for (let i = 0; i < imageInput.files.length; i++) {
        formData.append('workImages', imageInput.files[i]);
    }
    
    try {
        const response = await fetch('/generate-invoice', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error generating invoice: ' + error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Generate Invoice';
    }
});

// Image preview
document.getElementById('workImages').addEventListener('change', function(e) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    
    [...this.files].forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxHeight = '100px';
            img.style.margin = '5px';
            preview.appendChild(img);
        }
        reader.readAsDataURL(file);
    });
}); 