import { fireEvent, waitFor } from '@testing-library/react';
import BigNumber from 'bignumber.js';
import _cloneDeep from 'lodash/cloneDeep';
import noop from 'noop-ts';
import { IsTokenActionEnabledInput, isTokenActionEnabled } from 'packages/tokens';
import { Asset, Swap, TokenBalance } from 'types';
import Vi from 'vitest';

import fakeAccountAddress from '__mocks__/models/address';
import fakeContractReceipt from '__mocks__/models/contractReceipt';
import fakeTokenBalances, { FAKE_BUSD_BALANCE_TOKENS } from '__mocks__/models/tokenBalances';
import { bnb, busd, wbnb, xvs } from '__mocks__/models/tokens';
import { swapTokensAndSupply } from 'clients/api';
import { selectToken } from 'components/SelectTokenTextField/__testUtils__/testUtils';
import { getTokenTextFieldTestId } from 'components/SelectTokenTextField/testIdGetters';
import {
  HIGH_PRICE_IMPACT_THRESHOLD_PERCENTAGE,
  MAXIMUM_PRICE_IMPACT_THRESHOLD_PERCENTAGE,
} from 'constants/swap';
import useGetSwapInfo from 'hooks/useGetSwapInfo';
import useGetSwapTokenUserBalances from 'hooks/useGetSwapTokenUserBalances';
import { UseIsFeatureEnabled, useIsFeatureEnabled } from 'hooks/useIsFeatureEnabled';
import useSuccessfulTransactionModal from 'hooks/useSuccessfulTransactionModal';
import renderComponent from 'testUtils/renderComponent';
import en from 'translation/translations/en.json';

import Repay from '..';
import SWAP_SUMMARY_TEST_IDS from '../../SwapSummary/testIds';
import { fakeAsset, fakePool } from '../__testUtils__/fakeData';
import TEST_IDS from '../testIds';

const fakeBusdWalletBalanceWei = new BigNumber(FAKE_BUSD_BALANCE_TOKENS).multipliedBy(
  new BigNumber(10).pow(busd.decimals),
);

const fakeBusdAmountBellowWalletBalanceWei = fakeBusdWalletBalanceWei.minus(100);

const fakeMarginWithSupplyCapTokens = fakeAsset.supplyCapTokens.minus(
  fakeAsset.supplyBalanceTokens,
);

const fakeMarginWithSupplyCapWei = fakeMarginWithSupplyCapTokens.multipliedBy(
  new BigNumber(10).pow(xvs.decimals),
);

const fakeSwap: Swap = {
  fromToken: busd,
  fromTokenAmountSoldWei: fakeBusdAmountBellowWalletBalanceWei,
  toToken: xvs,
  expectedToTokenAmountReceivedWei: fakeMarginWithSupplyCapWei,
  minimumToTokenAmountReceivedWei: fakeMarginWithSupplyCapWei,
  exchangeRate: fakeMarginWithSupplyCapWei.div(fakeBusdAmountBellowWalletBalanceWei),
  routePath: [busd.address, xvs.address],
  priceImpactPercentage: 0.001,
  direction: 'exactAmountIn',
};

vi.mock('packages/tokens');
vi.mock('hooks/useGetSwapTokenUserBalances');
vi.mock('hooks/useSuccessfulTransactionModal');
vi.mock('hooks/useGetSwapInfo');
vi.mock('hooks/useGetSwapRouterContractAddress');

