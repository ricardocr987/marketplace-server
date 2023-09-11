import { IX_DATA_LAYOUT, InstructionType, Product, AccountType } from "brick-protocol";
import { ImportAccountFromPrivateKey } from "aleph-sdk-ts/dist/accounts/solana";
import { ACCOUNTS_DATA_LAYOUT } from "../utils/layout/accounts";
import { existsMessage, generateAlephMessage } from "../aleph";
import { Connection, PublicKey } from "@solana/web3.js";
import { verifyToken } from "../middleware/auth";
import { config } from "../config";
import Elysia, { t } from "elysia";

const validateSignatureBody = t.Object({
    signature: t.String(),
    productId: t.String()
})

export const validatePurchaseSignature = (app: Elysia) =>
    app.use(verifyToken)
        .post('/validateSignature', async ({body: { signature, productId }}) => {
            return await validateSignature(signature, productId);
        }, { body: validateSignatureBody });

async function validateSignature(signature: string, productId: string): Promise<Response> {
    console.log('validateSignature starts')

    try {
        if (!config.RPC) return new Response('Error: Server rpc not configured', { status: 500 });
        if (!config.MESSAGES_KEY) return new Response('Error: MessagesKey not configured', { status: 500 });

        const connection = new Connection(config.RPC);

        const messagesSigner = ImportAccountFromPrivateKey(Uint8Array.from(JSON.parse(config.MESSAGES_KEY)));

        const tx = await connection.getTransaction(signature, {commitment: 'confirmed', maxSupportedTransactionVersion: 1});
        if (!tx) {
            console.log('Transaction not found')
            return new Response('Transaction not found', { status: 404 });
        }
        console.log('Found the transaction from signature')

        const [context] = IX_DATA_LAYOUT[InstructionType.RegisterBuyCnft].deserialize(tx?.transaction.message.compiledInstructions[1].data);
        const { ...result } = context;
        const product = tx?.transaction.message.staticAccountKeys[4]?.toString() || '';
        const signer = tx?.transaction.message.staticAccountKeys[0]?.toString() || '';   

        const asyncTasks = [];
        asyncTasks.push(existsMessage([signature], ['Signature'], messagesSigner.address, [config.ALEPH_CHANNEL]));
        asyncTasks.push(existsMessage([product + signer], ['Permission'], messagesSigner.address, [config.ALEPH_CHANNEL]));
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
            const datasetID = productId//Buffer.from(productInfo.firstId).toString('hex');
            console.log(datasetID)
            const basePermissionContent = {
                datasetID,
                authorizer: productInfo.authority.toString(),
                status: 'GRANTED',
                requestor: signer,
                tags: [signer, product],
            }
            if (existsPermission) {
                console.log('Permission existed before')
                const permissionContent = {
                    ...basePermissionContent,
                    executionCount: existsPermission.executionCount,
                    maxExecutionCount: existsPermission.maxExecutionCount + result.params.amount,
                }
                asyncMessages.push(generateAlephMessage(permissionContent, 'amend', config.ALEPH_CHANNEL, messagesSigner, existsPermission.item_hash));
            } else {
                console.log('Permission not existed before')
                const permissionContent = {
                    ...basePermissionContent,
                    executionCount: 0,
                    maxExecutionCount: result.params.amount,
                }
                asyncMessages.push(generateAlephMessage(permissionContent, 'Permission', config.ALEPH_CHANNEL, messagesSigner));
            }
            asyncMessages.push(generateAlephMessage({signature, tags: [signature]}, 'Signature', config.ALEPH_CHANNEL, messagesSigner));
            await Promise.all(asyncMessages);
            console.log('Permission granted');
            return Response.json({ message: 'Permission granted' }, { status: 200, headers: { 'Content-Type': 'application/json' }});
        }
    } catch (error) {
        console.error(error);
        return new Response('Internal Server Error', { status: 500 });
    }
}