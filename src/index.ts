import { config } from "./config";
import { initProductTree } from "./methods/initProductTree";
import { registerBuy } from "./methods/registerBuy";
import { validateSignature } from "./methods/validateSignature";
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

new Elysia()
    .use(cors({
        origin: '*',
        credentials: false,
    }))
    .get('/initProductTree', async (req) => {
        const params = parseUrl(req.request.url);
        if (
            !params['signer'] ||
            !params['marketplace'] ||
            !params['paymentMint'] ||
            !params['id'] ||
            !params['productPrice'] ||
            !params['feeBasisPoints'] ||
            !params['height'] ||
            !params['buffer'] ||
            !params['canopy'] ||
            !params['name'] ||
            !params['metadataUrl']
        ) return new Response('Error: Missing required parameters', { status: 400 });

        const initProductTreeParams = {
            signer: params['signer'],
            marketplace: params['marketplace'],
            paymentMint: params['paymentMint'],
            params: {
                id: params['id'],
                productPrice: parseFloat(params['productPrice']),
                feeBasisPoints: parseInt(params['feeBasisPoints'], 10),
                height: parseInt(params['height'], 10),
                buffer: parseInt(params['buffer'], 10),
                canopy: parseInt(params['canopy'], 10),
                name: params['name'] || '',
                metadataUrl: params['metadataUrl'],
            }
        };

        return await initProductTree(initProductTreeParams);
    })
    .get('/registerBuy', async (req) => {
        const params = parseUrl(req.request.url);
        if (
            !params['signer'] ||
            !params['marketplace'] ||
            !params['productId'] ||
            !params['paymentMint'] ||
            !params['seller'] ||
            !params['marketplaceAuth'] ||
            !params['amount'] ||
            !params['rewardsActive'] ||
            !params['name']
        ) return new Response('Error: Missing required parameters', { status: 400 });

        const registerBuyParams = {
            signer: params['signer'],
            marketplace: params['marketplace'],
            productId: params['productId'],
            paymentMint: params['paymentMint'],
            seller: params['seller'],
            marketplaceAuth: params['marketplaceAuth'],
            params: {
                amount: parseInt(params['amount'] || '0', 10),
                rewardsActive: params['rewardsActive'] === 'true',
                name: params['name']
            }
        };
        
        return await registerBuy(registerBuyParams);
    })
    .get('/validateSignature', async (req) => {
        const params = parseUrl(req.request.url);
        if (!params['signature']) return new Response('Error: Missing required parameters', { status: 400 });
        if (!params['itemHash']) return new Response('Error: Missing required parameters', { status: 400 });

        const signature = params['signature'];
        const itemHash = params['itemHash'];
        return await validateSignature(signature, itemHash);
    })
    .listen({port: config.port}, ({ hostname, port }) => {
        console.log(`Running at http://${hostname}:${port}`)
    })

function parseUrl(url: string): Record<string, string> {
    const parts = url.split("?");
    const params: Record<string, string> = {};
    if (parts.length === 2) {
        const queryString = parts[1];
    
        queryString.split("&").forEach(param => {
            const [key, value] = param.split("=");
            const match = key.match(/\[(.*?)\]/);
            if (match) {
                const paramName = match[1];
                params[paramName] = decodeURIComponent(value);
            } else {
                params[key] = decodeURIComponent(value);
            }
        });    
    }
    return params;
}
      