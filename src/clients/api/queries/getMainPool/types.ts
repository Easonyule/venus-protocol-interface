import { ContractTypeByName } from 'packages/contracts';
import { Pool } from 'types';

import { type Provider } from 'clients/web3';

export interface GetMainPoolInput {
  name: string;
  description: string;
  mainPoolComptrollerContract: ContractTypeByName<'mainPoolComptroller'>;
  venusLensContract: ContractTypeByName<'venusLens'>;
  resilientOracleContract: ContractTypeByName<'resilientOracle'>;
  vaiControllerContract: ContractTypeByName<'vaiController'>;
  accountAddress?: string;
}

export interface GetMainPoolOutput {
  pool: Pool;
}
