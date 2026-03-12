const normalizeSeat = (seat) => {
  const row = typeof seat?.row === "string" ? seat.row.trim().toUpperCase() : "";
  const number = Number(seat?.number);
  return { row, number };
};

const uniqueSeats = (seats) => {
  const map = new Map();
  for (const seat of Array.isArray(seats) ? seats : []) {
    const normalized = normalizeSeat(seat);
    if (!normalized.row || !Number.isFinite(normalized.number)) continue;
    const key = `${normalized.row}:${normalized.number}`;
    if (!map.has(key)) map.set(key, normalized);
  }
  return Array.from(map.values());
};

const getActiveLocks = (show, now = new Date()) => {
  const locks = Array.isArray(show?.seatLocks) ? show.seatLocks : [];
  return locks.filter((lock) => lock.expiresAt && new Date(lock.expiresAt) > now);
};

const flattenLockedSeats = (locks) => {
  const out = [];
  for (const lock of locks) {
    for (const seat of lock.seats || []) {
      out.push({ row: seat.row, number: seat.number });
    }
  }
  return out;
};

const getMyLockedSeats = (locks, userId) => {
  if (!userId) return [];
  const out = [];
  for (const lock of locks) {
    if (lock.user && lock.user.toString() === userId.toString()) {
      for (const seat of lock.seats || []) {
        out.push({ row: seat.row, number: seat.number });
      }
    }
  }
  return out;
};

const getMyLockExpiresAt = (locks, userId) => {
  if (!userId) return null;
  let latest = null;
  for (const lock of locks) {
    if (lock.user && lock.user.toString() === userId.toString()) {
      const exp = lock.expiresAt ? new Date(lock.expiresAt) : null;
      if (exp && (!latest || exp > latest)) {
        latest = exp;
      }
    }
  }
  return latest ? latest.toISOString() : null;
};

const isSeatLockedByOther = (locks, seat, userId) => {
  const key = `${seat.row}:${seat.number}`;
  return locks.some((lock) => {
    if (!lock.user) return false;
    if (userId && lock.user.toString() === userId.toString()) return false;
    return (lock.seats || []).some((s) => `${s.row}:${s.number}` === key);
  });
};

const buildLockResponse = (show, userId) => {
  const activeLocks = getActiveLocks(show);
  return {
    lockedSeats: flattenLockedSeats(activeLocks),
    myLockedSeats: getMyLockedSeats(activeLocks, userId),
    myLockExpiresAt: getMyLockExpiresAt(activeLocks, userId),
  };
};

const upsertUserLock = (show, userId, seats, holdMinutes) => {
  const now = new Date();
  const activeLocks = getActiveLocks(show, now);
  const normalizedSeats = uniqueSeats(seats);
  const mySeats = getMyLockedSeats(activeLocks, userId);
  const mergedSeats = uniqueSeats([...mySeats, ...normalizedSeats]);

  const otherLocks = activeLocks.filter(
    (lock) => !lock.user || lock.user.toString() !== userId.toString()
  );

  const expiresAt = new Date(now.getTime() + holdMinutes * 60 * 1000);
  if (mergedSeats.length > 0) {
    otherLocks.push({
      user: userId,
      seats: mergedSeats,
      expiresAt,
      createdAt: now,
    });
  }

  show.seatLocks = otherLocks;
  const { lockedSeats, myLockedSeats, myLockExpiresAt } = buildLockResponse(show, userId);
  return { lockedSeats, myLockedSeats, myLockExpiresAt, expiresAt };
};

const removeUserLockedSeats = (show, userId, seatsToRemove) => {
  const now = new Date();
  const activeLocks = getActiveLocks(show, now);
  const removeSet = new Set(
    uniqueSeats(seatsToRemove).map((s) => `${s.row}:${s.number}`)
  );

  const remainingLocks = [];
  let mySeats = [];
  let myExpiresAt = null;

  for (const lock of activeLocks) {
    if (lock.user && lock.user.toString() === userId.toString()) {
      mySeats = lock.seats || [];
      myExpiresAt = lock.expiresAt;
    } else {
      remainingLocks.push(lock);
    }
  }

  if (removeSet.size > 0) {
    const remainingSeats = mySeats.filter(
      (s) => !removeSet.has(`${s.row}:${s.number}`)
    );
    if (remainingSeats.length > 0 && myExpiresAt && new Date(myExpiresAt) > now) {
      remainingLocks.push({
        user: userId,
        seats: remainingSeats,
        expiresAt: myExpiresAt,
        createdAt: now,
      });
    }
  }

  show.seatLocks = remainingLocks;
  return buildLockResponse(show, userId);
};

module.exports = {
  normalizeSeat,
  uniqueSeats,
  getActiveLocks,
  flattenLockedSeats,
  getMyLockedSeats,
  getMyLockExpiresAt,
  isSeatLockedByOther,
  buildLockResponse,
  upsertUserLock,
  removeUserLockedSeats,
};
