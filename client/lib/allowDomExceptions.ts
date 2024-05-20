export type DomExceptionName =
	| "IndexSizeError"
	| "HierarchyRequestError"
	| "WrongDocumentError"
	| "InvalidCharacterError"
	| "NoModificationAllowedError"
	| "NotFoundError"
	| "NotSupportedError"
	| "InvalidStateError"
	| "InUseAttributeError"
	| "SyntaxError"
	| "InvalidModificationError"
	| "NamespaceError"
	| "InvalidAccessError"
	| "TypeMismatchError"
	| "SecurityError"
	| "NetworkError"
	| "AbortError"
	| "URLMismatchError"
	| "QuotaExceededError"
	| "TimeoutError"
	| "InvalidNodeTypeError"
	| "DataCloneError"
	| "EncodingError"
	| "NotReadableError"
	| "UnknownError"
	| "ConstraintError"
	| "DataError"
	| "TransactionInactiveError"
	| "ReadOnlyError"
	| "VersionError"
	| "OperationError"
	| "NotAllowedError";

export function allowDomExceptions(error: unknown, names: DomExceptionName[]): void {
	const nameStrings: string[] = names;
	if (error instanceof DOMException && nameStrings.includes(error.name)) {
		return;
	}
	throw error;
}
