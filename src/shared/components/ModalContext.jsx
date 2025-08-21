import React from 'react';

export const ModalContext = React.createContext({ openModal: () => {}, closeModal: () => {} });
export const useModal = () => React.useContext(ModalContext);

