import * as TYPE from 'consts/actionTypes';
import store, { observeStore } from 'store';
import { apiPost } from 'lib/tritiumApi';
import rpc from 'lib/rpc';
import { legacyMode } from 'consts/misc';
import { walletEvents } from 'lib/wallet';
import { openModal } from 'lib/ui';
import { isLoggedIn } from 'selectors';
import listAll from 'utils/listAll';
import MigrateAccountModal from 'components/MigrateAccountModal';

export const selectUsername = (state) =>
  state.user.status?.username || state.sessions[state.user.session]?.username;

export const refreshStakeInfo = async () => {
  try {
    const stakeInfo = await apiPost('finance/get/stakeinfo');
    store.dispatch({ type: TYPE.SET_STAKE_INFO, payload: stakeInfo });
  } catch (err) {
    store.dispatch({ type: TYPE.CLEAR_STAKE_INFO });
    console.error('finance/get/stakeinfo failed', err);
  }
};

export const refreshUserStatus = async () => {
  try {
    const status = await apiPost('users/get/status');
    store.dispatch({ type: TYPE.SET_USER_STATUS, payload: status });
  } catch (err) {
    store.dispatch({ type: TYPE.CLEAR_USER });
  }
};

export const refreshBalances = async () => {
  try {
    const balances = await apiPost('finance/get/balances');
    store.dispatch({ type: TYPE.SET_BALANCES, payload: balances });
  } catch (err) {
    store.dispatch({ type: TYPE.CLEAR_BALANCES });
    console.error('finance/get/balances failed', err);
  }
};

export const login = async ({ username, password, pin }) => {
  const result = await apiPost('users/login/user', {
    username,
    password,
    pin,
  });
  const { session } = result;
  const status = await apiPost('users/get/status', { session });

  store.dispatch({ type: TYPE.LOGIN, payload: { username, session, status } });
  return { username, session, status };
};

export const logOut = async () => {
  const {
    sessions,
    core: { systemInfo },
  } = store.getState();
  store.dispatch({
    type: TYPE.LOGOUT,
  });
  if (systemInfo?.multiuser) {
    await Promise.all([
      Object.keys(sessions).map((session) => {
        apiPost('users/logout/user', { session });
      }),
    ]);
  } else {
    await apiPost('users/logout/user');
  }
};

export const unlockUser = async ({ pin }) => {
  const {
    settings: { enableStaking, enableMining },
  } = store.getState();
  return await apiPost('users/unlock/user', {
    pin,
    notifications: true,
    mining: !!enableMining,
    staking: !!enableStaking,
  });
};

export const switchUser = async ({ session }) => {
  const status = await apiPost('users/get/status', { session });
  store.dispatch({ type: TYPE.SWITCH_USER, payload: { session, status } });
};

export const loadOwnedTokens = async () => {
  const result = await listAll('users/list/tokens');
  store.dispatch({
    type: TYPE.SET_USER_OWNED_TOKENS,
    payload: result,
  });
};

export const loadAccounts = legacyMode
  ? // Legacy Mode
    async () => {
      const accList = await rpc('listaccounts', []);

      const addrList = await Promise.all(
        Object.keys(accList || {}).map((account) =>
          rpc('getaddressesbyaccount', [account])
        )
      );

      const validateAddressPromises = addrList.reduce(
        (list, element) => [
          ...list,
          ...element.map((address) => rpc('validateaddress', [address])),
        ],
        []
      );
      const validations = await Promise.all(validateAddressPromises);

      const accountList = [];
      validations.forEach((e) => {
        if (e.ismine && e.isvalid) {
          const index = accountList.findIndex(
            (ele) => ele.account === e.account
          );
          const indexDefault = accountList.findIndex(
            (ele) => ele.account === 'default'
          );

          if (e.account === '' || e.account === 'default') {
            if (index === -1 && indexDefault === -1) {
              accountList.push({
                account: 'default',
                addresses: [e.address],
              });
            } else {
              accountList[indexDefault].addresses.push(e.address);
            }
          } else {
            if (index === -1) {
              accountList.push({
                account: e.account,
                addresses: [e.address],
              });
            } else {
              accountList[index].addresses.push(e.address);
            }
          }
        }
      });

      accountList.forEach((acc) => {
        const accountName = acc.account || 'default';
        if (accountName === 'default') {
          acc.balance =
            accList['default'] !== undefined ? accList['default'] : accList[''];
        } else {
          acc.balance = accList[accountName];
        }
      });

      store.dispatch({ type: TYPE.MY_ACCOUNTS_LIST, payload: accountList });
    }
  : // Tritium Mode
    async () => {
      try {
        const accounts = await apiPost('users/list/accounts');
        store.dispatch({ type: TYPE.SET_TRITIUM_ACCOUNTS, payload: accounts });
      } catch (err) {
        console.error('users/list/accounts failed', err);
      }
    };

export const updateAccountBalances = async () => {
  const accList = await rpc('listaccounts', []);
  store.dispatch({ type: TYPE.UPDATE_MY_ACCOUNTS, payload: accList });
};

export const loadNameRecords = async () => {
  try {
    const nameRecords = await listAll('users/list/names');
    store.dispatch({ type: TYPE.SET_NAME_RECORDS, payload: nameRecords });
  } catch (err) {
    console.error('users/list/names failed', err);
  }
};

export const loadNamespaces = async () => {
  try {
    const namespaces = await listAll('users/list/namespaces');
    store.dispatch({ type: TYPE.SET_NAMESPACES, payload: namespaces });
  } catch (err) {
    console.error('users/list/namespaces failed', err);
  }
};

export const loadAssets = async () => {
  try {
    const assets = await listAll('users/list/assets');
    store.dispatch({ type: TYPE.SET_ASSETS, payload: assets });
  } catch (err) {
    console.error('users/list/assets failed', err);
  }
};

if (!legacyMode) {
  walletEvents.once('pre-render', function () {
    observeStore(isLoggedIn, async (loggedIn) => {
      if (loggedIn) {
        const {
          settings: { migrateSuggestionDisabled },
          core: { systemInfo },
        } = store.getState();
        if (!migrateSuggestionDisabled && !systemInfo?.legacy_unsupported) {
          const coreInfo = await rpc('getinfo', []);
          const legacyBalance = (coreInfo.balance || 0) + (coreInfo.stake || 0);
          if (legacyBalance) {
            openModal(MigrateAccountModal, { legacyBalance });
          }
        }
      }
    });

    observeStore(
      (state) => state.user.status,
      (userStatus) => {
        if (userStatus) {
          refreshStakeInfo();
        }
      }
    );
  });
}
