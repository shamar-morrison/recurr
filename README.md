# Recurr

Recurr is a comprehensive subscription tracking application built with React Native and Expo. It helps users manage their recurring expenses, get insights into their spending, and receive timely reminders for upcoming bills.

## Features

- **Subscription Management**: Add, edit, and track subscriptions with detailed billing cycles and payment methods.
- **Spending Insights**: Visual analytics and breakdowns of spending by category and total monthly/yearly costs.
- **Smart Reminders**: Customizable notifications to alert users before bills are due.
- **Categorization**: Organize subscriptions into categories for better organization.
- **Cloud Sync**: Secure data synchronization using Firebase.
- **Pro Features**: Premium features including unlimited subscriptions and advanced insights (managed via In-App Purchases).

## Technology Stack

### Core

- **Framework**: [Expo](https://expo.dev) (React Native)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Language**: TypeScript

### State Management & Data

- **Server State**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Backend/Db**: Firebase (Firestore, Auth, Functions)

### UI & Styling

- **Icons**: Phosphor React Native
- **Fonts**: Inter (via @expo-google-fonts)
- **Components**: Custom component library found in `src/components`

### Modules & Integrations

- **Authentication**: `react-native-google-auth`, Firebase Auth
- **Payments**: `react-native-iap`
- **Notifications**: `expo-notifications`
