import { useEffect, useState } from "react";

function App() {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState("London");

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=265fbb5eaab04c471df65b2b998066d5&units=metric`
        );
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        console.error("Error fetching weather:", err);
      }
    };

    fetchWeather();
  }, [city]);

  return (
    <div style={{ textAlign: "center", color: "white", padding: "2rem", background: "#1e1e1e", minHeight: "100vh" }}>
      <h1>🌤️ AI Weather App</h1>
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Enter city"
        style={{
          padding: "0.5rem",
          fontSize: "1rem",
          borderRadius: "8px",
          marginBottom: "1rem"
        }}
      />
      {weather && weather.main ? (
        <div>
          <p><strong>City:</strong> {weather.name}</p>
          <p><strong>Temperature:</strong> {weather.main.temp} °C</p>
          <p><strong>Weather:</strong> {weather.weather[0].description}</p>
          <p><strong>Humidity:</strong> {weather.main.humidity}%</p>
          <p><strong>Wind:</strong> {weather.wind.speed} m/s</p>
        </div>
      ) : (
        <p>Loading weather or invalid city...</p>
      )}
    </div>
  );
}

export default App;
