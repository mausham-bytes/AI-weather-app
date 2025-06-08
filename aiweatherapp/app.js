"use strict";

// --- Security Note ---
// API keys should not be stored in client-side code.
// These should be fetched from a secure backend server.
const weatherApiKey = '786496a76003ab0f577f806b3ebe1675'; // Replace with your key, but ideally use a backend proxy.

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return React.createElement('div', { className: 'text-left' },
                React.createElement('h3', { className: 'text-red-400 font-semibold text-lg' }, 'Animation Error'),
                React.createElement('p', { className: 'text-gray-300 text-sm' }, 'Animation failed to load.'),
                React.createElement('div', { className: 'lottie-fallback text-4xl mt-1' }, this.props.fallbackEmoji || '🌤️')
            );
        }
        return this.props.children;
    }
}

// Lottie Player Component
const LottiePlayer = ({ src, fallbackEmoji = '🌤️' }) => {
    const containerRef = React.useRef(null);
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
        let lottieElement;

        const initLottie = () => {
            if (containerRef.current) {
                lottieElement = document.createElement('lottie-player');
                lottieElement.setAttribute('src', src);
                lottieElement.setAttribute('background', 'transparent');
                lottieElement.setAttribute('speed', '1');
                lottieElement.setAttribute('loop', 'true');
                lottieElement.setAttribute('autoplay', 'true');
                lottieElement.style.width = '80px';
                lottieElement.style.height = '80px';

                lottieElement.addEventListener('ready', () => setIsLoaded(true));
                lottieElement.addEventListener('error', () => setHasError(true));

                // Ensure the container is empty before appending
                while (containerRef.current.firstChild) {
                    containerRef.current.removeChild(containerRef.current.firstChild);
                }
                containerRef.current.appendChild(lottieElement);
            }
        };

        // Wait for the custom element to be defined before using it
        customElements.whenDefined('lottie-player').then(() => {
            initLottie();
        }).catch(err => {
            console.error("Lottie player custom element failed to define:", err);
            setHasError(true);
        });

        return () => {
            if (lottieElement && lottieElement.parentElement) {
                lottieElement.parentElement.removeChild(lottieElement);
            }
        };
    }, [src]);

    if (hasError) {
        return React.createElement('div', { className: 'lottie-container' },
            React.createElement('div', { className: 'lottie-fallback' }, fallbackEmoji)
        );
    }

    return React.createElement('div', {
        ref: containerRef,
        className: 'lottie-container'
    },
        !isLoaded && React.createElement('div', { className: 'lottie-fallback' }, fallbackEmoji)
    );
};


function renderApp() {
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        console.error('React or ReactDOM not loaded');
        document.getElementById('root').innerHTML = '<p style="color: #f87171; text-align: center;">Failed to load React. Please check your network and try again.</p>';
        return;
    }

    const weatherEmojis = {
        'Clear': '☀️', 'Clouds': '☁️', 'Rain': '🌧️', 'Drizzle': '🌦️',
        'Thunderstorm': '⛈️', 'Snow': '❄️', 'Mist': '🌫️', 'Fog': '🌫️',
        'Cyberpunk': '🌌', 'Retro 90s': '🎮'
    };

    const fantasyThemes = {
        'Real': {
            emoji: '🌤️',
            bg: 'bg-gray-900/80',
            lottie: 'https://assets3.lottiefiles.com/packages/lf20_jcikwtux.json'
        },
        'Cyberpunk': {
            emoji: '🌌',
            bg: 'bg-gradient-to-b from-purple-900/70 to-gray-900/70',
            lottie: 'https://assets3.lottiefiles.com/packages/lf20_1pxqjqgi.json'
        },
        'Retro 90s': {
            emoji: '🎮',
            bg: 'bg-gradient-to-b from-pink-900/70 to-gray-900/70',
            lottie: 'https://assets3.lottiefiles.com/packages/lf20_kkflmtur.json'
        }
    };

    const getClothingSuggestion = (temp, condition) => {
        if (temp < 10) return 'Thermal jacket, insulated pants, gloves 🧥';
        if (temp < 20) return 'Light jacket, long sleeves, jeans 🧣';
        if (temp >= 20 && condition.includes('Rain')) return 'Waterproof jacket, umbrella ☔';
        if (temp >= 20) return 'T-shirt, shorts, sunglasses 👕';
        return 'Adaptable outfit for dynamic conditions 🌈';
    };

    const getActivitySuggestion = (temp, condition) => {
        if (condition.includes('Rain')) return 'Cozy up with a book or movie indoors 📚';
        if (temp > 20) return 'Perfect for a hike or picnic in the sun 🌞';
        if (temp < 10) return 'Try indoor yoga or a warm coffee run ☕';
        return 'Great day for a casual walk or photography 📸';
    };

    const mockWeatherMemory = () => [
        { date: '2025-06-01', temp: 22, condition: 'Clear', description: 'Sunny and warm' },
        { date: '2025-05-25', temp: 18, condition: 'Rain', description: 'Light drizzle' },
        { date: '2025-05-15', temp: 15, condition: 'Clouds', description: 'Overcast skies' }
    ];

    const mockGeoTimeWeather = () => ({
        date: '2015-06-08',
        temp: 20,
        condition: 'Sunny',
        description: 'Bright and warm, perfect for outdoor fun!'
    });

    const LynxWeather = () => {
        const [weather, setWeather] = React.useState(null);
        const [error, setError] = React.useState(null); // Use null for initial state
        const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'Real');
        const [chatInput, setChatInput] = React.useState('');
        const [chatMessages, setChatMessages] = React.useState([{ text: 'Welcome to LynxWeather! Ask about the weather or activities! 😎', isBot: true }]);
        const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
        const [isTyping, setIsTyping] = React.useState(false);
        const [savedOutfit, setSavedOutfit] = React.useState(localStorage.getItem('savedOutfit') || '');

        React.useEffect(() => {
            const canvas = document.querySelector('.particle-bg');
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const particleCount = window.innerWidth < 768 ? 20 : 30;
            const particles = Array.from({ length: particleCount }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speedX: Math.random() * 0.5 - 0.25,
                speedY: Math.random() * 0.5 - 0.25
            }));
            let animationFrameId;
            const animateParticles = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach(p => {
                    p.x += p.speedX;
                    p.y += p.speedY;
                    if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
                    if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
                    ctx.fillStyle = 'rgba(139, 92, 246, 0.5)';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                });
                animationFrameId = requestAnimationFrame(animateParticles);
            };
            animateParticles();
            const handleResize = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };
            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
                cancelAnimationFrame(animationFrameId);
            }
        }, []);

        React.useEffect(() => {
            const fetchWeather = () => {
                if (!navigator.geolocation) {
                    setError({ message: 'Geolocation is not supported by your browser.' });
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    async position => {
                        try {
                            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&units=metric&appid=${weatherApiKey}`);
                            const data = await response.json();
                            if (response.ok) {
                                setWeather(data);
                                setError(null);
                            } else if (data.cod === 401) {
                                setError({ message: 'Invalid API key.', link: 'https://openweathermap.org/' });
                            } else {
                                setError({ message: `Weather API error: ${data.message || 'Unknown error'}` });
                            }
                        } catch (err) {
                            console.error('Weather fetch error:', err);
                            setError({ message: 'Failed to fetch weather data. Check your connection.' });
                        }
                    },
                    err => {
                        console.error('Geolocation error:', err);
                        setError({ message: 'Unable to get your location. Please enable location services.' });
                    }
                );
            };
            fetchWeather();
        }, []);

        const handleChatSubmit = async (e) => {
            e.preventDefault();
            if (!chatInput.trim()) return;
            const userMessage = chatInput.trim();
            setChatInput('');
            setChatMessages(prev => [...prev, { text: userMessage, isBot: false }]);
            setIsTyping(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                let botResponse = '';
                if (userMessage.toLowerCase().includes('weather')) {
                    botResponse = weather ?
                        `Current weather: ${weather.weather[0].description}, ${Math.round(weather.main.temp)}°C in ${weather.name}. ${getActivitySuggestion(weather.main.temp, weather.weather[0].main)}` :
                        'Weather data is not available right now. Please try again later.';
                } else if (userMessage.toLowerCase().includes('outfit') || userMessage.toLowerCase().includes('clothes')) {
                    botResponse = weather ?
                        `For today's weather (${Math.round(weather.main.temp)}°C, ${weather.weather[0].main}), I suggest: ${getClothingSuggestion(weather.main.temp, weather.weather[0].main)}` :
                        'I need weather data to suggest an outfit. Please allow location access.';
                } else if (userMessage.toLowerCase().includes('activity') || userMessage.toLowerCase().includes('do')) {
                    botResponse = weather ?
                        getActivitySuggestion(weather.main.temp, weather.weather[0].main) :
                        'I need weather data to suggest activities. Please allow location access.';
                } else if (userMessage.toLowerCase().includes('memory') || userMessage.toLowerCase().includes('history')) {
                    const memories = mockWeatherMemory();
                    botResponse = `Here are some recent weather memories: ${memories.map(m => `${m.date}: ${m.temp}°C, ${m.description}`).join('; ')}`;
                } else if (userMessage.toLowerCase().includes('time travel') || userMessage.toLowerCase().includes('past')) {
                    const pastWeather = mockGeoTimeWeather();
                    botResponse = `Time travel weather for ${pastWeather.date}: ${pastWeather.temp}°C, ${pastWeather.description}`;
                } else {
                    botResponse = "I'm here to help with weather, outfit suggestions, and activity recommendations! Try asking about the weather, what to wear, or what to do today.";
                }
                setChatMessages(prev => [...prev, { text: botResponse, isBot: true }]);
            } catch (err) {
                console.error('Chat error:', err);
                setChatMessages(prev => [...prev, { text: 'Sorry, I encountered an error. Please try again.', isBot: true }]);
            } finally {
                setIsTyping(false);
            }
        };

        const saveOutfit = () => {
            if (weather) {
                const outfit = getClothingSuggestion(weather.main.temp, weather.weather[0].main);
                setSavedOutfit(outfit);
                localStorage.setItem('savedOutfit', outfit);
                setChatMessages(prev => [...prev, { text: `Outfit saved: ${outfit}`, isBot: true }]);
            }
        };

        const changeTheme = (newTheme) => {
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        };

        const ErrorDisplay = ({ error }) => {
            if (!error) return null;
            return React.createElement('div', { className: 'error-message p-4 mb-4 rounded-lg' },
                React.createElement('p', null, error.message),
                error.link && React.createElement('a', { href: error.link, target: '_blank', rel: 'noopener noreferrer', className: 'underline' }, 'Get a valid key here.')
            );
        };

        return React.createElement('div', { className: 'min-h-screen flex flex-col items-center justify-center p-4' },
            React.createElement('div', { className: `weather-card max-w-md w-full fade-in ${fantasyThemes[theme].bg}` },
                React.createElement('div', { className: 'text-center mb-4' },
                    React.createElement('h1', { className: 'text-4xl font-bold text-white font-orbitron' }, 'LynxWeather'),
                    React.createElement('p', { className: 'text-purple-200 mt-2' }, 'Your AI Weather Companion')
                ),
                React.createElement(ErrorDisplay, { error: error }),
                weather && React.createElement('div', { className: 'text-center space-y-4' },
                    React.createElement('div', { className: 'flex items-center justify-center space-x-4' },
                        React.createElement(ErrorBoundary, { fallbackEmoji: fantasyThemes[theme].emoji },
                            React.createElement(LottiePlayer, {
                                src: fantasyThemes[theme].lottie,
                                fallbackEmoji: fantasyThemes[theme].emoji
                            })
                        ),
                        React.createElement('div', { className: 'text-left' },
                            React.createElement('div', { className: 'text-4xl font-bold text-white' }, `${Math.round(weather.main.temp)}°C`),
                            React.createElement('div', { className: 'text-purple-300' }, weather.weather[0].description.charAt(0).toUpperCase() + weather.weather[0].description.slice(1))
                        )
                    ),
                    React.createElement('div', { className: 'text-gray-200' },
                        React.createElement('p', null, `${weather.name}, ${weather.sys.country}`),
                        React.createElement('p', { className: 'text-sm' }, `Feels like ${Math.round(weather.main.feels_like)}°C`)
                    ),
                    React.createElement('div', { className: 'mt-4 p-4 bg-gray-900/80 rounded-lg' },
                        React.createElement('h3', { className: 'font-semibold text-purple-300 mb-2' }, 'Suggestions'),
                        React.createElement('p', { className: 'text-sm text-gray-200 mb-2' }, getClothingSuggestion(weather.main.temp, weather.weather[0].main)),
                        React.createElement('p', { className: 'text-sm text-gray-200' }, getActivitySuggestion(weather.main.temp, weather.weather[0].main)),
                        React.createElement('button', {
                            onClick: saveOutfit,
                            className: 'mt-2 pulse text-white px-4 py-2 rounded-lg text-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500'
                        }, 'Save Outfit')
                    ),
                    savedOutfit && React.createElement('div', { className: 'mt-2 p-2 bg-purple-900-50 rounded-lg' },
                        React.createElement('p', { className: 'text-xs text-purple-200' }, `Saved: ${savedOutfit}`)
                    )
                ),
                !weather && !error && React.createElement('div', { className: 'text-center text-gray-300' },
                    React.createElement('p', null, 'Loading weather data...')
                ),
                React.createElement('div', { className: 'mt-4 flex justify-center space-x-2' },
                    Object.keys(fantasyThemes).map(themeName =>
                        React.createElement('button', {
                            key: themeName,
                            onClick: () => changeTheme(themeName),
                            className: `px-3 py-1 rounded-lg text-sm transition duration-300 ${theme === themeName ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`
                        }, `${fantasyThemes[themeName].emoji} ${themeName}`)
                    )
                )
            ),
            React.createElement('button', {
                onClick: () => setIsSidebarOpen(!isSidebarOpen),
                className: 'sidebar-toggle fixed bottom-4 right-4 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-purple-500',
                'aria-label': 'Open chat sidebar'
            }, '💬'),
            React.createElement('div', {
                className: `sidebar fixed top-0 right-0 h-screen w-64 transform transition-transform duration-300 ${isSidebarOpen ? '' : 'translate-x-full'}`
            },
                React.createElement('div', { className: 'h-full flex flex-col' },
                    React.createElement('div', { className: 'p-4 border-b border-purple-500-50 flex justify-between items-center' },
                        React.createElement('h2', { className: 'text-lg font-semibold text-white' }, 'Chat with LynxWeather'),
                        React.createElement('button', {
                            onClick: () => setIsSidebarOpen(false),
                            className: 'text-gray-300 hover:text-white',
                            'aria-label': 'Close chat sidebar'
                        }, '✕')
                    ),
                    React.createElement('div', { className: 'flex-1 overflow-y-auto p-4 space-y-2' },
                        chatMessages.map((msg, idx) =>
                            React.createElement('div', {
                                key: idx,
                                className: `message ${msg.isBot ? 'text-purple-300' : 'text-cyan-300'}`
                            }, `${msg.isBot ? '🤖' : '👤'} ${msg.text}`)
                        ),
                        isTyping && React.createElement('div', { className: 'text-purple-300' }, '🤖 Typing...')
                    ),
                    React.createElement('form', {
                        onSubmit: handleChatSubmit,
                        className: 'p-4 border-t border-purple-500-50'
                    },
                        React.createElement('input', {
                            type: 'text',
                            value: chatInput,
                            onChange: (e) => setChatInput(e.target.value),
                            placeholder: 'Ask about weather...',
                            className: 'w-full p-2 rounded-lg bg-gray-800 text-white border border-purple-500-50 focus:outline-none focus:ring-2 focus:ring-purple-500'
                        }),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'w-full mt-2 pulse text-white py-2 rounded-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500'
                        }, 'Send')
                    )
                )
            )
        );
    };

    try {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(LynxWeather));
    } catch (err) {
        console.error('Render error:', err);
        document.getElementById('root').innerHTML = '<p style="color: #f87171; text-align: center;">Failed to render the application. Please refresh and try again.</p>';
    }
}

