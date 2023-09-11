import { validatePurchaseSignature } from "./methods/validateSignature";
import { transactionBuilder } from "./methods/transactionBuilder";
import { swagger } from '@elysiajs/swagger'
import { auth } from "./methods/auth";
import { cors } from '@elysiajs/cors';
import { config } from "./config";
import { Elysia } from 'elysia';

const app = new Elysia();

app.use(
        cors({
            origin: '*', // config.APP_URL
            methods: ['GET', 'POST'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        })
    )
    .use(swagger())
    .use(auth)
    .use(transactionBuilder)
    .use(validatePurchaseSignature)
    .listen({ port: config.PORT }, ({ hostname, port }) => {
        console.log(`Running at http://${hostname}:${port}`)
    }
);
