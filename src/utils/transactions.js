import { 
  SystemProgram, 
  Transaction, 
  PublicKey,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
  createTransferInstruction, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction 
} from '@solana/spl-token';
import { connection } from './solana';

// Test transaction (already in your code)
export async function createTestTransaction(publicKey) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: publicKey, // sending to self for testing
      lamports: 100, // minimal amount
    })
  );
  
  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = publicKey;
  
  return transaction;
}

// SOL transfer transaction
export async function createSolTransferTransaction(fromPubkey, toPubkeyStr, amountSol) {
  const toPubkey = new PublicKey(toPubkeyStr);
  const lamports = amountSol * LAMPORTS_PER_SOL;
  
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    })
  );
  
  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;
  
  return transaction;
}

// SPL token transfer transaction
export async function createTokenTransferTransaction(
  fromPubkey, 
  toPubkeyStr, 
  tokenMintStr, 
  amount
) {
  const toPubkey = new PublicKey(toPubkeyStr);
  const tokenMint = new PublicKey(tokenMintStr);
  
  // Get token accounts for sender and receiver
  const fromTokenAccount = await getAssociatedTokenAddress(tokenMint, fromPubkey);
  const toTokenAccount = await getAssociatedTokenAddress(tokenMint, toPubkey);
  
  const transaction = new Transaction();
  
  // Check if receiver's token account exists, if not create it
  try {
    const accountInfo = await connection.getAccountInfo(toTokenAccount);
    if (!accountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey,
          toTokenAccount,
          toPubkey,
          tokenMint
        )
      );
    }
  } catch (error) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        fromPubkey,
        toTokenAccount,
        toPubkey,
        tokenMint
      )
    );
  }
  
  // Add transfer instruction
  transaction.add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      amount
    )
  );
  
  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;
  
  return transaction;
}