import type { IMessage } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

export type MessageListContextValue = {
	useShowTranslated: (message: IMessage) => boolean;
	useShowStarred: ({ message }: { message: IMessage }) => boolean;
	useShowFollowing: ({ message }: { message: IMessage }) => boolean;
	useMessageDateFormatter: () => (date: Date) => string;
	useUserHasReacted: (message: IMessage) => (reaction: string) => boolean;
	useReactionsFilter: (message: IMessage) => (reaction: string) => string[];
	useOpenEmojiPicker: (message: IMessage) => (event: React.MouseEvent) => void;
	showRoles: boolean;
	showRealName: boolean;
	showUsername: boolean;
	highlights?:
		| {
				highlight: string;
				regex: RegExp;
				urlRegex: RegExp;
		  }[];
	katex?: {
		dollarSyntaxEnabled: boolean;
		parenthesisSyntaxEnabled: boolean;
	};
	autoTranslateLanguage?: string;
	showColors: boolean;
	jumpToMessageParam?: string;
	scrollMessageList?: (callback: (wrapper: HTMLDivElement | null) => ScrollToOptions | void) => void;
};

export const MessageListContext = createContext<MessageListContextValue>({
	useShowTranslated: () => false,
	useShowStarred: () => false,
	useShowFollowing: () => false,
	useUserHasReacted: () => (): boolean => false,
	useMessageDateFormatter:
		() =>
		(date: Date): string =>
			date.toString(),
	useOpenEmojiPicker: () => (): void => undefined,
	useReactionsFilter:
		(message) =>
		(reaction: string): string[] =>
			message.reactions ? message.reactions[reaction]?.usernames || [] : [],
	showRoles: false,
	showRealName: false,
	showUsername: false,
	showColors: false,
	scrollMessageList: () => undefined,
});

export const useShowTranslated: MessageListContextValue['useShowTranslated'] = (...args) =>
	useContext(MessageListContext).useShowTranslated(...args);
export const useShowStarred: MessageListContextValue['useShowStarred'] = (...args) =>
	useContext(MessageListContext).useShowStarred(...args);
export const useShowFollowing: MessageListContextValue['useShowFollowing'] = (...args) =>
	useContext(MessageListContext).useShowFollowing(...args);
export const useMessageDateFormatter: MessageListContextValue['useMessageDateFormatter'] = (...args) =>
	useContext(MessageListContext).useMessageDateFormatter(...args);
export const useMessageListShowRoles = (): MessageListContextValue['showRoles'] => useContext(MessageListContext).showRoles;
export const useMessageListShowRealName = (): MessageListContextValue['showRealName'] => useContext(MessageListContext).showRealName;
export const useMessageListShowUsername = (): MessageListContextValue['showUsername'] => useContext(MessageListContext).showUsername;
export const useMessageListHighlights = (): MessageListContextValue['highlights'] => useContext(MessageListContext).highlights;
export const useMessageListJumpToMessageParam = (): MessageListContextValue['jumpToMessageParam'] =>
	useContext(MessageListContext).jumpToMessageParam;
export const useMessageListScroll = (): MessageListContextValue['scrollMessageList'] => useContext(MessageListContext).scrollMessageList;

export const useUserHasReacted: MessageListContextValue['useUserHasReacted'] = (message: IMessage) =>
	useContext(MessageListContext).useUserHasReacted(message);
export const useOpenEmojiPicker: MessageListContextValue['useOpenEmojiPicker'] = (...args) =>
	useContext(MessageListContext).useOpenEmojiPicker(...args);
export const useReactionsFilter: MessageListContextValue['useReactionsFilter'] = (message: IMessage) =>
	useContext(MessageListContext).useReactionsFilter(message);
