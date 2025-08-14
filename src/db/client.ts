import Dexie, { type Table } from 'dexie';
import type { User } from '../models/user';
import type { Preference } from '../models/preference';
import type { Constraint } from '../models/constraint';
import type { Task } from '../models/task';
import type { Block } from '../models/block';
import type { Insight } from '../models/insight';
import type { MoodLog } from '../models/mood';

class PlannerDb extends Dexie {
	users!: Table<User, string>;
	preferences!: Table<Preference, string>;
	constraints!: Table<Constraint, string>;
	tasks!: Table<Task, string>;
	blocks!: Table<Block, string>;
	insights!: Table<Insight, string>;
	moods!: Table<MoodLog, string>;

	constructor() {
		super('planner-db');
		// v1 schema
		this.version(1).stores({
			users: 'id',
			preferences: 'userId',
			constraints: 'id, userId, type, start, end',
			tasks: 'id, userId, area, deadline',
			blocks: 'id, userId, taskId, type, start, end',
			insights: 'id, userId, date',
			moods: 'id, userId, date'
		});
	}
}

let db: PlannerDb | null = null;

export function getDb(): PlannerDb {
	if (typeof window === 'undefined') {
		throw new Error('IndexedDB is not available on the server');
	}
	if (!db) db = new PlannerDb();
	return db;
}


