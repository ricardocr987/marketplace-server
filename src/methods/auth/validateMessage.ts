import * as admin from "firebase-admin";
import { SignedMessage } from "../../utils/signedMessage";
import { v4 as uuid } from 'uuid'

export async function validateMessage(message: string, signature: string) {
    try {
        const signinMessage = new SignedMessage(JSON.parse(message));
        const validationResult = await signinMessage.validate(signature);
        if (!validationResult) throw new Error('Unauthorized');

        return await admin.auth().createCustomToken(uuid());
    } catch (error) {
        throw new Error('Unauthorized');
    }
}