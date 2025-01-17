import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Vi from 'vitest';

import { poolData } from '__mocks__/models/pools';
import { useGetPools } from 'clients/api';
import renderComponent from 'testUtils/renderComponent';
import en from 'translation/translations/en.json';

import Dashboard from '.';
import TEST_IDS from './testIds';

describe('pages/Dashboard', () => {
  beforeEach(() => {
    (useGetPools as Vi.Mock).mockImplementation(() => ({
      data: {
        pools: poolData,
      },
      isLoading: false,
    }));
  });

  it('renders without crashing', () => {
    renderComponent(<Dashboard />);
  });

  it('displays markets table correctly', async () => {
    const { getByTestId } = renderComponent(<Dashboard />);

    await waitFor(() => getByTestId(TEST_IDS.marketTable));
    const marketsTable = getByTestId(TEST_IDS.marketTable);
    expect(marketsTable.textContent).toMatchSnapshot();
  });

  it('filters out assets when entering value in search input', async () => {
    const { getByTestId, queryAllByPlaceholderText } = renderComponent(<Dashboard />);

    await waitFor(() => getByTestId(TEST_IDS.marketTable));

    // Enter value in search input
    fireEvent.change(queryAllByPlaceholderText(en.dashboard.searchInput.placeholder)[0], {
      target: { value: 'usdt' },
    });

    const supplyMarketTable = getByTestId(TEST_IDS.marketTable);
    expect(supplyMarketTable.textContent).toMatchSnapshot();
  });
});
