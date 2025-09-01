# RadiantGo Testing Guide

## Testing Strategy

### Test Pyramid
```
    ┌─────────────────┐
    │   E2E Tests     │  ← Integration & User Journey
    │                 │
    ├─────────────────┤
    │ Integration     │  ← API & Database Integration
    │ Tests           │
    ├─────────────────┤
    │   Unit Tests    │  ← Business Logic & Utilities
    │                 │
    └─────────────────┘
```

### Backend Testing

#### Unit Tests
Located in `backend/src/__tests__/`

**Test Categories:**
- **Services**: Business logic testing
- **Controllers**: HTTP request/response handling
- **Utilities**: Helper functions and utilities
- **Middlewares**: Authentication, validation, error handling

#### Running Tests
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- booking.service.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="create booking"
```

#### Test Database Setup
Tests use MongoDB Memory Server for isolated testing:

```javascript
// setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  // Clean up after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

#### Test Examples

**Service Testing:**
```javascript
describe('BookingService', () => {
  it('should create booking with valid data', async () => {
    const bookingData = {
      origin: 'DEL',
      destination: 'BOM',
      pieces: 2,
      weight_kg: 5.5,
      route_id: 'direct-flight123'
    };

    const booking = await bookingService.createBooking(bookingData);

    expect(booking.ref_id).toMatch(/^RG[A-Z0-9]{8}$/);
    expect(booking.status).toBe(BookingStatus.BOOKED);
    expect(booking.events).toHaveLength(1);
  });
});
```

**Controller Testing:**
```javascript
describe('POST /api/bookings', () => {
  it('should create booking and return 201', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validBookingData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.ref_id).toBeDefined();
  });
});
```

### Frontend Testing

#### Component Testing
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest jsdom

# Run tests
npm test
```

#### Test Examples
```javascript
// BookingCard.test.tsx
import { render, screen } from '@testing-library/react';
import BookingCard from '../BookingCard';

describe('BookingCard', () => {
  const mockBooking = {
    ref_id: 'RG12345678',
    origin: 'DEL',
    destination: 'BOM',
    status: 'BOOKED',
    // ... other fields
  };

  it('should display booking information', () => {
    render(<BookingCard booking={mockBooking} />);
    
    expect(screen.getByText('RG12345678')).toBeInTheDocument();
    expect(screen.getByText('DEL')).toBeInTheDocument();
    expect(screen.getByText('BOM')).toBeInTheDocument();
  });
});
```

### Integration Testing

#### API Integration Tests
Test complete API workflows:

```javascript
describe('Booking Workflow Integration', () => {
  it('should complete full booking lifecycle', async () => {
    // 1. Search routes
    const routesResponse = await request(app)
      .get('/api/flights/routes')
      .query({ origin: 'DEL', destination: 'BOM', departure_date: '2024-01-15' });

    expect(routesResponse.status).toBe(200);
    const routes = routesResponse.body.data;
    expect(routes.length).toBeGreaterThan(0);

    // 2. Create booking
    const bookingResponse = await request(app)
      .post('/api/bookings')
      .send({
        origin: 'DEL',
        destination: 'BOM',
        pieces: 1,
        weight_kg: 5,
        route_id: routes[0].id
      });

    expect(bookingResponse.status).toBe(201);
    const booking = bookingResponse.body.data;

    // 3. Update status to departed
    const departResponse = await request(app)
      .post(`/api/bookings/${booking.ref_id}/depart`)
      .send({ location: 'DEL' });

    expect(departResponse.status).toBe(200);
    expect(departResponse.body.data.status).toBe('DEPARTED');

    // 4. Track booking
    const trackResponse = await request(app)
      .get(`/api/bookings/${booking.ref_id}`);

    expect(trackResponse.status).toBe(200);
    expect(trackResponse.body.data.events).toHaveLength(2);
  });
});
```

### Performance Testing

#### Load Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 120
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Route search and booking"
    weight: 70
    flow:
      - get:
          url: "/api/flights/routes"
          qs:
            origin: "DEL"
            destination: "BOM"
            departure_date: "2024-01-15"
      - post:
          url: "/api/bookings"
          json:
            origin: "DEL"
            destination: "BOM"
            pieces: 1
            weight_kg: 5
            route_id: "direct-test"

  - name: "Booking tracking"
    weight: 30
    flow:
      - get:
          url: "/api/bookings/{{ $randomString() }}"
```

#### Stress Testing
```bash
# Install Artillery
npm install -g artillery

# Run performance tests
artillery run artillery-config.yml

# Generate HTML report
artillery run artillery-config.yml --output report.json
artillery report report.json
```

### Test Data Management

#### Test Data Generation
```javascript
// test-data-generator.ts
export const generateTestBooking = (overrides = {}) => ({
  origin: 'DEL',
  destination: 'BOM',
  pieces: 1,
  weight_kg: 5.0,
  route_id: 'direct-test123',
  ...overrides
});

export const generateTestFlight = (overrides = {}) => ({
  flight_id: generateFlightId(),
  flight_number: 'AI101',
  airline: 'Air India',
  departure: new Date('2024-01-15T10:00:00Z'),
  arrival: new Date('2024-01-15T12:30:00Z'),
  origin: 'DEL',
  destination: 'BOM',
  ...overrides
});
```

#### Database Seeding for Tests
```javascript
// test-seeds.ts
export const seedTestData = async () => {
  // Create test flights
  const flights = [
    generateTestFlight({ origin: 'DEL', destination: 'BOM' }),
    generateTestFlight({ origin: 'BOM', destination: 'DEL' }),
    // ... more test flights
  ];
  
  await Flight.insertMany(flights);
  
  // Create test users
  const users = [
    { name: 'Test User', email: 'test@example.com', password: 'password123' },
    // ... more test users
  ];
  
  for (const userData of users) {
    const user = new User(userData);
    await user.save();
  }
};
```

### Continuous Integration

#### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd backend
        npm ci
    
    - name: Run tests
      run: |
        cd backend
        npm test -- --coverage
      env:
        MONGODB_URI: mongodb://localhost:27017/radiantgo-test
        REDIS_URL: redis://localhost:6379
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: backend/coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
```

### Test Coverage Goals

#### Coverage Targets
- **Overall Coverage**: > 80%
- **Services**: > 90%
- **Controllers**: > 85%
- **Utilities**: > 95%
- **Critical Paths**: 100%

#### Coverage Reports
```bash
# Generate coverage report
npm test -- --coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Testing Best Practices

#### Unit Testing
1. **Test Isolation**: Each test should be independent
2. **Mock External Dependencies**: Use mocks for external services
3. **Clear Test Names**: Descriptive test names
4. **Arrange-Act-Assert**: Clear test structure
5. **Edge Cases**: Test boundary conditions

#### Integration Testing
1. **Real Database**: Use test database for integration tests
2. **Complete Workflows**: Test end-to-end scenarios
3. **Error Scenarios**: Test error handling
4. **Concurrency**: Test concurrent operations

#### Performance Testing
1. **Baseline Metrics**: Establish performance baselines
2. **Load Patterns**: Test realistic load patterns
3. **Resource Monitoring**: Monitor system resources
4. **Bottleneck Identification**: Identify performance bottlenecks

### Debugging Tests

#### Common Issues
1. **Database Connection**: Ensure test database is available
2. **Async Operations**: Proper async/await usage
3. **Test Data Cleanup**: Clean state between tests
4. **Mock Configuration**: Proper mock setup

#### Debugging Tools
```bash
# Debug specific test
npm test -- --testNamePattern="create booking" --verbose

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Enable debug logging
DEBUG=* npm test
```