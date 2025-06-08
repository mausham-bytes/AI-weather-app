import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
import { config } from './config.js';

// --- Constants and Helpers ---
const weatherApiKey = config.weatherApiKey;

const fantasyThemes = {
    'Real': { emoji: '🌤️', bg: 'bg-real', lottie: 'https://assets3.lottiefiles.com/packages/lf20_jcikwtux.json' },
    'Cyberpunk': { emoji: '🌌', bg: 'bg-cyberpunk', lottie: 'https://assets3.lottiefiles.com/packages/lf20_1pxqjqgi.json' },
    'Retro 90s': { emoji: '🎮', bg: 'bg-retro', lottie: 'https://assets3.lottiefiles.com/packages/lf20_kkflmtur.json' }
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

// --- Components ---

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
            return (
                <div className="text-center p-4 bg-red-900/50 rounded-lg border border-red-500/50">
                    <h3 className="text-red-400 font-semibold mb-2">Animation Error</h3>
                    <p className="text-red-300 text-sm">Animation failed to load. Using fallback display.</p>
                    <div className="lottie-fallback mt-2">{this.props.fallbackEmoji || '🌤️'}</div>
                </div>
            );
        }
        return this.props.children;
    }
}

const LottiePlayer = ({ src, fallbackEmoji = '🌤️' }) => {
    const containerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let lottieElement = null;
        const loadLottie = async () => {
            try {
                if (typeof customElements === 'undefined' || !customElements.get('lottie-player')) {
                    const script = document.createElement('script');
                    script.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
                    document.head.appendChild(script);
                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = reject;
                        setTimeout(() => reject(new Error('Lottie script timeout')), 10000);
                    });
                }

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
                    containerRef.current.innerHTML = ''; // Clear previous content
                    containerRef.current.appendChild(lottieElement);
                }
            } catch (error) {
                console.error('Failed to load Lottie player:', error);
                setHasError(true);
            }
        };

        loadLottie();

        return () => {
            if (lottieElement && lottieElement.parentNode) {
                lottieElement.parentNode.removeChild(lottieElement);
            }
        };
    }, [src]);

    if (hasError) {
        return <div className="lottie-container"><div className="lottie-fallback">{fallbackEmoji}</div></div>;
    }

    return (
        <div ref={containerRef} className="lottie-container">
            {!isLoaded && <div className="lottie-fallback">{fallbackEmoji}</div>}
        </div>
    );
};

const ParticleBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const particleCount = window.innerWidth < 768 ? 25 : 40;
        const particles = Array.from({ length: particleCount }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2.5 + 1,
            speedX: Math.random() * 0.4 - 0.2,
            speedY: Math.random() * 0.4 - 0.2
        }));

        const animateParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
                if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
                ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            animationFrameId = requestAnimationFrame(animateParticles);
        };

        animateParticles();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="particle-bg" />;
};

