import { verifyToken } from "../../middleware/auth";
import { initProductTree } from "./initProductTree";
import { registerBuy } from "./registerBuy";
import { Elysia, t } from "elysia";

const initProductTreeParamsSchema = t.Object({
    signer: t.String(),
    marketplace: t.String(),
    paymentMint: t.String(),
    id: t.String(),
    productPrice: t.String(),
    feeBasisPoints: t.String(),
    height: t.String(),
    buffer: t.String(),
    canopy: t.String(),
    name: t.String(),
    metadataUrl: t.String(),
});

const registerBuyParamsSchema = t.Object({
    signer: t.String(),
    marketplace: t.String(),
    productId: t.String(),
    paymentMint: t.String(),
    seller: t.String(),
    marketplaceAuth: t.String(),
    amount: t.String(),
    rewardsActive: t.String(),
    name: t.String(),
});

export const transactionBuilder = (app: Elysia) => 
    app.group("/transactionBuilder", (app) =>
        app.use(verifyToken)
            .get('/initProductTree', async ({ query }) => {
                const {
                    signer,
                    marketplace,
                    paymentMint,
                    id,
                    productPrice,
                    feeBasisPoints,
                    height,
                    buffer,
                    canopy,
                    name = '',
                    metadataUrl,
                } = query;
                
                const initProductTreeParams = {
                    signer,
                    marketplace,
                    paymentMint,
                    params: {
                        id,
                        productPrice: parseFloat(productPrice),
                        feeBasisPoints: parseInt(feeBasisPoints, 10),
                        height: parseInt(height, 10),
                        buffer: parseInt(buffer, 10),
                        canopy: parseInt(canopy, 10),
                        name,
                        metadataUrl,
                    },
                };                

                return await initProductTree(initProductTreeParams);
            }, { query: initProductTreeParamsSchema })

            .get('/registerBuy', async ({ query }) => {
                const {
                    signer,
                    marketplace,
                    productId,
                    paymentMint,
                    seller,
                    marketplaceAuth,
                    amount,
                    rewardsActive,
                    name,
                } = query;
            
                const registerBuyParams = {
                    signer,
                    marketplace,
                    productId,
                    paymentMint,
                    seller,
                    marketplaceAuth,
                    params: {
                        amount: parseInt(amount, 10),
                        rewardsActive: rewardsActive === 'true',
                        name,
                    },
                };
            
                return await registerBuy(registerBuyParams);
            }, { query: registerBuyParamsSchema })            
        );