import React, { Component } from 'react';
import { reduxForm, Field, formValueSelector } from 'redux-form';
import styled from '@emotion/styled';
import { connect } from 'react-redux';

import { autoFetchCoreInfo } from 'lib/coreInfo';
import { apiPost } from 'lib/tritiumApi';
import Modal from 'components/Modal';
import FormField from 'components/FormField';
import TextField from 'components/TextField';
import Button from 'components/Button';
import Switch from 'components/Switch';
import { rpcErrorHandler } from 'utils/form';
import { showNotification, openErrorDialog } from 'actions/overlays';

/**
 *  Login Form
 *
 * @class Login
 * @extends {Component}
 */
@connect(
  null,
  { showNotification, openErrorDialog }
)
@reduxForm({
  form: 'login_tritium',
  destroyOnUnmount: false,
  initialValues: {
    username: '',
    password: '',
    pin: '',
    unlockMinting: false,
    unlockTransactions: false,
  },
  validate: ({ username, password, pin }, props) => {
    const errors = {};

    if (!username) {
      errors.username = __('Username is required');
    }

    if (!password) {
      errors.password = __('Password is required');
    }

    if (!pin) {
      errors.pin = __('PIN is required');
    }

    return errors;
  },
  onSubmit: async ({
    username,
    password,
    pin,
    unlockMinting,
    unlockTransactions,
  }) => {
    const result = await apiPost('users/login/user', {
      username,
      password,
      PIN: pin,
    });

    if (unlockMinting || unlockTransactions) {
      try {
        await apiPost('users/unlock/user', {
          PIN: pin,
          minting: !!unlockMinting,
          transactions: !!unlockTransactions,
        });
      } catch (err) {
        console.error(err);
      }
    }
    return result;
  },
  onSubmitSuccess: async (result, dispatch, props) => {
    props.reset();
    props.showNotification(__('Logged in successfully'), 'success');
    autoFetchCoreInfo();
  },
  // TODO: replace error handler
  onSubmitFail: rpcErrorHandler(__('Error logging in')),
})
class Login extends Component {
  /**
   * Component's Renderable JSX
   *
   * @returns
   * @memberof Login
   */
  render() {
    const { handleSubmit, submitting } = this.props;

    return (
      <Modal style={{ maxWidth: 500 }}>
        <Modal.Header>{__('Log in')}</Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit}>
            <FormField connectLabel label={__('Username')}>
              <Field
                component={TextField.RF}
                name="username"
                placeholder={__('Enter your username')}
              />
            </FormField>

            <FormField connectLabel label={__('Password')}>
              <Field
                component={TextField.RF}
                name="password"
                type="password"
                placeholder={__('Enter your password')}
              />
            </FormField>

            <FormField connectLabel label={__('PIN')}>
              <Field
                component={TextField.RF}
                name="pin"
                type="password"
                placeholder={__('Pin')}
              />
            </FormField>

            <FormField
              inline
              connectLabel
              label={__('Unlock for staking & mining')}
              style={{ marginTop: '1.5em' }}
            >
              <Field component={Switch.RF} name="unlockMinting" />
            </FormField>

            <FormField
              inline
              connectLabel
              label={__('Unlock for sending transactions')}
            >
              <Field component={Switch.RF} name="unlockTransactions" />
            </FormField>

            <div style={{ marginTop: '1.5em' }}>
              <Button type="submit" wide skin="primary" disabled={submitting}>
                {__('Log in')}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    );
  }
}

export default Login;
