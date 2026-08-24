document.addEventListener('DOMContentLoaded', async () => {
    try {
        const plans = await fetch('http://localhost:3000/api/subscriptions/plans').then(res => res.json());
        renderPlans(plans);
    } catch (e) {
        console.error(e);
        document.getElementById('plansContainer').innerHTML = '<div class="alert alert-danger">Failed to load subscription plans.</div>';
    }
});

function renderPlans(plans) {
    const container = document.getElementById('plansContainer');
    container.innerHTML = '';
    
    plans.forEach(plan => {
        container.innerHTML += `
            <div class="col-md-4 mb-3">
                <div class="card h-100 plan-card" onclick="selectPlan('${plan.id}', this)">
                    <div class="card-body text-center">
                        <h5 class="card-title text-primary">${plan.name}</h5>
                        <h3 class="my-3">$${plan.pricePerYear}<small class="text-muted fs-6">/yr</small></h3>
                        <p class="text-muted small">Up to ${plan.maxUsers} users</p>
                        <p class="small text-muted mb-0">${plan.features.join(', ')}</p>
                    </div>
                </div>
            </div>
        `;
    });
}

function selectPlan(planId, element) {
    document.getElementById('selectedPlan').value = planId;
    
    document.querySelectorAll('.plan-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('orgName').value;
    const adminEmail = document.getElementById('adminEmail').value;
    const subscriptionPlanId = document.getElementById('selectedPlan').value;
    
    if (!subscriptionPlanId) {
        alert('Please select a subscription plan.');
        return;
    }
    
    try {
        const res = await fetch('http://localhost:3000/api/organizations/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, adminEmail, subscriptionPlanId })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Registration failed');
        }
        
        alert('Registration successful! Please wait for approval by the Platform Owner. The default password for your admin account will be "password" once approved.');
        window.location.href = 'login.html';
    } catch (err) {
        alert(err.message);
    }
}
