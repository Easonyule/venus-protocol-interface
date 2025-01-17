import BigNumber from 'bignumber.js';
import { checkForTokenTransactionError } from 'errors';
import { ContractReceipt } from 'ethers';
import { VBep20, VBnb } from 'packages/contracts';

export interface BorrowInput {
  vTokenContract: VBep20 | VBnb;
  amountWei: BigNumber;
}

export type BorrowOutput = ContractReceipt;

const borrow = async ({ vTokenContract, amountWei }: BorrowInput): Promise<BorrowOutput> => {
  const transaction = await vTokenContract.borrow(amountWei.toFixed());
  const receipt = await transaction.wait(1);
  return checkForTokenTransactionError(receipt);
};

export default borrow;
