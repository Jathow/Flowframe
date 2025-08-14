import type { ISODateTimeString } from './common';

export type BlockType =
	| 'deep'
	| 'shallow'
	| 'break'
	| 'sleep'
	| 'commute'
	| 'workout'
	| 'meal'
	| 'buffer';

export type Block = {
	id: string;
	userId: string;
	taskId: string | null;
	type: BlockType;
	start: ISODateTimeString;
	end: ISODateTimeString;
	confidence?: number; // 0..1
};


