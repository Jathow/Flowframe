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


