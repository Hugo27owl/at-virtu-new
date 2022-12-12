/* eslint-env mocha */

import type { ILivechatPriority, IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';
import { OmnichannelSortingMechanismSettingType } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import faker from '@faker-js/faker';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { saveSLA, deleteSLA, generateRandomSLA } from '../../../data/livechat/priorities';
import { createAgent, createVisitor, createLivechatRoom, takeInquiry, bulkCreateLivechatRooms } from '../../../data/livechat/rooms';
import { addPermissions, removePermissions, updateEESetting, updatePermission, updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';
import { createDepartmentWithAnOnlineAgent } from '../../../data/livechat/department';
import { fetchAllInquiries } from '../../../data/livechat/inquiries';

(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - Priorities & SLAs', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true)
			.then(() => updateSetting('Livechat_Routing_Method', 'Manual_Selection'))
			.then(done);
	});

	this.afterAll(async () => {
		addPermissions({
			'manage-livechat-priorities': ['admin', 'livechat-manager'],
			'manage-livechat-sla': ['admin', 'livechat-manager'],
			'view-l-room': ['admin', 'livechat-manager', 'livechat-agent'],
		});
	});

	describe('livechat/sla', () => {
		// GET
		it('should return an "unauthorized error" when the user does not have the necessary permission for [GET] livechat/sla endpoint', async () => {
			await removePermissions(['manage-livechat-sla', 'view-l-room']);
			const response = await request.get(api('livechat/sla')).set(credentials).expect('Content-Type', 'application/json').expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of slas', async () => {
			await addPermissions({
				'manage-livechat-sla': ['admin', 'livechat-manager'],
				'view-l-room': ['livechat-agent', 'admin', 'livechat-manager'],
			});
			const sla = await saveSLA();
			expect(sla).to.not.be.undefined;
			expect(sla).to.have.property('_id');
			const response = await request.get(api('livechat/sla')).set(credentials).expect('Content-Type', 'application/json').expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.sla).to.be.an('array').with.lengthOf.greaterThan(0);
			const current = response.body.sla.find((p: IOmnichannelServiceLevelAgreements) => p && p?._id === sla._id);
			expect(current).to.be.an('object');
			expect(current).to.have.property('name', sla.name);
			expect(current).to.have.property('description', sla.description);
			expect(current).to.have.property('dueTimeInMinutes', sla.dueTimeInMinutes);
			await deleteSLA(sla._id);
		});
		// POST
		it('should return an "unauthorized error" when the user does not have the necessary permission for [POST] livechat/sla endpoint', async () => {
			await updatePermission('manage-livechat-sla', []);
			const response = await request
				.post(api('livechat/sla'))
				.set(credentials)
				.send(generateRandomSLA())
				.expect('Content-Type', 'application/json')
				.expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should create a new sla', async () => {
			await updatePermission('manage-livechat-sla', ['admin', 'livechat-manager']);

			const sla = generateRandomSLA();

			const response = await request
				.post(api('livechat/sla'))
				.set(credentials)
				.send(sla)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.sla).to.be.an('object');
			expect(response.body.sla).to.have.property('_id');
			expect(response.body.sla).to.have.property('name', sla.name);
			expect(response.body.sla).to.have.property('description', sla.description);
			expect(response.body.sla).to.have.property('dueTimeInMinutes', sla.dueTimeInMinutes);

			await deleteSLA(response.body.sla._id);
		});
	});

	describe('livechat/sla/:slaId', () => {
		// GET
		it('should return an "unauthorized error" when the user does not have the necessary permission for [GET] livechat/sla/:slaId endpoint', async () => {
			await removePermissions(['manage-livechat-sla', 'view-l-room']);
			const response = await request.get(api('livechat/sla/123')).set(credentials).expect('Content-Type', 'application/json').expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should create, find and delete an sla', async () => {
			await addPermissions({
				'manage-livechat-sla': ['admin', 'livechat-manager'],
				'view-l-room': ['livechat-agent', 'admin', 'livechat-manager'],
			});
			const sla = await saveSLA();
			const response = await request
				.get(api(`livechat/sla/${sla._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.be.an('object');
			expect(response.body._id).to.be.equal(sla._id);
			const deleteResponse = deleteSLA(sla._id);
			expect(deleteResponse).to.not.be.rejected;
		});
		// PUT
		it('should return an "unauthorized error" when the user does not have the necessary permission for [PUT] livechat/sla/:slaId endpoint', async () => {
			await updatePermission('manage-livechat-sla', []);

			const response = await request
				.put(api('livechat/sla/123'))
				.set(credentials)
				.send(generateRandomSLA())
				.expect('Content-Type', 'application/json')
				.expect(403);

			expect(response.body).to.have.property('success', false);
		});
		it('should update an sla', async () => {
			await updatePermission('manage-livechat-sla', ['admin', 'livechat-manager']);

			const sla = await saveSLA();
			const newSlaData = generateRandomSLA();

			const response = await request
				.put(api(`livechat/sla/${sla._id}`))
				.set(credentials)
				.send(newSlaData)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.sla).to.be.an('object');
			expect(response.body.sla).to.have.property('_id');
			expect(response.body.sla).to.have.property('name', newSlaData.name);
			expect(response.body.sla).to.have.property('description', newSlaData.description);
			expect(response.body.sla).to.have.property('dueTimeInMinutes', newSlaData.dueTimeInMinutes);

			await deleteSLA(response.body.sla._id);
		});
		// DELETE
		it('should return an "unauthorized error" when the user does not have the necessary permission for [DELETE] livechat/sla/:slaId endpoint', async () => {
			await updatePermission('manage-livechat-sla', []);
			const response = await request
				.delete(api('livechat/sla/123'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should delete an sla', async () => {
			await updatePermission('manage-livechat-sla', ['admin', 'livechat-manager']);
			const sla = await saveSLA();
			const response = await request
				.delete(api(`livechat/sla/${sla._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
		});
	});

	describe('livechat/inquiry.setSLA', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissions(['manage-livechat-sla', 'view-l-room', 'manage-livechat-priorities']);
			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					roomId: '123',
					sla: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if roomId is not in request body', async () => {
			await addPermissions({
				'manage-livechat-sla': ['admin', 'livechat-manager'],
				'manage-livechat-priorities': ['admin', 'livechat-manager'],
				'view-l-room': ['livechat-agent', 'admin', 'livechat-manager'],
			});
			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					sla: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if roomId is invalid', async () => {
			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					roomId: '123',
					sla: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if sla is not in request body', async () => {
			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					roomId: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if sla is not valid', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await createAgent();

			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					roomId: room._id,
					sla: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if inquiry is not queued', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await takeInquiry(room._id);

			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					roomId: room._id,
					sla: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should prioritize an inquiry', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const sla = await saveSLA();
			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					roomId: room._id,
					sla: sla._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
		});
	});

	describe('livechat/priorities', () => {
		let priority: ILivechatPriority;
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissions(['manage-livechat-priorities', 'view-l-room']);
			const response = await request
				.get(api('livechat/priorities'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of priorities', async () => {
			await addPermissions({
				'manage-livechat-priorities': ['admin', 'livechat-manager'],
				'view-l-room': ['livechat-agent', 'admin', 'livechat-manager'],
			});
			const response = await request
				.get(api('livechat/priorities'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.priorities).to.be.an('array');
			expect(response.body.priorities).to.have.lengthOf(5);
			expect(response.body.priorities[0]).to.have.property('_id');
			expect(response.body.priorities[0]).to.have.property('i18n');
			expect(response.body.priorities[0]).to.have.property('dirty');
			priority = response.body.priorities[0];
		});
		it('should return an array of priorities matching text param', async () => {
			const response = await request
				.get(api('livechat/priorities'))
				.set(credentials)
				.query({
					text: priority.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.priorities).to.be.an('array');
			expect(response.body.priorities).to.have.length.greaterThan(0);
			expect(response.body.priorities[0]).to.have.property('_id');
		});
	});

	describe('livechat/priorities/:priorityId', () => {
		let priority: ILivechatPriority;
		const name = faker.random.word();
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissions(['manage-livechat-priorities', 'view-l-room']);
			const response = await request.get(api('livechat/priorities/123')).set(credentials).expect(403);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error');
			expect(response.body?.error).to.contain('error-unauthorized');
		});
		it('should return a priority by id', async () => {
			await addPermissions({
				'manage-livechat-priorities': ['admin', 'livechat-manager'],
				'view-l-room': ['livechat-agent', 'admin', 'livechat-manager'],
			});
			const {
				body: { priorities },
			} = await request.get(api('livechat/priorities')).set(credentials).expect('Content-Type', 'application/json').expect(200);

			priority = priorities[0];

			const response = await request
				.get(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.be.an('object');
			expect(response.body._id).to.be.equal(priority._id);
		});
		it('should throw 404 when priority does not exist', async () => {
			const response = await request.get(api('livechat/priorities/123')).set(credentials).expect(404);
			expect(response.body).to.have.property('success', false);
		});
		it('should update a priority when using PUT', async () => {
			const response = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
		});
		it('should return dirty: true after a priority has been updated', async () => {
			const response = await request
				.get(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.have.property('dirty', true);
		});
		it('should return an array of priorities matching text param', async () => {
			const response = await request
				.get(api('livechat/priorities'))
				.set(credentials)
				.query({
					text: name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.priorities).to.be.an('array');
			expect(response.body.priorities).to.have.length.greaterThan(0);
			const pos = response.body.priorities.findIndex((p: ILivechatPriority) => p._id === priority._id);
			expect(pos).to.be.greaterThan(-1);
			expect(response.body.priorities[pos]).to.have.property('_id');
			expect(response.body.priorities[pos]).to.have.property('i18n', priority.i18n);
		});
		it('should edit a priority with a PUT', async () => {
			const newName = faker.random.word();
			const response = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					name: newName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			const newPriorityResponse = await request
				.get(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(newPriorityResponse.body).to.have.property('success', true);
			expect(newPriorityResponse.body).to.have.property('dirty', true);
			expect(newPriorityResponse.body).to.have.property('name', newName);
		});
		it('should fail to edit a priority with a PUT if using too many parameters', async () => {
			const newName = faker.random.word();
			const response = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					name: newName,
					reset: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error');
			expect(response.body?.error).to.contain('invalid-params');
		});
		it('should fail to edit a priority with a PUT if using an object as name', async () => {
			const newName = faker.random.word();
			const response = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					name: { name: newName },
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error');
			expect(response.body?.error).to.contain('invalid-params');
		});
		it('should not fail to edit a priority with a PUT if using a boolean as name (it becomes a string)', async () => {
			const response = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					name: false,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
		});
		it('should fail to update a non-existing priority', async () => {
			const response = await request
				.put(api('livechat/priorities/123'))
				.set(credentials)
				.send({
					name: faker.random.word(),
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should reset a single priority with a reset:true PUT parameter', async () => {
			const response = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					reset: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			const newPriorityResponse = await request
				.get(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(newPriorityResponse.body).to.have.property('success', true);
			expect(newPriorityResponse.body).to.have.property('dirty', false);
			expect(newPriorityResponse.body).to.not.have.property('name');
		});
		it('should throw a duplicate error incase there is already a priority with same name', async () => {
			const {
				body: { priorities },
			} = await request.get(api('livechat/priorities')).set(credentials).expect('Content-Type', 'application/json').expect(200);

			// change name of first priority to a random name
			const newName = faker.random.word();
			await request
				.put(api(`livechat/priorities/${priorities[0]._id}`))
				.set(credentials)
				.send({ name: newName })
				.expect('Content-Type', 'application/json')
				.expect(200);

			// change name of second priority to the name of first priority and expect error
			const response = await request
				.put(api(`livechat/priorities/${priorities[1]._id}`))
				.set(credentials)
				.send({ name: newName })
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error', 'error-duplicate-priority-name');
		});
		it('should throw a duplicate error incase there is already a priority with same name (case insensitive)', async () => {
			const {
				body: { priorities },
			} = await request.get(api('livechat/priorities')).set(credentials).expect('Content-Type', 'application/json').expect(200);

			// change name of first priority to a random name
			const newNameLowercase = faker.random.word().toLowerCase();
			await request
				.put(api(`livechat/priorities/${priorities[0]._id}`))
				.set(credentials)
				.send({ name: newNameLowercase })
				.expect('Content-Type', 'application/json')
				.expect(200);

			// change name of second priority to the name of first priority in different case and expect error
			const response = await request
				.put(api(`livechat/priorities/${priorities[1]._id}`))
				.set(credentials)
				.send({ name: newNameLowercase.toUpperCase() })
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error', 'error-duplicate-priority-name');
		});
	});

	describe('livechat/priorities.reset', () => {
		let priority: ILivechatPriority;
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('manage-livechat-priorities', []);
			const response = await request.post(api('livechat/priorities.reset')).set(credentials).expect(403);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error');
			expect(response.body?.error).to.contain('error-unauthorized');
		});
		it('should respond reset:true when a priority has been changed', async () => {
			await updatePermission('manage-livechat-priorities', ['admin', 'livechat-manager']);
			const {
				body: { priorities },
			} = await request.get(api('livechat/priorities')).set(credentials).expect('Content-Type', 'application/json').expect(200);

			priority = priorities[0];

			priority.name = faker.random.word();
			const responseChange = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					name: priority.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(responseChange.body).to.have.property('success', true);

			const response = await request
				.get(api('livechat/priorities.reset'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.have.property('reset', true);
		});
		it('should reset all priorities', async () => {
			const resetRespose = await request
				.post(api('livechat/priorities.reset'))
				.set(credentials)
				.send()
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(resetRespose.body).to.have.property('success', true);
		});
		it('should return reset: false after all priorities have been reset', async () => {
			const response = await request
				.get(api('livechat/priorities.reset'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.have.property('reset', false);
		});
		it('should change the priority name and dirty status when reset', async () => {
			const response = await request
				.get(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.have.property('dirty', false);
			expect(response.body).to.not.have.property('name');
		});
		it('should change all priorities to their default', async () => {
			const response = await request
				.get(api('livechat/priorities'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.priorities).to.be.an('array');
			response.body.priorities.forEach((priority: ILivechatPriority) => {
				expect(priority).to.not.have.property('name');
				expect(priority).to.have.property('dirty', false);
			});
		});
		it('should fail to reset when lacking permissions', async () => {
			await updatePermission('manage-livechat-priorities', []);
			const response = await request.post(api('livechat/priorities.reset')).set(credentials).expect(403);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error');
			expect(response.body?.error).to.contain('error-unauthorized');
		});
	});

	// eslint-disable-next-line no-restricted-properties
	describe.only('Inquiry queue sorting mechanism', () => {
		it('[Priority] test livechat/inquiries.queuedForUser route with priority based sorting', async () => {
			// update Omnichannel_sorting_mechanism setting to priority
			await updateEESetting('Omnichannel_sorting_mechanism', OmnichannelSortingMechanismSettingType.Priority);

			// create 6 rooms, one for each priority level (1-5) and one with no priority
			const { department, agent } = await createDepartmentWithAnOnlineAgent();
			const {
				body: { priorities },
			} = (await request.get(api('livechat/priorities')).set(credentials).expect('Content-Type', 'application/json').expect(200)) as {
				body: { priorities: ILivechatPriority[] };
			};
			const omniRooms = await bulkCreateLivechatRooms(6, department._id, (index) => {
				const priority = priorities.find((priority) => priority.sortItem === index + 1);
				return (
					priority && {
						priority: priority._id,
					}
				);
			});
			const sortedOmniRooms = omniRooms.sort((a, b) => {
				const { priorityId: priorityIdA } = a;
				const { priorityId: priorityIdB } = b;

				if (!priorityIdA || !priorityIdB) {
					// if one of the rooms has no priority, it should be the last one
					return priorityIdA ? -1 : 1;
				}

				const priorityA = priorities.find((priority) => priority._id === priorityIdA);
				const priorityB = priorities.find((priority) => priority._id === priorityIdB);

				if (!priorityA || !priorityB) {
					throw new Error(`Could not find priority for room ${a._id} or ${b._id} with priorityId ${priorityIdA} or ${priorityIdB}`);
				}

				return priorityA.sortItem - priorityB.sortItem;
			});

			// fetch all inquiries using livechat/inquiries.queuedForUser route (note it is paginated)
			const allInquiries = await fetchAllInquiries(agent.credentials, department._id);
			expect(allInquiries.length).to.be.greaterThanOrEqual(6);

			// verify if all the inquiry.rids are the same as the sortedOmniRoomsIds
			const inquiryRids = allInquiries.map((inquiry) => inquiry.rid);
			const sortedOmniRoomsIds = sortedOmniRooms.map((room) => room._id);
			// expect sortedOmniRoomsIds to be a subset of inquiryRids
			expect(sortedOmniRoomsIds.every((roomId) => inquiryRids.includes(roomId))).to.be.true;

			const inquiryRidAndPriority = allInquiries.map((inquiry) => {
				const { rid, priorityId } = inquiry;
				let priority = 0;

				if (priorityId) {
					const priorityObj = priorities.find((priority) => priority._id === priorityId);
					if (priorityObj) {
						priority = priorityObj.sortItem;
					}
				}

				return { rid, priority };
			});
			// expect the inquiryRidAndPriority to be sorted by priority in descending order
			const sortedInquiryRidAndPriority = inquiryRidAndPriority.sort((a, b) => b.priority - a.priority);
			expect(sortedInquiryRidAndPriority).to.deep.equal(inquiryRidAndPriority);
		});
	});
});
