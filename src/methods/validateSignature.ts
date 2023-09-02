import { Connection } from "@solana/web3.js";
import { ImportAccountFromPrivateKey } from "aleph-sdk-ts/dist/accounts/solana";
import { IX_DATA_LAYOUT, InstructionType, queryAccounts, Product } from "brick-protocol";
import { existsMessage, generateAlephMessage } from "../aleph";
import { config } from "../config";

export async function validateSignature(signature: string): Promise<Response> {
    try {
        if (!config.rpc) return new Response('Error: Server rpc not configured', { status: 500 });
        if (!config.messagesKey) return new Response('Error: MessagesKey not configured', { status: 500 });
        if (!config.indexerApi) return new Response('Error: Indexer API not configured', { status: 500 });

        const connection = new Connection(config.rpc);
        const messagesSigner = ImportAccountFromPrivateKey(Uint8Array.from(JSON.parse(config.messagesKey)));
        
        const tx = await connection.getTransaction(signature, {commitment: 'confirmed', maxSupportedTransactionVersion: 1});
        if (!tx) return new Response('Transaction not found', { status: 404 });

        const [context] = IX_DATA_LAYOUT[InstructionType.RegisterBuyCnft].deserialize(tx?.transaction.message.compiledInstructions[1].data);
        const { ...result } = context;
        const product = tx?.transaction.message.staticAccountKeys[3]?.toString() || '';
        const signer = tx?.transaction.message.staticAccountKeys[0]?.toString() || '';   

        const asyncTasks = [];
        asyncTasks.push(existsMessage([signature], ['Signature'], messagesSigner.address, [config.channel]));
        asyncTasks.push(existsMessage([signer, product], ['Permission'], messagesSigner.address, [config.channel]));
        asyncTasks.push(queryAccounts(config.indexerApi, { accounts: [product] }));
        const [existsSignature, existsPermission, productResponse] = await Promise.all(asyncTasks);

        const asyncMessages = []
        if (!signature) return new Response('Error: Signature is missing', { status: 400 });
        if (existsSignature) {
            return new Response('Signature already used', { status: 400 });
        } else {
            const data = productResponse[0].data as Product
            const combinedArray = [...data.firstId, ...data.secondId]
            const byteArray = new Uint8Array(combinedArray)
            const datasetID = String.fromCharCode(...byteArray);
            const basePermissionContent = {
                datasetID,
                authorizer: data.authority,
                status: 'GRANTED',
                requestor: signer,
                tags: [signer, product],
            }
            if (existsPermission) {
                const permissionContent = {
                    ...basePermissionContent,
                    executionCount: existsPermission.executionCount,
                    maxExecutionCount: existsPermission.maxExecutionCount + result.params.amount,
                }
                asyncMessages.push(generateAlephMessage(permissionContent, 'amend', config.channel, messagesSigner, existsPermission.item_hash));
            } else {
                const permissionContent = {
                    ...basePermissionContent,
                    executionCount: 0,
                    maxExecutionCount: result.params.amount,
                }
                asyncMessages.push(generateAlephMessage(permissionContent, 'Permission', config.channel, messagesSigner));
            }
            asyncMessages.push(generateAlephMessage({signature, tags: [signature]}, 'Signature', config.channel, messagesSigner));
            await Promise.all(asyncMessages);
            return new Response('Permission granted', { status: 200 });
        }
    } catch (error) {
        console.error(error);
        return new Response('Internal Server Error', { status: 500 });
    }
}