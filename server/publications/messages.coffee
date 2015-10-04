Meteor.publish 'messages', (rid, start) ->
	unless this.userId
		return this.ready()

	publication = this

	console.log '[publish] messages ->'.green, 'rid:', rid, 'start:', start

	if typeof rid isnt 'string'
		return this.ready()

	this.autorun (computation) ->
		if not Meteor.call 'canAccessRoom', rid, publication.userId
			return publication.ready()

		cursor = RocketChat.models.Messages.findVisibleByRoomId rid,
			sort:
				ts: -1
			limit: 50

		cursor.observeChanges
			added: (_id, record) ->
				publication.added('rocketchat_message', _id, record)

			changed: (_id, record) ->
				publication.changed('rocketchat_message', _id, record)

		cursorDelete = RocketChat.models.Messages.findInvisibleByRoomId rid,
			fields:
				_id: 1

		cursorDelete.observeChanges
			added: (_id, record) ->
				publication.added('rocketchat_message', _id, {_hidden: true})
			changed: (_id, record) ->
				publication.added('rocketchat_message', _id, {_hidden: true})

		@ready()

	return
