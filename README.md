# Country & Capital Weather Explorer

A responsive web application to explore country information and weather data for its capital. Includes search suggestions, dark/light mode toggle, and "Use My Location" functionality.

---

## Features

- Search for any **country, state, or city** and get:
  - Country name
  - Capital city
  - Population
  - National flag
  - Current weather in the capital
- **Search suggestions** appear as you type (auto-complete).
- **Dark/Light mode toggle** using a moon/sun emoji.
- **Use My Location** button:
  - Automatically detects your location using the browser's Geolocation API.
  - Displays the country info and capital weather instantly.
- Responsive design that works on both desktop and mobile.

---

## APIs Used

1. **Nominatim (OpenStreetMap) API**
   - For geocoding (searching country/state/city) and reverse geocoding (coordinates → country)
   - Endpoint examples:
     - Forward geocoding:  
       `https://nominatim.openstreetmap.org/search?q={QUERY}&format=json&addressdetails=1&limit=5`
     - Reverse geocoding:  
       `https://nominatim.openstreetmap.org/reverse?lat={LAT}&lon={LON}&format=json&addressdetails=1`

2. **REST Countries API**
   - Provides country details such as name, flag, capital, and population.
   - Endpoint example:  
     `https://restcountries.com/v3.1/alpha/{COUNTRY_CODE}?fields=name,flags,capital,population`

3. **OpenWeatherMap API**
   - Fetches real-time weather data for the capital city.
   - Endpoint example:  
     `https://api.openweathermap.org/data/2.5/weather?q={CITY}&appid={YOUR_API_KEY}&units=metric`
   - **API key required**. Stored in `config.js`:
     ```js
     const OPENWEATHER_API_KEY = "YOUR_KEY_HERE";
     ```

---

## How to Run

1. Clone the repository or download the files.
2. Create a `config.js` file with your OpenWeatherMap API key:
   ```js
   const OPENWEATHER_API_KEY = "YOUR_KEY_HERE";
