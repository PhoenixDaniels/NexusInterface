import * as TYPE from 'consts/actionTypes';

const initialState = false;

export default (state = initialState, action) => {
  switch (action.type) {
    case TYPE.SET_LEGACY_MODE:
      return action.payload;

    default:
      return state;
  }
};