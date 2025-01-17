import React from 'react';

import { poolData } from '__mocks__/models/pools';
import renderComponent from 'testUtils/renderComponent';

import PoolsBreakdown, { PoolsBreakdownProps } from '.';
import TEST_IDS from './testIds';

const baseProps: PoolsBreakdownProps = {
  pools: poolData,
};

describe('PoolsBreakdown', () => {
  it('renders without crashing', () => {
    renderComponent(<PoolsBreakdown {...baseProps} />);
  });

  it('displays content correctly', () => {
    const mainPool = baseProps.pools[0];
    const { getByTestId, getByText } = renderComponent(
      <PoolsBreakdown {...baseProps} pools={[mainPool]} />,
    );

    expect(getByText(mainPool.name)).toBeTruthy();
    expect(getByTestId(TEST_IDS.tables).textContent).toMatchSnapshot();
  });
});
