import { Connection, PublicKey } from "@solana/web3.js";
import { config } from "../config";
import { createInitProductTreeTransaction } from "brick-protocol";

type InitProductTreeParams = {
    signer: string,
    marketplace: string, 
    paymentMint: string, 
    params: {
        id: string,
        productPrice: number,
        feeBasisPoints: number,
        height: number,
        buffer: number,
        canopy: number,
        name: string,
        metadataUrl: string
    }
}

export async function initProductTree(params: InitProductTreeParams) {
    try {
        if (!config.rpc) return new Response('Error: Server rpc not configured', { status: 500 });
        const connection = new Connection(config.rpc);
        const accounts = {
            signer: new PublicKey(params.signer),
            marketplace: new PublicKey(params.marketplace),
            paymentMint: new PublicKey(params.paymentMint)
        };
        const normalizeParams = {
            id: String(params.params.id),
            productPrice: Number(params.params.productPrice),
            feeBasisPoints: Number(params.params.feeBasisPoints),
            height: Number(params.params.height),
            buffer: Number(params.params.buffer),
            canopy: Number(params.params.canopy),
            name: String(params.params.name), 
            metadataUrl: String(params.params.metadataUrl),
        }
        const transaction = await createInitProductTreeTransaction(connection, accounts, normalizeParams);

        return Response.json({ transaction: Buffer.from(transaction.serialize()).toString('base64') }, { status: 200, headers: {
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'content-type': 'application/json' ,
        }});
    } catch (error) {
        console.log(error)
        return new Response('Internal Server Error', { status: 500 });
    }
}