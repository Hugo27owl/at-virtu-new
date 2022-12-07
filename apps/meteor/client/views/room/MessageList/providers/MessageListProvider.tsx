import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { isMessageReactionsNormalized, isThreadMainMessage } from '@rocket.chat/core-typings';
import { useLayout, useUser, useUserPreference, useUserSubscription, useSetting, useEndpoint } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useMemo, memo } from 'react';

import { EmojiPicker } from '../../../../../app/emoji/client';
import { getRegexHighlight, getRegexHighlightUrl } from '../../../../../app/highlight-words/client/helper';
import { useRoom } from '../../contexts/RoomContext';
import ToolboxProvider from '../../providers/ToolboxProvider';
import type { MessageListContextValue } from '../contexts/MessageListContext';
import { MessageListContext } from '../contexts/MessageListContext';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { useKatex } from '../hooks/useKatex';

const fields = {};

export const MessageListProvider: FC<{
	rid: IRoom['_id'];
}> = memo(function MessageListProvider({ rid, ...props }) {
	const reactToMessage = useEndpoint('POST', '/v1/chat.react');
	const user = useUser();
	const uid = user?._id;
	const username = user?.username;
	const subscription = useUserSubscription(rid, fields);

	const { isMobile } = useLayout();

	const showRealName = Boolean(useSetting('UI_Use_Real_Name'));
	const showReadReceipt = Boolean(useSetting('Message_Read_Receipt_Enabled'));
	const showColors = useSetting('HexColorPreview_Enabled') as boolean;

	const displayRolesGlobal = Boolean(useSetting('UI_DisplayRoles'));
	const hideRolesPreference = Boolean(!useUserPreference<boolean>('hideRoles') && !isMobile);
	const showRoles = displayRolesGlobal && hideRolesPreference;
	const showUsername = Boolean(!useUserPreference<boolean>('hideUsernames') && !isMobile);
	const highlights = useUserPreference<string[]>('highlights');

	const { showAutoTranslate, autoTranslateLanguage } = useAutoTranslate(subscription);
	const { katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled } = useKatex();

	const hasSubscription = Boolean(subscription);

	const context: MessageListContextValue = useMemo(
		() => ({
			showColors,
			useReactionsFilter: (message: IMessage): ((reaction: string) => string[]) => {
				const { reactions } = message;
				return !showRealName
					? (reaction: string): string[] =>
							reactions?.[reaction]?.usernames.filter((user) => user !== username).map((username) => `@${username}`) || []
					: (reaction: string): string[] => {
							if (!reactions || !reactions[reaction]) {
								return [];
							}
							if (!isMessageReactionsNormalized(message)) {
								return message.reactions?.[reaction]?.usernames.filter((user) => user !== username).map((username) => `@${username}`) || [];
							}
							if (!username) {
								return message.reactions[reaction].names;
							}
							const index = message.reactions[reaction].usernames.indexOf(username);
							if (index === -1) {
								return message.reactions[reaction].names;
							}

							return message.reactions[reaction].names.splice(index, 1);
					  };
			},
			useUserHasReacted: username
				? (message) =>
						(reaction): boolean =>
							Boolean(message.reactions?.[reaction].usernames.includes(username))
				: () => (): boolean => false,
			useShowFollowing: uid
				? ({ message }): boolean => Boolean(message.replies && message.replies.indexOf(uid) > -1 && !isThreadMainMessage(message))
				: (): boolean => false,
			autoTranslateLanguage,
			useShowTranslated: showAutoTranslate,
			useShowStarred: hasSubscription
				? ({ message }): boolean => Boolean(Array.isArray(message.starred) && message.starred.find((star) => star._id === uid))
				: (): boolean => false,
			useMessageDateFormatter:
				() =>
				(date: Date): string =>
					date.toLocaleString(),
			showReadReceipt,
			showRoles,
			showRealName,
			showUsername,
			...(katexEnabled && {
				katex: {
					dollarSyntaxEnabled: katexDollarSyntaxEnabled,
					parenthesisSyntaxEnabled: katexParenthesisSyntaxEnabled,
				},
			}),
			highlights: highlights
				?.map((str) => str.trim())
				.map((highlight) => ({
					highlight,
					regex: getRegexHighlight(highlight),
					urlRegex: getRegexHighlightUrl(highlight),
				})),
			useReactToMessage: uid
				? (message) =>
						(reaction): void =>
							reactToMessage({ messageId: message._id, reaction }) as unknown as void
				: () => (): void => undefined,

			useOpenEmojiPicker: uid
				? (message) =>
						(e): void => {
							e.nativeEvent.stopImmediatePropagation();
							EmojiPicker.open(
								e.currentTarget,
								(emoji: string) => reactToMessage({ messageId: message._id, reaction: emoji }) as unknown as void,
							);
						}
				: () => (): void => undefined,
		}),
		[
			username,
			uid,
			showAutoTranslate,
			hasSubscription,
			autoTranslateLanguage,
			showRoles,
			showRealName,
			showUsername,
			showReadReceipt,
			katexEnabled,
			katexDollarSyntaxEnabled,
			katexParenthesisSyntaxEnabled,
			highlights,
			reactToMessage,
			showColors,
		],
	);

	const room = useRoom();

	if (!room) {
		throw new Error('Room not found');
	}

	return (
		<ToolboxProvider room={room}>
			<MessageListContext.Provider value={context} {...props} />
		</ToolboxProvider>
	);
});
