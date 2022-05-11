import { IRoom } from '@rocket.chat/core-typings';
import { TextInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import {
	VideoConfModal,
	VideoConfModalContent,
	VideoConfModalInfo,
	VideoConfModalTitle,
	VideoConfModalControllers,
	VideoConfModalController,
	VideoConfModalFooter,
	VideoConfModalControllerButton,
	VideoConfModalFooterButton,
	useVideoConfControllers,
	VideoConfModalField,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useState, ChangeEvent } from 'react';

import RoomAvatar from '../../../../../components/avatar/RoomAvatar';

type StartGroupVideoConfModalProps = {
	room: IRoom;
	onClose: () => void;
};

const StartGroupVideoConfModal = ({ room, onClose }: StartGroupVideoConfModalProps): ReactElement => {
	const t = useTranslation();
	const [confName, setConfName] = useState<string | undefined>(undefined);
	const { controllersConfig, handleToggleMic, handleToggleVideo } = useVideoConfControllers();

	return (
		<VideoConfModal>
			<VideoConfModalContent>
				<RoomAvatar room={room} size='x124' />
				<VideoConfModalTitle>{t('Start_conference_call')}</VideoConfModalTitle>
				<VideoConfModalInfo>
					{room.usersCount && t('__userCount__people_will_be_invited', { userCount: room.usersCount - 1 })}
				</VideoConfModalInfo>
				<VideoConfModalControllers>
					<VideoConfModalController>
						<VideoConfModalControllerButton
							primary={controllersConfig.mic}
							text={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
							title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
							icon={controllersConfig.mic ? 'mic' : 'mic-off'}
							onClick={handleToggleMic}
						/>
					</VideoConfModalController>
					<VideoConfModalController>
						<VideoConfModalControllerButton
							primary={controllersConfig.video}
							text={controllersConfig.video ? t('Cam_on') : t('Cam_off')}
							title={controllersConfig.video ? t('Cam_on') : t('Cam_off')}
							icon={controllersConfig.video ? 'video' : 'video-off'}
							onClick={handleToggleVideo}
						/>
					</VideoConfModalController>
				</VideoConfModalControllers>
				<VideoConfModalField>
					<TextInput
						width='full'
						placeholder={t('Conference_name')}
						value={confName}
						onChange={(e: ChangeEvent<HTMLInputElement>): void => setConfName(e.target.value)}
					/>
				</VideoConfModalField>
			</VideoConfModalContent>
			<VideoConfModalFooter>
				<VideoConfModalFooterButton primary icon='phone'>
					{t('Start_call')}
				</VideoConfModalFooterButton>
				<VideoConfModalFooterButton onClick={onClose}>{t('Cancel')}</VideoConfModalFooterButton>
			</VideoConfModalFooter>
		</VideoConfModal>
	);
};

export default StartGroupVideoConfModal;
