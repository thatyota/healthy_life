<div align="center">

# 🥗 Healthy Life

**A social mobile app for sharing healthy recipes and connecting with people who love eating well.**

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

</div>

---

## 📖 About

Healthy Life is a full-stack social network built around healthy eating. Users can post recipes with photos, follow other people, like and comment, and get notified about activity. The app also includes a moderation system, with user reports and an admin panel, to keep the community safe.

The project is a monorepo with a **mobile app** (React Native / Expo) and a **REST API** (Node.js / Express), deployed on Vercel.

## ✨ Features

**For users**
- 🔐 Sign up and log in with email, **Google** or **Apple** (Clerk), with email verification and password recovery
- 📝 Create recipe posts (up to 280 characters) with an optional image
- ❤️ Like and 💬 comment on posts
- 👥 Follow users and search for people
- 🔔 Notifications for follows, likes, comments and moderator actions, with swipe-to-delete
- 👤 Editable profile with picture, banner, bio and location
- 🚩 Report posts, comments and users
- 🗑️ Account deactivation and reactivation with an email code
- 🌗 Light and dark theme

**For admins**
- 📊 Dashboard with stats (users, posts, comments, reports)
- 🛡️ Manage users: ban, timeout and unban
- 🧹 Remove posts and comments, with a reason sent to the author
- 🗂️ Moderation logs of every action
- 📬 Review and resolve reports

## 🧰 Tech Stack

| Area | Technologies |
| --- | --- |
| **Mobile** | React Native, Expo (Expo Router), TypeScript, NativeWind (Tailwind), TanStack Query, Axios |
| **Backend** | Node.js, Express 5, Mongoose, Multer |
| **Database** | MongoDB |
| **Auth** | Clerk (email, Google, Apple) |
| **Media** | Cloudinary |
| **Security** | Arcjet (shield, rate limiting, bot detection) |
| **Deployment** | Vercel |

## 📁 Project Structure

```
healthy_life/
├── backend/
│   └── src/
│       ├── config/        # DB, Cloudinary, Arcjet, env
│       ├── controllers/   # users, posts, comments, notifications, reports, admin
│       ├── middleware/    # auth, admin, upload, Arcjet
│       ├── models/        # User, Post, Comment, Notification, Report, ModerationLog
│       ├── routes/
│       └── server.js
└── mobile/
    ├── app/               # Expo Router screens: (auth), (tabs), (admin), post, profile
    ├── components/
    ├── hooks/             # React Query hooks (posts, comments, notifications, ...)
    └── utils/api.ts       # Axios client with Clerk token
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB database
- Accounts on [Clerk](https://clerk.com), [Cloudinary](https://cloudinary.com) and [Arcjet](https://arcjet.com)

### 1. Clone the repo
```bash
git clone https://github.com/thatyota/healthy_life.git
cd healthy_life
```

### 2. Backend
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=3000
NODE_ENV=development
MONGO_URI=
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ARCJET_KEY=
ADMIN_CODE=choose-a-long-random-value
```

Then start the server:
```bash
npm run dev
```

### 3. Mobile
```bash
cd mobile
npm install
```

Create a `.env` file in `mobile/`:
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

Point `API_BASE_URL` in `mobile/utils/api.ts` to your backend, then run:
```bash
npx expo start
```

Scan the QR code with **Expo Go**, or press `a` / `i` to open an Android or iOS emulator.

## 🔌 API Overview

| Route | Purpose |
| --- | --- |
| `/api/users` | Profiles, search, follow, account deactivation and reactivation |
| `/api/posts` | Feed, create, like and delete posts |
| `/api/comments` | Comments on posts |
| `/api/notifications` | List, mark as read and delete notifications |
| `/api/reports` | Create and list user reports |
| `/api/admin` | Stats, moderation and logs (admin only) |
| `/api/auth` | Sync Clerk users with MongoDB |

## 📸 Screenshots

<!-- Add your screenshots here, for example: -->
<!-- <img src="./assets/screenshots/home.png" width="220" /> -->

## 🗺️ Roadmap

- [ ] Add screenshots and a demo video
- [ ] Automated tests
- [ ] Publish to the Play Store

## 👤 Author

**David Nascimento** · [@thatyota](https://github.com/thatyota)
