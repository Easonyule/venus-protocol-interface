import BigNumber from 'bignumber.js';
import { VBep20, VBnb, getVTokenContract } from 'packages/contracts';
import Vi from 'vitest';

import fakeContractReceipt from '__mocks__/models/contractReceipt';
import fakeSigner from '__mocks__/models/signer';
import { vBnb, vXvs } from '__mocks__/models/vTokens';

import supply from '.';

const fakeAmountWei = new BigNumber('10000000000000000');

vi.mock('packages/contracts');

describe('api/mutation/supply', () => {
  describe('supply BNB', () => {
    test('returns contract receipt when request succeeds', async () => {
      const waitMock = vi.fn(async () => fakeContractReceipt);
      const mintMock = vi.fn(() => ({
        wait: waitMock,
      }));

      const fakeVTokenContract = {
        mint: mintMock,
      } as unknown as VBep20;

      (getVTokenContract as Vi.Mock).mockImplementationOnce(() => fakeVTokenContract);

      const response = await supply({
        signer: fakeSigner,
        vToken: vBnb,
        amountWei: fakeAmountWei,
      });

      expect(response).toBe(fakeContractReceipt);

      expect(mintMock).toHaveBeenCalledTimes(1);
      expect(mintMock).toHaveBeenCalledWith({
        value: fakeAmountWei.toFixed(),
      });
      expect(waitMock).toBeCalledTimes(1);
      expect(waitMock).toHaveBeenCalledWith(1);
    });
  });

  describe('supply non-BNB token', () => {
    test('returns contract receipt when request succeeds', async () => {
      const waitMock = vi.fn(async () => fakeContractReceipt);
      const mintMock = vi.fn(() => ({
        wait: waitMock,
      }));

      const fakeVTokenContract = {
        mint: mintMock,
      } as unknown as VBnb;

      (getVTokenContract as Vi.Mock).mockImplementationOnce(() => fakeVTokenContract);

      const response = await supply({
        signer: fakeSigner,
        vToken: vXvs,
        amountWei: fakeAmountWei,
      });

      expect(response).toBe(fakeContractReceipt);

      expect(mintMock).toHaveBeenCalledTimes(1);
      expect(mintMock).toHaveBeenCalledWith(fakeAmountWei.toFixed());
      expect(waitMock).toBeCalledTimes(1);
      expect(waitMock).toHaveBeenCalledWith(1);
    });
  });
});
