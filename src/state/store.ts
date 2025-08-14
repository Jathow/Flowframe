import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { getDb } from '../db/client';
import type { User } from '../models/user';
import type { Preference } from '../models/preference';
import type { Constraint } from '../models/constraint';
import type { Task } from '../models/task';
import type { Block } from '../models/block';
import type { Insight } from '../models/insight';
import type { MoodLog } from '../models/mood';

type EntitiesState = {
	users: User[];
	preferences: Preference[];
	constraints: Constraint[];
	tasks: Task[];
	blocks: Block[];
	insights: Insight[];
	moods: MoodLog[];
};

type Actions = {
	init: () => Promise<void>;
	// User & preferences
	upsertUser: (user: User) => Promise<void>;
	upsertPreference: (pref: Preference) => Promise<void>;
	// Tasks
	addTask: (input: Omit<Task, 'id'> & { id?: string }) => Promise<string>;
	updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
	deleteTask: (id: string) => Promise<void>;
	// Constraints
	addConstraint: (input: Omit<Constraint, 'id'> & { id?: string }) => Promise<string>;
	deleteConstraint: (id: string) => Promise<void>;
	// Blocks
	addBlock: (input: Omit<Block, 'id'> & { id?: string }) => Promise<string>;
	updateBlock: (id: string, updates: Partial<Block>) => Promise<void>;
	deleteBlock: (id: string) => Promise<void>;
  // Mood logs
  addMood: (input: Omit<MoodLog, 'id'> & { id?: string }) => Promise<string>;
	// Sync helpers
	exportSnapshot: () => Promise<EntitiesState>;
	importSnapshot: (snap: Partial<EntitiesState>) => Promise<void>;
};

type MetaState = {
	hasHydrated: boolean;
};

export type AppState = EntitiesState & Actions & MetaState;

export const useAppStore = create<AppState>()(
	persist(
		(set, get) => ({
			hasHydrated: false,
			users: [],
			preferences: [],
			constraints: [],
			tasks: [],
			blocks: [],
			insights: [],
			moods: [],

			init: async () => {
				if (typeof window === 'undefined') return;
				const db = getDb();
				const [users, preferences, constraints, tasks, blocks, insights, moods] = await Promise.all([
					db.users.toArray(),
					db.preferences.toArray(),
					db.constraints.toArray(),
					db.tasks.toArray(),
					db.blocks.toArray(),
					db.insights.toArray(),
					db.moods.toArray()
				]);
				set({ users, preferences, constraints, tasks, blocks, insights, moods, hasHydrated: true });
			},

			upsertUser: async (user) => {
				const db = getDb();
				await db.users.put(user);
				const users = await db.users.toArray();
				set({ users });
			},
			upsertPreference: async (pref) => {
				const db = getDb();
				await db.preferences.put(pref, pref.userId);
				const preferences = await db.preferences.toArray();
				set({ preferences });
			},

			addTask: async (input) => {
				const id = input.id ?? nanoid();
				const task: Task = { ...input, id } as Task;
				const db = getDb();
				await db.tasks.add(task);
				set({ tasks: [...get().tasks, task] });
				return id;
			},
			updateTask: async (id, updates) => {
				const db = getDb();
				await db.tasks.update(id, updates);
				set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) });
			},
			deleteTask: async (id) => {
				const db = getDb();
				await db.tasks.delete(id);
				set({ tasks: get().tasks.filter((t) => t.id !== id) });
			},

			addConstraint: async (input) => {
				const id = (input as any).id ?? nanoid();
				const constraint: Constraint = { ...(input as any), id } as Constraint;
				const db = getDb();
				await db.constraints.add(constraint);
				set({ constraints: [...get().constraints, constraint] });
				return id;
			},
			deleteConstraint: async (id) => {
				const db = getDb();
				await db.constraints.delete(id);
				set({ constraints: get().constraints.filter((c) => c.id !== id) });
			},

			addBlock: async (input) => {
				const id = (input as any).id ?? nanoid();
				const block: Block = { ...(input as any), id } as Block;
				const db = getDb();
				await db.blocks.add(block);
				set({ blocks: [...get().blocks, block] });
				return id;
			},
			updateBlock: async (id, updates) => {
				const db = getDb();
				await db.blocks.update(id, updates);
				set({ blocks: get().blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)) });
			},
			deleteBlock: async (id) => {
				const db = getDb();
				await db.blocks.delete(id);
				set({ blocks: get().blocks.filter((b) => b.id !== id) });
      },

      addMood: async (input) => {
        const id = (input as any).id ?? nanoid();
        const mood: MoodLog = { ...(input as any), id } as MoodLog;
        const db = getDb();
        await db.moods.add(mood);
        set({ moods: [...get().moods, mood] });
        return id;
			},

			exportSnapshot: async () => {
				const { users, preferences, constraints, tasks, blocks, insights, moods } = get();
				return { users, preferences, constraints, tasks, blocks, insights, moods } as EntitiesState;
			},

			importSnapshot: async (snap) => {
				const db = getDb();
				await db.transaction('rw', db.users, db.preferences, db.constraints, db.tasks, db.blocks, db.insights, db.moods, async () => {
					if (snap.users) { await db.users.clear(); await db.users.bulkAdd(snap.users as any); }
					if (snap.preferences) { await db.preferences.clear(); await db.preferences.bulkAdd(snap.preferences as any); }
					if (snap.constraints) { await db.constraints.clear(); await db.constraints.bulkAdd(snap.constraints as any); }
					if (snap.tasks) { await db.tasks.clear(); await db.tasks.bulkAdd(snap.tasks as any); }
					if (snap.blocks) { await db.blocks.clear(); await db.blocks.bulkAdd(snap.blocks as any); }
					if (snap.insights) { await db.insights.clear(); await db.insights.bulkAdd(snap.insights as any); }
					if (snap.moods) { await db.moods.clear(); await db.moods.bulkAdd(snap.moods as any); }
				});
				set({
					users: snap.users ?? get().users,
					preferences: snap.preferences ?? get().preferences,
					constraints: snap.constraints ?? get().constraints,
					tasks: snap.tasks ?? get().tasks,
					blocks: snap.blocks ?? get().blocks,
					insights: snap.insights ?? get().insights,
					moods: snap.moods ?? get().moods
				});
			}
		}),
		{
			name: 'planner-store-v1',
			storage: createJSONStorage(() => localStorage),
			// Persist only lightweight metadata and cached lists for cold reload UX
			partialize: (state) => ({
				hasHydrated: state.hasHydrated,
				tasks: state.tasks,
				blocks: state.blocks
			})
		}
	)
);


