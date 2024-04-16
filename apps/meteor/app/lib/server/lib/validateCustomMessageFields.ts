import mem from 'mem';
import Ajv from 'ajv';

const ajv = new Ajv();

const customFieldsValidate = mem((customFieldsSetting: string) => {
	const schema = JSON.parse(customFieldsSetting);

	if (schema.type && schema.type !== 'object') {
		throw new Error('Invalid custom fields config');
	}

	return ajv.compile({
		...schema,
		type: 'object',
		additionalProperties: false,
	});
});

export const validateCustomMessageFields = (customFields: Record<string, any>, messageCustomFieldsEnabled: boolean, messageCustomFields: string) => {
	// get the json schema for the custom fields of the message and validate it using ajv
	// if the validation fails, throw an error
	// if there are no custom fields, the message object remains unchanged

	if (messageCustomFieldsEnabled !== true) {
		throw new Error('Custom fields not enabled');
	}

	const validate = customFieldsValidate(messageCustomFields);
	if (!validate(customFields)) {
		throw new Error('Invalid custom fields');
	}
};
