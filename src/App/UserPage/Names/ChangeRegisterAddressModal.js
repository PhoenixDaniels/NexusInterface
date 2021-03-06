import React from 'react';
import { connect } from 'react-redux';
import { reduxForm, Field } from 'redux-form';
import styled from '@emotion/styled';

import Modal from 'components/Modal';
import Button from 'components/Button';
import FormField from 'components/FormField';
import TextField from 'components/TextField';
import Spinner from 'components/Spinner';
import confirmPin from 'utils/promisified/confirmPin';
import { errorHandler } from 'utils/form';
import { openSuccessDialog } from 'lib/ui';
import { loadNameRecords } from 'lib/user';
import { apiPost } from 'lib/tritiumApi';

__ = __context('ChangeRegisterAddress');

const Prefix = styled.span(({ theme }) => ({
  color: theme.mixer(0.5),
}));

const Name = styled.span(({ theme }) => ({
  color: theme.foreground,
}));

@connect(state => ({
  username: state.user.status && state.user.status.username,
}))
@reduxForm({
  form: 'change-register-address',
  destroyOnUnmount: true,
  onSubmit: async ({ registerAddress }, dispatch, { nameRecord }) => {
    const pin = await confirmPin();

    if (pin) {
      return await apiPost('names/update/name', {
        pin,
        address: nameRecord.address,
        register_address: registerAddress,
      });
    }
  },
  onSubmitSuccess: async (result, dispatch, props) => {
    if (!result) return; // Submission was cancelled
    loadNameRecords();
    props.closeModal();
    openSuccessDialog({
      message: __('Name has been updated'),
    });
  },
  onSubmitFail: errorHandler(__('Error updating name')),
})
class ChangeRegisterAddressForm extends React.Component {
  inputRef = React.createRef();

  componentDidMount() {
    setTimeout(() => {
      // Select all register address
      this.inputRef.current.select();
    }, 0);
  }

  render() {
    const { handleSubmit, username, nameRecord, submitting } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <FormField label={__('Name')}>
          {nameRecord.global ? null : nameRecord.namespace ? (
            <Prefix>{nameRecord.namespace + '::'}</Prefix>
          ) : (
            <Prefix>{username + ':'}</Prefix>
          )}
          <Name>{nameRecord.name}</Name>
        </FormField>

        <FormField connectLabel label={__('Register address')}>
          <Field
            inputRef={this.inputRef}
            name="registerAddress"
            component={TextField.RF}
            placeholder={__('Register address that this name points to')}
          />
        </FormField>

        <div className="mt1" style={{ textAlign: 'left' }}>
          {__('Name update fee')}: 1 NXS
        </div>

        <Button
          skin="primary"
          wide
          uppercase
          className="mt3"
          type="submit"
          disabled={submitting}
        >
          {submitting ? (
            <span>
              <Spinner className="space-right" />
              <span className="v-align">{__('Updating name')}...</span>
            </span>
          ) : (
            __('Update name')
          )}
        </Button>
      </form>
    );
  }
}

const ChangeRegisterAddressModal = ({ nameRecord }) => (
  <Modal maxWidth={600}>
    {closeModal => (
      <>
        <Modal.Header>{__('Change register address')}</Modal.Header>
        <Modal.Body>
          <ChangeRegisterAddressForm
            closeModal={closeModal}
            nameRecord={nameRecord}
            initialValues={{
              registerAddress: nameRecord.register_address,
            }}
          />
        </Modal.Body>
      </>
    )}
  </Modal>
);

export default ChangeRegisterAddressModal;
