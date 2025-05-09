'use client'

import { useWallet } from '@lazorkit/wallet';
import { connection } from '../utils/solana';
import { 
  createTestTransaction, 
  createSolTransferTransaction,
  createTokenTransferTransaction 
} from '../utils/transactions';
import { 
  createMetaplexAdapter, 
  getMetaplex, 
  getCandyMachine,
  mintNFT 
} from '../utils/metaplex';
import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';

export default function Home() {
  const { connect, isConnected, publicKey, signMessage, executeTransaction } = useWallet(connection);
  
  // State management
  const [signature, setSignature] = useState('');
  const [txSignature, setTxSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionType, setTransactionType] = useState('test');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [tokenMint, setTokenMint] = useState('');
  const [candyMachineId, setCandyMachineId] = useState('');
  const [error, setError] = useState('');
  
  // Message signing
  const handleSign = async () => {
    const message = new TextEncoder().encode("Hello Passkeys!");
    const sig = await signMessage(message);
    setSignature(Buffer.from(sig).toString('hex'));
  };
  
  // Test transaction (original function)
  const handleSignTransaction = async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Create transaction
      const tx = await createTestTransaction(new PublicKey(publicKey));
      
      // 2. Execute transaction using Lazor Kit's executeTransaction
      const txSig = await executeTransaction({
        transaction: tx,
        // Add any other required parameters based on your Lazor Kit SDK
      });
      
      setTxSignature(txSig);
    } catch (err) {
      console.error("Transaction failed:", err);
      setError(`Transaction failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // SOL transfer
  const handleSolTransfer = async () => {
    if (!publicKey || !recipient || !amount) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Create SOL transfer transaction
      const tx = await createSolTransferTransaction(
        new PublicKey(publicKey),
        recipient,
        parseFloat(amount)
      );
      
      // 2. Execute transaction using Lazor Kit
      const txSig = await executeTransaction({
        transaction: tx,
        // You may need these parameters based on your Lazor Kit implementation
        // The exact parameters needed will depend on the Lazor Kit implementation
        arbitraryInstruction: tx.instructions[0],
        pubkey: new PublicKey(publicKey).toBuffer(),
        signature: Buffer.from([]), // This may need to be handled differently
        message: {
          nonce: 1,
          timestamp: new anchor.BN(Date.now()),
          payload: Buffer.from([]),
        },
        // Add any other required parameters
      });
      
      setTxSignature(txSig);
    } catch (err) {
      console.error("SOL transfer failed:", err);
      setError(`SOL transfer failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Token transfer
  const handleTokenTransfer = async () => {
    if (!publicKey || !recipient || !amount || !tokenMint) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Create token transfer transaction
      const tx = await createTokenTransferTransaction(
        new PublicKey(publicKey),
        recipient,
        tokenMint,
        parseFloat(amount)
      );
      
      // 2. Execute transaction using Lazor Kit
      const txSig = await executeTransaction({
        transaction: tx,
        // Add appropriate parameters similar to SOL transfer
        arbitraryInstruction: tx.instructions[0],
        pubkey: new PublicKey(publicKey).toBuffer(),
        signature: Buffer.from([]),
        message: {
          nonce: 1,
          timestamp: new anchor.BN(Date.now()),
          payload: Buffer.from([]),
        },
        // Add any other required parameters
      });
      
      setTxSignature(txSig);
    } catch (err) {
      console.error("Token transfer failed:", err);
      setError(`Token transfer failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // NFT mint from Candy Machine
  const handleMintNFT = async () => {
    if (!publicKey || !candyMachineId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create a wallet adapter for Metaplex that works with Lazor Kit
      const metaplexAdapter = createMetaplexAdapter(publicKey, executeTransaction);
      
      // Initialize Metaplex with our adapted wallet
      const metaplex = getMetaplex(metaplexAdapter);
      
      // Get the Candy Machine
      const candyMachine = await getCandyMachine(
        metaplex, 
        new PublicKey(candyMachineId)
      );
      
      // Mint NFT
      const nft = await mintNFT(metaplex, candyMachine);
      
      // Set the transaction signature
      // Note: The actual signature might be handled differently with Metaplex + Lazor Kit
      setTxSignature(nft.address.toString());
    } catch (err) {
      console.error("NFT minting failed:", err);
      setError(`NFT minting failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Determine which transaction function to call based on selected type
  const handleExecuteTransaction = async () => {
    switch (transactionType) {
      case 'test':
        await handleSignTransaction();
        break;
      case 'sol':
        await handleSolTransfer();
        break;
      case 'token':
        await handleTokenTransfer();
        break;
      case 'nft':
        await handleMintNFT();
        break;
      default:
        await handleSignTransaction();
    }
  };
  
  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Passkey Authentication</h1>
      
      {!isConnected ? (
        <button
          onClick={() => connect()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Connect with Passkey
        </button>
      ) : (
        <div className="space-y-4">
          <p>Connected: <code className="break-all">{publicKey.toString()}</code></p>
          
          {/* Transaction Type Selection */}
          <div className="space-y-2">
            <label className="block font-medium">Transaction Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTransactionType('test')}
                className={`px-4 py-2 rounded ${
                  transactionType === 'test' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Test Transaction
              </button>
              <button
                onClick={() => setTransactionType('sol')}
                className={`px-4 py-2 rounded ${
                  transactionType === 'sol' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                SOL Transfer
              </button>
              <button
                onClick={() => setTransactionType('token')}
                className={`px-4 py-2 rounded ${
                  transactionType === 'token' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Token Transfer
              </button>
              <button
                onClick={() => setTransactionType('nft')}
                className={`px-4 py-2 rounded ${
                  transactionType === 'nft' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Mint NFT
              </button>
            </div>
          </div>
          
          {/* Message Signing */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleSign}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Sign Message
            </button>
          </div>
          
          {/* Transaction Form Fields - SOL Transfer */}
          {transactionType === 'sol' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded">
              <div>
                <label className="block text-sm font-medium">Recipient Address</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Enter recipient Solana address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium">Amount (SOL)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="0.01"
                  step="0.000000001"
                />
              </div>
            </div>
          )}
          
          {/* Transaction Form Fields - Token Transfer */}
          {transactionType === 'token' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded">
              <div>
                <label className="block text-sm font-medium">Token Mint Address</label>
                <input
                  type="text"
                  value={tokenMint}
                  onChange={(e) => setTokenMint(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Enter token mint address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium">Recipient Address</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Enter recipient Solana address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="1"
                  step="0.000000001"
                />
              </div>
            </div>
          )}
          
          {/* Transaction Form Fields - NFT Minting */}
          {transactionType === 'nft' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded">
              <div>
                <label className="block text-sm font-medium">Candy Machine ID</label>
                <input
                  type="text"
                  value={candyMachineId}
                  onChange={(e) => setCandyMachineId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Enter Candy Machine address"
                />
              </div>
            </div>
          )}
          
          {/* Transaction Button */}
          <button
            onClick={handleExecuteTransaction}
            disabled={isLoading}
            className={`px-4 py-2 rounded ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            {isLoading ? 'Processing...' : 
              transactionType === 'test' ? 'Sign Test Transaction' :
              transactionType === 'sol' ? 'Send SOL' :
              transactionType === 'token' ? 'Send Tokens' :
              'Mint NFT'
            }
          </button>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Message Signature */}
      {signature && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Message Signature:</h3>
          <code className="break-all text-sm">{signature}</code>
        </div>
      )}
      
      {/* Transaction Signature */}
      {txSignature && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Transaction Signature:</h3>
          <code className="break-all text-sm">{txSignature}</code>
          <a 
            href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-blue-500 hover:underline"
          >
            View on Solana Explorer
          </a>
        </div>
      )}
    </main>
  );
}