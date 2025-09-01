import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, Wind, Thermometer, Eye } from 'lucide-react';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  icon: string;
}

interface WeatherWidgetProps {
  airportCode: string;
  className?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ airportCode, className = '' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate weather API call
    setTimeout(() => {
      setWeather({
        location: airportCode,
        temperature: Math.floor(Math.random() * 20) + 15, // 15-35°C
        condition: ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        windSpeed: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
        visibility: Math.floor(Math.random() * 5) + 5, // 5-10 km
        icon: 'sunny'
      });
      setIsLoading(false);
    }, 500);
  }, [airportCode]);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear': return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'partly cloudy': return <Cloud className="h-6 w-6 text-gray-500" />;
      case 'cloudy': return <Cloud className="h-6 w-6 text-gray-600" />;
      case 'light rain': return <CloudRain className="h-6 w-6 text-blue-500" />;
      default: return <Sun className="h-6 w-6 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-medium text-gray-900">{weather.location} Weather</h4>
          <p className="text-xs text-gray-600">{weather.condition}</p>
        </div>
        {getWeatherIcon(weather.condition)}
      </div>
      
      <div className="flex items-center space-x-4 mb-3">
        <div className="flex items-center space-x-1">
          <Thermometer className="h-4 w-4 text-red-500" />
          <span className="text-lg font-bold text-gray-900">{weather.temperature}°C</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Wind className="h-3 w-3 text-gray-500" />
          </div>
          <p className="text-gray-600">{weather.windSpeed} km/h</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Cloud className="h-3 w-3 text-gray-500" />
          </div>
          <p className="text-gray-600">{weather.humidity}%</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Eye className="h-3 w-3 text-gray-500" />
          </div>
          <p className="text-gray-600">{weather.visibility} km</p>
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherWidget;