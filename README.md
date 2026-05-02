# 🍳 HomeChef — Artisan Marketplace

> A premium mobile marketplace connecting food lovers with talented home chefs in their neighborhood.

![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue)
![Framework](https://img.shields.io/badge/Framework-Expo%20SDK%2054-purple)
![Backend](https://img.shields.io/badge/Backend-Supabase-green)
![i18n](https://img.shields.io/badge/Languages-English%20%7C%20العربية-orange)

---

## ✨ Features

### For Customers
- 🏠 **Discover** nearby home chefs and daily specials
- 🗺️ **Map View** — browse chefs on an interactive map
- 🛒 **Cart & Checkout** — multi-chef orders in one checkout
- 📍 **Live Tracking** — real-time order status with map
- ⭐ **Reviews** — rate taste, packaging, accuracy
- ❤️ **Favorites** — save dishes and follow chefs
- 🔔 **Notifications** — real-time order & promo alerts

### For Chefs
- 📝 **Daily Posts** — publish specials with photos, prices, and quantity limits
- 📊 **Dashboard** — live earnings, order count, and ratings
- 🔄 **Order Management** — status flow: received → preparing → ready → delivered
- 💰 **Earnings** — daily/weekly/monthly breakdown with payout requests
- 🏪 **Kitchen Toggle** — open/close your kitchen with one tap

### Platform
- 💳 **Payments** — Stripe (card) + Cash on Delivery
- 🌍 **Bilingual** — English + Arabic (RTL support)
- ⚡ **Real-time** — live updates powered by Supabase Realtime
- 📱 **Cross-platform** — iOS, Android, and Web

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- npm or yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Supabase](https://supabase.com) account

### 1. Clone & Install
```bash
git clone <repo-url>
cd HomeChef
npm install
```

### 2. Set Up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:
   - `supabase/migration.sql` — Creates all tables, RLS, triggers
   - `supabase/payments.sql` — Payment & payout tables
   - `supabase/seed.sql` — Demo data (optional)

### 3. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run
```bash
# Web
npx expo start --web

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android
```

---

## 🏗️ Architecture

```
HomeChef/
├── app/                    # Expo Router screens (27 total)
│   ├── (auth)/            # Login, signup, onboarding
│   ├── (customer)/        # Home, search, cart, orders, profile
│   └── (chef)/            # Dashboard, orders, earnings, create post
├── components/            # Reusable UI components + MapView
├── lib/                   # API, storage, payments (with .native.ts)
├── stores/                # Zustand state management
├── hooks/                 # useTheme, useRealtime, useLanguage
├── i18n/                  # English + Arabic translations
├── constants/             # Design system tokens
└── supabase/              # SQL migrations, seed, Edge Functions
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + React Native |
| Routing | Expo Router (file-based) |
| State | Zustand |
| Backend | Supabase (PostgreSQL + Realtime + Storage) |
| Payments | Stripe React Native |
| Maps | react-native-maps (native) / styled fallback (web) |
| i18n | react-i18next + expo-localization |
| Fonts | Plus Jakarta Sans + Noto Serif |

---

## 💳 Payments Setup (Optional)

### Stripe
1. Get keys from [Stripe Dashboard](https://dashboard.stripe.com)
2. Add to `.env`: `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
3. Deploy Edge Functions:
```bash
supabase functions deploy create-payment-intent
supabase functions deploy refund-payment
```
4. Set Stripe secret key as Edge Function secret:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

---

## 🌍 Localization

The app supports **English** and **Arabic** with full RTL layout support.

- Language auto-detected from device settings
- Manual switching via Profile → Language
- 200+ translation keys covering all screens

---

## 📦 Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## 📄 License

MIT © HomeChef Team
