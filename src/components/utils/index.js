function getMethod(methodName) {
	return this[methodName];
}

module.exports = {
	getMethod,
};
