# ⚡ Solana dApp with Next.js + Lazor Kit

This project is a full-stack Solana dApp built with **Next.js** and integrated with **Lazor Kit** for wallet connectivity. It supports:

- ✅ Test transactions
- ✅ SOL transfers
- ✅ SPL token transfers
- ✅ NFT minting from a Candy Machine (Metaplex v2)

---

## 📦 Tech Stack

- [Next.js 13+ (App Router)](https://nextjs.org/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [@solana/spl-token](https://github.com/solana-labs/solana-program-library)
- [@metaplex-foundation/js](https://docs.metaplex.com/)
- [Lazor Kit](https://github.com/lazorhq/lazor-kit)

---

## 🚀 Getting Started

### 1. Clone the repository**


git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

### 2. Install dependencies

npm install
# or
yarn install

### 3. Set up environment variables

**Create a .env.local file:**
touch .env.local

**Add your environment-specific settings. For example:**

NEXT_PUBLIC_CANDY_MACHINE_ID=YOUR_CANDY_MACHINE_ID

**🧪 Testing Locally**
Start the dev server

npm run dev
# or
yarn dev

Navigate to http://localhost:3000 to see the app.

**Run test transaction**
1. Connect your wallet (via Lazor Kit).

2. Trigger the test transaction (transfers a small amount of SOL to self).

3. Check devnet explorer for confirmation.

**🧬 Folder Structure**

``bash
/
├── app/               # Next.js app directory (App Router)
│   └── page.jsx       # Main landing page
├── lib/
│   ├── solana.js      # Connection to Solana
│   ├── transactions.js # SOL + token transfer utils
│   └── metaplex.js     # Metaplex + NFT minting
├── public/            # Static assets
├── .env.local         # Local environment variables
├── package.json
└── README.md
``bash

**🧾 Deployment on Vercel**
Vercel is the recommended deployment platform for Next.js apps.

**1. Push code to GitHub**
Ensure your latest changes are committed:

git add .
git commit -m "Ready for deployment"
git push origin main

**2. Deploy via Vercel**
Go to https://vercel.com/new

Select your GitHub repository

Add environment variables (NEXT_PUBLIC_CANDY_MACHINE_ID, etc.)

Click Deploy

**3. Fixing SSR issues (e.g., localStorage error)**
Ensure browser-only APIs like localStorage or window are only used inside useEffect and client components:

'use client';

import { useEffect, useState } from 'react';

export default function Page() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
  }, []);

  return <div>{token}</div>;
}

**🛠️ Debugging Tips**
localStorage is not defined: Move all usage into useEffect.

TypeError: Cannot read properties of null: Make sure wallet is connected before calling transactions.

Use Solana Explorer (devnet) to trace transactions.

**🎉 Credits**
Solana Labs

Metaplex

Lazor Kit

Next.js

**📜 License**
MIT License.
