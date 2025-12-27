// --- EMAILJS CONFIGURATION ---
function sendSecurityEmail(userEmail, code) {
    const serviceID = "service_o7nd4jl";    // Your EmailJS Service ID
    const templateID = "template_vdpfy4t";  // Your EmailJS Template ID

    const username = userEmail.split("@")[0]; // Extract username from email

    const templateParams = {
        to_email: userEmail,
        username: username,
        code: code,
        subject: "Your Vercel Invest Security Code",
        instructions: "Enter this code in your app to verify your account. This code expires in 10 minutes.",
        timestamp: new Date().toLocaleString()
    };

    return emailjs.send(serviceID, templateID, templateParams)
        .then(() => console.log("2FA Email sent to " + userEmail + "!"))
        .catch(err => console.error("Email failed:", err));
}

// --- GENERATE 6-DIGIT 2FA CODE ---
function generate2FACode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- NAVIGATION ---
function navigate(viewId) {
    document.querySelectorAll('.auth-view').forEach(view => view.classList.add('hidden'));
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.remove('hidden');
}

// --- PASSWORD TOGGLE ---
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = "password";
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// --- POPUP ---
let popupCallback = null;
function showPopup(message, type = "success", callback = null) {
    const overlay = document.getElementById('popup-overlay');
    const msgEl = document.getElementById('popup-message');
    const iconEl = document.getElementById('popup-icon');

    msgEl.innerText = message;
    popupCallback = callback;

    if (type === "error") {
        iconEl.innerHTML = '<i class="fas fa-circle-exclamation text-danger"></i>';
    } else {
        iconEl.innerHTML = '<i class="fas fa-circle-check text-success"></i>';
    }

    overlay.classList.remove('hidden');
}

function closePopup() {
    document.getElementById('popup-overlay').classList.add('hidden');
    if (popupCallback) {
        popupCallback();
        popupCallback = null;
    }
}

// --- LOADING ANIMATION ---
function runLoadingAnimation(bar, btn, originalText, onComplete) {
    bar.style.width = "40%";
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> SECURING...`;

    setTimeout(() => {
        bar.style.width = "100%";
        setTimeout(() => {
            bar.style.width = "0%";
            btn.disabled = false;
            btn.innerHTML = originalText;
            onComplete();
        }, 400);
    }, 800);
}

// --- AUTH HANDLER ---
function handleAuth(action, event) {
    const bar = document.getElementById('top-loader');
    const btn = event.target;
    const originalText = btn.innerHTML;

    if (action === 'signup') {
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        if (!email || !pass) return showPopup("Please fill all fields", "error");

        localStorage.setItem('userEmail', email.toLowerCase());
        localStorage.setItem('userPass', pass);

        const code = generate2FACode();
        localStorage.setItem('user2FACode', code);

        runLoadingAnimation(bar, btn, originalText, () => {
            sendSecurityEmail(email, code);
            showPopup("Account created! 2FA code sent to your Gmail.", "success", () => navigate('signin'));
        });
    }

    else if (action === 'signin') {
        const emailInput = document.getElementById('log-email').value.toLowerCase();
        const passInput = document.getElementById('log-pass').value;
        const savedEmail = localStorage.getItem('userEmail');
        const savedPass = localStorage.getItem('userPass');

        if (emailInput === savedEmail && passInput === savedPass) {
            const code = generate2FACode();
            localStorage.setItem('user2FACode', code);

            runLoadingAnimation(bar, btn, originalText, () => {
                sendSecurityEmail(emailInput, code).then(() => {
                    navigate('2fa');
                    showPopup("Security code sent to your email.", "success");
                });
            });
        } else {
            showPopup("Incorrect email or password.", "error");
        }
    }

    else if (action === 'reset') {
        const emailInput = document.getElementById('forgot-email-input').value.toLowerCase();
        const newPass = document.getElementById('new-password-input').value;
        const savedEmail = localStorage.getItem('userEmail');

        if (emailInput === savedEmail) {
            runLoadingAnimation(bar, btn, originalText, () => {
                localStorage.setItem('userPass', newPass);
                sendSecurityEmail(emailInput, "Password Updated Successfully").then(() => {
                    showPopup("Password updated! Check Gmail for confirmation.", "success", () => navigate('signin'));
                });
            });
        } else {
            showPopup("Email not found.", "error");
        }
    }

    /* -----------------------------------------------------------
       STAGES: 2FA VERIFICATION & DASHBOARD REDIRECT
       ----------------------------------------------------------- */
    else if (action === 'verify2fa') {
        const otpInputs = document.querySelectorAll('.otp-input');
        let enteredCode = "";
        otpInputs.forEach(input => enteredCode += input.value);

        runLoadingAnimation(bar, btn, originalText, () => {
            // Check if the entered code matches the one stored in LocalStorage
            if (enteredCode === localStorage.getItem('user2FACode')) {

                // Success Popup: When "Continue" is clicked, it executes the callback function
                showPopup("Identity Verified. Welcome!", "success", () => {

                    /* >>> START REDIRECT LOGIC <<< */
                    // This links to your main Dashboard file
                    window.location.href = "./Dashboard.html";
                    /* >>> END REDIRECT LOGIC <<< */

                });

            } else {
                // Handle incorrect code
                showPopup("Invalid Code. Please check your Gmail.", "error");
                otpInputs.forEach(input => input.value = "");
                otpInputs[0].focus();
            }
        });
    }
    /* ----------------------------------------------------------- */
}

// --- OTP AUTO-FOCUS ---
document.querySelectorAll('.otp-input').forEach((input, index, inputs) => {
    input.addEventListener('input', () => {
        if (input.value.length === 1 && index < inputs.length - 1) inputs[index + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value === '' && index > 0) inputs[index - 1].focus();
    });
});
