import { PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

export const config = {
    hostname: process.env.HOST || '',
    port: process.env.PORT || '',
    rpc: process.env.RPC || '',
    messagesKey: process.env.MESSAGES_KEY || '',
    indexerApi: process.env.INDEXER_API || '',
    channel: process.env.ALEPH_CHANNEL || ''
}

export const BRICK_PROGRAM_ID = 'brick5uEiJqSkfuAvMtKmq7kiuEVmbjVMiigyV51GRF'
export const BRICK_PROGRAM_ID_PK = new PublicKey(BRICK_PROGRAM_ID)
