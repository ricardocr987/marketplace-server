import { SOLAccount } from 'aleph-sdk-ts/dist/accounts/solana.js';
import { Publish as publishPost } from 'aleph-sdk-ts/dist/messages/post/index.js';
import { ItemType } from 'aleph-sdk-ts/dist/messages/types/base.js';

export type PurchaseContent = {
  product: string, 
  seller: string, 
  signer: string, 
  units: number, 
  paymentMint: string, 
  totalAmount: number
}

export type PermissionContent = {
  datasetID: string;
  authorizer: string;
  status: string;
  executionCount: number;
  maxExecutionCount: number;
  requestor: string;
  tags: string[];
};

export type SignatureContent = {
  signature: string;
  tags: string[];
};

type MessageContent = PermissionContent | SignatureContent | PurchaseContent;

interface AlephAPIConfig {
  APIServer: string;
  inlineRequested: boolean;
  storageEngine: ItemType;
}

export async function generateAlephMessage(
  content: MessageContent,
  postType: string,
  channel: string,
  account: SOLAccount,
  ref?: string,
  apiConfig: AlephAPIConfig = {
    APIServer: 'https://api1.aleph.im',
    inlineRequested: true,
    storageEngine: ItemType.inline
  }
): Promise<string> {
  try {
    const resp = await publishPost({
      ref,
      account,
      postType,
      content,
      channel,
      ...apiConfig
    });
    return resp.item_hash;
  } catch (e) {
    console.log(`Error posting aleph message: ${e}`);
    throw e;
  }
}

export async function existsMessage(
  tags: string[],
  types: string[],
  messagesSignerAddress: string,
  channels: string[],
  apiServer: string = "https://api1.aleph.im"
) {
  try {
    const url = `${apiServer}/api/v0/posts.json?tags=${tags}&channels=${channels}&types=${types}&sender=${messagesSignerAddress}`;    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': '*'
      },
    });
    if (response.ok) {
      const jsonResponse = await response.json();
      return jsonResponse.posts.length > 0 ? jsonResponse.posts[0].content : false;
    } else {
      console.error(`Error fetching aleph message: HTTP ${response.status}`);
      return false;
    }
  } catch (e) {
    console.log(`Error fetching aleph message: ${e}`);
    return false;
  }  
}

