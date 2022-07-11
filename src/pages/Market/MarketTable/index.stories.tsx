import React from 'react';
import { ComponentMeta, Story } from '@storybook/react';
import { withRouter } from 'stories/decorators';
import { markets } from '__mocks__/models/markets';
import { MarketTableUi, IMarketTableProps } from '.';

export default {
  title: 'Pages/Market/MarketTable',
  component: MarketTableUi,
  decorators: [withRouter],
  parameters: {
    backgrounds: {
      default: 'White',
    },
  },
} as ComponentMeta<typeof MarketTableUi>;

const Template: Story<IMarketTableProps> = args => <MarketTableUi {...args} />;

export const Primary = Template.bind({});

Primary.args = {
  markets,
};
