import { Metaplex } from '@metaplex-foundation/js';
import { PublicKey } from '@solana/web3.js';
import { connection } from './solana';

// Create a wallet adapter for Metaplex that works with Lazor Kit
export function createMetaplexAdapter(publicKey, executeTransaction) {
  return {
    publicKey: new PublicKey(publicKey),
    async signTransaction(transaction) {
      // Since Lazor Kit doesn't have a direct signTransaction method,
      // we need to handle transactions differently
      
      // Make sure the transaction has the correct blockhash and fee payer
      if (!transaction.recentBlockhash) {
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
      }
      
      if (!transaction.feePayer) {
        transaction.feePayer = new PublicKey(publicKey);
      }
      
      // For Metaplex operations, we'll need to adapt the executeTransaction function
      // This is placeholder implementation that will need to be adapted to your needs
      await executeTransaction({
        transaction: transaction,
        // Add any other required parameters
      });
      
      return transaction;
    },
    async signAllTransactions(transactions) {
      return Promise.all(transactions.map(tx => this.signTransaction(tx)));
    },
  };
}

// Initialize Metaplex
export function getMetaplex(walletAdapter) {
  return Metaplex.make(connection).use(walletAdapter);
}

// Get Candy Machine by address
export async function getCandyMachine(metaplex, candyMachineAddress) {
  return await metaplex.candyMachines().findByAddress({
    address: candyMachineAddress,
  });
}

// Mint from Candy Machine
export async function mintNFT(metaplex, candyMachine) {
  try {
    const { nft } = await metaplex.candyMachines().mint({
      candyMachine,
    });
    
    return nft;
  } catch (error) {
    console.error('Failed to mint NFT:', error);
    throw error;
  }
}