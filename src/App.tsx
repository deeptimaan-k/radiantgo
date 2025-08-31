import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { CreateBookingPage } from './pages/CreateBookingPage';
import { BookingDetailPage } from './pages/BookingDetailPage';
import { SearchResultsPage } from './pages/SearchResultsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-radiant relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"
          />
          <motion.div
            animate={{
              y: [0, 30, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute top-40 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl"
          />
          <motion.div
            animate={{
              y: [0, -15, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
            className="absolute bottom-20 left-1/4 w-24 h-24 bg-white/8 rounded-full blur-xl"
          />
        </div>

        <Header />
        
        <AnimatePresence mode="wait">
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 pt-20 min-h-screen"
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create-booking" element={<CreateBookingPage />} />
              <Route path="/booking/:refId" element={<BookingDetailPage />} />
              <Route path="/search" element={<SearchResultsPage />} />
            </Routes>
          </motion.main>
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;