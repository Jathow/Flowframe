import { useAppStore } from './store';
import type { Task } from '../models/task';

export function useTasks(): Task[] {
	return useAppStore((s) => s.tasks);
}

export function useTaskById(taskId: string | undefined): Task | undefined {
	return useAppStore((s) => s.tasks.find((t) => t.id === taskId));
}

export function useInitAppState() {
	const init = useAppStore((s) => s.init);
	return init;
}


