const form = document.getElementById("search-form");
const input = document.getElementById("q");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const loader = document.getElementById("loader");
const suggestionsEl = document.getElementById("suggestions");
const moonBtn = document.querySelector(".moon");
const geoBtn = document.getElementById("geo-btn");
const cache = { countries: new Map(), weather: new Map() };

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function updateMoon() {
  moonBtn.textContent = document.body.classList.contains("dark") ? "🌙" : "☀️";
}

moonBtn.addEventListener("click", () => {
  if (document.body.classList.contains("dark")) {
    document.body.classList.remove("dark");
    document.body.classList.add("light");
  } else {
    document.body.classList.remove("light");
    document.body.classList.add("dark");
  }
  updateMoon();
});

document.body.classList.add("dark");
updateMoon();

function renderCountryCard(country) {
  const flag = country.flags?.svg || country.flags?.png || "";
  const name = country.name?.common || "Unknown";
  const capital = country.capital?.[0] || "N/A";
  const population = country.population?.toLocaleString() || "N/A";

  resultsEl.innerHTML = `
    <div class="country-card">
      <img class="flag" src="${flag}" alt="${name} flag" />
      <h2>${name}</h2>
      <p><strong>Capital:</strong> ${capital}</p>
      <p><strong>Population:</strong> ${population}</p>
      <div id="weather"><p>Fetching weather...</p></div>
    </div>
  `;
}

function renderWeather(data, capital) {
  const weatherDiv = document.getElementById("weather");
  if (!data) {
    weatherDiv.innerHTML = "<p>⚠️ Weather data not available.</p>";
    return;
  }
  const temp = data.main?.temp ?? "N/A";
  const desc = data.weather?.[0]?.description ?? "Unknown";
  const icon = data.weather?.[0]?.icon;

  weatherDiv.innerHTML = `
    <h3>Weather in ${capital}</h3>
    <p>🌡 ${temp} °C</p>
    <p>☁ ${desc}</p>
    ${icon ? `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" />` : ""}
  `;
}

async function fetchWeather(city) {
  if (cache.weather.has(city)) return cache.weather.get(city);
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const data = await fetchJSON(url);
  cache.weather.set(city, data);
  return data;
}

async function fetchCountry(countryCode) {
  if (cache.countries.has(countryCode)) return cache.countries.get(countryCode);
  const url = `https://restcountries.com/v3.1/alpha/${countryCode}?fields=name,flags,capital,population`;
  const data = await fetchJSON(url);
  cache.countries.set(countryCode, data);
  return data;
}

async function fetchSuggestions(query) {
  if (!query) { suggestionsEl.innerHTML = ""; return; }
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
  try {
    const data = await fetchJSON(url);
    suggestionsEl.innerHTML = "";
    data.forEach(item => {
      const li = document.createElement("li");
      const country = item.address.country || "";
      const state = item.address.state || "";
      li.textContent = state ? `${state}, ${country}` : country;
      li.addEventListener("click", () => {
        input.value = li.textContent;
        suggestionsEl.innerHTML = "";
        form.requestSubmit();
      });
      suggestionsEl.appendChild(li);
    });
  } catch { suggestionsEl.innerHTML = ""; }
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const query = input.value.trim();
  suggestionsEl.innerHTML = "";
  if (!query) { statusEl.textContent = "⚠️ Please enter a place."; return; }
  statusEl.textContent = "";
  resultsEl.innerHTML = "";
  loader.classList.remove("hidden");

  try {
    const geoData = await fetchJSON(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`);
    if (!geoData.length) { statusEl.textContent = `❌ Could not find "${query}".`; loader.classList.add("hidden"); return; }

    const countryCode = geoData[0].address.country_code.toUpperCase();
    const country = await fetchCountry(countryCode);
    renderCountryCard(country);

    if (country.capital?.length > 0) {
      fetchWeather(country.capital[0]).then(data => renderWeather(data, country.capital[0])).catch(() => renderWeather(null, country.capital[0]));
    } else renderWeather(null, "N/A");
  } catch (err) { statusEl.textContent = "❌ Error: " + err.message; }
  finally { loader.classList.add("hidden"); }
});

input.addEventListener("input", debounce(() => fetchSuggestions(input.value.trim()), 300));
document.addEventListener("click", e => { if (!form.contains(e.target)) suggestionsEl.innerHTML = ""; });

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) { statusEl.textContent = "⚠️ Geolocation not supported."; return; }
  statusEl.textContent = "";
  resultsEl.innerHTML = "";
  loader.classList.remove("hidden");

  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude, longitude } = pos.coords;
    try {
      const geoData = await fetchJSON(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
      const countryCode = geoData.address.country_code.toUpperCase();
      const country = await fetchCountry(countryCode);
      renderCountryCard(country);

      if (country.capital?.length > 0) {
        fetchWeather(country.capital[0]).then(data => renderWeather(data, country.capital[0])).catch(() => renderWeather(null, country.capital[0]));
      } else renderWeather(null, "N/A");
    } catch (err) { statusEl.textContent = "❌ Error fetching location: " + err.message; }
    finally { loader.classList.add("hidden"); }
  }, () => {
    statusEl.textContent = "⚠️ Unable to retrieve location.";
    loader.classList.add("hidden");
  });
});
