export class BiMap<K, V> {
	#map = new Map<K, V>();
	#pam = new Map<V, K>();
	size: number;

	constructor() {
		this.size = 0;
	}

	get(v: K): V | undefined {
		return this.#map.get(v);
	}
	has(k: K): boolean {
		return this.#map.has(k);
	}
	revHas(v: V) {
		return this.#pam.has(v);
	}
	revGet(v: V): K | undefined {
		return this.#pam.get(v);
	}

	set(k: K, v: V): this {
		this.#map.set(k, v);
		this.#pam.set(v, k);
		this.size++;
		return this;
	}

	delete(k: K): boolean {
		let v = this.#map.get(k);
		if (v) {
			this.#map.delete(k);
			this.#pam.delete(v);
			this.size--;
			return true;
		}
		return false;
	}
	revDelete(v: V) {
		let k = this.#pam.get(v);
		if (k) {
			this.#map.delete(k);
			this.#pam.delete(v);
			this.size--;
			return true;
		}
		return false;
	}
	entries(): IterableIterator<[K, V]> {
		return this.#map.entries();
	}

	toString() {
		return this.#map.toString();
	}
}
