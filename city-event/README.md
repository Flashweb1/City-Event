# 🌆 CITY EVENT

**Global Event Management Platform with QR Code Check-In**

A modern, scalable event management system designed to compete with Eventbrite, Meetup, and Ticketmaster. Built with cutting-edge technology and a bold urban design aesthetic.

![City Event](https://img.shields.io/badge/Status-MVP-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🚀 Features

### Current (MVP)
- ✅ **Event Discovery** - Browse and search events with category filters
- ✅ **User Authentication** - Secure JWT-based login/registration
- ✅ **Event Registration** - One-click registration for events
- ✅ **QR Code Tickets** - Automatic QR code generation for registered events
- ✅ **QR Scanner** - Built-in camera scanner for instant check-in
- ✅ **Real-time Validation** - Prevent duplicate check-ins
- ✅ **Organizer Dashboard** - Create and manage events
- ✅ **Capacity Management** - Track registrations and prevent overbooking
- ✅ **Responsive Design** - Mobile-first, works on all devices

### Coming Soon (Phase 2 - Global Features)
- 🌍 **Multi-language Support** (i18n)
- 💳 **Payment Integration** (Stripe, PayPal)
- 🎫 **Tiered Ticketing** (Free, VIP, Early Bird)
- 📧 **Email Marketing** & Automation
- 📱 **Mobile Apps** (iOS & Android - React Native)
- 🔗 **Social Media Integration**
- 📊 **Advanced Analytics Dashboard**
- 🎨 **White-label Solutions** for enterprises
- 🌐 **Timezone Handling**
- 💰 **Revenue Sharing** for organizers
- 🔔 **Push Notifications**
- 📍 **Map Integration** (Google Maps)
- 🎤 **Live Streaming Integration**
- 🤝 **Partnership Programs**

---

## 🏗️ Architecture

```
city-event/
├── backend/              # Node.js + Express API
│   ├── server.js        # Main server with all API routes
│   └── package.json
├── frontend/            # React + Vite
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   │   └── Navbar.jsx
│   │   ├── pages/       # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── EventDetail.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MyTickets.jsx
│   │   │   ├── Scanner.jsx
│   │   │   └── CreateEvent.jsx
│   │   ├── utils/       # Utilities
│   │   │   ├── api.js   # API client
│   │   │   └── auth.js  # Authentication context
│   │   ├── styles.css   # Global styles
│   │   ├── App.jsx      # Main app with routing
│   │   └── main.jsx     # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

### Tech Stack

**Frontend:**
- React 18
- React Router 6
- Vite (build tool)
- QRCode.react (QR generation)
- html5-qrcode (QR scanning)

**Backend:**
- Node.js
- Express.js
- JWT (authentication)
- bcrypt (password hashing)
- UUID (unique IDs)

**Current Database:**
- In-memory (for MVP)
- Easy to upgrade to PostgreSQL/MongoDB

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ (with npm)
- Modern web browser with camera access

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd city-event
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Server runs on: `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
App runs on: `http://localhost:3000`

### 4. Open the App
Navigate to `http://localhost:3000` in your browser.

---

## 🎮 Usage

### Demo Account
- **Email:** demo@cityevent.com
- **Password:** password123
- **Role:** Organizer (can create events)

### User Flows

**1. Attendee Flow:**
1. Browse events at `/events`
2. Click event → View details
3. Click "Register Now"
4. View ticket with QR code at `/my-tickets`
5. Show QR code at event entrance

**2. Organizer Flow:**
1. Login as organizer
2. Click "Create Event"
3. Fill event details
4. Event appears on platform
5. Use `/scanner` to check in attendees

**3. Gate Staff Flow:**
1. Login to system
2. Navigate to `/scanner`
3. Click "Start Scanning"
4. Scan attendee QR codes
5. Green = valid, Red = invalid

---

## 🔐 API Endpoints

### Authentication
```
POST /api/auth/register     # Create new user
POST /api/auth/login        # Login user
GET  /api/auth/me          # Get current user
```

### Events
```
GET    /api/events          # List all events (with filters)
GET    /api/events/:id      # Get single event
POST   /api/events          # Create event (organizers only)
PUT    /api/events/:id      # Update event
DELETE /api/events/:id      # Delete event
```

### Registrations
```
POST /api/registrations              # Register for event
GET  /api/registrations/my-tickets   # Get user's tickets
GET  /api/registrations/:id          # Get single registration
```

### Check-in
```
POST /api/checkin/scan            # Scan QR & check-in
GET  /api/checkin/event/:eventId  # Get event check-in stats
```

---

## 🎨 Design System

### Color Palette
- **Neon Cyan:** `#00f5ff` - Primary actions, success states
- **Neon Pink:** `#ff006e` - Errors, sold out badges
- **Neon Yellow:** `#ffbe0b` - Highlights, CTAs
- **Electric Purple:** `#8338ec` - Gradients
- **Deep Black:** `#0a0a0a` - Background
- **Dark Gray:** `#1a1a1a` - Cards, containers

### Typography
- **Display Font:** Bebas Neue (headers, titles)
- **Body Font:** Work Sans (paragraphs, UI text)

### Key Design Principles
- Bold, urban-inspired aesthetic
- High contrast for readability
- Neon accents for energy
- Geometric shapes
- Mobile-first responsive

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Render/Railway)
```bash
cd backend
# Push to GitHub
# Connect to Render/Railway
# Set environment variables
```

