import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import VerticalBar from '../../../../client/components/VerticalBar';
import { PriorityFormData } from './PriorityEditForm';
import PriorityEditFormWithData from './PriorityEditFormWithData';

type PriorityVerticalBarProps = {
	context: 'new' | 'edit';
	priorityId: string;
	onSave: (data: PriorityFormData) => void;
	onClose: () => void;
};

export const PriorityVerticalBar = ({ priorityId, onClose, onSave }: PriorityVerticalBarProps): ReactElement | null => {
	const t = useTranslation();

	return (
		<VerticalBar>
			<VerticalBar.Header>
				{t('Edit_Priority')}
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent height='100%'>
				<PriorityEditFormWithData priorityId={priorityId} onSave={onSave} onCancel={onClose} />
			</VerticalBar.ScrollableContent>
		</VerticalBar>
	);
};
