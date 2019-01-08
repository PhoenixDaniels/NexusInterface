// External
import React, { Component } from 'react';
import styled from '@emotion/styled';

// Internal
import UIController from 'components/UIController';
import SnackBar from 'components/SnackBar';
import { timing } from 'styles';

const outro = { opacity: [1, 0] };

const NotificationComponent = styled(SnackBar)({
  '&::after': {
    content: '"✕"',
    fontSize: 10,
    fontWeight: 'bold',
    position: 'absolute',
    top: 2,
    right: 5,
    opacity: 0,
    transition: `opacity ${timing.normal}`,
  },
  '&:hover': {
    '&::after': {
      opacity: 1,
    },
  },
});

export default class Notification extends Component {
  static defaultProps = {
    type: 'info',
    autoClose: 3000, // ms
  };

  componentDidMount() {
    if (this.props.autoClose) {
      this.startAutoClose();
    }
  }

  componentWillUnmount() {
    this.stopAutoClose();
  }

  animatedClose = () => {
    if (this.props.notifID) {
      const duration = parseInt(timing.quick);
      this.stopAutoClose();
      this.elem.animate(outro, {
        duration,
        easing: 'ease-in',
        fill: 'both',
      });
      setTimeout(this.close, duration);
    }
  };

  close = () => {
    UIController.hideNotification(this.props.notifID);
  };

  stopAutoClose = () => {
    clearTimeout(this.autoClose);
  };

  startAutoClose = () => {
    this.stopAutoClose();
    this.autoClose = setTimeout(this.animatedClose, this.props.autoClose);
  };

  render() {
    return (
      <NotificationComponent
        ref={el => {
          this.elem = el;
        }}
        onClick={this.animatedClose}
        onMouseEnter={this.stopAutoClose}
        onMouseLeave={this.startAutoClose}
        {...this.props}
      />
    );
  }
}