document.addEventListener("DOMContentLoaded", () => {
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

  async function fetchWeatherData(
    latitude,
    longitude,
    temperatureUnit = "fahrenheit"
  ) {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=${temperatureUnit}`
      );

      if (!response.ok) throw new Error("Weather fetch failed");

      const data = await response.json();

      const weather = data.current_weather;
      if (!weather) throw new Error("No weather data found");

      const condition = getWeatherCondition(weather.weathercode);
      const element = document.getElementById("condition");
      element.innerText = `Current weather: ${condition}, ${weather.temperature}°F`;
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

  (async () => {
    const location = await getLocationFromIP();
    if (location) {
      fetchWeatherData(location.latitude, location.longitude);
    } else {
      document.getElementById("condition").innerText =
        "Could not determine location.";
    }
  })();
});
