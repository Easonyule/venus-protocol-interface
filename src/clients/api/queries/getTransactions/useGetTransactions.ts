import { useGetToken, useGetTokens } from 'packages/tokens';
import { QueryObserverOptions, useQuery } from 'react-query';
import { generatePseudoRandomRefetchInterval } from 'utilities';

import getTransactions, {
  GetTransactionsInput,
  GetTransactionsOutput,
} from 'clients/api/queries/getTransactions';
import useGetVTokens from 'clients/api/queries/getVTokens/useGetVTokens';
import FunctionKey from 'constants/functionKey';

type TrimmedGetTransactionsInput = Omit<
  GetTransactionsInput,
  'vTokens' | 'tokens' | 'defaultToken'
>;

type Options = QueryObserverOptions<
  GetTransactionsOutput,
  Error,
  GetTransactionsOutput,
  GetTransactionsOutput,
  [FunctionKey.GET_TRANSACTIONS, TrimmedGetTransactionsInput]
>;

const refetchInterval = generatePseudoRandomRefetchInterval();

const useGetTransactions = (params: TrimmedGetTransactionsInput, options?: Options) => {
  const { data: getVTokenData } = useGetVTokens();
  const vTokens = getVTokenData?.vTokens || [];

  const tokens = useGetTokens();
  const xvs = useGetToken({
    symbol: 'XVS',
  });

  return useQuery(
    [FunctionKey.GET_TRANSACTIONS, params],
    () => getTransactions({ ...params, vTokens, tokens, defaultToken: xvs || tokens[0] }),
    {
      keepPreviousData: true,
      refetchInterval,
      ...options,
      enabled: vTokens.length > 0 && (!options || options.enabled),
    },
  );
};

export default useGetTransactions;
