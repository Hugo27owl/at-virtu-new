import { AutoComplete, Box, Icon, Option, Options, Chip, AutoCompleteProps } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { IRoom } from '../../../../../definition/IRoom';
import RoomAvatar from '../../../../components/avatar/RoomAvatar';
import { useEndpointData } from '../../../../hooks/useEndpointData';

type RoomsInputProps = {
	value: IRoom[];
	onChange: (value: unknown, action: 'remove' | undefined) => void;
};

// TODO: Make AutoComplete accept arbitrary kinds of values
const useRoomsAutoComplete = (name: string): {
	rooms: Record<IRoom['_id'], IRoom>;
	options: AutoCompleteProps['options'];
} => {
	const params = useMemo(() => ({
		selector: JSON.stringify({ name }),
	}), [name]);
	const { value: data } = useEndpointData('rooms.autocomplete.channelAndPrivate', params);

	const options = useMemo<AutoCompleteProps['options']>(() => {
		if (!data) {
			return [];
		}

		return data.items.map((room: IRoom) => ({
			label: room.fname ?? room.name,
			value: room._id,
		}));
	}, [data]);

	const rooms = useMemo<Record<IRoom['_id'], IRoom>>(() => data?.items.reduce((obj, room) => {
		obj[room._id] = room;
		return obj;
	}, {} as Record<IRoom['_id'], IRoom>) ?? {}, [data]);

	return {
		options,
		rooms,
	};
};

const RoomsInput: FC<RoomsInputProps> = ({ onChange, ...props }) => {
	const [filter, setFilter] = useState('');
	const { rooms, options } = useRoomsAutoComplete(useDebouncedValue(filter, 1000));

	const onClickSelected = useCallback((e) => {
		e.stopPropagation();
		e.preventDefault();

		onChange(rooms[e.currentTarget.value], 'remove');
	}, [onChange, rooms]);

	const handleChange = useCallback<AutoCompleteProps['onChange']>((value, action) => {
		onChange(rooms[value as IRoom['_id']], action);
	}, [onChange, rooms]);

	const renderSelected = useCallback<FC<{ value?: IRoom[] }>>(
		({ value: selected }) => <>
			{selected?.map((room) => (<Chip key={room._id} height='x20' value={room._id} onClick={onClickSelected} mie='x4'>
				<Icon name={room.t === 'c' ? 'hash' : 'hashtag-lock'} size='x12' />
				<Box is='span' margin='none' mis='x4'>{room.name}</Box>
			</Chip>))}
		</>, [onClickSelected],
	);

	const renderItem = useCallback<FC<{ value: IRoom['_id'] }>>(
		({ value: rid, ...props }) => <Option key={rooms[rid]._id} {...props} avatar={<RoomAvatar room={rooms[rid]} size={Options.AvatarSize} />} />,
		[rooms],
	);

	return <AutoComplete
		{...props}
		filter={filter}
		options={options}
		renderSelected={renderSelected}
		renderItem={renderItem}
		setFilter={setFilter}
		onChange={handleChange}
	/>;
};

export default memo(RoomsInput);