### Environment Variables
```
JWT_SECRET=your-secret-key
PORT=3001
DATABASE_URL=postgresql://... (when upgrading DB)
```

---

## 🌍 Roadmap to Global Platform

### Phase 1: MVP ✅ (Current)
- Core event management
- QR check-in system
- Basic authentication

### Phase 2: Enterprise Features (3-6 months)
- Payment processing (Stripe)
- Multi-currency support
- Email automation
- Advanced analytics
- White-label options
- API for third-party integrations

### Phase 3: Mobile Apps (6-9 months)
- iOS app (React Native)
- Android app (React Native)
- Offline mode for scanner
- Push notifications

### Phase 4: AI & Advanced Features (9-12 months)
- AI-powered event recommendations
- Smart pricing algorithms
- Fraud detection
- Live streaming integration
- Virtual event support

### Phase 5: Global Expansion (12+ months)
- Multi-language support (20+ languages)
- Regional partnerships
- Local payment methods
- Compliance (GDPR, CCPA, etc.)
- Enterprise SLA support

---

## 🤝 Contributing

Contributions welcome! To contribute:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

MIT License - feel free to use this project commercially or personally.

---

## 🆘 Support

- **Issues:** GitHub Issues
- **Email:** support@cityevent.com (placeholder)
- **Docs:** [Coming Soon]

---

## 🎯 Competitive Advantages

**vs. Eventbrite:**
- Faster check-in with built-in QR scanner
- Modern, mobile-first design
- Lower fees for organizers (future)

**vs. Meetup:**
- More flexible event types
- Better organizer tools
- Real-time analytics

**vs. Ticketmaster:**
- No hidden fees
- Direct organizer-attendee relationship
- Open platform approach

---

## 📊 Performance Metrics (Target)

- **Page Load:** < 2 seconds
- **QR Scan Time:** < 1 second
- **API Response:** < 200ms
- **Uptime:** 99.9%
- **Mobile Score:** 95+ (Lighthouse)

---

## 🔒 Security

- JWT tokens with 7-day expiration
- Bcrypt password hashing (10 rounds)
- HTTPS enforced in production
- Rate limiting on API endpoints
- Input validation & sanitization
- CORS configuration

---

## 🏆 Credits

Built with ❤️ by the City Event Team

**Technologies:**
- React
- Node.js
- Express
- Vite
- QRCode.react
- html5-qrcode

---

**Ready to revolutionize event management?** 🚀

Start the app and create your first event!
