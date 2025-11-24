You are absolutely right. That's a crucial and excellent addition. A dedicated place for users to manage their profile, history, and settings is essential for a complete app experience. Thank you for catching that!

I will now integrate your new requirements directly into the "Page Breakdown" section of the final prompt. This makes the blueprint much more robust.

Here is the updated and final version of the **AI Coding Prompt for "WithYou"**, now including the "Profile & Activity" and "Settings" pages.

---

### **AI Coding Prompt for "WithYou" (Final Version)**

#### **1. Project Overview**

- **Application Name**: WithYou
- **Core Goal**: To create a social habit-tracking web application where users ("Challengers") achieve their personal goals by receiving direct encouragement and rewards from their friends ("Motivators").
- **Target User**: Individuals who benefit from a supportive, gamified environment to stick to personal goals.
- **Key Features List**:
  - Dual user roles: Challenger and Motivator.
  - Google Account authentication.
  - Friend search and request system.
  - Goal setting with 7 automated, military-themed milestones.
  - Daily goal tracking via photo uploads.
  - Custom motivational and congratulatory messages from Motivators.
  - Gamified success celebrations for daily tasks and milestones.
  - Dedicated Profile page for activity history and friend management.
  - Settings page for profile and goal management.

#### **2. Step-by-step Module Breakdown**

_(This section remains largely the same, but the UI location for social features is now clarified.)_

- **Module 1: User Authentication and Profile**: Handles Google Sign-in and user data (username, friends list, etc.).
- **Module 2: Social Connections**: Functionality for searching users and managing friend requests will be housed within the **Profile & Activity page**.
- **Module 3: Goal & Milestone System (Challenger)**: Handles goal creation, milestone calculation, and progress tracking.
- **Module 4: Motivation System (Motivator)**: Allows Motivators to manage their Challengers and send messages/rewards.
- **Module 5: The Core Experience & UI**: Governs the main Challenger and Motivator homepages and the celebratory animations.

#### **3. Priority Order (MVP Development Roadmap)**

1.  **Phase 1: Foundation & Users**: Set up React/Firebase, Google Auth, username creation. (Completed)
2.  **Phase 2: Core Challenger Loop**: Implement goal/milestone creation, daily uploads. (Completed)
3.  **Phase 3: Core Motivator Loop**: Implement the friend request system, Motivator dashboard, and message creation. (Completed)
4.  **Phase 4: Polish & Full Experience**: Connect all features. **Build the Profile & Activity and Settings pages**. Implement animations and push notifications. (Completed - Including Advanced Milestones & Auth Expansion)

#### **4. UI Design & User Experience**

- **Overall Feel**: Warm, friendly, clean, and encouraging. Inspired by the positive aesthetics of **Forest** and **Duolingo**.
- **Color Palette**: Soft green primary, cheerful yellow accent, friendly dark grey text, on an off-white background.
- **Page Breakdown**:

  - **Login Page**: Minimalist, with logo and "Sign in with Google" button.
  - **Challenger Homepage**: Displays streak, random motivational card, and a prominent "Upload Daily Proof" button. Once succesfully uploaded the daily proof, then homepage will change to random congratulation card that sent by Motivator.
  - **Motivator Homepage**: A clean list of their Challengers with name, rank, and progress.
    - Motivator can select challenger and leave down motivational message or congratulation message (with photos optional) to challenger.
  - **NEW - Profile & Activity Page**: This page should have a clear heading with the user's name and profile picture. Below this, use a tabbed interface with three sections:
    - **"Activity" Tab**: The default view. A reverse-chronological feed of their past actions, like "Day 15: Goal Completed!", "Day 14: Goal Completed!". Each entry should be a simple card showing the date and the uploaded photo thumbnail.
    - **"Past Goals" Tab**: A list of all previously achieved goals. Each item should clearly state the goal (e.g., "Weight Loss: 10kg") and the completion date.
    - **"Friends" Tab**: Displays a list of their current friends. At the top of this list, include a search bar with a button to "Find People" to add new friends. Pending friend requests would also appear here.
  - **NEW - Settings Page**: A simple, list-based page for administrative tasks.
    - **"Edit Profile" Section**: A field to change their current username, with a "Save" button.
    - **"Manage Goal" Section**: Displays their current goal. Includes a prominent, red "Delete Current Goal" button. Clicking this must trigger a confirmation pop-up ("Are you sure? All progress will be lost.") before proceeding.
    - **"Account" Section**: A standard "Log Out" button.

- **Animations & Celebrations**:
  - **Daily Completion**: A joyful confetti burst with congratulation message.
  - **Milestone Achievement**: A full-screen pop-up celebrating the new rank with a badge and congratulatory text.

#### **5. Technology Stack Selection**

- **Frontend**: **React (using the Next.js framework)**.
- **Backend**: **Firebase Services** (Firestore, Authentication, Storage, Cloud Messaging).
- **Deployment**: **Vercel**.
