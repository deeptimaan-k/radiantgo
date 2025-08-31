import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Search, Menu, X, Package, Home, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchRef, setSearchRef] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef.trim()) {
      navigate(`/search?ref=${searchRef.trim()}`);
      setSearchRef('');
      setIsMenuOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/create-booking', label: 'New Booking', icon: Plus },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-2xl border-b border-white/20 shadow-lg"
    >
      <div className="container-fluid">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-4 group">
            <motion.div
              whileHover={{ 
                rotate: 360,
                scale: 1.1 
              }}
              transition={{ 
                duration: 0.8,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-xl">
                <Plane className="w-7 h-7 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-yellow-500 rounded-2xl blur-lg opacity-30 -z-10"></div>
            </motion.div>
            
            <div className="hidden sm:block">
              <motion.h1 
                className="text-2xl font-bold text-white group-hover:text-yellow-200 transition-colors duration-300 text-shadow"
                whileHover={{ scale: 1.05 }}
              >
                RadiantGo
              </motion.h1>
              <motion.p 
                className="text-sm text-white/80 -mt-1 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Air Cargo, Simplified
              </motion.p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Navigation Links */}
            <nav className="flex items-center space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search booking..."
                  value={searchRef}
                  onChange={(e) => setSearchRef(e.target.value)}
                  className="pl-12 w-80 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 rounded-2xl backdrop-blur-sm"
                />
              </div>
              <Button 
                type="submit" 
                size="sm" 
                className="h-12 px-4 bg-white/20 hover:bg-white/30 text-white border-white/20 rounded-2xl backdrop-blur-sm transition-all duration-300"
                variant="outline"
              >
                <Search className="w-5 h-5" />
              </Button>
            </form>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-white/20 rounded-xl"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isMenuOpen ? 'close' : 'menu'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.div>
            </AnimatePresence>
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-6 space-y-6 bg-white/5 backdrop-blur-sm rounded-b-3xl border-t border-white/10">
                {/* Mobile Navigation */}
                <nav className="space-y-3">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                        <Link
                          to={item.path}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center space-x-3 px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                            isActive(item.path)
                              ? 'bg-white/20 text-white shadow-lg'
                              : 'text-white/80 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Mobile Search */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="px-6"
                >
                  <form onSubmit={handleSearch} className="flex items-center space-x-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                      <Input
                        type="text"
                        placeholder="Search booking..."
                        value={searchRef}
                        onChange={(e) => setSearchRef(e.target.value)}
                        className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 rounded-2xl backdrop-blur-sm"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      size="sm" 
                      className="h-12 px-4 bg-white/20 hover:bg-white/30 text-white border-white/20 rounded-2xl backdrop-blur-sm"
                      variant="outline"
                    >
                      <Search className="w-5 h-5" />
                    </Button>
                  </form>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}