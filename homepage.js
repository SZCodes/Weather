document.addEventListener("DOMContentLoaded", () => {
  let temperatureUnit = "celsius"; // default
  let currentLocation = null;

  // Map weather codes to descriptive text
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

  // Map weather codes to emoji icons
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

  // Map weather codes to background gradients
  function getBackgroundForCode(code) {
    const backgrounds = {
      0: "linear-gradient(to bottom, #FFF9C4, #FFEE58)", // Clear - yellow
      1: "linear-gradient(to bottom, #FFFDE7, #FFF9C4)", // Mainly clear - pale yellow
      2: "linear-gradient(to bottom, #EEE9AE, #DAD7A7)", // Partly cloudy - grey yellow
      3: "linear-gradient(to bottom, #d7dde8, #757f9a)", // Overcast - grayish
      45: "linear-gradient(to bottom, #d7d2cc, #304352)", // Fog - misty gray
      48: "linear-gradient(to bottom, #d7d2cc, #304352)", // Rime fog - same as fog
      51: "linear-gradient(to bottom, #89f7fe, #66a6ff)", // Drizzle - soft blue
      61: "linear-gradient(to bottom, #4b79a1, #283e51)", // Rain - dark blue-gray
      71: "linear-gradient(to bottom, #b6fbff, #83a4d4)", // Snow - soft icy blue
      80: "linear-gradient(to bottom, #4b79a1, #283e51)", // Showers - same as rain
    };
    return backgrounds[code] || "linear-gradient(to bottom, #f9f3f3, #fcefdc)"; // default warm
  }

  // Modify fetchWeatherData to return weather code and temperature data instead of updating UI
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

      return weather; // return the data, don't update UI here
    } catch (err) {
      console.error("❌ Weather API error:", err.message);
      alert("Failed to fetch weather data.");
      return null;
    }
  }

  async function updateWeather() {
    if (!currentLocation) {
      currentLocation = await getLocationFromIP();
    }

    if (currentLocation) {
      const titleEl = document.getElementById("title");
      const emojiEl = document.getElementById("weather-emoji");
      const chipsContainer = document.getElementById("chips-container");
      const toggleButton = document.getElementById("unitToggle");

      // Show loading state
      titleEl.innerText = "Fetching data...";
      emojiEl.innerText = "⏳";
      toggleButton.style.display = "none"; // hide toggle while loading
      chipsContainer.innerHTML = ""; // clear chips while loading

      // Run fetch + delay in parallel
      const fetchPromise = fetchWeatherData(
        currentLocation.latitude,
        currentLocation.longitude
      );
      const delayPromise = sleep(1000);

      const [weather] = await Promise.all([fetchPromise, delayPromise]);

      if (weather) {
        // Now update UI *after* delay and fetch complete, so emoji and title update simultaneously
        const emoji = getWeatherEmoji(weather.weathercode);
        emojiEl.innerText = emoji;

        const condition = getWeatherCondition(weather.weathercode);
        const unitSymbol = temperatureUnit === "celsius" ? "°C" : "°F";
        const tempText = `${weather.temperature}${unitSymbol}`;

        chipsContainer.innerHTML = ""; // clear again just in case

        const conditionChip = document.createElement("div");
        conditionChip.className = "chip";
        conditionChip.innerText = condition;

        const tempChip = document.createElement("div");
        tempChip.className = "chip";
        tempChip.innerText = tempText;

        chipsContainer.appendChild(conditionChip);
        chipsContainer.appendChild(tempChip);

        titleEl.innerText = "Current Weather";
        toggleButton.style.display = "inline-block";

        // Update background
        document.body.style.background = getBackgroundForCode(
          weather.weathercode
        );
      } else {
        // If fetch failed, show error
        emojiEl.innerText = "❓";
        titleEl.innerText = "Could not fetch weather.";
        chipsContainer.innerHTML = "";
        toggleButton.style.display = "none";
        document.body.style.background =
          "linear-gradient(to bottom, #f9f3f3, #fcefdc)";
      }
    } else {
      // If location fetch failed
      document.getElementById("weather-emoji").innerText = "❓";
      document.getElementById("title").innerText =
        "Could not determine location.";
      document.getElementById("chips-container").innerHTML = "";
      document.getElementById("unitToggle").style.display = "none";
      document.body.style.background =
        "linear-gradient(to bottom, #f9f3f3, #fcefdc)";
    }
  }

  // Get location via IP-based lookup service
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

  // Helper: sleep/delay for given milliseconds
  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Initial load
  updateWeather();

  // Refresh every 5 minutes
  setInterval(updateWeather, 5 * 60 * 1000);

  // Toggle temperature unit button logic
  const toggleButton = document.getElementById("unitToggle");
  toggleButton.addEventListener("click", () => {
    temperatureUnit = temperatureUnit === "celsius" ? "fahrenheit" : "celsius";
    toggleButton.innerText = temperatureUnit === "celsius" ? "°F" : "°C";
    updateWeather();
  });
});
