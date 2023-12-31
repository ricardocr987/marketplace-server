/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import * as beet from '@metaplex-foundation/beet'
import { PaymentFeePayer, paymentFeePayerBeet } from './PaymentFeePayer.js'
export type FeesConfig = {
  discountMint: web3.PublicKey
  fee: number
  feeReduction: number
  feePayer: PaymentFeePayer
}

/**
 * @category userTypes
 * @category generated
 */
export const feesConfigBeet = new beet.BeetArgsStruct<FeesConfig>(
  [
    ['discountMint', beetSolana.publicKey],
    ['fee', beet.u16],
    ['feeReduction', beet.u16],
    ['feePayer', paymentFeePayerBeet],
  ],
  'FeesConfig',
)
