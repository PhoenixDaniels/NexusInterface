import React from 'react';
import { connect } from 'react-redux';
import styled from '@emotion/styled';
import { NavLink } from 'react-router-dom';

import { timing, consts } from 'styles';
import * as color from 'utils/color';
import Button from 'components/Button';

__ = __context('User');

const UserBriefComponent = styled.div(({ theme }) => ({
  width: 307,
  marginLeft: -30,
  padding: '0 30px',
  borderRight: `1px solid ${theme.mixer(0.125)}`,
  overflow: 'auto',
}));

const Separator = styled.div(({ theme }) => ({
  borderBottom: `1px solid ${theme.mixer(0.125)}`,
  margin: '5px 0',
}));

const Username = styled.div(({ theme }) => ({
  color: theme.primary,
  textAlign: 'center',
  fontSize: 30,
  padding: '20px 0',
}));

const Genesis = styled.div({
  textAlign: 'center',
  opacity: 0.7,
  fontSize: '.8em',
  padding: '10px 0',
});

const GenesisId = styled.div({
  wordBreak: 'break-all',
  fontFamily: consts.monoFontFamily,
});

const MenuItem = styled(NavLink)(
  ({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '.5em 30px',
    margin: '0 -30px',
    transitionProperty: 'background, color',
    transitionDuration: timing.normal,
    cursor: 'pointer',

    '&:hover': {
      background: theme.mixer(0.05),
    },

    '&.active, &.active:hover': {
      background: theme.primary,
      color: theme.primaryAccent,
    },
  }),
  ({ selected, theme }) =>
    selected && {
      '&, &:hover': {
        background: color.fade(theme.primary, 0.4),
        color: theme.primaryAccent,
      },
    }
);

const UserBrief = ({ status, match }) => (
  <UserBriefComponent>
    <Username>{status.username}</Username>
    <Separator />
    <Genesis>
      <div>{__('User ID')}:</div>
      <GenesisId>{status.genesis}</GenesisId>
    </Genesis>
    <Separator />
    <MenuItem to={`${match.url}/Accounts`}>{__('Accounts')}</MenuItem>
    <MenuItem to={`${match.url}/Staking`}>{__('Staking')}</MenuItem>
    <MenuItem to={`${match.url}/Tokens`}>{__('Tokens')}</MenuItem>
    <MenuItem to={`${match.url}/Names`}>{__('Names')}</MenuItem>
    <MenuItem to={`${match.url}/Namespaces`}>{__('Namespaces')}</MenuItem>
    <MenuItem to={`${match.url}/Assets`}>{__('Assets')}</MenuItem>
  </UserBriefComponent>
);

const mapStateToProps = state => ({
  status: state.user.status,
});

export default connect(mapStateToProps)(UserBrief);
