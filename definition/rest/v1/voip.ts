import { ILivechatAgent } from '../../ILivechatAgent';
import { IRoom } from '../../IRoom';
import { IRegistrationInfo } from '../../voip/IRegistrationInfo';
import { VoipClientEvents } from '../../voip/VoipClientEvents';

export type VoipEndpoints = {
	'connector.extension.getRegistrationInfoByUserId': {
		GET: (params: { id: string }) => IRegistrationInfo;
	};

	'voip/events': {
		POST: (params: { event: VoipClientEvents; rid: string; comment?: string }) => void;
	};

	'voip/room': {
		GET: (params: { token: string; agentId: ILivechatAgent['_id'] }) => { room: IRoom; newRoom: boolean };
	};
};
