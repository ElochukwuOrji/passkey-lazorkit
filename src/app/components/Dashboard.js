'use client'

import { useState, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { connection } from '../../utils/solana';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Initialize wallet
  const wallet = isClient ? useWallet(connection) : null;
  const isConnected = wallet?.isConnected;
  const publicKey = wallet?.publicKey;
  
  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Fetch balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return;
      
      try {
        setLoading(true);
        const balanceInLamports = await connection.getBalance(publicKey);
        setBalance(balanceInLamports / LAMPORTS_PER_SOL);
      } catch (err) {
        setError('Failed to fetch balance: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (isConnected) {
      fetchBalance();
    }
  }, [isConnected, publicKey]);
  
  // Not on client yet
  if (!isClient) {
    return <div>Loading dashboard...</div>;
  }
  
  // Not connected
  if (!isConnected) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">Dashboard</h2>
        <p className="mb-4">Please connect your wallet to view your dashboard.</p>
        <button 
          onClick={() => wallet.connect()}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Connect with Passkey
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Dashboard</h2>
      
      <div className="mb-4 p-4 bg-green-100 rounded">
        <p className="font-semibold">Connected with Passkey</p>
        <p className="text-sm break-all mt-1">{publicKey.toString()}</p>
      </div>
      
      {/* Balance */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Wallet Balance</h3>
        {loading ? (
          <p>Loading balance...</p>
        ) : (
          <div className="p-4 bg-gray-100 rounded">
            <p className="text-2xl font-bold">{balance !== null ? balance.toFixed(4) : '0'} SOL</p>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
          {error}
        </div>
      )}
    </div>
  );
}