const ChatSidebar = ({ isOpen, onClose, weather }) => {
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([{ text: 'Welcome to LynxWeather! Ask about the weather or activities! 😎', isBot: true }]);
    const [isTyping, setIsTyping] = useState(false);
    const chatBodyRef = useRef(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [chatMessages]);

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
            } else {
                botResponse = "I'm here to help with weather, outfits, and activities! Try asking about the weather, what to wear, or what to do today.";
            }
            setChatMessages(prev => [...prev, { text: botResponse, isBot: true }]);
        } catch (err) {
            console.error('Chat error:', err);
            setChatMessages(prev => [...prev, { text: 'Sorry, I encountered an error. Please try again.', isBot: true }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className={`sidebar fixed top-0 right-0 h-screen w-64 transform transition-transform duration-300 ${isOpen ? '' : 'translate-x-full'}`}>
            <div className="h-full flex flex-col">
                <div className="p-4 border-b border-purple-500-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Chat with LynxWeather</h2>
                    <button onClick={onClose} className="text-gray-300 hover:text-white text-2xl">&times;</button>
                </div>
                <div ref={chatBodyRef} className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.isBot ? 'is-bot' : 'is-user'}`}>
                            {`${msg.isBot ? '🤖' : '👤'} ${msg.text}`}
                        </div>
                    ))}
                    {isTyping && <div className="message is-bot">🤖 Typing...</div>}
                </div>
                <form onSubmit={handleChatSubmit} className="p-4 border-t border-purple-500-50">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask about weather..."
                        className="w-full p-2 rounded-lg bg-gray-800 text-white border border-purple-500-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button type="submit" className="w-full mt-2 pulse text-white py-2 rounded-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

const LynxWeather = () => {
    const [weather, setWeather] = useState(null);
    const [error, setError] = useState('');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'Real');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [savedOutfit, setSavedOutfit] = useState(localStorage.getItem('savedOutfit') || '');

    useEffect(() => {
        const fetchWeather = () => {
            if (!navigator.geolocation) {
                setError('Geolocation is not supported by your browser.');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                async position => {
                    try {
                        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&units=metric&appid=${weatherApiKey}`);
                        if (!response.ok) {
                            if (response.status === 401) {
                                throw new Error('Invalid API key. Please visit <a href="https://openweathermap.org/" target="_blank" class="underline">OpenWeatherMap</a> to get a valid API key.');
                            }
                            const data = await response.json();
                            throw new Error(data.message || 'Failed to fetch weather data');
                        }
                        const data = await response.json();
                        setWeather(data);
                        setError('');
                    } catch (err) {
                        console.error('Weather fetch error:', err);
                        setError(err.message);
                    }
                },
                err => {
                    console.error('Geolocation error:', err);
                    setError('Unable to get your location. Please enable location services.');
                }
            );
        };
        fetchWeather();
    }, []);

    const saveOutfit = () => {
        if (weather) {
            const outfit = getClothingSuggestion(weather.main.temp, weather.weather[0].main);
            setSavedOutfit(outfit);
            localStorage.setItem('savedOutfit', outfit);
        }
    };

    const changeTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const currentTheme = fantasyThemes[theme] || fantasyThemes['Real'];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <ParticleBackground />
            <div className={`weather-card max-w-md w-full fade-in ${currentTheme.bg}`}>
                <div className="text-center mb-4">
                    <h1 className="text-4xl font-bold text-white font-orbitron">Lynx-Weather</h1>
                    <p className="text-lg text-purple-300 font-semibold">Your AI Weather Companion</p>
                </div>

                {error && <div className="error-message mb-4" dangerouslySetInnerHTML={{ __html: error }} />}

                {weather ? (
                    <div className="text-center space-y-2">
                        <div className="flex items-center justify-center space-x-2">
                            <ErrorBoundary fallbackEmoji={currentTheme.emoji}>
                                <LottiePlayer src={currentTheme.lottie} fallbackEmoji={currentTheme.emoji} />
                            </ErrorBoundary>
                            <div>
                                <div className="text-2xl font-bold text-white">{`${Math.round(weather.main.temp)}°C`}</div>
                                <div className="text-purple-300 capitalize">{weather.weather[0].description}</div>
                            </div>
                        </div>
                        <div className="text-gray-200">
                            <p>{`${weather.name}, ${weather.sys.country}`}</p>
                            <p className="text-sm">{`Feels like ${Math.round(weather.main.feels_like)}°C`}</p>
                        </div>
                        <div className="mt-4 p-4 bg-gray-900/80 rounded-lg">
                            <h3 className="font-semibold text-purple-300 mb-2">Suggestions</h3>
                            <p className="text-sm text-gray-200 mb-2">{getClothingSuggestion(weather.main.temp, weather.weather[0].main)}</p>
                            <p className="text-sm text-gray-200">{getActivitySuggestion(weather.main.temp, weather.weather[0].main)}</p>
                            <button onClick={saveOutfit} className="mt-2 pulse text-white px-4 py-2 rounded-lg text-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500">
                                Save Outfit
                            </button>
                        </div>
                        {savedOutfit && (
                            <div className="mt-2 p-2 bg-purple-900-50 rounded-lg">
                                <p className="text-xs text-purple-200">{`Saved: ${savedOutfit}`}</p>
                            </div>
                        )}
                    </div>
                ) : !error && (
                    <div className="text-center text-gray-300 p-8">
                        <p>Loading weather data...</p>
                    </div>
                )}

                <div className="mt-4 flex justify-center space-x-2">
                    {Object.keys(fantasyThemes).map(themeName => (
                        <button
                            key={themeName}
                            onClick={() => changeTheme(themeName)}
                            className={`px-3 py-1 rounded-lg text-sm transition duration-300 ${theme === themeName ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                        >
                            {`${fantasyThemes[themeName].emoji} ${themeName}`}
                        </button>
                    ))}
                </div>
            </div>

            <button onClick={() => setIsSidebarOpen(true)} className="sidebar-toggle fixed bottom-4 right-4 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                💬
            </button>

            <ChatSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} weather={weather} />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <LynxWeather />
    </React.StrictMode>
);