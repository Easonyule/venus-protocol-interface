import { fireEvent, waitFor } from '@testing-library/react';
import BigNumber from 'bignumber.js';
import _cloneDeep from 'lodash/cloneDeep';
import noop from 'noop-ts';
import React from 'react';
import { Asset, Swap, TokenBalance } from 'types';
import Vi from 'vitest';

import fakeAccountAddress from '__mocks__/models/address';
import fakeContractReceipt from '__mocks__/models/contractReceipt';
import fakeTokenBalances, { FAKE_BUSD_BALANCE_TOKENS } from '__mocks__/models/tokenBalances';
import { bnb, busd, wbnb, xvs } from '__mocks__/models/tokens';
import { swapTokensAndRepay } from 'clients/api';
import { selectToken } from 'components/SelectTokenTextField/__testUtils__/testUtils';
import { getTokenTextFieldTestId } from 'components/SelectTokenTextField/testIdGetters';
import {
  HIGH_PRICE_IMPACT_THRESHOLD_PERCENTAGE,
  MAXIMUM_PRICE_IMPACT_THRESHOLD_PERCENTAGE,
} from 'constants/swap';
import useGetSwapInfo, { UseGetSwapInfoInput } from 'hooks/useGetSwapInfo';
import useGetSwapTokenUserBalances from 'hooks/useGetSwapTokenUserBalances';
import { UseIsFeatureEnabled, useIsFeatureEnabled } from 'hooks/useIsFeatureEnabled';
import useSuccessfulTransactionModal from 'hooks/useSuccessfulTransactionModal';
import renderComponent from 'testUtils/renderComponent';
import en from 'translation/translations/en.json';

import Repay, { PRESET_PERCENTAGES } from '..';
import SWAP_SUMMARY_TEST_IDS from '../../SwapSummary/testIds';
import { fakeAsset, fakePool } from '../__testUtils__/fakeData';
import TEST_IDS from '../testIds';

const fakeBusdWalletBalanceWei = new BigNumber(FAKE_BUSD_BALANCE_TOKENS).multipliedBy(
  new BigNumber(10).pow(busd.decimals),
);

const fakeBusdAmountBellowWalletBalanceWei = fakeBusdWalletBalanceWei.minus(100);

const fakeXvsUserBorrowBalanceInWei = new BigNumber(fakeAsset.userBorrowBalanceTokens).multipliedBy(
  new BigNumber(10).pow(xvs.decimals),
);

const fakeXvsAmountBelowUserBorrowBalanceWei = fakeXvsUserBorrowBalanceInWei.minus(100);

const fakeSwap: Swap = {
  fromToken: busd,
  fromTokenAmountSoldWei: fakeBusdAmountBellowWalletBalanceWei,
  toToken: xvs,
  expectedToTokenAmountReceivedWei: fakeXvsAmountBelowUserBorrowBalanceWei,
  minimumToTokenAmountReceivedWei: fakeXvsAmountBelowUserBorrowBalanceWei,
  exchangeRate: fakeXvsAmountBelowUserBorrowBalanceWei.div(fakeBusdAmountBellowWalletBalanceWei),
  routePath: [busd.address, xvs.address],
  priceImpactPercentage: 0.001,
  direction: 'exactAmountIn',
};

// Fake full repayment swap in which the wallet balance covers exactly the entire user loan
const fakeFullRepaymentSwap: Swap = {
  fromToken: busd,
  expectedFromTokenAmountSoldWei: fakeBusdWalletBalanceWei,
  maximumFromTokenAmountSoldWei: fakeBusdWalletBalanceWei,
  toToken: xvs,
  toTokenAmountReceivedWei: fakeXvsUserBorrowBalanceInWei,
  exchangeRate: fakeXvsUserBorrowBalanceInWei.div(fakeBusdWalletBalanceWei),
  routePath: [busd.address, xvs.address],
  priceImpactPercentage: 0.001,
  direction: 'exactAmountOut',
};

vi.mock('hooks/useGetSwapTokenUserBalances');
vi.mock('hooks/useSuccessfulTransactionModal');
vi.mock('hooks/useGetSwapInfo');
vi.mock('hooks/useGetSwapRouterContractAddress');

