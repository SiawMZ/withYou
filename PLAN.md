# WithYou - Project Implementation Plan

## **1. Project Overview**

- **Application Name**: WithYou
- **Core Goal**: A social habit-tracking web application where users (Challengers) achieve their personal goals by receiving direct encouragement and rewards from their friends (Motivators).
- **Target User**: Individuals who benefit from a supportive, gamified environment to stick to personal goals.
- **Status**: ✅ **FULLY IMPLEMENTED & DEPLOYED**
- **Live URL**: https://withyou-e9335.web.app

---

## **2. Implemented Features**

### ✅ **Authentication System**
- **Google Sign-In** with forced account selection
- **Email/Password Authentication** with sign-up and sign-in
- **Auto-redirect logic**:
  - Logged-in users with complete profiles → `/challenger`
  - Logged-in users with incomplete profiles → `/onboarding`
  - Logged-out users → Landing page
- **Protected routes** using `withAuth` HOC
- **Profile completeness checking** (username + role validation)

### ✅ **User Roles & Onboarding**
- **Dual Roles**: Users can be both Challenger AND Motivator
- **Onboarding Flow**: New users select username and role on first login
- **Profile Creation**: Automatic user document creation with merge strategy

### ✅ **Goal & Milestone System (Challenger)**
- **Goal Creation**: Custom goal name and description
- **7 Customizable Milestones**: Users can edit milestone descriptions
- **Milestone Completion**: Click to mark milestones as complete
- **Goal Completion**: Automatic detection when all 7 milestones are done
- **Daily Proof Upload**: Photo upload to Firebase Storage for daily goal completion
- **History Tracking**: All daily completions stored with timestamps and images
- **Past Goals Archive**: Completed goals automatically moved to pastGoals subcollection
- **Rank System**: Based on consecutive days completed
  - Seedling (1 day)
  - Sprout (3 days)
  - Sapling (7 days)
  - Tree (14 days)
  - Forest (30 days)
  - Guardian (60 days)
  - Ancient (90 days)

### ✅ **Motivation System (Motivator)**
- **Friend Management**: View list of Challengers (friends)
- **Daily Motivations**: Send morning motivation messages with custom images
- **Congratulations Messages**: Send celebration messages when Challenger completes daily goal
- **Multiple Messages Per Day**: Support for sending multiple motivations/congratulations
- **Auto-categorization**: System detects if goal is completed today and shows appropriate message type
- **Image Uploads**: Motivators can upload custom images with messages
- **AI Image Generation**: Integrated image generation for motivation/congratulation images (optional)

### ✅ **Social Features**
- **Friend Search**: Search users by username
- **Friend Request System**: Send, accept, and decline friend requests
- **Friend List**: Display all friends with usernames (not UIDs)
- **Bidirectional Friendship**: Friendship stored in both users' friend subcollections
- **Real-time Updates**: Friend requests and friend list update via Firestore onSnapshot

### ✅ **Profile & Activity Page**
Tabbed interface with 4 sections:

1. **Activity Tab** (Default):
   - Reverse-chronological feed of completed daily goals
   - Each card shows: Date, uploaded proof image, goal completion badge
   - **Delete functionality**: Remove individual activity items
   - Displays activities from both current goal and past goals

2. **Memories Tab**:
   - Collection of saved motivations/congratulations
   - Heart/save button on motivation cards to add to memories
   - Displays message text, image, type badge, and date
   - Beautiful card layout with image overlay

3. **Past Goals Tab**:
   - Current goal (if exists) shown with "Active" badge
   - List of all archived/completed goals
   - Shows goal name, completion date, and status
   - **Delete functionality**: Remove past goals permanently

4. **Friends Tab**:
   - **My Friends**: List of current friends with avatars
   - **Friend Requests**: Pending incoming requests with Accept/Decline buttons
   - **Find Friends**: Search bar to discover and add new friends

### ✅ **Settings Page**
- **Profile Information**: Display current username and email
- **Edit Username**: (Currently view-only, can be extended)
- **Manage Goal**: View current goal details
- **Logout**: Sign out functionality