// Ensure DOM is loaded before rendering
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderApp);
} else {
    renderApp();
}

const { useState, useEffect } = React;

function App() {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState("London");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY"; // Replace with your key

  useEffect(() => {
    fetchWeather(city);
  }, []);

  function fetchWeather(cityName) {
    setLoading(true);
    setError("");
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`)
      .then(res => {
        if (!res.ok) throw new Error("City not found");
        return res.json();
      })
      .then(data => {
        setWeather(data);
        setCity(cityName);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  function handleSearch(e) {
    e.preventDefault();
    const form = e.target;
    const input = form.elements.city;
    fetchWeather(input.value);
  }

  // Choose Lottie animation based on weather
  const lottieSrc = weather
    ? weather.weather[0].main === "Clear"
      ? "https://assets10.lottiefiles.com/packages/lf20_jmBauI.json"
      : weather.weather[0].main === "Rain"
      ? "https://assets10.lottiefiles.com/packages/lf20_xzgLBp.json"
      : "https://assets10.lottiefiles.com/packages/lf20_jmBauI.json"
    : "";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <form onSubmit={handleSearch} className="mb-4 flex space-x-2">
        <input
          name="city"
          type="text"
          placeholder="Enter city"
          className="p-2 rounded-lg text-gray-900"
          aria-label="City"
        />
        <button className="p-2 bg-purple-600 text-white rounded-lg font-semibold" type="submit">
          Search
        </button>
      </form>
      <div className="weather-card max-w-xs w-full text-center fade-in">
        {loading && <div className="text-lg">Loading...</div>}
        {error && <div className="error-message p-2 rounded mb-2">{error}</div>}
        {weather && !loading && (
          <>
            <div className="lottie-container">
              <lottie-player
                src={lottieSrc}
                background="transparent"
                speed="1"
                loop
                autoplay
              ></lottie-player>
            </div>
            <h2 className="text-2xl font-bold mt-2">{weather.name}</h2>
            <div className="text-xl">{Math.round(weather.main.temp)}°C</div>
            <div className="text-purple-300">{weather.weather[0].main}</div>
          </>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);