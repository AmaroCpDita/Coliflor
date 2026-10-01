# Coliflor 🥦💛

Coliflor is a romantic, private Web Application (PWA-ready) designed as a shared digital space exclusively for couples. It functions as a digital diary, organizer, and memory box, all wrapped in a premium, highly aesthetic "glassmorphism" UI with dark and light modes.

It was originally created as a personal project, but is designed to be easily white-labeled and used by any couple. 

## ✨ Key Features

- **Home/Dashboard**: A customizable hero image (uploadable by the couple) with a real-time counter showing how many days they've been together, and a shared space for daily sweet notes.
- **Nuestro Mapa (Our Map)**: An interactive Mapbox map where the couple can drop "pins" of their favorite places or first dates. Features custom scaling emojis.
- **Agenda & Recuerdos**: A shared intelligent calendar that automatically marks both partners' birthdays and anniversaries, and tracks special events.
- **Metas / Bucket List**: A shared list for future plans and goals.
- **Racha de Fotos**: A daily photo streak to capture memories every day.
- **Quiz de Sintonía**: Fun mini-games to test how well the couple knows each other.
- **Chat Secreto**: A private messaging system with realtime push notifications (powered by Supabase real-time channels and OneSignal).
- **Settings/Customization**: Personalizable partner names, nicknames, and profile settings.

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + TypeScript
- **Styling**: Plain CSS focusing on maximum visual detail (glassmorphism, CSS variables, flex/grid layouts) and native-like mobile aesthetics.
- **Backend/DB**: Supabase (PostgreSQL), Auth, Realtime database, and Storage for images.
- **Maps**: Mapbox GL JS.
- **Notifications**: OneSignal & Supabase Realtime.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- A [Supabase](https://supabase.com/) project
- A [Mapbox](https://www.mapbox.com/) access token
- (Optional) A [OneSignal](https://onesignal.com/) App ID for Push Notifications

### Environment Variables

Copy the `.env.example` file to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Setup your database by running the migrations located in `supabase/migrations/` in your Supabase SQL Editor.

3. Start the development server:

```bash
npm run dev
```

## 📸 Screenshots

*(Add your screenshots here)*

## 📄 License

This project is licensed under the MIT License.
