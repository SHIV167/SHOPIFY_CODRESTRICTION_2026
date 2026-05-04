// Add this code to your theme.js file or create a new JavaScript file and include it in your theme

document.addEventListener('DOMContentLoaded', (event) => {
  const loginPopup = document.getElementById('login-popup');
  const signupPopup = document.getElementById('signup-popup');
  const loginLink = document.getElementById('login-link');
  const signupLink = document.getElementById('signup-link');
  const showSignup = document.getElementById('show-signup');
  const showLogin = document.getElementById('show-login');
  const closeBtns = document.getElementsByClassName('close');

  function showPopup(popup) {
    popup.style.display = 'block';
  }

  function hidePopup(popup) {
    popup.style.display = 'none';
  }

  loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPopup(loginPopup);
  });

  signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPopup(signupPopup);
  });

  showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    hidePopup(loginPopup);
    showPopup(signupPopup);
  });

  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    hidePopup(signupPopup);
    showPopup(loginPopup);
  });

  Array.from(closeBtns).forEach(btn => {
    btn.addEventListener('click', () => {
      hidePopup(loginPopup);
      hidePopup(signupPopup);
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target == loginPopup) {
      hidePopup(loginPopup);
    }
    if (e.target == signupPopup) {
      hidePopup(signupPopup);
    }
  });
});