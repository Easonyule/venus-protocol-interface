import { useGetVaiControllerContract } from 'packages/contracts';
import { useGetToken } from 'packages/tokens';
import { MutationObserverOptions, useMutation } from 'react-query';
import { callOrThrow } from 'utilities';

import { IRepayVaiOutput, RepayVaiInput, queryClient, repayVai } from 'clients/api';
import FunctionKey from 'constants/functionKey';

type TrimmedRepayVai = Omit<RepayVaiInput, 'vaiControllerContract'>;
type Options = MutationObserverOptions<IRepayVaiOutput, Error, TrimmedRepayVai>;

const useRepayVai = (options?: Options) => {
  const vaiControllerContract = useGetVaiControllerContract({
    passSigner: true,
  });

  const vai = useGetToken({
    symbol: 'VAI',
  });

  return useMutation(
    FunctionKey.REPAY_VAI,
    (input: TrimmedRepayVai) =>
      callOrThrow(
        {
          vaiControllerContract,
        },
        params =>
          repayVai({
            ...params,
            ...input,
          }),
      ),
    {
      ...options,
      onSuccess: async (...onSuccessParams) => {
        const accountAddress = await vaiControllerContract?.signer.getAddress();
        // Invalidate queries related to fetching the user minted VAI amount
        queryClient.invalidateQueries(FunctionKey.GET_MINTED_VAI);
        queryClient.invalidateQueries(FunctionKey.GET_V_TOKEN_BALANCES_ALL);
        queryClient.invalidateQueries(FunctionKey.GET_VAI_REPAY_AMOUNT_WITH_INTERESTS);
        queryClient.invalidateQueries(FunctionKey.GET_VAI_CALCULATE_REPAY_AMOUNT);

        if (vai) {
          queryClient.invalidateQueries([
            FunctionKey.GET_TOKEN_ALLOWANCE,
            {
              tokenAddress: vai,
              accountAddress,
              spenderAddress: vaiControllerContract?.address,
            },
          ]);
        }

        if (options?.onSuccess) {
          options.onSuccess(...onSuccessParams);
        }
      },
    },
  );
};

export default useRepayVai;