### ✅ **Notifications System**
- **Friend Activity Notifications**: When friends complete daily goals or entire goals
- **Notification Types**:
  - `daily_completion`: Friend completed their daily goal
  - `goal_completion`: Friend completed their entire goal
- **Notification Display**: Shows friend name, message, and read/unread status
- **Real-time Updates**: Firestore listeners for instant notification delivery

---

## **3. UI/UX Design**

### **Design Philosophy**
- **Overall Feel**: Warm, friendly, clean, and encouraging
- **Inspiration**: Forest app + Duolingo + Modern glassmorphism
- **Accessibility**: Responsive design, mobile-friendly, smooth animations

### **Color Palette**
```css
--color-primary: #4CAF50 (Soft Green)
--color-secondary: #FFF9E5 (Cream)
--color-accent: #66BB6A (Bright Green)
--color-highlight: #E8F5E9 (Light Green)
--color-text: #2E3A23 (Dark Green-Grey)
```

### **Design System**
- **Glass Panels**: Backdrop blur with white/60% opacity
- **Rounded Corners**: Border-radius of 2xl (1rem) to 3xl (1.5rem)
- **Hover Effects**: Scale transforms, shadow enhancements
- **Smooth Transitions**: 300ms ease-in-out on all interactive elements
- **Gradient Overlays**: Black gradients on images for text readability

### **Page Breakdown**

#### **Landing Page** (`/`)
- Minimalist welcome screen
- "Welcome to WithYou" heading with tagline
- "Sign in with Google" and "Email Sign In" buttons
- Auto-redirects authenticated users

#### **Onboarding Page** (`/onboarding`)
- Username input (with validation)
- Role selection: Challenger or Motivator
- Clean card-based form
- Auto-redirect if profile is already complete

#### **Challenger Homepage** (`/challenger`)
**Header Section**:
- Goal name as page title
- Current rank badge (with icon and day count)
- Milestone progress bar (visual icons for 7 milestones)

**Main Content**:
- **Before Daily Completion**:
  - Large motivation card with image
  - Message from Motivator friend
  - Rotating carousel if multiple motivations (16s interval)
  - Heart icon to save motivation to memories
  
- **After Daily Completion**:
  - Congratulations card with image
  - Celebration message from Motivator
  - "See you tomorrow!" message

**Upload Section**:
- Floating circular upload button (green, with glow effect)
- File picker for image selection
- "Upload Proof" button appears after file selection
- Confetti animation on successful upload

**Goal Completion State**:
- Full-screen celebration with cat image
- "Mission Accomplished!" message
- Goal name display
- "Start New Mission" button

#### **Motivator Homepage** (`/motivator`)
- **Challengers List**: Card-based grid of all Challenger friends
- Each card shows:
  - Friend's username
  - Profile picture/avatar
  - "Send Motivation" button
  - Current streak/rank

**Motivation Modal**:
- Tab switching: "Morning Motivation" / "Congratulations"
- Text input for message
- Image upload option
- "Generate Image" button (AI integration)
- Preview of message
- Send button

#### **Profile & Activity Page** (`/profile`)
- **Header**: "Profile & Activity" title
- **Tabbed Navigation**: 
  - Activity | Memories | Past Goals | Friends
  - Active tab highlighted with green underline
  - Smooth tab transitions

**Activity Tab**:
- Grid layout (3 columns on desktop, responsive)
- Image cards with:
  - Proof photo
  - Date completed
  - "Goal Completed" badge
  - Delete button (appears on hover)

**Memories Tab**:
- Grid of saved motivation cards
- Large image with text overlay
- Badge showing type (Motivation/Congrats)
- Date stamp
- Hover zoom effect

**Past Goals Tab**:
- Current goal card (if exists) with green accent
- Archived goals list with:
  - Goal name
  - Completion date
  - "Archived" badge
  - Delete button (hover)

**Friends Tab**:
- Split layout:
  - Left: My Friends list + Friend Requests
  - Right: Find Friends search
- Friend avatars with initials
- Search bar with real-time results
- "Add Friend" buttons

