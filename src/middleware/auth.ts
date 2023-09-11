
import { createJsonResponse } from "../utils";
import * as admin from "firebase-admin";
import { Elysia } from "elysia";

export const verifyToken = (app: Elysia) => 
  app.derive(async (req) => {
    try {
      const authHeader = req.request.headers.get('Authorization');

      if (!authHeader) {
        return createJsonResponse({ message: 'Error: Authentication header not included' }, 401);
      }

      const [, idToken] = authHeader.split(' ');
      await admin.auth().verifyIdToken(idToken);

      return { authorization: idToken }
    } catch (error) {
      console.error(error);
      return createJsonResponse({ message: 'Error: Unauthorized' }, 403);
    }
  });