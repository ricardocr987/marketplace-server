import { createInitProductTreeTransaction } from "brick-protocol";
import { Connection, PublicKey } from "@solana/web3.js";
import { createJsonResponse } from "../../utils";
import { config } from "../../config";

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
    console.log('initProductTree starts');

    try {
        if (!config.RPC) {
            return createJsonResponse({ message: 'Error: Server rpc not configured' }, 500);
        }

        const connection = new Connection(config.RPC);
        const accounts = {
            signer: new PublicKey(params.signer),
            marketplace: new PublicKey(params.marketplace),
            paymentMint: new PublicKey(params.paymentMint)
        };

        const transaction = await createInitProductTreeTransaction(connection, accounts, params.params);
        const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');
        console.log('Serialized transaction ', serializedTransaction);

        return createJsonResponse({ message: serializedTransaction });
    } catch (error) {
        console.log(error);
        return createJsonResponse({ message: 'Internal Server Error' }, 500);
    }
}
