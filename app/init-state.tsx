"use client";

import { useEffect } from 'react';
import { useInitAppState } from '../src/state/hooks';

export function InitState() {
	const init = useInitAppState();
	useEffect(() => {
		init();
	}, [init]);
	return null;
}


