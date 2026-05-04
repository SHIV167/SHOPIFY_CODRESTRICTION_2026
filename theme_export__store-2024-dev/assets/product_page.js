 
    // JavaScript to set London tab active by default
    document.addEventListener("DOMContentLoaded", function() {
        var londonButton = document.querySelector(".tab button.tablinks:nth-of-type(1)");
        londonButton.click(); // Simulate a click event to activate London tab
    });

    // Function to switch tabs
    function openCity(evt, cityName) {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(cityName).style.display = "block";
        evt.currentTarget.className += " active";
    }
  