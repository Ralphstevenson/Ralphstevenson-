// Fonksyon pou chanje ant Login ak Signup nan paj Auth la
window.toggleAuth = (type) => {
    const loginSection = document.getElementById('login-section');
    const signupSection = document.getElementById('signup-section');

    if (type === 'signup') {
        loginSection.classList.add('hidden');
        signupSection.classList.remove('hidden');
    } else {
        signupSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    }
};
