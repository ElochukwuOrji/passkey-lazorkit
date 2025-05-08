'use client'

import { useState, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { connection } from '../../utils/solana';

export function usePasskey() {
  const [isClient, setIsClient] = useState(false);
  const wallet = isClient ? useWallet(connection) : null;
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return {
    wallet,
    isConnected: wallet?.isConnected || false,
    publicKey: wallet?.publicKey || null,
    connect: () => wallet?.connect(),
    disconnect: () => wallet?.disconnect(),
    signTransaction: async (transaction) => {
      if (!wallet) {
        throw new Error('Wallet not initialized');
      }
      
      // Handle different wallet implementations
      if (typeof wallet.signTransaction === 'function') {
        return await wallet.signTransaction(transaction);
      } else if (wallet.wallet && typeof wallet.wallet.signTransaction === 'function') {
        return await wallet.wallet.signTransaction(transaction);
      } else if (wallet.signAllTransactions && typeof wallet.signAllTransactions === 'function') {
        const signedTxs = await wallet.signAllTransactions([transaction]);
        return signedTxs[0];
      } else {
        throw new Error("No transaction signing method found");
      }
    }
  };
}