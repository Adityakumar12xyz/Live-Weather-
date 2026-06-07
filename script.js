/* ==========================================================================
   WEATHER APP LOGIC: REAL TIME WEATHER REPORT (OPEN-METEO ENGINE)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const searchForm = document.getElementById('searchForm');
    const cityInput = document.getElementById('cityInput');
    const loader = document.getElementById('loader');
    const weatherDisplay = document.getElementById('weatherDisplay');
    const errorPanel = document.getElementById('errorPanel');
    const errorMsg = document.getElementById('errorMsg');
    const errorRetryBtn = document.getElementById('errorRetryBtn');
    const warningBanner = document.getElementById('warningBanner');
    const warningDesc = document.getElementById('warningDesc');
    const dashboardScrollArea = document.getElementById('dashboardScrollArea');

    // Weather Display Values
    const cityNameEl = document.getElementById('cityName');
    const countryBadge = document.getElementById('countryBadge');
    const currentDateEl = document.getElementById('currentDate');
    const tempValueEl = document.getElementById('tempValue');
    const unitC = document.getElementById('unitC');
    const unitF = document.getElementById('unitF');
    const weatherIconContainer = document.getElementById('weatherIconContainer');
    const weatherDescEl = document.getElementById('weatherDesc');
    const feelsLikeTempEl = document.getElementById('feelsLikeTemp');
    
    // Core Metrics
    const humidityValEl = document.getElementById('humidityVal');
    const windValEl = document.getElementById('windVal');
    const pressureValEl = document.getElementById('pressureVal');
    const visibilityValEl = document.getElementById('visibilityVal');
    const aqiValEl = document.getElementById('aqiVal');
    const uvValEl = document.getElementById('uvVal');
    const sunriseValEl = document.getElementById('sunriseVal');
    const sunsetValEl = document.getElementById('sunsetVal');
    
    // Yesterday & Forecast
    const yesterdayTempEl = document.getElementById('yesterdayTemp');
    const yesterdayDescEl = document.getElementById('yesterdayDesc');
    const forecastRow = document.getElementById('forecastRow');

    // Settings Drawer Elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDrawer = document.getElementById('settingsDrawer');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const defaultCityInput = document.getElementById('defaultCityInput');
    const showWarningsToggle = document.getElementById('showWarningsToggle');
    const resetPrefBtn = document.getElementById('resetPrefBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    // --- State Variables ---
    let currentTempCelsius = 25; 
    let currentFeelsCelsius = 26;
    let yesterdayMinCelsius = 20;
    let yesterdayMaxCelsius = 30;
    let forecastMaxTemps = []; // Cache forecast C values for unit toggling
    let forecastMinTemps = [];
    let currentUnit = 'C';

    let preferences = {
        defaultCity: localStorage.getItem('skyflow_start_city') || 'Delhi',
        showWarnings: localStorage.getItem('skyflow_show_warnings') !== 'false'
    };

    // --- Custom Animated SVG Weather Icons ---
    const weatherIcons = {
        clear: `
            <svg class="weather-svg" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ffb703" />
                        <stop offset="100%" stop-color="#fb8500" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="20" fill="url(#sunGrad)" class="sun-glow spin-slow" />
                <g class="spin-slow" style="transform-origin: 50px 50px;">
                    <line x1="50" y1="12" x2="50" y2="20" stroke="#ffb703" stroke-width="4" stroke-linecap="round" />
                    <line x1="50" y1="80" x2="50" y2="88" stroke="#fb8500" stroke-width="4" stroke-linecap="round" />
                    <line x1="12" y1="50" x2="20" y2="50" stroke="#ffb703" stroke-width="4" stroke-linecap="round" />
                    <line x1="80" y1="50" x2="88" y2="50" stroke="#fb8500" stroke-width="4" stroke-linecap="round" />
                    <line x1="23.2" y1="23.2" x2="28.8" y2="28.8" stroke="#ffb703" stroke-width="4" stroke-linecap="round" />
                    <line x1="71.2" y1="71.2" x2="76.8" y2="76.8" stroke="#fb8500" stroke-width="4" stroke-linecap="round" />
                    <line x1="76.8" y1="23.2" x2="71.2" y2="28.8" stroke="#ffb703" stroke-width="4" stroke-linecap="round" />
                    <line x1="28.8" y1="71.2" x2="23.2" y2="76.8" stroke="#fb8500" stroke-width="4" stroke-linecap="round" />
                </g>
            </svg>
        `,
        clouds: `
            <svg class="weather-svg" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#ffffff" />
                        <stop offset="100%" stop-color="#cbd5e1" />
                    </linearGradient>
                    <linearGradient id="cloudGradBack" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#94a3b8" />
                        <stop offset="100%" stop-color="#64748b" />
                    </linearGradient>
                </defs>
                <path d="M28 62a14 14 0 0 1 12-20c2.5-4.8 7.3-8 13-8 7.7 0 14 5.8 15 13a12 12 0 0 1 12 12c0 6.6-5.4 12-12 12H30a10 10 0 0 1-2-9z" fill="url(#cloudGradBack)" class="cloud-float-2" />
                <path d="M35 68a15 15 0 0 1 10-25c2.7-6 8.7-10 15.8-10 9.2 0 16.8 7.2 18 16.3A14 14 0 0 1 90 63c0 7.7-6.3 14-14 14H39a13 13 0 0 1-4-9z" fill="url(#cloudGrad)" class="cloud-float-1" />
            </svg>
        `,
        rain: `
            <svg class="weather-svg" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="rainCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#94a3b8" />
                        <stop offset="100%" stop-color="#475569" />
                    </linearGradient>
                </defs>
                <path d="M35 55a15 15 0 0 1 10-25c2.7-6 8.7-10 15.8-10 9.2 0 16.8 7.2 18 16.3A14 14 0 0 1 90 50c0 7.7-6.3 14-14 14H39a13 13 0 0 1-4-9z" fill="url(#rainCloud)" class="cloud-float-1" />
                <line x1="42" y1="68" x2="39" y2="78" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" class="rain-drop-1" />
                <line x1="56" y1="72" x2="53" y2="82" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" class="rain-drop-2" />
                <line x1="70" y1="68" x2="67" y2="78" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" class="rain-drop-3" />
            </svg>
        `,
        snow: `
            <svg class="weather-svg" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="snowCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#e2e8f0" />
                        <stop offset="100%" stop-color="#cbd5e1" />
                    </linearGradient>
                </defs>
                <path d="M35 55a15 15 0 0 1 10-25c2.7-6 8.7-10 15.8-10 9.2 0 16.8 7.2 18 16.3A14 14 0 0 1 90 50c0 7.7-6.3 14-14 14H39a13 13 0 0 1-4-9z" fill="url(#snowCloud)" class="cloud-float-1" />
                <line x1="44" y1="68" x2="44" y2="74" stroke="#ffffff" stroke-width="2" stroke-linecap="round" class="snow-flake-1" />
                <line x1="58" y1="70" x2="58" y2="76" stroke="#ffffff" stroke-width="2" stroke-linecap="round" class="snow-flake-2" />
                <line x1="70" y1="68" x2="70" y2="74" stroke="#ffffff" stroke-width="2" stroke-linecap="round" class="snow-flake-3" />
                <circle cx="44" cy="71" r="2.5" fill="#ffffff" class="snow-flake-1" />
                <circle cx="58" cy="73" r="2.5" fill="#ffffff" class="snow-flake-2" />
                <circle cx="70" cy="71" r="2.5" fill="#ffffff" class="snow-flake-3" />
            </svg>
        `,
        storm: `
            <svg class="weather-svg" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="stormCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#475569" />
                        <stop offset="100%" stop-color="#1e293b" />
                    </linearGradient>
                </defs>
                <path d="M35 55a15 15 0 0 1 10-25c2.7-6 8.7-10 15.8-10 9.2 0 16.8 7.2 18 16.3A14 14 0 0 1 90 50c0 7.7-6.3 14-14 14H39a13 13 0 0 1-4-9z" fill="url(#stormCloud)" class="cloud-float-1" />
                <line x1="38" y1="68" x2="35" y2="75" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" class="rain-drop-1" />
                <line x1="68" y1="68" x2="65" y2="75" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" class="rain-drop-3" />
                <polygon points="53,60 44,74 50,74 45,88 59,71 52,71" fill="#fbbf24" class="lightning-flash" />
            </svg>
        `,
        mist: `
            <svg class="weather-svg" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="mistGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#e2e8f0" />
                        <stop offset="100%" stop-color="#94a3b8" />
                    </linearGradient>
                </defs>
                <g stroke="url(#mistGrad)" stroke-width="5" stroke-linecap="round">
                    <line x1="25" y1="35" x2="75" y2="35" class="mist-slide-1" />
                    <line x1="32" y1="47" x2="68" y2="47" class="mist-slide-2" />
                    <line x1="20" y1="59" x2="80" y2="59" class="mist-slide-1" />
                    <line x1="38" y1="71" x2="62" y2="71" class="mist-slide-2" />
                </g>
            </svg>
        `
    };

    // --- Helper Functions ---

    // Translate wind degrees to compass points
    function getWindCompass(deg) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 22.5) % 16;
        return directions[index];
    }

    // Map Open-Meteo WMO Codes to design categories
    function mapWmoCode(code) {
        if (code === 0) return { main: 'Clear', desc: 'Clear sky', id: 800 };
        if (code === 1) return { main: 'Clear', desc: 'Mainly clear', id: 800 };
        if (code === 2) return { main: 'Clouds', desc: 'Partly cloudy', id: 801 };
        if (code === 3) return { main: 'Clouds', desc: 'Overcast', id: 804 };
        if (code === 45 || code === 48) return { main: 'Mist', desc: 'Foggy mist', id: 701 };
        if (code === 51 || code === 53 || code === 55) return { main: 'Rain', desc: 'Drizzle showers', id: 300 };
        if (code === 56 || code === 57) return { main: 'Snow', desc: 'Freezing drizzle', id: 600 };
        if (code === 61 || code === 63 || code === 65) return { main: 'Rain', desc: 'Rainy', id: 500 };
        if (code === 66 || code === 67) return { main: 'Snow', desc: 'Freezing rain', id: 600 };
        if (code === 71 || code === 73 || code === 75) return { main: 'Snow', desc: 'Snowfall', id: 600 };
        if (code === 77) return { main: 'Snow', desc: 'Snow grains', id: 600 };
        if (code === 80 || code === 81 || code === 82) return { main: 'Rain', desc: 'Rain showers', id: 500 };
        if (code === 85 || code === 86) return { main: 'Snow', desc: 'Snow showers', id: 600 };
        if (code === 95 || code === 96 || code === 99) return { main: 'Storm', desc: 'Thunderstorm', id: 200 };
        return { main: 'Clouds', desc: 'Cloudy', id: 801 };
    }

    // Format ISO string to 12-hour clock (AM/PM)
    function formatIsoTime(isoStr) {
        if (!isoStr) return 'N/A';
        try {
            const date = new Date(isoStr);
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (e) {
            const timePart = isoStr.split('T')[1] || isoStr;
            return timePart.slice(0, 5);
        }
    }

    // Format Forecast Dates for 14-day labels
    function formatForecastDayName(dateStr) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const date = new Date(dateStr);
        const dayName = days[date.getDay()];
        const dayOfMonth = date.getDate();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[date.getMonth()];
        return {
            label: dayName,
            subLabel: `${dayOfMonth} ${monthName}`
        };
    }

    // Get AQI Rating Label
    function getAqiRating(aqi) {
        if (aqi <= 50) return { label: 'Good', class: 'aqi-good' };
        if (aqi <= 100) return { label: 'Moderate', class: 'aqi-moderate' };
        if (aqi <= 150) return { label: 'Sensitive Unhealthy', class: 'aqi-sensitive' };
        if (aqi <= 200) return { label: 'Unhealthy', class: 'aqi-unhealthy' };
        if (aqi <= 300) return { label: 'Very Unhealthy', class: 'aqi-very-unhealthy' };
        return { label: 'Hazardous', class: 'aqi-hazardous' };
    }

    // Get UV Rating Label
    function getUvRating(uv) {
        if (uv <= 2) return 'Low';
        if (uv <= 5) return 'Moderate';
        if (uv <= 7) return 'High';
        if (uv <= 10) return 'Very High';
        return 'Extreme';
    }

    // Dynamic weather background theme selector
    function changeWeatherTheme(weatherCondition) {
        document.body.className = ''; // Reset body classes
        const cond = weatherCondition.toLowerCase();
        if (cond === 'clear') {
            document.body.classList.add('theme-clear');
        } else if (cond === 'clouds') {
            document.body.classList.add('theme-clouds');
        } else if (cond === 'rain' || cond === 'drizzle') {
            document.body.classList.add('theme-rain');
        } else if (cond === 'snow') {
            document.body.classList.add('theme-snow');
        } else if (cond === 'thunderstorm' || cond === 'storm') {
            document.body.classList.add('theme-storm');
        } else if (['mist', 'smoke', 'haze', 'dust', 'fog', 'sand', 'ash', 'squall', 'tornado'].includes(cond)) {
            document.body.classList.add('theme-mist');
        } else {
            document.body.classList.add('theme-default');
        }
    }

    // Select suitable SVG icon
    function setWeatherIcon(container, weatherId, mainCondition) {
        let iconSvg = weatherIcons.clouds; // Default cloud
        const cond = mainCondition.toLowerCase();

        if (weatherId === 800) {
            iconSvg = weatherIcons.clear;
        } else if (weatherId >= 200 && weatherId < 300) {
            iconSvg = weatherIcons.storm;
        } else if ((weatherId >= 300 && weatherId < 400) || (weatherId >= 500 && weatherId < 600)) {
            iconSvg = weatherIcons.rain;
        } else if (weatherId >= 600 && weatherId < 700) {
            iconSvg = weatherIcons.snow;
        } else if (weatherId >= 700 && weatherId < 800) {
            iconSvg = weatherIcons.mist;
        } else if (cond === 'clear') {
            iconSvg = weatherIcons.clear;
        } else if (cond === 'rain' || cond === 'drizzle') {
            iconSvg = weatherIcons.rain;
        } else if (cond === 'snow') {
            iconSvg = weatherIcons.snow;
        } else if (cond === 'storm' || cond === 'thunderstorm') {
            iconSvg = weatherIcons.storm;
        } else if (cond === 'mist' || cond === 'haze') {
            iconSvg = weatherIcons.mist;
        }

        container.innerHTML = iconSvg;
    }

    // --- Weather Alert warning banner evaluator ---
    function evaluateWeatherWarnings(current, daily, usAqi) {
        if (!preferences.showWarnings) {
            warningBanner.classList.add('hidden');
            return;
        }

        const alerts = [];
        const weatherInfo = mapWmoCode(current.weather_code);
        const maxTempToday = daily.temperature_2m_max[1];
        const minTempToday = daily.temperature_2m_min[1];
        const maxWindToday = daily.wind_speed_10m_max ? daily.wind_speed_10m_max[1] : current.wind_speed_10m;
        const maxUvToday = daily.uv_index_max[1];

        // 1. Extreme Heat Alert
        if (maxTempToday >= 38) {
            alerts.push(`☀️ Extreme Heat Alert: Temperatures expected to peak at ${Math.round(maxTempToday)}°C today. Stay hydrated!`);
        }
        // 2. Severe Cold Alert
        else if (minTempToday <= 3) {
            alerts.push(`❄️ Freeze Warning: Temperature dropping to ${Math.round(minTempToday)}°C. Stay warm inside.`);
        }

        // 3. Storm Warning
        if (weatherInfo.main === 'Storm') {
            alerts.push(`⛈️ Severe Thunderstorm Alert: Lightning, hail, and high winds are active in this region.`);
        }
        // 4. Heavy Rain Alert
        else if (current.weather_code === 65 || current.weather_code === 82) {
            alerts.push(`🌧️ Flood Advisory: Intense heavy rain observed. Avoid low-lying flooded roadways.`);
        }

        // 5. High Wind Warning
        if (maxWindToday > 40) {
            alerts.push(`💨 High Wind Warning: Gusts exceeding ${Math.round(maxWindToday)} km/h are expected.`);
        }

        // 6. Extreme UV Radiation Alert
        if (maxUvToday >= 8) {
            alerts.push(`🧴 High UV Danger: Max UV index is ${maxUvToday} today. Wear sunscreen and sunglasses.`);
        }

        // 7. Dangerous Air Quality Alert
        if (usAqi > 100) {
            alerts.push(`😷 Air Quality Alert: AQI is ${usAqi} (Unhealthy). Sensitive groups should stay indoors.`);
        }

        // Display the most critical alert if any exist
        if (alerts.length > 0) {
            warningDesc.textContent = alerts[0];
            warningBanner.classList.remove('hidden');
        } else {
            warningBanner.classList.add('hidden');
        }
    }

    // --- Weather Renderer ---
    function renderWeatherDashboard(geoData, forecastData, aqiData) {
        // Cache current values
        currentTempCelsius = forecastData.current.temperature_2m;
        currentFeelsCelsius = forecastData.current.apparent_temperature;

        // Cache Yesterday values (index 0 in Open-Meteo response since past_days=1)
        yesterdayMinCelsius = forecastData.daily.temperature_2m_min[0];
        yesterdayMaxCelsius = forecastData.daily.temperature_2m_max[0];
        
        // Cache Forecast arrays (index 1 to index 14, represents next 14 days)
        forecastMinTemps = forecastData.daily.temperature_2m_min.slice(1);
        forecastMaxTemps = forecastData.daily.temperature_2m_max.slice(1);

        // Core Labels
        cityNameEl.textContent = `${geoData.name}${geoData.admin1 ? ', ' + geoData.admin1 : ''}`;
        countryBadge.textContent = geoData.country_code ? geoData.country_code.toUpperCase() : 'N/A';
        
        // Format Current Date
        const options = { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
        currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);

        // Weather Code current translations
        const currentWmo = mapWmoCode(forecastData.current.weather_code);
        weatherDescEl.textContent = currentWmo.desc;
        changeWeatherTheme(currentWmo.main);
        setWeatherIcon(weatherIconContainer, currentWmo.id, currentWmo.main);

        // Wind Speed conversion and direction
        const windSpeed = forecastData.current.wind_speed_10m;
        const windDirectionDeg = forecastData.current.wind_direction_10m;
        const windDirectionCompass = getWindCompass(windDirectionDeg);
        windValEl.textContent = `${Math.round(windSpeed)} km/h ${windDirectionCompass}`;

        // Humidity, Pressure, Visibility
        humidityValEl.textContent = `${forecastData.current.relative_humidity_2m}%`;
        pressureValEl.textContent = `${Math.round(forecastData.current.pressure_msl)} hPa`;
        
        const visibilityKm = (forecastData.current.visibility / 1000).toFixed(1);
        visibilityValEl.textContent = `${visibilityKm} km`;

        // AQI
        const usAqi = aqiData.current.us_aqi;
        const aqiRating = getAqiRating(usAqi);
        aqiValEl.textContent = `${usAqi} (${aqiRating.label})`;
        
        // UV Index (Current hour approximation or daily max)
        const uvMax = forecastData.daily.uv_index_max[1];
        const uvRating = getUvRating(uvMax);
        uvValEl.textContent = `${Math.round(uvMax)} (${uvRating})`;

        // Sunrise & Sunset (Index 1 is today)
        sunriseValEl.textContent = formatIsoTime(forecastData.daily.sunrise[1]);
        sunsetValEl.textContent = formatIsoTime(forecastData.daily.sunset[1]);

        // Yesterday's historical card setup
        const yesterdayWmo = mapWmoCode(forecastData.daily.weather_code[0]);
        yesterdayDescEl.textContent = yesterdayWmo.desc;

        // Render forecast list (14 cards)
        forecastRow.innerHTML = '';
        const dailyData = forecastData.daily;
        
        // Loop from index 1 to 14 (total 14 items)
        for (let i = 1; i <= 14; i++) {
            const dateStr = dailyData.time[i];
            if (!dateStr) continue;

            const dayObj = formatForecastDayName(dateStr);
            const wmo = mapWmoCode(dailyData.weather_code[i]);
            
            const card = document.createElement('div');
            card.className = 'forecast-item-card';
            
            // Forecast item icon container
            const forecastIconId = `f-icon-${i}`;
            
            card.innerHTML = `
                <span class="forecast-day">${dayObj.label}</span>
                <span class="forecast-date">${dayObj.subLabel}</span>
                <div class="forecast-icon-box" id="${forecastIconId}"></div>
                <span class="forecast-temp">
                    <span class="max-t">${Math.round(dailyData.temperature_2m_max[i])}°</span>
                    <span class="min-temp">${Math.round(dailyData.temperature_2m_min[i])}°</span>
                </span>
                <span class="forecast-desc" title="${wmo.desc}">${wmo.main}</span>
            `;
            
            forecastRow.appendChild(card);
            
            // Inject SVGs into forecast card iconbox
            const iconBox = document.getElementById(forecastIconId);
            setWeatherIcon(iconBox, wmo.id, wmo.main);
        }

        // Temperature units renderer C / F
        updateTemperatureDisplay();

        // Safety Warnings Evaluator
        evaluateWeatherWarnings(forecastData.current, dailyData, usAqi);

        // Reset scroll position to top on page update
        dashboardScrollArea.scrollTop = 0;
    }

    // Temperature text formatter based on active unit
    function updateTemperatureDisplay() {
        const isC = currentUnit === 'C';

        if (isC) {
            tempValueEl.textContent = Math.round(currentTempCelsius);
            feelsLikeTempEl.textContent = Math.round(currentFeelsCelsius);
            yesterdayTempEl.textContent = `${Math.round(yesterdayMinCelsius)}°C - ${Math.round(yesterdayMaxCelsius)}°C`;
            
            unitC.classList.add('active');
            unitF.classList.remove('active');
        } else {
            // C to F: (C * 9/5) + 32
            const tempF = Math.round((currentTempCelsius * 9/5) + 32);
            const feelsF = Math.round((currentFeelsCelsius * 9/5) + 32);
            const yestMinF = Math.round((yesterdayMinCelsius * 9/5) + 32);
            const yestMaxF = Math.round((yesterdayMaxCelsius * 9/5) + 32);

            tempValueEl.textContent = tempF;
            feelsLikeTempEl.textContent = feelsF;
            yesterdayTempEl.textContent = `${yestMinF}°F - ${yestMaxF}°F`;

            unitF.classList.add('active');
            unitC.classList.remove('active');
        }

        // Update Forecast cards temperatures as well
        const forecastCards = forecastRow.querySelectorAll('.forecast-item-card');
        forecastCards.forEach((card, index) => {
            const maxEl = card.querySelector('.max-t');
            const minEl = card.querySelector('.min-temp');
            
            const maxC = forecastMaxTemps[index];
            const minC = forecastMinTemps[index];

            if (maxEl && minEl && maxC !== undefined && minC !== undefined) {
                if (isC) {
                    maxEl.textContent = `${Math.round(maxC)}°`;
                    minEl.textContent = `${Math.round(minC)}°`;
                } else {
                    maxEl.textContent = `${Math.round((maxC * 9/5) + 32)}°`;
                    minEl.textContent = `${Math.round((minC * 9/5) + 32)}°`;
                }
            }
        });
    }

    // --- Weather Fetch Engine (Core Flow) ---
    async function executeWeatherSearch(city) {
        showLoader();

        try {
            // Step 1: Geocoding (Lookup Coordinates)
            const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
            const geoRes = await fetch(geocodeUrl);
            
            if (!geoRes.ok) throw new Error('NETWORK_ERROR');
            
            const geoData = await geoRes.json();
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('CITY_NOT_FOUND');
            }

            const activeLocation = geoData.results[0];
            const lat = activeLocation.latitude;
            const lon = activeLocation.longitude;

            // Step 2: Fetch weather forecast (14 days forecast + 1 past day historical)
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max&timezone=auto&past_days=1&forecast_days=15&wind_speed_unit=kmh`;
            
            // Step 3: Fetch Air Quality (AQI)
            const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,us_aqi`;

            // Parallel executions
            const [weatherRes, aqiRes] = await Promise.all([
                fetch(weatherUrl),
                fetch(aqiUrl)
            ]);

            if (!weatherRes.ok || !aqiRes.ok) throw new Error('NETWORK_ERROR');

            const weatherData = await weatherRes.json();
            const aqiData = await aqiRes.json();

            // Step 4: Render
            hideLoader();
            renderWeatherDashboard(activeLocation, weatherData, aqiData);
            
            // Cache last queried city
            localStorage.setItem('skyflow_last_city', city);

        } catch (error) {
            hideLoader();
            showError(error.message);
        }
    }

    // --- Loading & State managers ---
    function showLoader() {
        loader.classList.remove('hidden');
        weatherDisplay.classList.add('hidden');
        errorPanel.classList.add('hidden');
        warningBanner.classList.add('hidden');
    }

    function hideLoader() {
        loader.classList.add('hidden');
        weatherDisplay.classList.remove('hidden');
    }

    function showError(errType) {
        weatherDisplay.classList.add('hidden');
        errorPanel.classList.remove('hidden');
        warningBanner.classList.add('hidden');

        if (errType === 'CITY_NOT_FOUND') {
            errorMsg.textContent = "We couldn't find that city. Please verify the spelling and try again.";
        } else {
            errorMsg.textContent = "Connection issue occurred. Please check your internet connection and try again.";
        }
    }


    // --- Event Listeners ---

    // Search submissions
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city) {
            executeWeatherSearch(city);
        }
    });

    // Temp unit buttons C / F
    unitC.addEventListener('click', () => {
        if (currentUnit !== 'C') {
            currentUnit = 'C';
            updateTemperatureDisplay();
        }
    });
    unitF.addEventListener('click', () => {
        if (currentUnit !== 'F') {
            currentUnit = 'F';
            updateTemperatureDisplay();
        }
    });

    // Error retry button
    errorRetryBtn.addEventListener('click', () => {
        const city = cityInput.value.trim() || preferences.defaultCity;
        executeWeatherSearch(city);
    });

    // Settings panel triggers
    settingsBtn.addEventListener('click', () => {
        defaultCityInput.value = preferences.defaultCity;
        showWarningsToggle.checked = preferences.showWarnings;
        settingsDrawer.classList.add('open');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsDrawer.classList.remove('open');
    });

    // Reset drawer preferences
    resetPrefBtn.addEventListener('click', () => {
        defaultCityInput.value = 'Delhi';
        showWarningsToggle.checked = true;
    });

    // Save preferences
    saveSettingsBtn.addEventListener('click', () => {
        const newStartCity = defaultCityInput.value.trim() || 'Delhi';
        const showWarns = showWarningsToggle.checked;

        preferences.defaultCity = newStartCity;
        preferences.showWarnings = showWarns;

        localStorage.setItem('skyflow_start_city', newStartCity);
        localStorage.setItem('skyflow_show_warnings', showWarns);

        settingsDrawer.classList.remove('open');

        // Re-evaluate warnings with current loaded data
        // Trigger a fresh search if starting city changed and currently in error
        const currentCity = cityNameEl.textContent || newStartCity;
        executeWeatherSearch(currentCity);
    });


    // --- Boot Bootloader ---
    const lastCity = localStorage.getItem('skyflow_last_city') || preferences.defaultCity;
    cityInput.value = lastCity;
    executeWeatherSearch(lastCity);
});
