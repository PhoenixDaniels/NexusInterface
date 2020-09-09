import axios from 'axios';

import store from 'store';
import { getActiveCoreConfig } from 'lib/coreConfig';

const getDefaultOptions = ({ apiUser, apiPassword }) => ({
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: !!(apiUser && apiPassword),
  auth:
    apiUser && apiPassword
      ? {
          username: apiUser,
          password: apiPassword,
        }
      : undefined,
});

/**
 * Send a Tritium API request in POST method
 *
 * @export
 * @param {*} endpoint
 * @param {*} params
 * @returns
 */
export async function apiPost(endpoint, customParams) {
  const conf = await getActiveCoreConfig();
  const {
    user: { session },
    core: { systemInfo },
  } = store.getState();
  try {
    const params = systemInfo?.multiuser
      ? { session, ...customParams }
      : customParams;
    const response = await axios.post(
      `${conf.apiHost}/${endpoint}`,
      params,
      getDefaultOptions(conf)
    );
    return response.data && response.data.result;
  } catch (err) {
    throw err.response && err.response.data && err.response.data.error;
  }
}

/**
 * Send a Tritium API request in GET method
 *
 * @export
 * @param {*} url
 * @returns
 */
export async function apiGet(url) {
  const conf = await getActiveCoreConfig();
  try {
    const response = await axios.get(
      `${conf.apiHost}/${url}`,
      getDefaultOptions(conf)
    );
    return response.data && response.data.result;
  } catch (err) {
    throw err.response && err.response.data && err.response.data.error;
  }
}
