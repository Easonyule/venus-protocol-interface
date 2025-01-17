import { useGetGovernorBravoDelegateContract } from 'packages/contracts';
import { MutationObserverOptions, useMutation } from 'react-query';
import { callOrThrow } from 'utilities';

import {
  CreateProposalInput,
  CreateProposalOutput,
  createProposal,
  queryClient,
} from 'clients/api';
import FunctionKey from 'constants/functionKey';

type Options = MutationObserverOptions<CreateProposalOutput, Error, CreateProposalInput>;

const useCreateProposal = (options?: Options) => {
  const governorBravoDelegateContract = useGetGovernorBravoDelegateContract({
    passSigner: true,
  });

  return useMutation(
    FunctionKey.CREATE_PROPOSAL,
    (input: CreateProposalInput) =>
      callOrThrow({ governorBravoDelegateContract }, params =>
        createProposal({
          ...input,
          ...params,
        }),
      ),
    {
      ...options,
      onSuccess: (...onSuccessParams) => {
        queryClient.invalidateQueries(FunctionKey.GET_PROPOSALS);

        if (options?.onSuccess) {
          options.onSuccess(...onSuccessParams);
        }
      },
    },
  );
};

export default useCreateProposal;
