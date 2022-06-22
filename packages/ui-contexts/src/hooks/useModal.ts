import { useContext } from 'react';

import { ModalContext, ModalContextValue } from '../ModalContext';

/**
 * Consider use useCurrentModal to get the current modal
 */
export const useModal = (): ModalContextValue['modal'] => {
	const context = useContext(ModalContext);

	if (!context) {
		throw new Error('useModal must be used inside Modal Context');
	}

	return context.modal;
};
