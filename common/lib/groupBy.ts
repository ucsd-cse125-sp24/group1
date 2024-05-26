export function groupBy<K, T>(items: T[], getKey: (item: T, index: number) => K): Map<K, T[]> {
	const groups = new Map<K, T[]>();
	for (const [i, item] of items.entries()) {
		const key = getKey(item, i);
		let group = groups.get(key);
		if (!group) {
			group = [];
			groups.set(key, group);
		}
		group.push(item);
	}
	return groups;
}
