# 🕵️ The Impostor (المحتال)

**The Impostor** is a thrilling social deduction web game designed for groups of 3 to 20 players. Inspired by classic games like "Spyfall" and "Undercover", it tests your ability to describe a secret word without giving it away to the hidden impostors among you!

## ✨ Key Features

- 🌍 **Multi-language Support**: Play in English, Arabic (RTL support), or French.
- 👥 **3-20 Players**: Perfect for small gatherings or large parties.
- 🛠️ **Configurable Settings**:
  - Choose from multiple categories (Food, Countries, Animals, Sports, etc.).
  - Adjust the number of impostors.
  - Optional timer for faster-paced rounds.
  - "Chaos Mode" for random impostor counts.
  - "Impostor Hint" to help the impostor blend in.
- 🌓 **Theme Support**: Seamlessly switch between Light and Dark modes.
- 🎨 **Premium UI/UX**: Built with smooth animations using Framer Motion and a modern "glassmorphism" aesthetic.
- 📱 **Mobile First**: Optimized for passing a single phone around the group.

## 🚀 Technologies Used

- **React** (Vite)
- **Tailwind CSS** for styling
- **Framer Motion** for premium animations
- **Lucide React** for icons
- **Next-themes** for light/dark mode
- **Sonner** for elegant toast notifications
- **i18next** inspired custom localization system

## 🎮 How to Play

1. **Setup**: Gather your friends (3-20 players), enter names, and choose your preferred categories and settings.
2. **The Reveal**: Pass the device around. Each player long-presses to reveal their role.
   - **Citizens**: Will see the "Secret Word".
   - **Impostors**: Will see "You are the Impostor" (and potentially a category hint).
3. **The Discussion**:
   - Each player takes turns saying exactly **one word or short phrase** related to the secret word.
   - Citizens must be vague enough to not tell the impostor the word, but clear enough to prove they know it.
   - Impostors must guess the word from others' descriptions and mimic them to blend in.
4. **Voting**: After the round, discuss who the impostor might be.
5. **The Result**: Cast your votes! If the group correctly identifies all impostors, the Citizens win. If the impostors manage to stay hidden or win the vote, they take the victory!

## 🛠️ Local Development

To run this project locally:

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Optional: configure the frontend socket server URL
cp .env.example .env.local

# Start the development server
npm run dev
```

### Frontend Environment Variables

The frontend reads these Vite env vars:

- `VITE_SOCKET_SERVER_URL`: Socket.IO server base URL used for online mode.

If `VITE_SOCKET_SERVER_URL` is not set, the frontend falls back to the current page hostname on port `3001`.

---
*Built with ❤️ for social fun.*