#### **Settings Page** (`/settings`)
- Simple list-based layout
- Sections:
  - **Profile**: Username and email display
  - **Account**: Logout button
- Clean, minimal design
- Future: Goal management, theme settings

### **Animations & Celebrations**

#### **Confetti Animation**
- **Trigger**: Daily goal completion
- **Duration**: 5 seconds
- **Effect**: Colorful confetti particles falling from top
- **Implementation**: Custom Confetti component

#### **Milestone Popup**
- **Trigger**: Reaching rank milestones (1, 3, 7, 14, 30, 60, 90 days)
- **Design**: Full-screen overlay with badge
- **Content**: 
  - "New Rank Unlocked!" message
  - Rank name (e.g., "Sprout")
  - Trophy/icon
  - "Keep Growing!" encouragement
- **Interaction**: Click anywhere to close

#### **Page Transitions**
- **Library**: Framer Motion
- **Effect**: Slide and fade (15px horizontal shift)
- **Duration**: 150ms
- **Easing**: Custom bezier curve [0.22, 1, 0.36, 1]

#### **Micro-interactions**
- Button hover: Scale 105% + shadow
- Card hover: Slight lift + shadow enhancement
- Input focus: Green ring animation
- Image hover: Scale 110% in containers

### **Navigation**

#### **Desktop Header**
- Fixed top bar with glassmorphism
- Centered pill-shaped navbar
- Links: Challenger | Motivator | Profile | Settings
- Sign In/Out button on right
- Hover effects on all links

#### **Mobile Navigation**
- Top bar with "WithYou" logo
- Hamburger menu button
- Dropdown menu with all navigation links
- Smooth slide-down animation

---

## **4. Technology Stack**

### **Frontend**
- ✅ **Framework**: Next.js 15 (App Router)
- ✅ **Language**: TypeScript + JavaScript (mixed)
- ✅ **Styling**: Vanilla CSS with CSS Variables
- ✅ **Animations**: Framer Motion
- ✅ **Image Handling**: Next.js Image component with unoptimized mode

### **Backend & Services**
- ✅ **Authentication**: Firebase Auth (Google + Email/Password)
- ✅ **Database**: Cloud Firestore (NoSQL)
- ✅ **Storage**: Firebase Storage (image uploads)
- ✅ **Hosting**: Firebase Hosting
- ✅ **Security**: Firestore Security Rules + Storage Rules

### **Development & Deployment**
- ✅ **Build**: Static Export (`output: 'export'`)
- ✅ **Environment Variables**: `.env.local` (gitignored)
- ✅ **Version Control**: Git + GitHub
- ✅ **Package Manager**: npm
- ✅ **Deployment Command**: `npm run build && firebase deploy --only hosting`

---

## **5. Database Schema**

### **Firestore Structure**

```
users/
  {userId}/
    - uid: string
    - email: string
    - username: string
    - role: "challenger" | "motivator"
    - photoURL: string
    - createdAt: timestamp
    
    friends/ (subcollection)
      {friendId}/
        - friend: true
    
goals/
  {userId}/
    - name: string
    - description: string
    - createdAt: timestamp
    - lastCompleted: timestamp
    - status: "active" | "completed"
    - completedAt: timestamp (optional)
    - history: array<{date: timestamp, url: string}>
    - milestones: array<{id: number, description: string, completed: boolean}>
    
    pastGoals/ (subcollection)
      {goalId}/
        - (same as goal structure)
        - archivedAt: timestamp
        - status: "completed" | "abandoned"

friendRequests/
  {requestId}/
    - from: userId
    - to: userId
    - status: "pending" | "accepted" | "declined"

motivations/
  {motivationId}/
    - from: userId (motivator)
    - to: userId (challenger)
    - date: string (YYYY-MM-DD)
    - type: "motivation" | "congrats"
    - motivationMessage: string
    - motivationImageUrl: string
    - congratsMessage: string
    - congratsImageUrl: string
    - saved: boolean
    - createdAt: timestamp

notifications/
  {notificationId}/
    - to: userId
    - from: userId
    - fromName: string
    - type: "daily_completion" | "goal_completion"
    - message: string
    - read: boolean
    - createdAt: timestamp
```

