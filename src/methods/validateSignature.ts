import { Connection, PublicKey } from "@solana/web3.js";
import { ImportAccountFromPrivateKey } from "aleph-sdk-ts/dist/accounts/solana";
import { IX_DATA_LAYOUT, InstructionType, queryAccounts, Product, AccountType } from "brick-protocol";
import { existsMessage, generateAlephMessage } from "../aleph";
import { config } from "../config";
import { ACCOUNTS_DATA_LAYOUT } from "../utils/accounts";

export async function validateSignature(signature: string): Promise<Response> {
    console.log('validateSignature starts')

    try {
        if (!config.rpc) return new Response('Error: Server rpc not configured', { status: 500 });
        if (!config.messagesKey) return new Response('Error: MessagesKey not configured', { status: 500 });

        const connection = new Connection(config.rpc);
        const messagesSigner = ImportAccountFromPrivateKey(Uint8Array.from(JSON.parse(config.messagesKey)));
        
        const tx = await connection.getTransaction(signature, {commitment: 'confirmed', maxSupportedTransactionVersion: 1});
        if (!tx) {
            console.log('Transaction not found')
            return new Response('Transaction not found', { status: 404 });
        }
        console.log('Found the transaction from signature')

        const [context] = IX_DATA_LAYOUT[InstructionType.RegisterBuyCnft].deserialize(tx?.transaction.message.compiledInstructions[1].data);
        const { ...result } = context;
        const product = tx?.transaction.message.staticAccountKeys[3]?.toString() || '';
        const signer = tx?.transaction.message.staticAccountKeys[0]?.toString() || '';   
        console.log('Product: ', product, ' signer: ', signer)

        const asyncTasks = [];
        asyncTasks.push(existsMessage([signature], ['Signature'], messagesSigner.address, [config.channel]));
        asyncTasks.push(existsMessage([signer, product], ['Permission'], messagesSigner.address, [config.channel]));
        asyncTasks.push(connection.getAccountInfo(new PublicKey(product)));
        const [existsSignature, existsPermission, accountInfo] = await Promise.all(asyncTasks);
        console.log('First batch of async functions done')

        const asyncMessages = []
        if (existsSignature) {
            console.log('Signature already used')
            return new Response('Signature already used', { status: 400 });
        } else {
            console.log('Signature not used yet')
            const productInfo = ACCOUNTS_DATA_LAYOUT[AccountType.Product].deserialize(accountInfo?.data)[0] as Product
            console.log(productInfo)
            const datasetID = Buffer.from(productInfo.firstId).toString('hex');
            console.log(datasetID)
            const basePermissionContent = {
                datasetID,
                authorizer: productInfo.authority.toString(),
                status: 'GRANTED',
                requestor: signer,
                tags: [signer, product],
            }
            console.log(basePermissionContent)
            if (existsPermission) {
                console.log('Permission existed before')
                const permissionContent = {
                    ...basePermissionContent,
                    executionCount: existsPermission.executionCount,
                    maxExecutionCount: existsPermission.maxExecutionCount + result.params.amount,
                }
                asyncMessages.push(generateAlephMessage(permissionContent, 'amend', config.channel, messagesSigner, existsPermission.item_hash));
            } else {
                console.log('Permission not existed before')
                const permissionContent = {
                    ...basePermissionContent,
                    executionCount: 0,
                    maxExecutionCount: result.params.amount,
                }
                asyncMessages.push(generateAlephMessage(permissionContent, 'Permission', config.channel, messagesSigner));
            }
            asyncMessages.push(generateAlephMessage({signature, tags: [signature]}, 'Signature', config.channel, messagesSigner));
            const [itemHash1, itemHash2] = await Promise.all(asyncMessages);
            console.log('Permission hash: ', itemHash1, ' Signature hash: ', itemHash2)
            console.log('Permission granted')
            return Response.json({ message: 'Permission granted' }, { status: 200, headers: { 'Content-Type': 'application/json' }});
        }
    } catch (error) {
        console.error(error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

function combineIds(ids: [number[], number[]]): string {
    const reconstructedBuffer = Buffer.from(ids[0]);
    return reconstructedBuffer.toString('hex');
}