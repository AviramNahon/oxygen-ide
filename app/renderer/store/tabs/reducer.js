/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { message } from 'antd';
import * as ActionTypes from './types';
import subjects from './subjects';

const defaultState = {
  isLoading: false,
  list: [],
  active: null,
};

export default (state = defaultState, action, dispatch) => {
  const { key, title, newKey, newTitle, fromIndex, toIndex, value, error } = action.payload || {};
  let _index, _newActive, _newList;

  switch (action.type) {
    // TABS_SET_ACTIVE
    case ActionTypes.TABS_SET_ACTIVE:
      return { 
        ...state, 
        //$FlowFixMe
        active: key,
      };
    
    // TABS_SET_TOUCHED
    case ActionTypes.TABS_SET_TOUCHED:
      _index = state.list.findIndex(x => x.key === key);
      if (_index === -1) {
        return state;
      }
      return { 
        ...state, 
        list: [
          ...state.list.slice(0, _index),
          {
            ...state.list[_index],
            touched: value,
          },
          ...state.list.slice(_index + 1),
        ],
      };

    // TABS_ADD
    case ActionTypes.TABS_ADD:
      if (state.list.some(x => x.key === key)) {
        return state;
      }
      let newTab = { key, title };
      let tabListClone = [...state.list, newTab];

      return { 
        ...state, 
        list: tabListClone,
        //$FlowFixMe
        active: key,
      };
    
    // TABS_REMOVE
    case ActionTypes.TABS_REMOVE:
      const newListAfterRemove = state.list.filter(tab => tab.key !== key);
      let newActiveTabKey = state.active;
      if (newActiveTabKey === key) {
        newActiveTabKey = newListAfterRemove.length > 0 ? newListAfterRemove[newListAfterRemove.length - 1].key : null;
      }
      return { 
        ...state, 
        list: newListAfterRemove,
        // when the tab is removed, set the last tab in the list as active
        active: newActiveTabKey,
      };

    // TABS_RENAME
    case ActionTypes.TABS_RENAME:
      _index = state.list.findIndex(x => x.key === key);
      if (_index === -1) {
        return state;
      }
      _newActive = state.active === key ? newKey : state.active;
      return { 
        ...state, 
        active: _newActive,
        list: [
          ...state.list.slice(0, _index),
          {
            ...state.list[_index],
            key: newKey,
            title: newTitle,
          },
          ...state.list.slice(_index + 1),
        ],
      };

    // TABS_CHANGE_ORDER
    case ActionTypes.TABS_CHANGE_ORDER:
      _newList= state.list.slice();
      const firstItem = _newList[fromIndex];
      _newList[fromIndex] = _newList[toIndex];
      _newList[toIndex] = firstItem;
      return {
        ...state,
        list: _newList,
      };

    default:
      return state;
  }
};
