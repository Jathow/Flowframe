export type MoodLog = {
	id: string;
	userId: string;
	date: string; // ISO date
	mood: number; // -5..+5 or 0..10; choose 0..10 for simplicity
	energy: number; // 0..10
};