describe('hooks/useBorrowRepayModal/Repay - Feature flag enabled: integratedSwap', () => {
  beforeEach(() => {
    (useIsFeatureEnabled as Vi.Mock).mockImplementation(
      ({ name }: UseIsFeatureEnabled) => name === 'integratedSwap',
    );

    (useGetSwapInfo as Vi.Mock).mockImplementation(() => ({
      swap: undefined,
      error: undefined,
      isLoading: false,
    }));

    (useGetSwapTokenUserBalances as Vi.Mock).mockImplementation(() => ({
      data: fakeTokenBalances,
    }));
  });

  it('renders without crashing', () => {
    renderComponent(<Repay asset={fakeAsset} pool={fakePool} onCloseModal={noop} />);
  });

  it('displays correct wallet balance', async () => {
    const { getByText, container } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={noop} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    selectToken({
      container,
      selectTokenTextFieldTestId: TEST_IDS.selectTokenTextField,
      token: busd,
    });

    await waitFor(() => getByText('300.00K BUSD'));
  });

  it('disables submit button if no amount was entered in input', async () => {
    const { getByText } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={noop} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    await waitFor(() => getByText(en.operationModal.repay.submitButtonLabel.enterValidAmount));
    expect(
      getByText(en.operationModal.repay.submitButtonLabel.enterValidAmount).closest('button'),
    ).toBeDisabled();
  });

  it('disables submit button if swap is a wrap', async () => {
    (useGetSwapInfo as Vi.Mock).mockImplementation(() => ({
      swap: undefined,
      error: 'WRAPPING_UNSUPPORTED',
      isLoading: false,
    }));

    const customFakeAsset: Asset = {
      ...fakeAsset,
      vToken: {
        ...fakeAsset.vToken,
        underlyingToken: wbnb,
      },
    };

    const { getByText, container, getByTestId } = renderComponent(
      <Repay asset={customFakeAsset} pool={fakePool} onCloseModal={noop} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    selectToken({
      container,
      selectTokenTextFieldTestId: TEST_IDS.selectTokenTextField,
      token: bnb,
    });

    const selectTokenTextField = getByTestId(
      getTokenTextFieldTestId({
        parentTestId: TEST_IDS.selectTokenTextField,
      }),
    ) as HTMLInputElement;

    // Enter valid amount in input
    fireEvent.change(selectTokenTextField, { target: { value: '1' } });

    await waitFor(() => getByText(en.operationModal.repay.submitButtonLabel.wrappingUnsupported));
    expect(
      getByText(en.operationModal.repay.submitButtonLabel.wrappingUnsupported).closest('button'),
    ).toBeDisabled();
  });

  it('disables submit button if swap is an unwrap', async () => {
    (useGetSwapInfo as Vi.Mock).mockImplementation(() => ({
      swap: undefined,
      error: 'UNWRAPPING_UNSUPPORTED',
      isLoading: false,
    }));

    const customFakeAsset: Asset = {
      ...fakeAsset,
      vToken: {
        ...fakeAsset.vToken,
        underlyingToken: bnb,
      },
    };

    const { getByText, container, getByTestId } = renderComponent(
      <Repay asset={customFakeAsset} pool={fakePool} onCloseModal={noop} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    selectToken({
      container,
      selectTokenTextFieldTestId: TEST_IDS.selectTokenTextField,
      token: wbnb,
    });

    const selectTokenTextField = getByTestId(
      getTokenTextFieldTestId({
        parentTestId: TEST_IDS.selectTokenTextField,
      }),
    ) as HTMLInputElement;

    // Enter valid amount in input
    fireEvent.change(selectTokenTextField, { target: { value: '1' } });

    await waitFor(() => getByText(en.operationModal.repay.submitButtonLabel.unwrappingUnsupported));
    expect(
      getByText(en.operationModal.repay.submitButtonLabel.unwrappingUnsupported).closest('button'),
    ).toBeDisabled();
  });

  it('disables submit button if no swap is found', async () => {
    (useGetSwapInfo as Vi.Mock).mockImplementation(() => ({
      swap: undefined,
      error: 'INSUFFICIENT_LIQUIDITY',
      isLoading: false,
    }));

    const { getByTestId, getByText } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={noop} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    const selectTokenTextField = getByTestId(
      getTokenTextFieldTestId({
        parentTestId: TEST_IDS.selectTokenTextField,
      }),
    ) as HTMLInputElement;

    // Enter valid amount in input
    fireEvent.change(selectTokenTextField, { target: { value: '1' } });

    await waitFor(() =>
      getByText(en.operationModal.repay.submitButtonLabel.insufficientSwapLiquidity),
    );
    expect(
      getByText(en.operationModal.repay.submitButtonLabel.insufficientSwapLiquidity).closest(
        'button',
      ),
    ).toBeDisabled();
  });

  it('disables submit button if amount entered in input is higher than wallet balance', async () => {
    const { container, getByTestId, getByText } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={noop} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    selectToken({
      container,
      selectTokenTextFieldTestId: TEST_IDS.selectTokenTextField,
      token: busd,
    });

    const selectTokenTextField = getByTestId(
      getTokenTextFieldTestId({
        parentTestId: TEST_IDS.selectTokenTextField,
      }),
    ) as HTMLInputElement;

    // Enter invalid amount in input
    const invalidAmount = `${Number(FAKE_BUSD_BALANCE_TOKENS) + 1}`;
    fireEvent.change(selectTokenTextField, { target: { value: invalidAmount } });

    const expectedSubmitButtonLabel =
      en.operationModal.repay.submitButtonLabel.insufficientWalletBalance.replace(
        '{{tokenSymbol}}',
        busd.symbol,
      );

    await waitFor(() => getByText(expectedSubmitButtonLabel));
    expect(getByText(expectedSubmitButtonLabel).closest('button')).toBeDisabled();
  });

  it('disables submit button if amount entered in input would have a higher value than borrow balance after swapping', async () => {
    const customFakeFullRepaymentSwap: Swap = {
      ...fakeFullRepaymentSwap,
      toTokenAmountReceivedWei: fakeXvsUserBorrowBalanceInWei.plus(1),
    };

    (useGetSwapInfo as Vi.Mock).mockImplementation(() => ({
      swap: customFakeFullRepaymentSwap,
      error: undefined,
      isLoading: false,
    }));

    const { container, getByTestId, getByText } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={noop} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    selectToken({
      container,
      selectTokenTextFieldTestId: TEST_IDS.selectTokenTextField,
      token: busd,
    });

    const selectTokenTextField = getByTestId(
      getTokenTextFieldTestId({
        parentTestId: TEST_IDS.selectTokenTextField,
      }),
    ) as HTMLInputElement;

    // Enter invalid amount in input
    fireEvent.change(selectTokenTextField, { target: { value: FAKE_BUSD_BALANCE_TOKENS } });

    const expectedSubmitButtonLabel =
      en.operationModal.repay.submitButtonLabel.amountHigherThanRepayBalance;

    await waitFor(() => getByText(expectedSubmitButtonLabel));
    expect(getByText(expectedSubmitButtonLabel).closest('button')).toBeDisabled();
  });

  it('displays warning notice and set correct submit button label if the swap has a high price impact', async () => {
    const customFakeSwap: Swap = {
      ...fakeSwap,
      priceImpactPercentage: HIGH_PRICE_IMPACT_THRESHOLD_PERCENTAGE,
    };

    (useGetSwapInfo as Vi.Mock).mockImplementation(() => ({
      swap: customFakeSwap,
      isLoading: false,
    }));

    const onCloseMock = vi.fn();

    const { container, getByTestId, getByText } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={onCloseMock} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    selectToken({
      container,
      selectTokenTextFieldTestId: TEST_IDS.selectTokenTextField,
      token: busd,
    });

    const selectTokenTextField = getByTestId(
      getTokenTextFieldTestId({
        parentTestId: TEST_IDS.selectTokenTextField,
      }),
    ) as HTMLInputElement;

    // Enter valid amount in input
    fireEvent.change(selectTokenTextField, { target: { value: '1' } });

    // Check warning notice is displayed
    await waitFor(() => getByText(en.operationModal.repay.swappingWithHighPriceImpactWarning));

    // Check submit button label is correct
    await waitFor(() =>
      getByText(en.operationModal.repay.submitButtonLabel.swapAndRepayWithHighPriceImpact),
    );
    const submitButton = getByText(
      en.operationModal.repay.submitButtonLabel.swapAndRepayWithHighPriceImpact,
    ).closest('button');
    expect(submitButton).toBeEnabled();
  });

  it('disables submit button when price impact has reached the maximum tolerated', async () => {
    const customFakeSwap: Swap = {
      ...fakeSwap,
      priceImpactPercentage: MAXIMUM_PRICE_IMPACT_THRESHOLD_PERCENTAGE,
    };

    (useGetSwapInfo as Vi.Mock).mockImplementation(() => ({
      swap: customFakeSwap,
      isLoading: false,
    }));

    const onCloseMock = vi.fn();

    const { container, getByTestId, getByText } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={onCloseMock} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    selectToken({
      container,
      selectTokenTextFieldTestId: TEST_IDS.selectTokenTextField,
      token: busd,
    });

    const selectTokenTextField = getByTestId(
      getTokenTextFieldTestId({
        parentTestId: TEST_IDS.selectTokenTextField,
      }),
    ) as HTMLInputElement;

    // Enter valid amount in input
    fireEvent.change(selectTokenTextField, { target: { value: '1' } });

    // Check submit button has the correct label and is disabled
    await waitFor(() =>
      getByText(en.operationModal.repay.submitButtonLabel.priceImpactHigherThanMaximumTolerated),
    );
    const submitButton = getByText(
      en.operationModal.repay.submitButtonLabel.priceImpactHigherThanMaximumTolerated,
    ).closest('button');
    expect(submitButton).toBeDisabled();
  });

  it('displays correct swap details', async () => {
    (useGetSwapInfo as Vi.Mock).mockImplementation(() => ({
      swap: fakeSwap,
      error: undefined,
      isLoading: false,
    }));

    const { container, getByTestId } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={noop} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    selectToken({
      container,
      selectTokenTextFieldTestId: TEST_IDS.selectTokenTextField,
      token: busd,
    });

    const selectTokenTextField = getByTestId(
      getTokenTextFieldTestId({
        parentTestId: TEST_IDS.selectTokenTextField,
      }),
    ) as HTMLInputElement;

    // Enter valid amount in input
    fireEvent.change(selectTokenTextField, { target: { value: FAKE_BUSD_BALANCE_TOKENS } });

    await waitFor(() => getByTestId(TEST_IDS.swapDetails));
    expect(getByTestId(TEST_IDS.swapDetails).textContent).toMatchSnapshot();
    expect(getByTestId(SWAP_SUMMARY_TEST_IDS.swapSummary).textContent).toMatchSnapshot();
  });

  it('updates input value to 0 when pressing on max button if wallet balance is 0', async () => {
    const customFakeTokenBalances: TokenBalance[] = fakeTokenBalances.map(tokenBalance => ({
      ...tokenBalance,
      balanceWei:
        tokenBalance.token.address.toLowerCase() === busd.address.toLowerCase()
          ? new BigNumber(0)
          : tokenBalance.balanceWei,
    }));

    (useGetSwapTokenUserBalances as Vi.Mock).mockImplementation(() => ({
      data: customFakeTokenBalances,
    }));

    const { container, getByText, getByTestId } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={noop} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    await waitFor(() => getByText(en.operationModal.repay.submitButtonLabel.enterValidAmount));

    selectToken({
      container,
      selectTokenTextFieldTestId: TEST_IDS.selectTokenTextField,
      token: busd,
    });

    // Check input is empty
    const selectTokenTextField = getByTestId(
      getTokenTextFieldTestId({
        parentTestId: TEST_IDS.selectTokenTextField,
      }),
    ) as HTMLInputElement;
    expect(selectTokenTextField.value).toBe('');

    // Click on max button
    fireEvent.click(getByText(en.operationModal.repay.rightMaxButtonLabel));

    // Check input value was updated correctly
    await waitFor(() => expect(selectTokenTextField.value).toBe('0'));

    // Check submit button is disabled
    expect(
      getByText(en.operationModal.repay.submitButtonLabel.enterValidAmount).closest('button'),
    ).toBeDisabled();
  });

  it('updates input value to wallet balance when clicking on max button', async () => {
    const { container, getByText, getByTestId } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={noop} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    await waitFor(() => getByText(en.operationModal.repay.submitButtonLabel.enterValidAmount));

    selectToken({
      container,
      selectTokenTextFieldTestId: TEST_IDS.selectTokenTextField,
      token: busd,
    });

    // Check input is empty
    const selectTokenTextField = getByTestId(
      getTokenTextFieldTestId({
        parentTestId: TEST_IDS.selectTokenTextField,
      }),
    ) as HTMLInputElement;
    expect(selectTokenTextField.value).toBe('');

    // Click on max button
    fireEvent.click(getByText(en.operationModal.repay.rightMaxButtonLabel));

    // Check input value was updated correctly
    await waitFor(() => expect(selectTokenTextField.value).toBe(FAKE_BUSD_BALANCE_TOKENS));

    // Check submit button is enabled
    expect(
      getByText(en.operationModal.repay.submitButtonLabel.swapAndRepay).closest('button'),
    ).toBeEnabled();
  });

  it('updates input value to correct value when pressing on preset percentage buttons', async () => {
    const exchangeRate = new BigNumber(2);
    const getConvertedFromTokenAmountTokens = (toTokenAmountTokens: BigNumber | string) =>
      new BigNumber(toTokenAmountTokens).dividedBy(exchangeRate);

    // Memoize generate swaps to prevent infinite re-renders on state update
    const memoizedFakeSwaps: { [key: string]: Swap } = {};

    // Generate fake swap info based on amount being swapped to
    const getFakeSwap = ({
      toTokenAmountTokens,
      direction,
      fromToken,
      toToken,
    }: UseGetSwapInfoInput) => {
      if (toTokenAmountTokens && memoizedFakeSwaps[toTokenAmountTokens]) {
        return memoizedFakeSwaps[toTokenAmountTokens];
      }

      if (direction === 'exactAmountIn' || !toTokenAmountTokens) {
        return undefined;
      }

      const fakeConvertedFromTokenAmountTokens =
        getConvertedFromTokenAmountTokens(toTokenAmountTokens);
      const fakeConvertedFromTokenAmountWei = fakeConvertedFromTokenAmountTokens.multipliedBy(
        new BigNumber(10).pow(fromToken.decimals),
      );
      const fakeToTokenAmountReceivedWei = new BigNumber(toTokenAmountTokens).multipliedBy(
        new BigNumber(10).pow(toToken.decimals),
      );

      const customFakeSwap: Swap = {
        ...fakeFullRepaymentSwap,
        expectedFromTokenAmountSoldWei: fakeConvertedFromTokenAmountWei,
        maximumFromTokenAmountSoldWei: fakeConvertedFromTokenAmountWei,
        toTokenAmountReceivedWei: fakeToTokenAmountReceivedWei,
      };

      memoizedFakeSwaps[toTokenAmountTokens] = customFakeSwap;
      return customFakeSwap;
    };

    (useGetSwapInfo as Vi.Mock).mockImplementation((input: UseGetSwapInfoInput) => ({
      swap: getFakeSwap(input),
      error: undefined,
      isLoading: false,
    }));

    const { container, getByText, getByTestId } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={noop} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    await waitFor(() => getByText(en.operationModal.repay.submitButtonLabel.enterValidAmount));

    selectToken({
      container,
      selectTokenTextFieldTestId: TEST_IDS.selectTokenTextField,
      token: busd,
    });

    // Check input is empty
    const selectTokenTextField = getByTestId(
      getTokenTextFieldTestId({
        parentTestId: TEST_IDS.selectTokenTextField,
      }),
    ) as HTMLInputElement;
    expect(selectTokenTextField.value).toBe('');

    for (let i = 0; i < PRESET_PERCENTAGES.length; i++) {
      // Clear input
      fireEvent.change(selectTokenTextField, {
        target: { value: '' },
      });

      const presetPercentage = PRESET_PERCENTAGES[i];

      // Press on preset percentage button
      fireEvent.click(getByText(`${presetPercentage}%`));

      const fakeToTokenAmountRepaidTokens = fakeAsset.userBorrowBalanceTokens
        .multipliedBy(presetPercentage / 100)
        .dp(fakeAsset.vToken.underlyingToken.decimals);

      const fakeConvertedFromTokenAmountTokens = getConvertedFromTokenAmountTokens(
        fakeToTokenAmountRepaidTokens,
      ).dp(busd.decimals);

      expect(selectTokenTextField.value).toBe(fakeConvertedFromTokenAmountTokens.toFixed());
    }
  });

  it('lets user swap and repay partial loan, then displays successful transaction modal and calls onClose callback on success', async () => {
    (useGetSwapInfo as Vi.Mock).mockImplementation(() => ({
      swap: fakeSwap,
      error: undefined,
      isLoading: false,
    }));

    const onCloseMock = vi.fn();
    const { openSuccessfulTransactionModal } = useSuccessfulTransactionModal();

    const { container, getByTestId, getByText } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={onCloseMock} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    selectToken({
      container,
      selectTokenTextFieldTestId: TEST_IDS.selectTokenTextField,
      token: busd,
    });

    const selectTokenTextField = getByTestId(
      getTokenTextFieldTestId({
        parentTestId: TEST_IDS.selectTokenTextField,
      }),
    ) as HTMLInputElement;

    const validAmountTokens = FAKE_BUSD_BALANCE_TOKENS;

    // Enter valid amount in input
    fireEvent.change(selectTokenTextField, { target: { value: validAmountTokens } });

    const expectedSubmitButtonLabel = en.operationModal.repay.submitButtonLabel.swapAndRepay;

    // Click on submit button
    await waitFor(() => getByText(expectedSubmitButtonLabel));
    fireEvent.click(getByText(expectedSubmitButtonLabel));

    // Check swapTokensAndRepay is called with correct arguments
    await waitFor(() => expect(swapTokensAndRepay).toHaveBeenCalledTimes(1));
    expect(swapTokensAndRepay).toHaveBeenCalledWith({
      swap: fakeSwap,
      isRepayingFullLoan: false,
    });

    const expectedAmountRepaidWei = fakeSwap.expectedToTokenAmountReceivedWei;

    await waitFor(() => expect(onCloseMock).toHaveBeenCalledTimes(1));

    expect(openSuccessfulTransactionModal).toHaveBeenCalledWith({
      transactionHash: fakeContractReceipt.transactionHash,
      amount: {
        token: fakeAsset.vToken.underlyingToken,
        valueWei: expectedAmountRepaidWei,
      },
      content: expect.any(String),
      title: expect.any(String),
    });
  });

  it('lets user swap and repay full loan', async () => {
    (useGetSwapInfo as Vi.Mock).mockImplementation(() => ({
      swap: fakeFullRepaymentSwap,
      isLoading: false,
    }));

    const onCloseMock = vi.fn();
    const { openSuccessfulTransactionModal } = useSuccessfulTransactionModal();

    const { container, getByText } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={onCloseMock} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    selectToken({
      container,
      selectTokenTextFieldTestId: TEST_IDS.selectTokenTextField,
      token: busd,
    });

    // Click on 100% button
    fireEvent.click(getByText('100%'));

    // Check notice is displayed
    await waitFor(() =>
      expect(getByText(en.operationModal.repay.fullRepaymentWarning)).toBeTruthy(),
    );

    const expectedSubmitButtonLabel = en.operationModal.repay.submitButtonLabel.swapAndRepay;

    // Click on submit button
    await waitFor(() => getByText(expectedSubmitButtonLabel));
    fireEvent.click(getByText(expectedSubmitButtonLabel));

    // Check swapTokensAndRepay is called with correct arguments
    await waitFor(() => expect(swapTokensAndRepay).toHaveBeenCalledTimes(1));
    expect(swapTokensAndRepay).toHaveBeenCalledWith({
      swap: fakeFullRepaymentSwap,
      isRepayingFullLoan: true,
    });

    const expectedAmountRepaidWei = fakeFullRepaymentSwap.toTokenAmountReceivedWei;

    await waitFor(() => expect(onCloseMock).toHaveBeenCalledTimes(1));

    expect(openSuccessfulTransactionModal).toHaveBeenCalledWith({
      transactionHash: fakeContractReceipt.transactionHash,
      amount: {
        token: fakeAsset.vToken.underlyingToken,
        valueWei: expectedAmountRepaidWei,
      },
      content: expect.any(String),
      title: expect.any(String),
    });
  });
});
