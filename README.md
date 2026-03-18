# 🕵️ Kick the Impostor (اخرج المحتال)

**Kick the Impostor** is a premium, high-fidelity social deduction web game designed for groups of 3 to 20 players. Inspired by classics like "Spyfall" and "Undercover", it blends modern web aesthetics with thrilling gameplay to test your descriptive skills and intuition.

---

## ✨ High-Fidelity Features

### 🎮 Immersive Gameplay Mechanics
- 🌍 **Multi-language Support**: Fully localized in English, Arabic (with native RTL support), and French.
- 🌓 **Dynamic Theme Engine**: Seamlessly switch between Light and Dark modes with a circular "reveal" transition effect.
- 🎨 **Glassmorphism Aesthetic**: A modern, premium UI built with smooth animations using **Framer Motion**.
- 📱 **Mobile First**: Optimized for both passing a single phone around the group and individual online play.

### 🎭 Advanced Game Interactions
- 🖐️ **Hold-to-Reveal**: A secure role-reveal mechanic requiring a long press to prevent accidental word peeking.
- ⏳ **Circular Progress Timers**: High-visibility timers for speaking turns and discussion phases.
- 🎊 **Premium Celebrations**: Particle system celebrations and dynamic feedback for wins, losses, and role reveals.
- 📳 **Sensory Feedback**: Differentiated haptic feedback (vibrations) for various actions—strong for critical hits, subtle for routine clicks.

### 🌐 Robust Online Mode
- ☁️ **Real-Time Sync**: Powered by **Socket.io** for seamless multi-device play.
- 🗳️ **Advanced Voting**: Visual feedback for selected candidates, confirmation steps, and real-time voting status tracking.
- 👑 **Host Controls**: Centralized game management allowing the host to sync phases (reveal, discussion, voting) for all players.
- 🔄 **Resilient Connections**: Automatic reconnection logic and server-side validation to ensure game stability.

### 🛡️ Professional Infrastructure
- 🍞 **Custom Toast System**: A professional-grade notification system with auto-classification for success, errors, warnings, and loading states.
- 🚧 **Error Boundaries**: Robust React error boundaries to prevent app crashes and provide graceful recovery options.
- 🔍 **Safe Valdiation**: Comprehensive input sanitization and server-side checks for room codes, player names, and game settings.

---

## 🚀 Technologies Used

- **React (Vite)**: Core framework for high performance.
- **Tailwind CSS**: For the refined, responsive design system.
- **Framer Motion**: Powering premium micro-animations and transitions.
- **Socket.io**: Enabling low-latency online multiplayer.
- **Lucide React**: Crisp, modern iconography.
- **Canvas-Confetti**: For visual celebration effects.
- **Next-themes**: For robust dark mode management.

---

## 🎮 How to Play

1. **Host a Game**: Choose between **Local** (one phone) or **Online** (multiple devices).
2. **Configure**: Select categories (Food, Sports, Animals, etc.) and adjust settings like "Chaos Mode" or "Impostor Hint".
3. **The Reveal**: Pass the device or check your own. Use the **Hold-to-Reveal** button to see your secret word or your identity as the Impostor.
4. **The Discussion**: Describe the secret word using only one word or phrase.
5. **The Vote**: Discuss, debate, and cast your vote! Citizens win if they kick all impostors; Impostors win if they blend in and survive.

---

## 🛠️ Local Development

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### Setup
```sh
# Clone and install
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install

# Start development server
npm run dev

# (Optional) Start socket server for online testing
cd server
node index.js
```

### Advanced Configuration
The frontend automatically handles socket server discovery:
- It looks for `VITE_SOCKET_SERVER_URL` in environment variables.
- Defaults to `window.location.hostname:3001` for seamless local and LAN testing.

---

*Built with ❤️ for social fun and premium experiences.*
