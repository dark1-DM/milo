# 🔧 Milo - API Bestanden Overzicht

## 📋 **Belangrijke Bestanden om Later te Bewerken**

### 🔑 **Backend Configuratie**
1. **`backend/.env`** - Database en Discord credentials
2. **`backend/config/passport.js`** - Discord OAuth2 setup
3. **`backend/index.js`** - Hoofdserver configuratie

### 🛣️ **API Routes (backend/routes/)**
1. **`auth.js`** - Discord login/logout systeem
2. **`dashboard.js`** - Server management en configuratie
3. **`admin.js`** - Admin panel functionaliteit  
4. **`bot.js`** - Discord bot commando's en events
5. **`payments.js`** - Premium abonnementen (Stripe)
6. **`tickets.js`** - Support ticket systeem
7. **`verification.js`** - Gebruiker verificatie
8. **`analytics.js`** - Statistieken en data
9. **`public.js`** - Publieke API endpoints

### 💾 **Database Models (backend/models/)**
1. **`User.js`** - Gebruiker data en permissions
2. **`Guild.js`** - Discord server configuraties
3. **`Ticket.js`** - Support tickets
4. **`Analytics.js`** - Statistiek data

### 🎨 **Frontend API Integratie**
1. **`frontend/src/contexts/AuthContext.tsx`** - Login state management
2. **`frontend/src/pages/dashboard/`** - Dashboard componenten die APIs aanroepen
3. **`frontend/.env`** - Frontend configuratie

## 🔧 **Wat Je Later Moet Configureren:**

### 1. **Discord Bot Setup**
```env
# In backend/.env
DISCORD_TOKEN=jouw_bot_token_hier
DISCORD_CLIENT_ID=jouw_discord_app_client_id  
DISCORD_CLIENT_SECRET=jouw_discord_app_client_secret
```

### 2. **Database Configuratie**
```env
# Al geconfigureerd in backend/.env
MONGODB_URI=mongodb+srv://kaspergamevip:kaspergamevip@cluster0.esaaoxr.mongodb.net/
```

### 3. **Belangrijke API Endpoints**
- ✅ `GET /api/health` - Server status (werkt al)
- 🔧 `GET /api/auth/discord` - Discord login
- 🔧 `GET /api/dashboard/guilds` - Gebruiker servers
- 🔧 `POST /api/payments/create` - Premium betalingen
- 🔧 `GET /api/tickets` - Support tickets

## 🎯 **Prioriteit Volgorde:**

### **Hoge Prioriteit:**
1. **Discord OAuth Setup** (`auth.js` + `passport.js`)
2. **Bot Token Configuratie** (`.env` + `bot.js`)  
3. **Dashboard APIs** (`dashboard.js`)

### **Gemiddelde Prioriteit:**
4. **Database Models aanpassen** (`models/`)
5. **Admin Panel** (`admin.js`)
6. **Ticket Systeem** (`tickets.js`)

### **Lage Prioriteit:**
7. **Payment Integration** (`payments.js`)
8. **Analytics** (`analytics.js`)
9. **Verification System** (`verification.js`)

## 📂 **Snelle Toegang Commands:**

```bash
# Backend bewerken
code backend/routes/auth.js
code backend/.env
code backend/config/passport.js

# Frontend bewerken  
code frontend/src/contexts/AuthContext.tsx
code frontend/.env
```

## 🚀 **Status Nu:**
- ✅ **Server Setup**: Compleet
- ✅ **Database**: Verbonden (MongoDB Atlas)
- ✅ **Frontend**: Draait op port 3000
- ✅ **Backend**: Draait op port 8000
- 🔧 **Discord Integration**: Nog te configureren
- 🔧 **API Logic**: Nog aan te passen

**Alle basis infrastructuur is klaar - je hoeft alleen nog de Discord credentials en business logic toe te voegen!** 🎉