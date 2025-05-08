'use client'

import { useState, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { connection } from '../../utils/solana';
import { createTestTransaction } from '../../utils/transactions';

export default function PasskeyAuth() {
  const [isClient, setIsClient] = useState(false);
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [txSignature, setTxSignature] = useState('');
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
  
  // Handle message signing
  const handleSignMessage = async () => {
    if (!message || !wallet) {
      setError('Please enter a message and connect your wallet');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Convert message to Uint8Array
      const messageBytes = new TextEncoder().encode(message);
      
      // Sign the message
      let sig;
      if (typeof wallet.signMessage === 'function') {
        sig = await wallet.signMessage(messageBytes);
      } else if (wallet.wallet && typeof wallet.wallet.signMessage === 'function') {
        sig = await wallet.wallet.signMessage(messageBytes);
      } else {
        throw new Error("No message signing method found");
      }
      
      // Convert signature to hex string for display
      const sigHex = Buffer.from(sig).toString('hex');
      setSignature(sigHex);
    } catch (err) {
      setError('Signing failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle transaction signing
  const handleSignTransaction = async () => {
    if (!publicKey || !wallet) {
      setError('Please connect your wallet first');
      return;
    }
    
    setLoading(true);
    setError('');
    setTxSignature('');
    
    try {
      // Create a test transaction
      const transaction = await createTestTransaction(publicKey);
      
      // Sign the transaction
      let signedTx;
      try {
        if (typeof wallet.signTransaction === 'function') {
          signedTx = await wallet.signTransaction(transaction);
        } else if (wallet.wallet && typeof wallet.wallet.signTransaction === 'function') {
          signedTx = await wallet.wallet.signTransaction(transaction);
        } else if (wallet.signAllTransactions && typeof wallet.signAllTransactions === 'function') {
          const signedTxs = await wallet.signAllTransactions([transaction]);
          signedTx = signedTxs[0];
        } else {
          throw new Error("No transaction signing method found");
        }
      } catch (signError) {
        console.error("Failed to sign transaction:", signError);
        throw new Error(`Signing failed: ${signError.message}`);
      }
      
      // Send the signed transaction
      const txSig = await connection.sendRawTransaction(signedTx.serialize());
      
      setTxSignature(txSig);
    } catch (err) {
      setError('Transaction signing failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Not on client yet
  if (!isClient) {
    return <div>Loading authentication interface...</div>;
  }
  
  // Not connected
  if (!isConnected) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">Passkey Authentication</h2>
        <p className="mb-4">Please connect your wallet to use the authentication features.</p>
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
      <h2 className="text-xl font-bold mb-4">Passkey Authentication</h2>
      
      <div className="mb-4 p-4 bg-green-100 rounded">
        <p className="font-semibold">Connected with Passkey</p>
        <p className="text-sm break-all mt-1">{publicKey.toString()}</p>
      </div>
      
      {/* Message Signing */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Sign Message</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a message to sign"
          />
        </div>
        
        <button 
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
          onClick={handleSignMessage}
          disabled={loading}
        >
          {loading ? 'Signing...' : 'Sign Message'}
        </button>
        
        {signature && (
          <div className="p-4 bg-gray-100 rounded">
            <h4 className="font-semibold mb-1">Signature:</h4>
            <p className="text-xs break-all">{signature}</p>
          </div>
        )}
      </div>
      
      {/* Transaction Signing */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Sign Transaction</h3>
        <p className="text-sm mb-2">Sign a test transaction that sends a tiny amount of SOL to yourself.</p>
        
        <button 
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
          onClick={handleSignTransaction}
          disabled={loading}
        >
          {loading ? 'Signing...' : 'Sign Test Transaction'}
        </button>
        
        {txSignature && (
          <div className="p-4 bg-gray-100 rounded">
            <h4 className="font-semibold mb-1">Transaction Signature:</h4>
            <p className="text-xs break-all">{txSignature}</p>
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