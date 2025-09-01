export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
}

export const airports: Airport[] = [
  // India - Major Airports
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bangalore', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'CCU', name: 'Netaji Subhas Chandra Bose International Airport', city: 'Kolkata', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'GOI', name: 'Goa International Airport', city: 'Goa', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'LKO', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'NAG', name: 'Dr. Babasaheb Ambedkar International Airport', city: 'Nagpur', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'TRV', name: 'Trivandrum International Airport', city: 'Thiruvananthapuram', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'VNS', name: 'Lal Bahadur Shastri Airport', city: 'Varanasi', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IXC', name: 'Chandigarh Airport', city: 'Chandigarh', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IXB', name: 'Bagdogra Airport', city: 'Siliguri', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IXM', name: 'Madurai Airport', city: 'Madurai', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IXJ', name: 'Jammu Airport', city: 'Jammu', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IXU', name: 'Aurangabad Airport', city: 'Aurangabad', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'RPR', name: 'Swami Vivekananda Airport', city: 'Raipur', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'BHO', name: 'Raja Bhoj Airport', city: 'Bhopal', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IDR', name: 'Devi Ahilya Bai Holkar Airport', city: 'Indore', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'JLR', name: 'Jabalpur Airport', city: 'Jabalpur', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IXE', name: 'Mangalore International Airport', city: 'Mangalore', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IXW', name: 'Sonari Airport', city: 'Jamshedpur', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IXS', name: 'Kailashahar Airport', city: 'Silchar', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IXD', name: 'Allahabad Airport', city: 'Allahabad', country: 'India', timezone: 'Asia/Kolkata' },

  // International - Major Cargo Hubs
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai' },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', timezone: 'Asia/Qatar' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' },
  { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
  { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul' },
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
  { code: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok' },
  { code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  { code: 'CGK', name: 'Soekarno-Hatta International Airport', city: 'Jakarta', country: 'Indonesia', timezone: 'Asia/Jakarta' },
  { code: 'MNL', name: 'Ninoy Aquino International Airport', city: 'Manila', country: 'Philippines', timezone: 'Asia/Manila' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', timezone: 'Europe/Berlin' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', timezone: 'Europe/Amsterdam' },
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', timezone: 'Europe/Paris' },
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', timezone: 'America/New_York' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', timezone: 'America/Los_Angeles' },
  { code: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', country: 'United States', timezone: 'America/Chicago' },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States', timezone: 'America/New_York' },
  { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', timezone: 'America/Toronto' },
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', timezone: 'Australia/Melbourne' },
];

export const searchAirports = (query: string): Airport[] => {
  if (!query || query.length < 1) return [];
  
  const searchTerm = query.toLowerCase();
  
  return airports.filter(airport => 
    airport.code.toLowerCase().includes(searchTerm) ||
    airport.name.toLowerCase().includes(searchTerm) ||
    airport.city.toLowerCase().includes(searchTerm) ||
    airport.country.toLowerCase().includes(searchTerm)
  ).slice(0, 10); // Limit to 10 results
};

export const getAirportByCode = (code: string): Airport | undefined => {
  return airports.find(airport => airport.code.toLowerCase() === code.toLowerCase());
};