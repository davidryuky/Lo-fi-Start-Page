
import React, { useEffect, useState, memo } from 'react';
import { Cloud, CloudRain, Sun, CloudSnow, CloudLightning, Loader, Wind, ArrowDown, ArrowUp } from 'lucide-react';
import { WeatherConfig, ThemeConfig } from '../types';
import { hexToRgba } from '../utils';

interface WeatherWidgetProps {
  config: WeatherConfig;
  theme: ThemeConfig;
}

interface WeatherData {
  temp: number;
  min?: number;
  max?: number;
  conditionCode: number;
  description: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = memo(({ config, theme }) => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!config.enabled || !config.city) return;

    // Check Cache
    const cacheKey = `weather_cache_${config.city}_${config.unit}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp < 30 * 60 * 1000) { // 30 min cache
                setData(data);
                // Don't return here, we still might want to fetch if stale, 
                // but this allows instant display.
            }
        } catch (e) {}
    }

    const fetchWeather = async () => {
      // Only set loading if we don't have data
      if (!data) setLoading(true);
      setError(false);
      try {
        let latitude = config.latitude;
        let longitude = config.longitude;

        // If no coordinates stored (legacy config or manual entry), try to geocode one last time
        if (latitude === undefined || longitude === undefined) {
            const geoRes = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(config.city)}&count=1&language=en&format=json`
            );
            const geoJson = await geoRes.json();
            if (!geoJson.results || geoJson.results.length === 0) throw new Error('City not found');
            latitude = geoJson.results[0].latitude;
            longitude = geoJson.results[0].longitude;
        }

        // Fetch Forecast using coordinates
        const tempUnit = config.unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&temperature_unit=${tempUnit}`
        );
        const weatherJson = await weatherRes.json();
        
        // WMO Code Map for text
        const getDesc = (c: number) => {
            if (c === 0) return 'Clear Sky';
            if ([1,2,3].includes(c)) return 'Cloudy';
            if ([45,48].includes(c)) return 'Fog';
            if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(c)) return 'Rain';
            if ([71,73,75,77,85,86].includes(c)) return 'Snow';
            if ([95,96,99].includes(c)) return 'Storm';
            return 'Cloudy';
        };

        const newData = {
            temp: weatherJson.current_weather.temperature,
            conditionCode: weatherJson.current_weather.weathercode,
            min: weatherJson.daily.temperature_2m_min[0],
            max: weatherJson.daily.temperature_2m_max[0],
            description: getDesc(weatherJson.current_weather.weathercode)
        };

        setData(newData);
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: newData }));

      } catch (err) {
        console.error("Weather Fetch Error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 30 mins
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);

  }, [config.enabled, config.city, config.latitude, config.longitude, config.unit]);

  if (!config.enabled) return null;

  // Icon Render Logic
  const renderIcon = () => {
      const code = data?.conditionCode ?? 0;
      if (code === 0) return <Sun size={24} />;
      if ([1,2,3,45,48].includes(code)) return <Cloud size={24} />;
      if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return <CloudRain size={24} />;
      if ([71,73,75,77,85,86].includes(code)) return <CloudSnow size={24} />;
      if ([95,96,99].includes(code)) return <CloudLightning size={24} />;
      return <Cloud size={24} />;
  };

  return (
    <div 
      className="w-full p-4 border backdrop-blur-sm transition-all duration-300 shadow-sm flex items-center justify-between gap-4"
      style={{
        borderColor: `${config.textColor}22`,
        borderRadius: theme.borderRadius,
        backgroundColor: hexToRgba(config.backgroundColor, config.opacityLevel),
        backdropFilter: config.blurLevel > 0 ? `blur(${config.blurLevel}px)` : 'none',
        color: config.textColor
      }}
    >
        {/* Left: City & Desc */}
        <div className="flex flex-col">
            <div className="flex items-center gap-1 opacity-60 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[100px]">{config.city}</span>
            </div>
            {loading && !data ? (
                <div className="h-4 w-12 bg-white/10 rounded animate-pulse"></div>
            ) : error ? (
                <span className="text-xs text-red-400">Unavailable</span>
            ) : (
                <span className="text-sm font-medium capitalize truncate max-w-[120px] opacity-90">{data?.description}</span>
            )}
        </div>

        {/* Right: Temp & Icon */}
        <div className="flex items-center gap-3">
             {data && !error && (
                 <div className="flex flex-col items-end mr-1">
                     <span className="text-2xl font-mono font-bold leading-none">{Math.round(data.temp)}°</span>
                     {(data.min !== undefined && data.max !== undefined) && (
                         <div className="flex gap-2 text-[10px] opacity-60 mt-1 font-mono">
                             <span className="flex items-center"><ArrowUp size={8} />{Math.round(data.max)}°</span>
                             <span className="flex items-center"><ArrowDown size={8} />{Math.round(data.min)}°</span>
                         </div>
                     )}
                 </div>
             )}
             
             <div style={{ color: theme.accentColor }} className="flex-shrink-0">
                 {loading && !data ? <Loader size={20} className="animate-spin opacity-50" /> : renderIcon()}
             </div>
        </div>
    </div>
  );
});
