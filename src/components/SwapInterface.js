'use client'

import { useState, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { connection } from '../../utils/solana';
import { getTokenList, getQuote, getSwapTransaction } from '../../utils/jupiter';
import { Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

export default function SwapInterface() {
  // States
  const [isClient, setIsClient] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Initialize wallet hook
  const wallet = isClient ? useWallet(connection) : null;
  const isConnected = wallet?.isConnected;
  const publicKey = wallet?.publicKey;

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
    
    // Fetch token list on component mount
    const fetchTokens = async () => {
      const { tokens } = await getTokenList();
      setTokens(tokens);
      
      // Set default tokens (SOL and USDC on devnet)
      const sol = tokens.find(t => t.symbol === 'SOL');
      const usdc = tokens.find(t => t.symbol === 'USDC');
      
      if (sol) setFromToken(sol);
      if (usdc) setToToken(usdc);
    };
    
    fetchTokens();
  }, []);
  
  // Handle getting a quote
  const handleGetQuote = async () => {
    if (!fromToken || !toToken || !amount || amount <= 0) {
      setError('Please select tokens and enter a valid amount');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Convert amount to smallest unit (considering decimals)
      const amountInSmallestUnit = (parseFloat(amount) * 10 ** fromToken.decimals).toString();
      
      const quoteData = await getQuote(
        fromToken.address,
        toToken.address,
        amountInSmallestUnit
      );
      
      setQuote(quoteData);
    } catch (err) {
      setError('Failed to get quote: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle swap execution
  const handleSwap = async () => {
    if (!quote || !publicKey) {
      setError('Missing quote or wallet not connected');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Get serialized transaction
      const serializedTransaction = await getSwapTransaction(quote, publicKey);
      
      // Deserialize the transaction
      const swapTransaction = Transaction.from(
        Buffer.from(serializedTransaction, 'base64')
      );
      
      console.log('Transaction to sign:', swapTransaction);
      
      // Sign transaction with Passkey
      let signedTx;
      try {
        if (typeof wallet.signTransaction === 'function') {
          signedTx = await wallet.signTransaction(swapTransaction);
        } else if (wallet.wallet && typeof wallet.wallet.signTransaction === 'function') {
          signedTx = await wallet.wallet.signTransaction(swapTransaction);
        } else if (wallet.signAllTransactions && typeof wallet.signAllTransactions === 'function') {
          const signedTxs = await wallet.signAllTransactions([swapTransaction]);
          signedTx = signedTxs[0];
        } else {
          throw new Error("No transaction signing method found on wallet object");
        }
      } catch (signError) {
        console.error("Failed to sign transaction:", signError);
        throw new Error(`Signing failed: ${signError.message}`);
      }
      
      // Send the signed transaction
      const txSig = await connection.sendRawTransaction(signedTx.serialize());
      
      setSuccess(`Swap successful! Transaction ID: ${txSig}`);
      console.log('Swap complete:', txSig);
    } catch (err) {
      setError('Swap failed: ' + err.message);
      console.error('Swap error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Not on client yet
  if (!isClient) {
    return <div>Loading wallet interface...</div>;
  }
  
  // Not connected
  if (!isConnected) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">Token Swap</h2>
        <p className="mb-4">Please connect your wallet to use the swap interface.</p>
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
      <h2 className="text-xl font-bold mb-4">Token Swap</h2>
      
      {/* Token Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
        <select 
          className="w-full p-2 border rounded"
          value={fromToken?.address || ''}
          onChange={(e) => setFromToken(tokens.find(t => t.address === e.target.value))}
        >
          <option value="">Select token</option>
          {tokens.map(token => (
            <option key={token.address} value={token.address}>
              {token.symbol} - {token.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
        <select 
          className="w-full p-2 border rounded"
          value={toToken?.address || ''}
          onChange={(e) => setToToken(tokens.find(t => t.address === e.target.value))}
        >
          <option value="">Select token</option>
          {tokens.map(token => (
            <option key={token.address} value={token.address}>
              {token.symbol} - {token.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
        <input 
          type="number" 
          className="w-full p-2 border rounded"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          min="0"
        />
      </div>
      
      {/* Quote Button */}
      <button 
        className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4"
        onClick={handleGetQuote}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Get Quote'}
      </button>
      
      {/* Quote Info */}
      {quote && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Quote Details</h3>
          <p>In: {fromToken.symbol} {Number(amount).toLocaleString()}</p>
          <p>Out: {toToken.symbol} {(Number(quote.outAmount) / 10 ** toToken.decimals).toLocaleString()}</p>
          <p>Price Impact: {(quote.priceImpactPct * 100).toFixed(2)}%</p>
          
          <button 
            className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 mt-2"
            onClick={handleSwap}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Swap Tokens'}
          </button>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded mb-4">
          {success}
        </div>
      )}
    </div>
  );
}