import { Metaplex } from '@metaplex-foundation/js';
import { PublicKey } from '@solana/web3.js';
import { connection } from './solana';

// Create a wallet adapter for Metaplex that works with Lazor Kit
export function createMetaplexAdapter(publicKey, executeTransaction) {
  return {
    publicKey: new PublicKey(publicKey),
    async signTransaction(transaction) {
     const { blockhash } = await connection.getLatestBlockhash();
     transaction.recentBlockhash = blockhash;
     transaction.feePayer = new PublicKey(this.publicKey);

  // LazorKit executes transaction — but Metaplex expects the transaction signed locally
     const txSig = await executeTransaction({
     transaction,
     pubkey: new PublicKey(this.publicKey).toBuffer(),
     arbitraryInstruction: transaction.instructions[0], // or something more dynamic
     signature: Buffer.from([]), // Adjust if needed
     message: {
      nonce: 1,
      timestamp: new anchor.BN(Date.now()),
      payload: Buffer.from([]),
      },
     });

  // Metaplex just expects the transaction returned here — the tx itself won't include the signature
  // So we return it untouched (even though it's technically not "signed")
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