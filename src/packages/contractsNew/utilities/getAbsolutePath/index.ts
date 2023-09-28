import * as path from 'path';

import cwd from 'utilities/cwd';

export const CONTRACTS_PACKAGE_PATH = './src/packages/contractsNew';

export interface GetAbsolutePathInput {
  relativePath: string;
}

const getAbsolutePath = ({ relativePath }: GetAbsolutePathInput) =>
  path.join(cwd(), `${CONTRACTS_PACKAGE_PATH}/${relativePath}`);

export default getAbsolutePath;