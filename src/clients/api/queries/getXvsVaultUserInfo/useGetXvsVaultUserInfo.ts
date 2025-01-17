import { useGetXvsVaultContract } from 'packages/contracts';
import { QueryObserverOptions, useQuery } from 'react-query';
import { callOrThrow } from 'utilities';

import getXvsVaultUserInfo, {
  GetXvsVaultUserInfoInput,
  GetXvsVaultUserInfoOutput,
} from 'clients/api/queries/getXvsVaultUserInfo';
import FunctionKey from 'constants/functionKey';

type TrimmedGetXvsVaultUserInfoInput = Omit<GetXvsVaultUserInfoInput, 'xvsVaultContract'>;
type Options = QueryObserverOptions<
  GetXvsVaultUserInfoOutput,
  Error,
  GetXvsVaultUserInfoOutput,
  GetXvsVaultUserInfoOutput,
  [FunctionKey.GET_XVS_VAULT_USER_INFO, TrimmedGetXvsVaultUserInfoInput]
>;

const useGetXvsVaultUserInfo = (input: TrimmedGetXvsVaultUserInfoInput, options?: Options) => {
  const xvsVaultContract = useGetXvsVaultContract();

  return useQuery(
    [FunctionKey.GET_XVS_VAULT_USER_INFO, input],
    () => callOrThrow({ xvsVaultContract }, params => getXvsVaultUserInfo({ ...params, ...input })),
    options,
  );
};

export default useGetXvsVaultUserInfo;
