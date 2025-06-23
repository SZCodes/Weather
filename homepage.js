document.addEventListener("DOMContentLoaded", () => {
  let temperatureUnit = "celsius"; // default
  let currentLocation = null;

  function getWeatherCondition(code) {
    const codeMap = {
      0: "Clear",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Rime fog",
      51: "Drizzle",
      61: "Rain",
      71: "Snow",
      80: "Showers",
    };
    return codeMap[code] || "Unknown";
  }

  function getWeatherEmoji(code) {
    const emojiMap = {
      0: "☀️",
      1: "🌤️",
      2: "⛅",
      3: "☁️",
      45: "🌫️",
      48: "🌫️",
      51: "🌦️",
      61: "🌧️",
      71: "❄️",
      80: "🌧️",
    };
    return emojiMap[code] || "❓";
  }

  async function fetchWeatherData(latitude, longitude) {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=${temperatureUnit}`
      );

      if (!response.ok) throw new Error("Weather fetch failed");

      const data = await response.json();

      const weather = data.current_weather;
      console.log("🌤️ Current weather data:", weather);
      if (!weather) throw new Error("No weather data found");

      // Update emoji
      const emoji = getWeatherEmoji(weather.weathercode);
      document.getElementById("weather-emoji").innerText = emoji;

      // Update chips for condition and temperature
      const condition = getWeatherCondition(weather.weathercode);
      const unitSymbol = temperatureUnit === "celsius" ? "°C" : "°F";
      const tempText = `${weather.temperature}${unitSymbol}`;

      const chipsContainer = document.getElementById("chips-container");
      chipsContainer.innerHTML = ""; // clear old chips

      const conditionChip = document.createElement("div");
      conditionChip.className = "chip";
      conditionChip.innerText = condition;

      const tempChip = document.createElement("div");
      tempChip.className = "chip";
      tempChip.innerText = tempText;

      chipsContainer.appendChild(conditionChip);
      chipsContainer.appendChild(tempChip);
    } catch (err) {
      console.error("❌ Weather API error:", err.message);
      alert("Failed to fetch weather data.");
    }
  }

  async function getLocationFromIP() {
    try {
      const response = await fetch(
        "https://ipinfo.io/json?token=041f9c510fa3cc"
      );
      if (!response.ok) throw new Error("IP location fetch failed");

      const data = await response.json();
      if (!data.loc) throw new Error("No location found in IP info");

      const [latitude, longitude] = data.loc.split(",");
      console.log(`📍 IP-based location: ${latitude}, ${longitude}`);
      return {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };
    } catch (error) {
      console.error("❌ IP Geolocation failed:", error.message);
      alert("Failed to determine location via IP.");
      return null;
    }
  }

  async function updateWeather() {
    if (!currentLocation) {
      currentLocation = await getLocationFromIP();
    }

    if (currentLocation) {
      await fetchWeatherData(
        currentLocation.latitude,
        currentLocation.longitude
      );
    } else {
      document.getElementById("weather-emoji").innerText = "❓";
      const chipsContainer = document.getElementById("chips-container");
      chipsContainer.innerHTML = `<div class="chip">Could not determine location.</div>`;
    }
  }

  updateWeather();

  // Refresh every 5 minutes
  setInterval(updateWeather, 5 * 60 * 1000);

  // Toggle button logic
  const toggleButton = document.getElementById("unitToggle");
  toggleButton.addEventListener("click", () => {
    temperatureUnit = temperatureUnit === "celsius" ? "fahrenheit" : "celsius";
    toggleButton.innerText = temperatureUnit === "celsius" ? "°F" : "°C";
    updateWeather();
  });
});