---

## **6. Security Implementation**

### **Firestore Security Rules**
- Users can only read/write their own user document
- Users can only write to their own goals
- Users can read goals of their friends
- Friend requests: users can create if they're the sender, read/update if they're the recipient
- Motivations: motivators can write, challengers can update (for saving)
- Notifications: users can only read their own notifications

### **Storage Security Rules**
- Authenticated users can upload to `proofs/{userId}/` only
- File size limit: 5MB
- Allowed types: Images only (image/*)

### **Environment Variables**
- ✅ Firebase config moved to `.env.local`
- ✅ `.env.example` template created for developers
- ✅ All sensitive data excluded from git

---

## **7. Current Limitations & Future Enhancements**

### **Known Limitations**
- ⚠️ No username editing functionality in Settings (display only)
- ⚠️ No goal deletion from Settings page
- ⚠️ Persistent lint errors in `app/challenger/page.tsx` (doesn't affect build)
- ⚠️ No push notifications (only in-app notifications)
- ⚠️ No search filters (only exact username match)

### **Potential Future Features**
- 🔮 **Push Notifications**: Firebase Cloud Messaging integration
- 🔮 **Dark Mode**: Theme switcher in Settings
- 🔮 **Goal Templates**: Pre-defined goal categories
- 🔮 **Leaderboards**: Friend ranking by streaks
- 🔮 **Badges/Achievements**: Special rewards for unique accomplishments
- 🔮 **Goal Sharing**: Share achievements to social media
- 🔮 **Calendar View**: Month view of completed days
- 🔮 **Statistics**: Charts and graphs of progress
- 🔮 **Multi-language Support**: i18n implementation
- 🔮 **Profile Pictures**: Custom avatar uploads
- 🔮 **Bio/Description**: Personal profile descriptions
- 🔮 **Private/Public Goals**: Control goal visibility

---

## **8. Development Best Practices Used**

✅ **Component Reusability**: Shared components like `Header`, `withAuth`, `PageTransition`
✅ **Error Handling**: Try-catch blocks with user-friendly error messages
✅ **Loading States**: Loading indicators during async operations
✅ **Optimistic UI**: Immediate feedback before server confirmation
✅ **Real-time Sync**: Firestore listeners for live data updates
✅ **Code Organization**: Logical folder structure (app/, components/, lib/, context/)
✅ **Type Safety**: TypeScript interfaces for data structures
✅ **Security First**: Protected routes, validated inputs, secure rules
✅ **Responsive Design**: Mobile-first approach with breakpoints
✅ **Performance**: Image optimization, lazy loading, code splitting
✅ **Git Workflow**: Meaningful commits, feature branches (when needed)
✅ **Documentation**: README, env.example, inline comments

---

## **9. Deployment Information**

### **Production Environment**
- **URL**: https://withyou-e9335.web.app
- **Firebase Project**: withyou-e9335
- **Region**: Default (us-central)
- **Build Command**: `npm run build`
- **Deploy Command**: `firebase deploy --only hosting`

### **Build Configuration**
```javascript
// next.config.ts
{
  output: 'export',
  images: { unoptimized: true },
  // Firebase Storage remote patterns allowed
}
```

### **Cache Strategy**
- HTML files: No cache (always fetch latest)
- JS/CSS: Long cache with content hashing
- Images: CDN caching enabled

---

## **10. Maintenance & Support**

### **Monitoring**
- Firebase Console for analytics
- Firestore usage monitoring
- Storage usage tracking
- Authentication metrics

### **Backup Strategy**
- Code: GitHub repository backup
- Database: Firestore automatic backups
- Environment: `.env.local` stored securely offline

### **Update Workflow**
1. Make changes locally
2. Test with `npm run dev`
3. Build with `npm run build`
4. Deploy with `firebase deploy --only hosting`
5. Commit and push to GitHub

---

**Last Updated**: November 24, 2024
**Version**: 1.0.0 (Production)
**Maintainer**: SiawMZ
