import { validateMessage } from './validateMessage';
import { createJsonResponse } from '../../utils';
import { cookie } from '@elysiajs/cookie'
import { config } from '../../config';
import { jwt } from '@elysiajs/jwt'
import { Elysia, t } from 'elysia'

const validateMessageParams = t.Object({
    message: t.String(),
    signature: t.String()
})

export const auth = (app: Elysia) =>
    app.group('/auth', (app) =>
        app.use(
                jwt({
                    name: "jwt",
                    secret: config.JWT_SECRET,
                })
            )
            .use(cookie())
            .get('/validateMessage', async ({ setCookie, query: { message, signature } }) => {
                try {
                    const token = await validateMessage(message, signature);
                    setCookie('auth', token, {
                        httpOnly: true,
                        maxAge: 900, // 15 min
                    });
                    return createJsonResponse({ message: 'Message validated' }, 200);
                } catch(e) {
                    return createJsonResponse({ message: 'Unauthorized' }, 500);
                }

            }, { query: validateMessageParams })
            /*.get('/refresh', async (req) => {
                return await refreshJwtToken(req);
            })*/
);

