# OKN User Dashboard (Standalone)

Standalone, zero-backend-dependency Next.js dashboard application for the **$OKN Token Ecosystem** (Portfolio, Referral Program, Polymarket AI Agent, Tasks, Claim, Buy, Missions, Leaderboard, and Settings).

Engineered for 1-click deployment on **Vercel** with full creative freedom and responsive mobile-first polish.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run development server (runs on port 3000)
npm run dev

# 3. Or test production build locally:
npm run build
npm run start
```

Visit [http://localhost:3000](http://localhost:3000) to view the live dashboard.

---

## ⚡ 1-Click Vercel Deployment

1. Push this folder to a GitHub repository or import it directly into Vercel.
2. Select framework **Next.js**.
3. **No required environment variables to boot**: Sensible defaults and fallback contract addresses are baked into `next.config.ts`.
4. Hit **Deploy** — builds and deploys cleanly in under 2 minutes.

### Optional Production Environment Variables:
```env
NEXT_PUBLIC_APP_URL=https://app.okntoken.com
NEXT_PUBLIC_BOT_USERNAME=okntest001_bot
NEXT_PUBLIC_BSC_CHAIN_ID=56
NEXT_PUBLIC_BSC_EXPLORER=https://bscscan.com
NEXT_PUBLIC_OKN_TOKEN_ADDRESS=0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377
NEXT_PUBLIC_TOKEN_SALE_ADDRESS=0x46fC09a84C23c94Ea6853450253C050be44dB751
NEXT_PUBLIC_MERKLE_DISTRIBUTOR_ADDRESS=0xC0e7a1cEB339B7a35Af81D2AE7705f7d8456C4a9
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

---

## 🎨 UI/UX Features & Design Polish

- **Vibrant Purple Quick Actions**: 4 quick actions (`Tasks`, `Claim`, `Buy`, `Invite`) on `#7A12F5` purple background with pure white icons (`stroke-white`), glowing circular badges (`bg-white/20`), and bold white typography.
- **Active Navigation Styling**: Desktop sidebar items and mobile bottom navigation pills feature `#7A12F5` backgrounds with crisp `#FFFFFF` icons and text in both light and dark mode.
- **Referral Page**: Complete partner package cards (10–15% commission, \$200,000 marketing budget, 12 mo token vesting), unique referral link generator, 3-tier commission breakdown, real-time leaderboard, and FAQ.
- **Polymarket AI Agent**: Prediction market intelligence tabs (`Agent`, `Copier`, `Funds`) with conviction scoring and responsive positioning previews.
- **Flawless Dark & Light Modes**: Seamless theme toggling with zero flash and persistence.
- **Zero Auto-Refresh Bug**: Network requests and Web3Modal fallbacks patched to prevent browser reload loops.

---

## 📂 Project Structure

```
okn-dashboard/
├── messages/             # Multi-language translation catalogs (en, es, fr, zh, etc.)
├── public/               # Static brand assets, tokens, icons, and logos
├── src/
│   ├── app/
│   │   ├── [locale]/app/ # User Dashboard routes (portfolio, referral, tasks, etc.)
│   │   ├── api/          # Lightweight mock API routes (me, referral, tasks, claims)
│   │   ├── layout.tsx    # Root HTML layout with ThemeProvider and Toaster
│   │   └── proxy.ts      # Edge routing & locale negotiation
│   ├── components/
│   │   ├── dashboard/    # Overview, activity, daily check-in, holdings, buy widget
│   │   ├── layout/       # AppShell, sidebar, bottom navigation, area theme
│   │   ├── polymarket-agent/ # Polymarket agent & copier components
│   │   ├── providers/    # AppKit, Wagmi, and Theme providers
│   │   └── ui/           # Radix & Tailwind UI primitives
│   ├── config/           # AppKit and Wagmi configurations
│   ├── i18n/             # next-intl routing, request, and navigation setup
│   ├── lib/              # Utility functions, hooks, price math, and auth guards
│   ├── shared/           # Standalone ABIs, constants, types, and schemas
│   └── styles/           # globals.css & responsive.css
├── next.config.ts        # Next.js bundler config with Webpack aliases & rewrites
├── vercel.json           # Vercel deployment specification
└── package.json          # Clean, self-contained dependencies
```
