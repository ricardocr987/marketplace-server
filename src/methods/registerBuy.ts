import { Connection, PublicKey } from "@solana/web3.js";
import { ImportAccountFromPrivateKey } from "aleph-sdk-ts/dist/accounts/solana";
import { Product, createRegisterBuyCnftTransaction, AccountType } from "brick-protocol";
import { generateAlephMessage } from "../aleph";
import { BRICK_PROGRAM_ID_PK, config } from "../config";
import { ACCOUNTS_DATA_LAYOUT } from "../utils/accounts";

type RegisterBuyParams = {
    signer: string,
    marketplace: string, 
    productId: string, 
    paymentMint: string, 
    seller: string, 
    marketplaceAuth: string, 
    params: {
        amount: number,
        rewardsActive: boolean,
        name: string
    }
}

export async function registerBuy(params: RegisterBuyParams) {
    console.log('registerBuy starts')

    try {
        if (!config.rpc) return new Response('Error: Server rpc not configured', { status: 500 });
        if (!config.messagesKey) return new Response('Error: MessagesKey not configured', { status: 500 });
        if (!config.indexerApi) return new Response('Error: MessagesKey not configured', { status: 500 });
        if (!params.signer || !params.marketplace || !params.productId || !params.paymentMint || !params.seller || !params.marketplaceAuth || !params.params) {
            return new Response('Error: Missing required information', { status: 500 });
        }

        const connection = new Connection(config.rpc);
        const messagesSigner = ImportAccountFromPrivateKey(Uint8Array.from(JSON.parse(config.messagesKey)));

        const [firstId, secondId] = splitId(params.productId)
        const marketKey = new PublicKey(params.marketplace)
        const [product] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("product", "utf-8"), 
              firstId, 
              secondId,
              marketKey.toBuffer()
            ],
            BRICK_PROGRAM_ID_PK
        );
        const accountInfo = await connection.getAccountInfo(product);
        const productInfo = ACCOUNTS_DATA_LAYOUT[AccountType.Product].deserialize(accountInfo?.data)[0] as Product
        const itemHash = await generateAlephMessage({ 
            product: product.toString(), 
            seller: params.seller as string, 
            signer: params.signer as string, 
            units: Number(params.params.amount), 
            paymentMint: params.paymentMint as string, 
            totalAmount: Number(productInfo.sellerConfig.productPrice) * params.params.amount 
        }, 'Purchase', 'BrickV1.1', messagesSigner);
        console.log('NFT itemHash: ', itemHash)

        const accounts = {
            signer: new PublicKey(params.signer),
            marketplace: new PublicKey(params.marketplace),
            product: new PublicKey(product),
            paymentMint: new PublicKey(params.paymentMint),
            seller: new PublicKey(params.seller),
            marketplaceAuth: new PublicKey(params.marketplaceAuth),
            merkleTree: new PublicKey(productInfo.merkleTree),
        };

        console.log('Accounts: ', accounts)

        const parsedParams = {
            rewardsActive: params.params.rewardsActive,
            amount: Number(params.params.amount),
            name: params.params.name,
            uri: `https://api1.aleph.im/api/v0/messages.json?hashes=${itemHash}`,
        }
        console.log('Params: ', parsedParams)

        const transaction = await createRegisterBuyCnftTransaction(connection, accounts, parsedParams);
        const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64')
        console.log('Serialized transaction ', serializedTransaction)

        return Response.json({ transaction: serializedTransaction }, { status: 200, headers: { 'Content-Type': 'application/json' }});
    } catch (error) {
        console.error(error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

export function splitId(str: string): [Buffer, Buffer]{
    return [Buffer.from(str, 'hex'), Buffer.from(str, 'hex')]
}
