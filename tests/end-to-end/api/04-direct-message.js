import { expect } from 'chai';

import {
	getCredentials,
	api,
	request,
	credentials,
	directMessage,
	apiUsername,
	apiEmail,
	methodCall,
} from '../../data/api-data.js';
import { password, adminUsername } from '../../data/user.js';
import { deleteRoom } from '../../data/rooms.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { updateSetting, updatePermission } from '../../data/permissions.helper';


describe('[Direct Messages]', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	it('/chat.postMessage', (done) => {
		request.post(api('chat.postMessage'))
			.set(credentials)
			.send({
				channel: 'rocket.cat',
				text: 'This message was sent using the API',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('message.msg', 'This message was sent using the API');
				expect(res.body).to.have.nested.property('message.rid');
				directMessage._id = res.body.message.rid;
			})
			.end(done);
	});

	describe('/im.setTopic', () => {
		it('should set the topic of the DM with a string', (done) => {
			request.post(api('im.setTopic'))
				.set(credentials)
				.send({
					roomId: directMessage._id,
					topic: 'a direct message with rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('topic', 'a direct message with rocket.cat');
				})
				.end(done);
		});
		it('should set the topic of DM with an empty string(remove the topic)', (done) => {
			request.post(api('im.setTopic'))
				.set(credentials)
				.send({
					roomId: directMessage._id,
					topic: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('topic', '');
				})
				.end(done);
		});
	});

	describe('Testing DM info', () => {
		let testDM = {};
		let dmMessage = {};
		it('creating new DM...', (done) => {
			request.post(api('im.create'))
				.set(credentials)
				.send({
					username: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testDM = res.body.room;
				})
				.end(done);
		});
		it('sending a message...', (done) => {
			request.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid: testDM._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					dmMessage = res.body.message;
				})
				.end(done);
		});
		it('REACTing with last message', (done) => {
			request.post(api('chat.react'))
				.set(credentials)
				.send({
					emoji: ':squid:',
					messageId: dmMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('STARring last message', (done) => {
			request.post(api('chat.starMessage'))
				.set(credentials)
				.send({
					messageId: dmMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('PINning last message', (done) => {
			request.post(api('chat.pinMessage'))
				.set(credentials)
				.send({
					messageId: dmMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should return all DM messages where the last message of array should have the "star" array with USERS star ONLY', (done) => {
			request.get(api('im.messages'))
				.set(credentials)
				.query({
					roomId: testDM._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
					const { messages } = res.body;
					const lastMessage = messages.filter((message) => message._id === dmMessage._id)[0];
					expect(lastMessage).to.have.property('starred').and.to.be.an('array');
					expect(lastMessage.starred[0]._id).to.be.equal(adminUsername);
				})
				.end(done);
		});
	});

	it('/im.history', (done) => {
		request.get(api('im.history'))
			.set(credentials)
			.query({
				roomId: directMessage._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('messages');
			})
			.end(done);
	});

	it('/im.list', (done) => {
		request.get(api('im.list'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('count');
				expect(res.body).to.have.property('total');
			})
			.end(done);
	});

	it('/im.list.everyone', (done) => {
		request.get(api('im.list.everyone'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('count');
				expect(res.body).to.have.property('total');
			})
			.end(done);
	});

	it('/im.open', (done) => {
		request.post(api('im.open'))
			.set(credentials)
			.send({
				roomId: directMessage._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/im.counters', (done) => {
		request.get(api('im.counters'))
			.set(credentials)
			.query({
				roomId: directMessage._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('joined', true);
				expect(res.body).to.have.property('members');
				expect(res.body).to.have.property('unreads');
				expect(res.body).to.have.property('unreadsFrom');
				expect(res.body).to.have.property('msgs');
				expect(res.body).to.have.property('latest');
				expect(res.body).to.have.property('userMentions');
			})
			.end(done);
	});

	it('/im.files', (done) => {
		request.get(api('im.files'))
			.set(credentials)
			.query({
				roomId: directMessage._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files');
				expect(res.body).to.have.property('count');
				expect(res.body).to.have.property('offset');
				expect(res.body).to.have.property('total');
			})
			.end(done);
	});

	describe('/im.messages.others', () => {
		it('should fail when the endpoint is disabled', (done) => {
			updateSetting('API_Enable_Direct_Message_History_EndPoint', false).then(() => {
				request.get(api('im.messages.others'))
					.set(credentials)
					.query({
						roomId: directMessage._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-endpoint-disabled');
					})
					.end(done);
			});
		});
		it('should fail when the endpoint is enabled but the user doesnt have permission', (done) => {
			updateSetting('API_Enable_Direct_Message_History_EndPoint', true).then(() => {
				updatePermission('view-room-administration', []).then(() => {
					request.get(api('im.messages.others'))
						.set(credentials)
						.query({
							roomId: directMessage._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(403)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error', 'unauthorized');
						})
						.end(done);
				});
			});
		});
		it('should succeed when the endpoint is enabled and user has permission', (done) => {
			updateSetting('API_Enable_Direct_Message_History_EndPoint', true).then(() => {
				updatePermission('view-room-administration', ['admin']).then(() => {
					request.get(api('im.messages.others'))
						.set(credentials)
						.query({
							roomId: directMessage._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('messages').and.to.be.an('array');
							expect(res.body).to.have.property('offset');
							expect(res.body).to.have.property('count');
							expect(res.body).to.have.property('total');
						})
						.end(done);
				});
			});
		});
	});

	it('/im.close', (done) => {
		request.post(api('im.close'))
			.set(credentials)
			.send({
				roomId: directMessage._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	describe('fname property', () => {
		const username = `fname_${ apiUsername }`;
		const name = `Name fname_${ apiUsername }`;
		const updatedName = `Updated Name fname_${ apiUsername }`;
		const email = `fname_${ apiEmail }`;
		let userId;
		let directMessageId;

		before((done) => {
			request.post(api('users.create'))
				.set(credentials)
				.send({
					email,
					name,
					username,
					password,
					active: true,
					roles: ['user'],
					joinDefaultChannels: true,
					verified: true,
				})
				.expect((res) => {
					userId = res.body.user._id;
				})
				.end(done);
		});

		before((done) => {
			request.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: `@${ username }`,
					text: 'This message was sent using the API',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', 'This message was sent using the API');
					expect(res.body).to.have.nested.property('message.rid');
					directMessageId = res.body.message.rid;
				})
				.end(done);
		});

		it('should have fname property', (done) => {
			request.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({
					roomId: directMessageId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.subscription).to.have.property('name', username);
					expect(res.body.subscription).to.have.property('fname', name);
				})
				.end(done);
		});

		it('should update user\'s name', (done) => {
			request.post(api('users.update'))
				.set(credentials)
				.send({
					userId,
					data: {
						name: updatedName,
					},
				})
				.expect((res) => {
					expect(res.body.user).to.have.property('name', updatedName);
				})
				.end(done);
		});

		it('should have fname property updated', (done) => {
			request.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({
					roomId: directMessageId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.subscription).to.have.property('name', username);
					expect(res.body.subscription).to.have.property('fname', updatedName);
				})
				.end(done);
		});
	});

	describe('/im.members', () => {
		it('should return and array with two members', (done) => {
			request.get(api('im.members'))
				.set(credentials)
				.query({
					roomId: directMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count').and.to.be.equal(2);
					expect(res.body).to.have.property('offset').and.to.be.equal(0);
					expect(res.body).to.have.property('total').and.to.be.equal(2);
					expect(res.body).to.have.property('members').and.to.have.lengthOf(2);
				})
				.end(done);
		});
		it('should return and array with one member', (done) => {
			request.get(api('im.members'))
				.set(credentials)
				.query({
					username: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count').and.to.be.equal(2);
					expect(res.body).to.have.property('offset').and.to.be.equal(0);
					expect(res.body).to.have.property('total').and.to.be.equal(2);
					expect(res.body).to.have.property('members').and.to.have.lengthOf(2);
				})
				.end(done);
		});
		it('should return and array with one member queried by status', (done) => {
			request.get(api('im.members'))
				.set(credentials)
				.query({
					roomId: directMessage._id,
					'status[]': ['online'],
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count').and.to.be.equal(1);
					expect(res.body).to.have.property('offset').and.to.be.equal(0);
					expect(res.body).to.have.property('total').and.to.be.equal(1);
					expect(res.body).to.have.property('members').and.to.have.lengthOf(1);
				})
				.end(done);
		});
	});

	describe('/im.create', () => {
		let otherUser;
		let roomId;

		before(async () => {
			otherUser = await createUser();
		});

		after(async () => {
			if (roomId) {
				await deleteRoom({ type: 'd', roomId });
			}
			await deleteUser(otherUser);
			otherUser = undefined;
		});

		it('creates a DM between two other parties (including self)', (done) => {
			request.post(api('im.create'))
				.set(credentials)
				.send({
					usernames: ['rocket.cat', otherUser.username].join(','),
				})
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');
					expect(res.body.room).to.have.property('usernames').and.to.have.members([adminUsername, 'rocket.cat', otherUser.username]);
					roomId = res.body.room._id;
				})
				.end(done);
		});

		it('creates a DM between two other parties (excluding self)', (done) => {
			request.post(api('im.create'))
				.set(credentials)
				.send({
					usernames: ['rocket.cat', otherUser.username].join(','),
					excludeSelf: true,
				})
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');
					expect(res.body.room).to.have.property('usernames').and.to.have.members(['rocket.cat', otherUser.username]);
					roomId = res.body.room._id;
				})
				.end(done);
		});

		it('should create a self-DM', (done) => {
			request.post(api('im.create'))
				.set(credentials)
				.send({
					username: adminUsername,
				})
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');
					expect(res.body.room).to.have.property('usernames').and.to.have.members([adminUsername]);
				})
				.end(done);
		});

		describe('should create dm with correct notification preferences', () => {
			let user;
			let userCredentials;
			let userPrefRoomId;

			before(async () => {
				user = await createUser();
				userCredentials = await login(user.username, password);
			});

			after(async () => {
				if (userPrefRoomId) {
					await deleteRoom({ type: 'd', roomId: userPrefRoomId });
				}
				await deleteUser(user);
				user = undefined;
			});

			it('should save user preferences', async () => {
				await request.post(methodCall('saveUserPreferences'))
					.set(userCredentials)
					.send({
						message: JSON.stringify({
							method: 'saveUserPreferences',
							params: [{ emailNotificationMode: 'nothing' }],
						}),
					})
					.expect(200);
			});

			it('should create a DM', (done) => {
				request.post(api('im.create'))
					.set(userCredentials)
					.send({
						usernames: [user.username, otherUser.username].join(','),
					})
					.expect(200)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('room').and.to.be.an('object');
						expect(res.body.room).to.have.property('usernames').and.to.have.members([user.username, otherUser.username]);
						userPrefRoomId = res.body.room._id;
					})
					.end(done);
			});

			it('should return the right user notification preferences in the dm', (done) => {
				request.get(api('subscriptions.getOne'))
					.set(userCredentials)
					.query({
						roomId: userPrefRoomId,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('subscription').and.to.be.an('object');
						expect(res.body).to.have.nested.property('subscription.emailNotifications').and.to.be.equal('nothing');
					})
					.end(done);
			});
		});
	});

	describe('/im.delete', () => {
		let testDM;

		it('/im.create', (done) => {
			request.post(api('im.create'))
				.set(credentials)
				.send({
					username: 'rocket.cat',
				})
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					testDM = res.body.room;
				})
				.end(done);
		});

		it('/im.delete', (done) => {
			request.post(api('im.delete'))
				.set(credentials)
				.send({
					username: 'rocket.cat',
				})
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/im.open', (done) => {
			request.post(api('im.open'))
				.set(credentials)
				.send({
					roomId: testDM._id,
				})
				.expect(400)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-channel');
				})
				.end(done);
		});

		context('when authenticated as a non-admin user', () => {
			let otherUser;
			let otherCredentials;

			before(async () => {
				otherUser = await createUser();
				otherCredentials = await login(otherUser.username, password);
			});

			after(async () => {
				await deleteUser(otherUser);
				otherUser = undefined;
			});

			it('/im.create', (done) => {
				request.post(api('im.create'))
					.set(credentials)
					.send({
						username: otherUser.username,
					})
					.expect(200)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						testDM = res.body.room;
					})
					.end(done);
			});

			it('/im.delete', (done) => {
				request.post(api('im.delete'))
					.set(otherCredentials)
					.send({
						roomId: testDM._id,
					})
					.expect(403)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});
	});
});
