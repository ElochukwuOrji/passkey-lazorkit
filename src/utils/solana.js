import { Connection, clusterApiUrl } from '@solana/web3.js';

// Choose network: 'devnet', 'testnet', or 'mainnet-beta'
export const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');