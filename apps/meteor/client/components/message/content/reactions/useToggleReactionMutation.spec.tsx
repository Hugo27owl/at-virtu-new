import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, act } from '@testing-library/react-hooks';

import { useToggleReactionMutation } from './useToggleReactionMutation';

it('should be call rest `POST /v1/chat.react` method', async () => {
	const fn = jest.fn();

	const { result, waitFor } = renderHook(() => useToggleReactionMutation(), {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/chat.react', fn).withJohnDoe().build(),
	});

	act(() => {
		result.current.mutate({ mid: 'MID', reaction: 'smile' });
	});

	await waitFor(() => expect(result.current.status).toBe('success'));

	expect(fn).toHaveBeenCalledWith({
		messageId: 'MID',
		reaction: 'smile',
	});
});

it('should not work for non-logged in users', async () => {
	const fn = jest.fn();

	const { result, waitFor } = renderHook(() => useToggleReactionMutation(), {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/chat.react', fn).build(),
	});

	act(() => {
		result.current.mutate({ mid: 'MID', reaction: 'smile' });
	});

	await waitFor(() => expect(result.current.status).toBe('error'));

	expect(fn).not.toHaveBeenCalled();
	expect(result.current.error).toEqual(new Error('Not logged in'));
});
