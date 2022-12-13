import type { IOmnichannelRoom, IRoom, IRoomWithRetentionPolicy, ISubscription } from '@rocket.chat/core-typings';

export type SubscriptionWithRoom = ISubscription &
	Pick<
		IRoom,
		| 'description'
		| 'cl'
		| 'topic'
		| 'announcement'
		| 'avatarETag'
		| 'lastMessage'
		| 'streamingOptions'
		| 'uids'
		| 'usernames'
		| 'usersCount'
		| 'muted'
		| 'federated'
		| 'lm'
	> &
	Pick<
		IOmnichannelRoom,
		| 'transcriptRequest'
		| 'servedBy'
		| 'tags'
		| 'onHold'
		| 'closedAt'
		| 'metrics'
		| 'waitingResponse'
		| 'responseBy'
		| 'priorityId'
		| 'livechatData'
		| 'departmentId'
		| 'queuedAt'
	> & {
		source?: IOmnichannelRoom['source'];
	} & Pick<Partial<IRoomWithRetentionPolicy>, 'retention'>;
