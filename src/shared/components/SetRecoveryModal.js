import fs from 'fs';
import path from 'path';
import React from 'react';
import { reduxForm, Field } from 'redux-form';

import { apiPost } from 'lib/tritiumApi';
import Modal from 'components/Modal';
import FormField from 'components/FormField';
import TextField from 'components/TextField';
import MaskableTextField from 'components/MaskableTextField';
import Button from 'components/Button';
import Select from 'components/Select';
import { errorHandler, numericOnly } from 'utils/form';
import { assetsDir } from 'consts/paths';

const options = [
  {
    value: 10,
    display: __('%{smart_count} word |||| %{smart_count} words', 10),
  },
  {
    value: 20,
    display: __('%{smart_count} word |||| %{smart_count} words', 20),
  },
  {
    value: 100,
    display: __('%{smart_count} word |||| %{smart_count} words', 100),
  },
];

@reduxForm({
  form: 'set-recovery-phrase',
  initialValues: {
    password: '',
    pin: '',
    phrase: '',
  },
  validate: ({ password, pin, phrase }) => {
    const errors = {};

    if (!password) {
      errors.password = __('Password is required');
    }

    if (!pin) {
      errors.pin = __('PIN is required');
    }

    if (!phrase) {
      errors.phrase = __('Recovery phrase is required');
    }

    return errors;
  },
})
export default class SetRecoveryModal extends React.Component {
  state = {
    wordCount: 20,
  };

  wordlist = null;

  async componentDidMount() {
    const allWords = await fs.promises.readFile(
      path.join(assetsDir, 'misc', 'wordlist.txt')
    );
    this.wordlist = allWords
      .toString()
      .split('\n')
      .map(w => w.trim())
      .filter(w => w);
  }

  generatePhrase = () => {
    if (!this.wordlist) return;
    const words = [];
    for (let i = 0; i < this.state.wordCount; i++) {
      const randomIndex = Math.floor(Math.random() * this.wordlist.length);
      words.push(this.wordlist[randomIndex]);
    }
    this.props.change('phrase', words.join(' '));
  };

  render() {
    return (
      <Modal
        assignClose={closeModal => (this.closeModal = closeModal)}
        style={{ maxWidth: 500 }}
      >
        <Modal.Header>{__('Recovery phrase')}</Modal.Header>
        <Modal.Body>
          <div>
            {__(
              'You will be able to use this recovery phrase to change your password and PIN in the future'
            )}
          </div>

          <FormField label={__('Password')}>
            <Field
              name="password"
              component={MaskableTextField.RF}
              placeholder={__('Your current password')}
            />
          </FormField>

          <FormField label={__('PIN')}>
            <Field
              name="pin"
              component={MaskableTextField.RF}
              normalize={numericOnly}
              placeholder={__('Your current PIN number')}
            />
          </FormField>

          <div className="mt1 flex center space-between">
            <Button skin="hyperlink" onClick={this.generatePhrase}>
              {__('Generate a recovery phrase')}
            </Button>
            <Select
              options={options}
              value={this.state.wordCount}
              onChange={wordCount => {
                this.setState({ wordCount });
              }}
            />
          </div>

          <FormField label={__('New recovery phrase')}>
            <Field
              multiline
              name="phrase"
              component={TextField.RF}
              placeholder={__('Enter your recovery phrase')}
              rows={1}
            />
          </FormField>

          <div className="mt2">
            <Button skin="primary" wide>
              {__('Set recovery phrase')}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}
