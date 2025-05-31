const API_KEY = "fc7e83ca36128519c1219013141d4c0f"; // 🔑 Replace this with your real API key
let map, marker;
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const weatherInfo = document.getElementById("weatherInfo");
const forecastCards = document.getElementById("forecastCards");
const clock = document.getElementById("clock");
const addCityBtn = document.getElementById("addCityBtn");
const citiesContainer = document.getElementById("citiesContainer");

addCityBtn.addEventListener("click", () => {
  const city = searchInput.value.trim();
  if (!city) return;

  let saved = JSON.parse(localStorage.getItem("cityList")) || [];

  if (!saved.includes(city)) {
    saved.push(city);
    localStorage.setItem("cityList", JSON.stringify(saved));
    createCityCard(city);
  }
});
function createCityCard(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.cod === 200) {
        const card = document.createElement("div");
        card.classList.add("city-card");

        const icon = data.weather[0].icon;
        const temp = data.main.temp.toFixed(1);
        const desc = data.weather[0].description;

        card.innerHTML = `
          <button class="delete-btn" title="Remove">❌</button>
          <h4>${city}</h4>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
          <p>${temp}°C</p>
          <p>${desc}</p>
        `;

        // Delete city from localStorage + UI
        card.querySelector(".delete-btn").addEventListener("click", () => {
          let cities = JSON.parse(localStorage.getItem("cityList")) || [];
          cities = cities.filter(c => c.toLowerCase() !== city.toLowerCase());
          localStorage.setItem("cityList", JSON.stringify(cities));
          card.remove();
        });

        citiesContainer.appendChild(card);
      }
    })
    .catch(err => console.error("Error loading city card:", err));
}

window.addEventListener("load", () => {
  const saved = JSON.parse(localStorage.getItem("cityList")) || [];
  saved.forEach(city => createCityCard(city));
});


// Update Clock Every Second
function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();
const cityButtonsContainer = document.getElementById("cityButtons");

// Load saved cities on page load


// Event listener
searchBtn.addEventListener("click", () => {
  const city = searchInput.value.trim();
  if (city) {
    getWeather(city);
    getForecast(city);
  }
});

// Fetch current weather
function getWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.cod === 200) {
        const { name, main, weather, coord } = data;
        const { temp, pressure, humidity } = main;
        const { description, icon } = weather[0];
        const tip = getWeatherTip(weather[0].main);

        const mainWeather = weather[0].main.toLowerCase();
        const windSpeed = data.wind.speed;
        const windDeg = data.wind.deg;

        document.getElementById("windSpeed").textContent = windSpeed;
        document.getElementById("compassNeedle").style.transform = `rotate(${windDeg}deg)`;


        // 🌤️ Set current weather block FIRST
        weatherInfo.innerHTML = `
          <h3>${name}</h3>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
          <p><strong>${temp}°C</strong> – ${description}</p>
          <p>💧 Humidity: ${humidity}% | 📊 Pressure: ${pressure} mb</p>
          <p class="weather-tip">${tip}</p> <!-- ✅ Weather Tip Line -->
        `;

        // 🎨 Background based on condition
        try {
          const bgLayer = document.querySelector(".background-layer");
          switch (mainWeather) {
            case 'clear': bgLayer.style.backgroundImage = "url('https://source.unsplash.com/1600x900/?clear-sky')"; break;
            case 'clouds': bgLayer.style.backgroundImage = "url('https://source.unsplash.com/1600x900/?cloudy')"; break;
            case 'rain': bgLayer.style.backgroundImage = "url('https://source.unsplash.com/1600x900/?rain')"; break;
            case 'snow': bgLayer.style.backgroundImage = "url('https://source.unsplash.com/1600x900/?snow')"; break;
            case 'thunderstorm': bgLayer.style.backgroundImage = "url('https://source.unsplash.com/1600x900/?storm')"; break;
            default: bgLayer.style.backgroundImage = "url('https://source.unsplash.com/1600x900/?weather')";
          }
        } catch (e) {
          console.error("Background layer error:", e);
        }

        // 🔁 Now fetch extra data
        const lat = coord.lat;
        const lon = coord.lon;
        showMap(lat,lon,name)
fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
  .then(res => res.json())
  .then(extra => {
    console.log("🌅 Extra Weather Data:", extra); // ✅ Check this

    if (!extra.current) {
      weatherInfo.innerHTML += `<p>⚠️ UV/Time data unavailable</p>`;
      return;
    }

    const uv = extra.current.uvi;
    const sunrise = new Date(extra.current.sunrise * 1000).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit'
    });
    const sunset = new Date(extra.current.sunset * 1000).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit'
    });

    console.log("🌞 Sunrise:", sunrise, "🌇 Sunset:", sunset); // ✅ Check if values are here

    // UI
    document.getElementById("sunriseTime").textContent = sunrise;
    document.getElementById("sunsetTime").textContent = sunset;
  });

      } else {
        weatherInfo.innerHTML = `<p>❌ City not found.</p>`;
      }
    })
    .catch(error => {
      console.error("Weather error:", error);
      weatherInfo.innerHTML = `<p>Something went wrong 😓</p>`;
    });
}

function getForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.cod === "200") {
        forecastCards.innerHTML = "";
        document.getElementById("hourlyCards").innerHTML = "";

        // 5-Day Forecast
        const dailyData = data.list.filter(item =>
          item.dt_txt.includes("12:00:00")
        );

        dailyData.slice(0, 5).forEach(day => {
          const date = new Date(day.dt_txt).toDateString().slice(0, 10);
          const temp = day.main.temp.toFixed(1);
          const icon = day.weather[0].icon;
          const desc = day.weather[0].description;

          const card = document.createElement("div");
          card.classList.add("forecast-card");
          card.innerHTML = `
            <h4>${date}</h4>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
            <p>${temp}°C</p>
            <p>${desc}</p>
          `;
          forecastCards.appendChild(card);
        });

        // 🔁 Hourly Cards
        const hourlyContainer = document.getElementById("hourlyCards");
        data.list.slice(0, 8).forEach(hour => {
          const time = new Date(hour.dt_txt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });
          const icon = hour.weather[0].icon;
          const temp = hour.main.temp.toFixed(1);
          const desc = hour.weather[0].main;

          const card = document.createElement("div");
          card.classList.add("hourly-card");
          card.innerHTML = `
            <h4>${time}</h4>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
            <p>${temp}°C</p>
            <small>${desc}</small>
          `;
          hourlyContainer.appendChild(card);
        });

        // 📊 Hourly Forecast Chart
        const hourlyLabels = data.list.slice(0, 8).map(hour =>
          new Date(hour.dt_txt).toLocaleTimeString([], { hour: '2-digit' })
        );

        const hourlyTemps = data.list.slice(0, 8).map(hour =>
          hour.main.temp.toFixed(1)
        );

        const ctx = document.getElementById("hourlyChart").getContext("2d");
        if (window.hourChart) {
          window.hourChart.destroy();
        }

        window.hourChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: hourlyLabels,
            datasets: [{
              label: "Hourly Temp (°C)",
              data: hourlyTemps,
              backgroundColor: "rgba(0, 123, 255, 0.2)",
              borderColor: "#007bff",
              borderWidth: 2,
              pointRadius: 4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: false
              }
            }
          }
        });

      } else {
        forecastCards.innerHTML = `<p>❌ Forecast not available.</p>`;
      }
    })
    .catch(err => {
      console.error("Forecast error:", err);
      forecastCards.innerHTML = `<p>Something went wrong 😢</p>`;
    });
}

const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});
const locationBtn = document.getElementById("locationBtn");

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          const city = data.name;
          getWeather(city);
          getForecast(city);
        });
    }, err => {
      alert("⚠️ Location permission denied.");
    });
  } else {
    alert("Geolocation not supported.");
  }
});
// HOURLY CHART BELOW
const hourlyLabels = data.list.slice(0, 8).map(hour =>
  new Date(hour.dt_txt).toLocaleTimeString([], { hour: '2-digit' })
);

const hourlyTemps = data.list.slice(0, 8).map(hour =>
  hour.main.temp.toFixed(1)
);

const ctx = document.getElementById("hourlyChart").getContext("2d");

if (window.hourChart) {
  window.hourChart.destroy(); // avoid duplicate chart
}

window.hourChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: hourlyLabels,
    datasets: [{
      label: "Hourly Temp (°C)",
      data: hourlyTemps,
      backgroundColor: "rgba(0, 123, 255, 0.2)",
      borderColor: "#007bff",
      borderWidth: 2,
      pointRadius: 3,
      fill: true
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false
      }
    }
  }
});
function getUvLevel(uv) {
  if (uv < 3) return "(Low)";
  else if (uv < 6) return "(Moderate)";
  else if (uv < 8) return "(High)";
  else if (uv < 11) return "(Very High)";
  else return "(Extreme)";
}
function showMap(lat, lon, cityName) {
  if (!window.myMap) {
    window.myMap = L.map('map').setView([lat, lon], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(window.myMap);
    window.myMarker = L.marker([lat, lon]).addTo(window.myMap).bindPopup(cityName).openPopup();
  } else {
    window.myMap.setView([lat, lon], 10);
    window.myMarker.setLatLng([lat, lon]).setPopupContent(cityName).openPopup();
  }
}
function getWeatherTip(condition) {
  switch (condition.toLowerCase()) {
    case "rain":
      return "☔ Don’t forget your umbrella!";
    case "clear":
      return "😎 Great day to be outside!";
    case "snow":
      return "❄️ Stay warm and drive safe!";
    case "clouds":
      return "🌥️ A calm day – maybe carry a light jacket.";
    case "thunderstorm":
      return "⛈️ Stay indoors and keep safe!";
    case "mist":
    case "fog":
      return "🌫️ Drive carefully in low visibility!";
    default:
      return "🌦️ Stay weather-aware and check updates!";
  }
}
