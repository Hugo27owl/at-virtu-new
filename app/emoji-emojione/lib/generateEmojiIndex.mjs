/* eslint-disable */
// emoji.json from emojione@4.5.0

// node --experimental-modules generateEmojiIndex.mjs
import fs from 'fs';
import https from 'https';
import request from 'request';

const emojiJsonUrl = 'https://raw.githubusercontent.com/emojione/emojione/4.5.0/emoji.json';

request(emojiJsonUrl, function (error, response, res) {
	if (error) {
		console.error(error);
		return;
	}
	generateEmojiPicker(res);
});

function generateEmojiPicker(data) {
	const emojiList = JSON.parse(data);
	console.log(`${Object.keys(emojiList).length} emojis found.`);

	let toneList = [];
	let emojisByCategory = {};

	for (let emoji in emojiList) {
		if (emojiList.hasOwnProperty(emoji)) {
			if (emojiList[emoji].shortname) {
				const toneIndex = emojiList[emoji].shortname.indexOf('_tone');
				if (toneIndex !== -1) {
					const tone = emojiList[emoji].shortname.substr(1, toneIndex - 1);
					if (!toneList.includes(tone)) {
						toneList.push(tone);
					}
					continue;
				}
			}

			if (!emojisByCategory[emojiList[emoji].category]) {
				emojisByCategory[emojiList[emoji].category] = [];
			}
			emojisByCategory[emojiList[emoji].category].push(emoji);
		}
	}

	let output = `/*
 * This file is automatically generated from generateEmojiIndex.mjs
 * Last generated ${Date().toString()}
 *
 * Mapping category hashes into human readable and translated names
 */\n\n`;


	const emojiCategoriesMapping = {
		people: 'Smileys_and_People',
		nature: 'Animals_and_Nature',
		food: 'Food_and_Drink',
		activity: 'Activity',
		travel: 'Travel_and_Places',
		objects: 'Objects',
		symbols: 'Symbols',
		flags: 'Flags',
		regional: 'Regional',
		modifier: 'Modifier'
	};

	// emojiCategories

	output += `export const emojiCategories = {\n`;
	for (let category in emojisByCategory) {
		if (emojiCategoriesMapping[category]) {
			output += `\t${category}: '${emojiCategoriesMapping[category]}',\n`;
		} else {
			console.error(`No emojiCategory mapping for ${category}`);
		}
	}
	output += `};\n`;

	// toneList

	const needsQuotes = ['-'];
	output += `export const toneList = {\n`;
	for (let tone in toneList) {
		if (toneList[tone].includes(needsQuotes)) {
			output += `\t'${toneList[tone]}': 1,\n`;
		} else {
			output += `\t${toneList[tone]}: 1,\n`;
		}

	}
	output += `};\n`;

	// emojisByCategory
	output += `export const emojisByCategory = {\n`;
	for (let category in emojisByCategory) {
		output += `\t${category}: [\n`;

		for (let emoji in emojisByCategory[category]) {
			output += `\t\t'${emojiList[emojisByCategory[category][emoji]].shortname.replace(/:/g,'')}',\n`;
		}

		output += `\t],\n`;
	}
	output += `};\n`;

	fs.writeFileSync("emojiPicker.js", output, {
		encoding: 'utf8',
		flag: 'w'
	});
	console.log('Generated emojiPicker.js!');
}
