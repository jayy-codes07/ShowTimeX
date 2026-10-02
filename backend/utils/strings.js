// Escape user input before it is used inside a MongoDB $regex / RegExp so
// characters like "(" or "[" are matched literally instead of breaking the
// pattern (500) or enabling catastrophic backtracking.
const escapeRegex = (value) =>
  String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { escapeRegex };