describe('hooks/useSupplyWithdrawModal/Supply - Feature flag enabled: integratedSwap', () => {
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

  it('disables swap feature when swapAndSupply action of underlying token is disabled', async () => {
    (isTokenActionEnabled as Vi.Mock).mockImplementation(
      ({ tokenAddress, action }: IsTokenActionEnabledInput) =>
        action !== 'swapAndSupply' || tokenAddress !== fakeAsset.vToken.underlyingToken.address,
    );

    const { queryByTestId } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={noop} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    expect(queryByTestId(TEST_IDS.selectTokenTextField)).toBeNull();
  });

  it('disables swap feature when swapAndSupply action of vToken is disabled', async () => {
    (isTokenActionEnabled as Vi.Mock).mockImplementation(
      ({ tokenAddress, action }: IsTokenActionEnabledInput) =>
        action !== 'swapAndSupply' || tokenAddress !== fakeAsset.vToken.address,
    );

    const { queryByTestId } = renderComponent(
      <Repay asset={fakeAsset} pool={fakePool} onCloseModal={noop} />,
      {
        authContextValue: {
          accountAddress: fakeAccountAddress,
        },
      },
    );

    expect(queryByTestId(TEST_IDS.selectTokenTextField)).toBeNull();
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

    await waitFor(() => getByText(en.operationModal.supply.submitButtonLabel.enterValidAmount));
    expect(
      getByText(en.operationModal.supply.submitButtonLabel.enterValidAmount).closest('button'),
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

    await waitFor(() => getByText(en.operationModal.supply.submitButtonLabel.wrappingUnsupported));
    expect(
      getByText(en.operationModal.supply.submitButtonLabel.wrappingUnsupported).closest('button'),
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
      getByText(en.operationModal.supply.submitButtonLabel.insufficientSwapLiquidity),
    );
    expect(
      getByText(en.operationModal.supply.submitButtonLabel.insufficientSwapLiquidity).closest(
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
      en.operationModal.supply.submitButtonLabel.insufficientWalletBalance.replace(
        '{{tokenSymbol}}',
        busd.symbol,
      );

    await waitFor(() => getByText(expectedSubmitButtonLabel));
    expect(getByText(expectedSubmitButtonLabel).closest('button')).toBeDisabled();
  });

  it('disables submit button if amount entered in input would have a higher value than supply cap after swapping', async () => {
    const customFakeSwap: Swap = {
      ...fakeSwap,
      expectedToTokenAmountReceivedWei: fakeMarginWithSupplyCapWei.plus(1),
    };

    (useGetSwapInfo as Vi.Mock).mockImplementation(() => ({
      swap: customFakeSwap,
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
      en.operationModal.supply.submitButtonLabel.amountHigherThanSupplyCap;

    await waitFor(() => getByText(expectedSubmitButtonLabel));
    expect(getByText(expectedSubmitButtonLabel).closest('button')).toBeDisabled();
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

    await waitFor(() => getByText(en.operationModal.supply.submitButtonLabel.enterValidAmount));

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
    fireEvent.click(getByText(en.operationModal.supply.rightMaxButtonLabel));

    // Check input value was updated correctly
    await waitFor(() => expect(selectTokenTextField.value).toBe('0'));

    // Check submit button is disabled
    expect(
      getByText(en.operationModal.supply.submitButtonLabel.enterValidAmount).closest('button'),
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

    await waitFor(() => getByText(en.operationModal.supply.submitButtonLabel.enterValidAmount));

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
    fireEvent.click(getByText(en.operationModal.supply.rightMaxButtonLabel));

    // Check input value was updated correctly
    await waitFor(() => expect(selectTokenTextField.value).toBe(FAKE_BUSD_BALANCE_TOKENS));

    // Check submit button is enabled
    expect(
      getByText(en.operationModal.supply.submitButtonLabel.swapAndSupply).closest('button'),
    ).toBeEnabled();
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
    await waitFor(() => getByText(en.operationModal.supply.swappingWithHighPriceImpactWarning));

    // Check submit button has the correct label and is enabled
    await waitFor(() =>
      getByText(en.operationModal.supply.submitButtonLabel.swapAndSupplyWithHighPriceImpact),
    );
    const submitButton = getByText(
      en.operationModal.supply.submitButtonLabel.swapAndSupplyWithHighPriceImpact,
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
      getByText(en.operationModal.supply.submitButtonLabel.priceImpactHigherThanMaximumTolerated),
    );
    const submitButton = getByText(
      en.operationModal.supply.submitButtonLabel.priceImpactHigherThanMaximumTolerated,
    ).closest('button');
    expect(submitButton).toBeDisabled();
  });

  it('lets user swap and supply, then displays successful transaction modal and calls onClose callback on success', async () => {
    (useGetSwapInfo as Vi.Mock).mockImplementation(() => ({
      swap: fakeSwap,
      isLoading: false,
    }));

    const onCloseMock = vi.fn();
    const { openSuccessfulTransactionModal } = useSuccessfulTransactionModal();

    const { container, getByText, getByTestId } = renderComponent(
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

    const expectedSubmitButtonLabel = en.operationModal.supply.submitButtonLabel.swapAndSupply;

    // Click on submit button
    await waitFor(() => getByText(expectedSubmitButtonLabel));
    fireEvent.click(getByText(expectedSubmitButtonLabel));

    await waitFor(() => expect(swapTokensAndSupply).toHaveBeenCalledTimes(1));
    expect(swapTokensAndSupply).toHaveBeenCalledWith({
      swap: fakeSwap,
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
});
